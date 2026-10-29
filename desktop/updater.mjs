import { createHash } from 'node:crypto';
import { mkdir, writeFile, rename, unlink, readFile } from 'node:fs/promises';
import { join } from 'node:path';
export const REPOSITORY='HajayYang/Daily-Food-Diary';
const prefix=`https://github.com/${REPOSITORY}/releases/download/`;
export function newer(tag,current){const parse=s=>/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(s)?.slice(1).map(Number);const a=parse(tag),b=parse(current);return Boolean(a&&b&&a.some((n,i)=>n>b[i]&&a.slice(0,i).every((v,j)=>v===b[j])));}
export function releaseAsset(release,name){
  const a=release.assets?.find(a=>a.name===name),expected=`${prefix}${release.tag_name}/${name}`;
  if(!a||a.browser_download_url!==expected)throw Error('Missing or invalid release asset');return expected;
}
async function bytes(response,max){
  if(!response.ok||Number(response.headers.get('content-length'))>max)throw Error('Download failed');
  const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.byteLength;if(size>max)throw Error('Download exceeds size limit');chunks.push(Buffer.from(chunk));}
  return Buffer.concat(chunks);
}
export class DesktopUpdater {
  constructor({version,directory,fetcher=fetch,verifier,cachePath}){Object.assign(this,{version,directory,fetcher,verifier,cachePath});}
  async check(){
    const release=JSON.parse((await bytes(await this.fetcher(`https://api.github.com/repos/${REPOSITORY}/releases/latest`,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)}),1024*1024)).toString());
    this.pending=null;this.downloaded=null;
    if(release.draft||release.prerelease||!newer(release.tag_name,this.version))return {available:false,version:this.version};
    const tag=release.tag_name;if(!/^v\d+\.\d+\.\d+$/.test(tag))throw Error('Invalid release version');
    const filename=`Daily-Bites-${tag.slice(1)}-win-x64-setup.exe`;
    const manifest=await bytes(await this.fetcher(releaseAsset(release,'DESKTOP-SHA256SUMS.txt'),{signal:AbortSignal.timeout(20000)}),16384);
    const bundle=JSON.parse((await bytes(await this.fetcher(releaseAsset(release,'DESKTOP-SHA256SUMS.sigstore.json'),{signal:AbortSignal.timeout(20000)}),1024*1024)).toString());
    const options={certificateIssuer:'https://token.actions.githubusercontent.com',certificateIdentityURI:`https://github.com/${REPOSITORY}/.github/workflows/desktop-release.yml@refs/tags/${tag}`,tufCachePath:this.cachePath};
    if(this.verifier)await this.verifier(bundle,manifest,options);else{const {verify}=await import('sigstore');await verify(bundle,manifest,options);}
    const match=new RegExp(`^([a-f0-9]{64})  ${filename.replaceAll('.','\\.')}\\n$`).exec(manifest.toString());
    if(!match)throw Error('Invalid signed desktop manifest');
    this.pending={version:tag.slice(1),filename,hash:match[1],url:releaseAsset(release,filename)};
    return {available:true,version:this.pending.version,notes:typeof release.body==='string'?release.body.slice(0,12000):'',url:`https://github.com/${REPOSITORY}/releases/tag/${tag}`};
  }
  async download(){
    if(this.busy||!this.pending)throw Error('Check for a verified update first');this.busy=true;
    const plan={...this.pending};await mkdir(this.directory,{recursive:true,mode:0o700});
    const target=join(this.directory,plan.filename),temp=`${target}.partial`;
    try{
      const response=await this.fetcher(plan.url,{signal:AbortSignal.timeout(300000)});
      const data=await bytes(response,512*1024*1024);
      if(createHash('sha256').update(data).digest('hex')!==plan.hash)throw Error('Installer checksum mismatch');
      await writeFile(temp,data,{mode:0o600});await rename(temp,target);this.downloaded={path:target,hash:plan.hash};return {version:plan.version};
    }catch(error){await unlink(temp).catch(()=>{});throw error;}finally{this.busy=false;}
  }
  async verifiedPath(){if(!this.downloaded)throw Error('Download a verified update first');const data=await readFile(this.downloaded.path);if(createHash('sha256').update(data).digest('hex')!==this.downloaded.hash){this.downloaded=null;throw Error('Installer checksum mismatch');}return this.downloaded.path;}
}
