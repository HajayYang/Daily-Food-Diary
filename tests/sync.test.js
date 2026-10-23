import test from 'node:test';
import assert from 'node:assert/strict';
import { createSyncClient, validSyncConfig, validSession } from '../sync-client.js';
const config={url:'https://example.supabase.co',key:'sb_publishable_test'},user={id:'11111111-1111-4111-8111-111111111111',email:'test@example.com'},session={access_token:'access-fixture',refresh_token:'refresh-fixture',expires_at:9999999999,user},snapshot={version:3,records:[],fitness:null,nextDay:null,lifestyle:null};
test('sync only accepts HTTPS Supabase project URLs and public keys, never service-role keys',()=>{
 assert.ok(validSyncConfig(config));for(const url of ['http://example.supabase.co','https://example.supabase.co.evil.com','https://evil.com','https://example.supabase.co/path'])assert.equal(validSyncConfig({...config,url}),false);
 const jwt=role=>`header.${btoa(JSON.stringify({role}))}.signature`;assert.ok(validSyncConfig({...config,key:jwt('anon')}));assert.equal(validSyncConfig({...config,key:jwt('service_role')}),false);assert.equal(validSyncConfig({...config,key:'sb_secret_never'}),false);assert.equal(validSession({...session,user:{id:'bad'}}),false);
});
test('sync signs in, fetches only the owner row and sends compare-and-swap uploads without passwords in snapshots',async()=>{
 const calls=[],sessions=[];const client=createSyncClient(config,{onSession:value=>sessions.push(value),fetcher:async(url,options)=>{calls.push({url,options});if(url.includes('grant_type=password'))return new Response(JSON.stringify(session));if(url.includes('diary_snapshots?'))return new Response(JSON.stringify([{revision:1,payload:snapshot}]));if(url.includes('/rpc/'))return new Response('2');return new Response('null');}});
 await client.signIn(user.email,'not-a-real-password');assert.equal(client.user().id,user.id);assert.equal((await client.download()).revision,1);assert.equal(await client.upload(snapshot,1),2);
 assert.ok(calls[1].url.includes(`user_id=eq.${user.id}`));assert.equal(calls[1].options.headers.Authorization,'Bearer access-fixture');assert.equal(calls[1].options.credentials,'omit');assert.deepEqual(JSON.parse(calls[2].options.body),{expected_revision:1,new_payload:snapshot});assert.ok(!calls[2].options.body.includes('not-a-real-password'));await client.signOut();assert.equal(client.user(),null);assert.equal(sessions.at(-1),null);
});
test('stale cloud revisions and corrupt payloads stop without overwriting local data or retrying uploads',async()=>{
 let requests=0;const client=createSyncClient(config,{fetcher:async(url)=>{requests++;return url.includes('/rpc/')?new Response(JSON.stringify({message:'sync_conflict'}),{status:400}):new Response(JSON.stringify([{revision:1,payload:{records:'bad'}}]));}});client.restore(session);
 await assert.rejects(()=>client.upload(snapshot,1),/另一设备/);assert.equal(requests,1);await assert.rejects(()=>client.download(),/校验失败/);assert.equal(requests,2);await assert.rejects(()=>client.upload({...snapshot,records:'invalid'},1));assert.equal(requests,2);
});
test('expired auth sessions refresh before data requests and clear sessions if refresh fails',async()=>{
 const urls=[],expired={...session,expires_at:0};const client=createSyncClient(config,{now:()=>100000,fetcher:async(url)=>{urls.push(url);return new Response(JSON.stringify(url.includes('refresh_token')?{...session,expires_at:200}:[]));}});client.restore(expired);assert.equal(await client.download(),null);assert.ok(urls[0].endsWith('grant_type=refresh_token'));
 let cleared=false;const failure=createSyncClient(config,{onSession:value=>{cleared=value===null;},fetcher:async()=>new Response('{}',{status:401})});failure.restore(expired);await assert.rejects(()=>failure.download());assert.equal(failure.user(),null);assert.equal(cleared,true);
});
test('email-verification signup does not claim a logged-in session and no data calls are allowed before login',async()=>{
 const client=createSyncClient(config,{fetcher:async()=>new Response(JSON.stringify({user}))});assert.equal(await client.signUp(user.email,'not-a-real-password'),null);assert.equal(client.user(),null);await assert.rejects(()=>client.download(),/先登录/);
});
