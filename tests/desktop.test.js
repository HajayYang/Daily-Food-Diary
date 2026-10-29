import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { PersonalStore, readSQLiteSnapshot, validateSettings } from '../desktop/personal-store.mjs';
import { DesktopUpdater, newer, releaseAsset, REPOSITORY } from '../desktop/updater.mjs';
import { applyImport, readSnapshot, DATA_KEYS } from '../backup.js';
const record={id:'desktop-1',date:'2026-10-30',meal:'lunch',food:'米饭',portion:'100g',calories:130,note:''};
async function fixture(t){const directory=await mkdtemp(join(tmpdir(),'daily-bites-sqlite-'));const store=await PersonalStore.open(directory);t.after(async()=>{store.close();await rm(directory,{recursive:true,force:true});});return {directory,store};}
test('personal SQLite persists across restarts and rejects a whole invalid batch before writing',async t=>{
 const {directory,store}=await fixture(t);store.setItem(DATA_KEYS.records,JSON.stringify([record]));
 assert.throws(()=>store.batch({[DATA_KEYS.records]:'[]','not-an-app-key':'bad'}));assert.equal(readSnapshot(store).records.length,1);
 const second=new PersonalStore(store.path);assert.deepEqual(readSnapshot(second).records,[record]);second.close();
 assert.equal((await readFile(join(directory,'personal.sqlite'))).subarray(0,15).toString(),'SQLite format 3');
});
test('native multi-collection imports use one SQLite transaction, including rollback on disk errors',async t=>{
 const {store}=await fixture(t);store.atomicWrite=changes=>store.batch(changes);
 store.db.exec(`CREATE TRIGGER fail_test BEFORE INSERT ON app_state WHEN NEW.key='daily-bites.fitness.v1' BEGIN SELECT RAISE(ABORT,'write failure'); END`);
 assert.throws(()=>applyImport({version:4,records:[record],fitness:{profile:{},workouts:[]},nextDay:null,lifestyle:null,wellbeing:null},store));
 // Exercise the native atomic writer directly: no earlier key survives a later failure.
 assert.throws(()=>store.batch({[DATA_KEYS.records]:JSON.stringify([record]),[DATA_KEYS.fitness]:'{}'}));assert.equal(store.getItem(DATA_KEYS.records),null);
 store.db.exec('DROP TRIGGER fail_test');applyImport({version:4,records:[record],fitness:null,nextDay:null,lifestyle:null,wellbeing:null},store);assert.deepEqual(readSnapshot(store).records,[record]);
});
test('online backups include WAL data, validate health-only restore and prune only owned files',async t=>{
 const {directory,store}=await fixture(t),folder=join(directory,'copies');store.setItem(DATA_KEYS.records,JSON.stringify([record]));store.setItem('daily-bites.photo-service.v1','private-service-setting');
 const first=await store.backup(folder);assert.deepEqual((await readSQLiteSnapshot(first.path)).records,[record]);assert.equal((await readSQLiteSnapshot(first.path)).apiKey,undefined);
 store.setItem(DATA_KEYS.records,'[]');assert.deepEqual((await readSQLiteSnapshot(first.path)).records,[record]);
 await writeFile(join(folder,'unrelated.sqlite'),'leave me alone');await store.backup(folder);await store.prune(1);assert.equal((await readdir(folder)).filter(n=>n.startsWith('daily-bites-')).length,1);assert.equal(await readFile(join(folder,'unrelated.sqlite'),'utf8'),'leave me alone');
 const corrupt=join(directory,'bad.sqlite');await writeFile(corrupt,'not SQLite');await assert.rejects(readSQLiteSnapshot(corrupt));
 await store.eraseBackups();assert.equal(await readFile(join(folder,'unrelated.sqlite'),'utf8'),'leave me alone');store.clear();assert.deepEqual(store.keys(),[]);
});
test('opening an unsupported future schema never downgrades it',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'daily-bites-future-'));t.after(()=>rm(directory,{recursive:true,force:true}));const path=join(directory,'personal.sqlite'),db=new DatabaseSync(path);db.exec('PRAGMA user_version=99');db.close();
 assert.throws(()=>new PersonalStore(path),/newer/);const check=new DatabaseSync(path);assert.equal(check.prepare('PRAGMA user_version').get().user_version,99);check.close();
});
test('desktop settings and stable versions reject unsafe values',()=>{
 assert.ok(validateSettings({backupHours:24,retention:14,closeToTray:false,autoStart:false}));assert.ok(!validateSettings({backupHours:-1,retention:100,closeToTray:true,autoStart:true}));
 assert.ok(newer('v2.1.0','2.0.9'));for(const tag of ['v1.9.99','v2.0.0','v3.0.0-rc1','evil','v02.0.0'])assert.ok(!newer(tag,'2.0.0'));
 assert.throws(()=>releaseAsset({tag_name:'v2.1.0',assets:[{name:'x',browser_download_url:'https://evil.test/x'}]},'x'));
});
function updateFixture(directory,{verifyError=false,corrupt=false}={}){
 const filename='Daily-Bites-2.1.0-win-x64-setup.exe',payload=Buffer.from('fake installer test bytes'),hash=createHash('sha256').update(payload).digest('hex'),manifest=`${hash}  ${filename}\n`,tag='v2.1.0',base=`https://github.com/${REPOSITORY}/releases/download/${tag}/`;
 const release={tag_name:tag,body:'Release notes',assets:[filename,'DESKTOP-SHA256SUMS.txt','DESKTOP-SHA256SUMS.sigstore.json'].map(name=>({name,browser_download_url:base+name}))};let verified=false;
 const updater=new DesktopUpdater({version:'2.0.0',directory,fetcher:async url=>new Response(url.includes('/releases/latest')?JSON.stringify(release):url.endsWith('.txt')?manifest:url.endsWith('.json')?'{}':corrupt?'tampered':payload),verifier:async(_bundle,data,options)=>{assert.equal(data.toString(),manifest);assert.equal(options.certificateIdentityURI,`https://github.com/${REPOSITORY}/.github/workflows/desktop-release.yml@refs/tags/v2.1.0`);assert.equal(options.certificateIssuer,'https://token.actions.githubusercontent.com');if(verifyError)throw Error('bad signature');verified=true;}});return {updater,payload,verified:()=>verified};
}
test('updates require signature, fixed release identity and matching installer hash; modified downloads cannot execute',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'daily-bites-update-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const {updater,payload,verified}=updateFixture(directory);await assert.rejects(updater.download());assert.equal((await updater.check()).available,true);assert.ok(verified());await updater.download();const path=await updater.verifiedPath();assert.deepEqual(await readFile(path),payload);await writeFile(path,'tampered');await assert.rejects(updater.verifiedPath(),/checksum/);
 const failed=updateFixture(directory,{verifyError:true}).updater;await assert.rejects(failed.check(),/signature/);await assert.rejects(failed.download());
 const bad=updateFixture(directory,{corrupt:true}).updater;await bad.check();await assert.rejects(bad.download(),/checksum/);assert.ok(!(await readdir(directory)).some(n=>n.endsWith('.partial')));
});
