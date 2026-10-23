import test from 'node:test';
import assert from 'node:assert/strict';
import { createFoodSearchHandler } from '../food-search.js';
import { foodServiceURL, searchPayload, normalizeSearch, createFoodClient } from '../food-api.js';
import { snapshotSearch } from '../food-snapshot.js';
const product={code:'12345678',product_name:'Bread',brands:['Example','Bakery'],allergens_tags:['en:gluten'],nutriments:{fat_100g:0,proteins_100g:4}};
const payload={hits:[product],count:1,timed_out:false};
const snapshot={version:1,queries:{bread:{codes:['12345678'],capturedAt:'2026-10-23T13:00:00Z'}},products:[{...product,brands:'Example'}]};
const request=(query='面包',page=1,headers={})=>new Request(`https://diary.example/api/food-search?${new URLSearchParams({query,page:String(page)})}`,{headers});
test('modern search hits preserve brands, allergens, missing and zero nutrients through the gateway shape',()=>{
 const raw=searchPayload(payload),data=normalizeSearch(raw,1);assert.equal(data.products[0].brand,'Example, Bakery');assert.equal(data.products[0].allergens,'en:gluten');assert.equal(data.products[0].fat,0);assert.equal(data.products[0].carbs,null);assert.throws(()=>searchPayload({...payload,timed_out:true}));assert.throws(()=>searchPayload({products:[]}));
});
test('service addresses support nested static sites or secure configured service roots without credentials',()=>{
 assert.equal(foodServiceURL('面包'), './api/food-search?query=%E9%9D%A2%E5%8C%85&page=1');assert.match(foodServiceURL('milk',2,'https://food.example'),/^https:\/\/food.example\/api\/food-search/);
 for(const service of ['javascript:alert(1)','http://remote.example','https://u:p@food.example','https://food.example/relay?url=other'])assert.throws(()=>foodServiceURL('milk',1,service));
});
test('gateway fixes upstream origin/fields, strips private headers, caches and coalesces identical queries',async()=>{
 let calls=0;const handler=createFoodSearchHandler({fetcher:async(url,options)=>{calls++;assert.equal(new URL(url).origin,'https://search.openfoodfacts.org');assert.equal(new URL(url).searchParams.get('q'),'bread');assert.equal(options.headers.Authorization,undefined);assert.equal(options.headers.Cookie,undefined);assert.equal(options.redirect,'error');return new Response(JSON.stringify(payload));}});
 const requests=await Promise.all([handler(request('面包',1,{Authorization:'private',Cookie:'private'})),handler(request())]);assert.ok(requests.every(response=>response.status===200));assert.equal(calls,1);assert.equal((await handler(request())).headers.get('X-Food-Cache'),'HIT');assert.equal(calls,1);
});
test('gateway rejects invalid queries, arbitrary upstreams and disallowed origins before any external request',async()=>{
 let calls=0;const handler=createFoodSearchHandler({fetcher:async()=>{calls++;return new Response('{}');}});
 for(const query of ['', 'x'.repeat(61),'milk\n']){const response=await handler(request(query+'\u0000'));assert.equal(response.status,400);}
 assert.equal((await handler(request('milk',101))).status,400);assert.equal((await handler(new Request('https://diary.example/api/food-search?query=milk&url=https://evil.example'))).status,400);
 assert.equal((await handler(request('milk',1,{Origin:'https://evil.example'}),{ALLOWED_ORIGIN:'https://diary.example'})).status,403);assert.equal(calls,0);
 const preflight=await handler(new Request('https://food.example/api/food-search',{method:'OPTIONS',headers:{Origin:'https://diary.example'}}),{ALLOWED_ORIGIN:'https://diary.example'});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://diary.example');
});
test('gateway classifies source failures, invalid/oversized JSON, timeouts and rate limits without leaking source bodies',async()=>{
 for(const body of ['<html>maintenance</html>',JSON.stringify({hits:[],timed_out:true}), 'x'.repeat(1024*1024+1)]){const handler=createFoodSearchHandler({fetcher:async()=>new Response(body)});assert.equal((await handler(request())).status,502);}
 const unavailable=createFoodSearchHandler({fetcher:async()=>new Response('private upstream details',{status:503})});const response=await unavailable(request());assert.equal(response.status,502);assert.ok(!(await response.text()).includes('private'));
 const timeout=createFoodSearchHandler({timeoutMs:5,fetcher:async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('timeout','AbortError'))))});assert.equal((await timeout(request())).status,504);
 const limited=createFoodSearchHandler({fetcher:async()=>new Response(JSON.stringify(payload))});for(let i=0;i<10;i++)assert.equal((await limited(request('q'+i))).status,200);const limit=await limited(request('more'));assert.equal(limit.status,429);assert.ok(Number(limit.headers.get('Retry-After'))>0);
});
test('static snapshot fallback is a dated limited dataset, never fabricated live results',()=>{
 const data=snapshotSearch(snapshot,'面包');assert.equal(data.source,'snapshot');assert.equal(data.capturedAt,'2026-10-23T13:00:00Z');assert.equal(data.count,1);assert.equal(data.hasNext,false);assert.equal(data.products[0].fat,0);assert.equal(data.products[0].carbs,null);assert.equal(snapshotSearch(snapshot,'unknown'),null);
});
test('failed live requests fall back to the bundled snapshot and keep user cancellation and unknown queries distinct',async()=>{
 const calls=[];let time=0;const client=createFoodClient({now:()=>time,fetcher:async(url)=>{calls.push(url);return url==='./food-cache.json'?new Response(JSON.stringify(snapshot)):new Response('{}',{status:502});}});
 const data=await client.search('面包');assert.equal(data.source,'snapshot');assert.ok(calls[0].startsWith('./api/food-search?'));assert.equal(calls[1],'./food-cache.json');await client.search('面包');assert.equal(calls.length,2);time=7000;await assert.rejects(()=>client.search('unknown'),/暂时不可用/);
 const abort=createFoodClient({fetcher:async()=>{throw new DOMException('cancel','AbortError');}});await assert.rejects(()=>abort.search('bread'),{name:'AbortError'});
});
