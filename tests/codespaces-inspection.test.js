import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,privateDecrypt,createDecipheriv,constants} from 'node:crypto';
import {encryptReport,inspectCodespaces} from '../maintenance/inspect-codespaces.mjs';
const repository='HajayYang/Daily-Food-Diary';
test('Codespaces inspection is read-only, repository-scoped and preserves dirty status without publishing names',async()=>{
 const requests=[],fetcher=async(url,options)=>{requests.push({url,method:options.method??'GET'});return new Response(JSON.stringify(url.endsWith('/user')?{login:'HajayYang'}:{total_count:1,codespaces:[{name:'private-space-name',repository:{full_name:repository},git_status:{has_uncommitted_changes:true}}]}));};
 const report=await inspectCodespaces({token:'test-only-token',fetcher,now:()=> '2026-11-16T00:00:00Z'});
 assert.equal(report.codespaces[0].git_status.has_uncommitted_changes,true);assert.ok(requests.every(r=>r.method==='GET'));assert.ok(requests[1].url.includes('/repos/'+repository+'/codespaces'));
 const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048}),encrypted=encryptReport(report,publicKey);
 assert.ok(!JSON.stringify(encrypted).includes('private-space-name'));assert.ok(!JSON.stringify(encrypted).includes('test-only-token'));
 const key=privateDecrypt({key:privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(encrypted.key,'base64'));
 const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(encrypted.iv,'base64'));decipher.setAuthTag(Buffer.from(encrypted.tag,'base64'));
 assert.deepEqual(JSON.parse(Buffer.concat([decipher.update(Buffer.from(encrypted.ciphertext,'base64')),decipher.final()]).toString()),report);
 const tampered=Buffer.from(encrypted.ciphertext,'base64');tampered[0]^=1;const rejected=createDecipheriv('aes-256-gcm',key,Buffer.from(encrypted.iv,'base64'));rejected.setAuthTag(Buffer.from(encrypted.tag,'base64'));assert.throws(()=>{rejected.update(tampered);rejected.final();});
});
test('inspection fails closed on missing permission, wrong owner and incomplete inventories',async()=>{
 await assert.rejects(inspectCodespaces({token:''}));
 await assert.rejects(inspectCodespaces({token:'test',fetcher:async()=>new Response('{}',{status:403})}),/403/);
 await assert.rejects(inspectCodespaces({token:'test',fetcher:async()=>new Response('{"login":"someone-else"}')}),/owner/);
 await assert.rejects(inspectCodespaces({token:'test',fetcher:async url=>new Response(JSON.stringify(url.endsWith('/user')?{login:'HajayYang'}:{total_count:1,codespaces:[]}))}),/Incomplete/);
});
test('a stopped-space probe stops the space after SSH failure, never deletes, and rejects a mismatched fingerprint',async()=>{
 const {probe,fingerprint}=await import('../maintenance/probe-codespace.mjs');
 const space={name:'test-space',state:'Shutdown',created_at:'2026-10-23',repository:{full_name:repository}},calls=[];
 let running=false;
 const fetcher=async(url,options={})=>{
  calls.push([options.method??'GET',url]);
  if(url.endsWith('/user'))return new Response('{"login":"HajayYang"}');
  if(url.includes('/repos/'))return new Response(JSON.stringify({total_count:1,codespaces:[space]}));
  if(url.endsWith('/start')){running=true;return new Response('{}');}
  if(url.endsWith('/stop')){running=false;return new Response('{}');}
  return new Response(JSON.stringify({state:running?'Available':'Shutdown'}));
 };
 const target=fingerprint({...space,repository});
 const report=await probe({token:'test-only-token',target,fetcher,command:async()=>({code:1,stdout:'',stderr:'test failure'}),wait:async()=>{}});
 assert.equal(report.stopped,true);assert.ok(report.inspection_error);assert.ok(calls.some(([m,u])=>m==='POST'&&u.endsWith('/stop')));assert.ok(calls.every(([m])=>m!=='DELETE'));
 const before=calls.length;await assert.rejects(probe({token:'test-only-token',target:'0'.repeat(64),fetcher}),/inventory/);assert.ok(calls.slice(before).every(([m])=>m==='GET'));
});
test('recovery export preserves a verified current-branch commit without launching or deleting the space',async()=>{
 const {exportSpace}=await import('../maintenance/export-codespace.mjs');const {fingerprint}=await import('../maintenance/probe-codespace.mjs');
 const space={name:'test-space',state:'Shutdown',created_at:'2026-10-23',repository:{full_name:repository}},calls=[];
 const fetcher=async(url,options={})=>{calls.push([options.method??'GET',url]);let data;
 if(url.endsWith('/user'))data={login:'HajayYang'};else if(url.includes('/repos/'))data={total_count:1,codespaces:[space]};else if(url.endsWith('/exports/latest'))data={state:'succeeded',branch:'codespace-test-space',sha:'a'.repeat(40)};else if(url.endsWith('/exports'))data={state:'pending'};else data=space;
 return new Response(JSON.stringify(data));};
 const report=await exportSpace({token:'test-only-token',target:fingerprint({...space,repository}),fetcher,wait:async()=>{}});
 assert.equal(report.export.sha,'a'.repeat(40));assert.equal(report.scope,'current-branch-only');assert.equal(report.after.state,'Shutdown');assert.ok(calls.filter(([m])=>m==='POST').every(([,u])=>u.endsWith('/exports')));assert.ok(calls.every(([m])=>m!=='DELETE'));
});
test('deletion requires explicit backup-scope confirmation and a matching published export, refuses changed or active spaces',async()=>{
 const {deleteExportedSpace}=await import('../maintenance/delete-exported-codespace.mjs');const {fingerprint}=await import('../maintenance/probe-codespace.mjs');
 const space={name:'test-space',state:'Shutdown',created_at:'2026-10-23',last_used_at:'2026-10-23T10:00:00Z',repository:{full_name:repository}};
 const options={token:'test-only-token',repositoryToken:'test-read-token',target:fingerprint({...space,repository}),exportSha:'b'.repeat(40),lastUsedAt:space.last_used_at,confirmedCurrentBranchOnly:true,wait:async()=>{}};
 function mock({changed=false,missingRef=false,active=false}={}){const calls=[];let deleted=false;return {calls,fetcher:async(url,args={})=>{calls.push([args.method??'GET',url]);let data;
 if(args.method==='DELETE'){deleted=true;return new Response(null,{status:202});}
 if(url.endsWith('/user'))data={login:'HajayYang'};else if(url.includes('/repos/')&&url.includes('/codespaces?'))data={total_count:1,codespaces:[space]};
 else if(url.endsWith('/exports/latest'))data={state:'succeeded',branch:'codespace-backup',sha:options.exportSha};
 else if(url.includes('/git/ref/'))data={object:{sha:missingRef?'c'.repeat(40):options.exportSha}};
 else if(deleted)return new Response('{}',{status:404});else data={...space,state:active?'Available':'Shutdown',last_used_at:changed?'2026-11-16T10:00:00Z':space.last_used_at};
 return new Response(JSON.stringify(data));}};}
 await assert.rejects(deleteExportedSpace({...options,confirmedCurrentBranchOnly:false}),/confirmation/);
 for(const flags of [{changed:true},{missingRef:true},{active:true}]){const m=mock(flags),r=await deleteExportedSpace({...options,fetcher:m.fetcher});assert.ok(r.error);assert.ok(m.calls.every(([method])=>method!=='DELETE'));}
 const m=mock(),r=await deleteExportedSpace({...options,fetcher:m.fetcher});assert.equal(r.deletion_confirmed,true);assert.equal(m.calls.filter(([method])=>method==='DELETE').length,1);assert.ok(m.calls.filter(([method])=>method==='DELETE').every(([,url])=>url.endsWith('/user/codespaces/test-space')));
});
