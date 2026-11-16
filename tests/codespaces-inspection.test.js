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
