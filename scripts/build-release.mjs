import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {deflateRawSync} from 'node:zlib';
import {PUBLIC_ASSETS} from '../public-assets.js';
import {checkCatalog} from '../database/check.mjs';
const root=new URL('../',import.meta.url);
const pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
if(!/^\d+\.\d+\.\d+$/.test(pkg.version))throw Error('Release version must be a stable semver');
await checkCatalog();
const prefix=`daily-food-diary-v${pkg.version}`,output=resolve(process.argv[2]??'dist');
await mkdir(output,{recursive:true});
// Small standard ZIP writer: DEFLATE, UTF-8 filenames, fixed timestamps, no Zip64.
// All entries come from the same allowlist as the HTTP server; no directory scanning.
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(data){let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
const entries=[];
for(const path of [...new Set([...PUBLIC_ASSETS,'LICENSE','vendor/sqljs/manifest.json','vendor/sqljs/README.md'])].sort())entries.push({path,bytes:await readFile(new URL(path,root))});
entries.push({path:'DEPLOY.md',bytes:Buffer.from(`# Daily Food Diary v${pkg.version}\n\nExtract this archive to an HTTPS static web host and keep all relative paths, including data/ and vendor/sqljs/. Start with index.html. The browser queries the included SQLite database. Personal records are stored in each browser by default. Photo recognition and optional cloud sync require their separately documented services.\n\nFor the Node server and read-only recipe API, use the GitHub Packages image ghcr.io/hajayyang/daily-food-diary:${pkg.version}.\n\nSource, license, setup and updates: https://github.com/HajayYang/Daily-Food-Diary\n`)});
const local=[],central=[];let offset=0;
for(const entry of entries){
 const name=Buffer.from(entry.path),data=deflateRawSync(entry.bytes,{level:9}),crc=crc32(entry.bytes);
 const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(0x5021,12);
 header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(entry.bytes.length,22);header.writeUInt16LE(name.length,26);
 local.push(header,name,data);
 const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(20,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(0x800,8);directory.writeUInt16LE(8,10);directory.writeUInt16LE(0x5021,14);
 directory.writeUInt32LE(crc,16);directory.writeUInt32LE(data.length,20);directory.writeUInt32LE(entry.bytes.length,24);directory.writeUInt16LE(name.length,28);directory.writeUInt32LE(offset,42);central.push(directory,name);offset+=header.length+name.length+data.length;
}
const centralBytes=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(centralBytes.length,12);end.writeUInt32LE(offset,16);
const artifacts={[`${prefix}-web.zip`]:Buffer.concat([...local,centralBytes,end]),[`${prefix}-cookbook.sqlite`]:await readFile(new URL('data/cookbook.sqlite',root))};
const checksums=[];
for(const [name,bytes] of Object.entries(artifacts)){await writeFile(resolve(output,name),bytes);checksums.push(`${createHash('sha256').update(bytes).digest('hex')}  ${name}`);}
await writeFile(resolve(output,'SHA256SUMS.txt'),checksums.join('\n')+'\n');
console.log(`Built release v${pkg.version}: ${entries.length} public files in web ZIP, SQLite catalog and SHA256SUMS.txt`);
