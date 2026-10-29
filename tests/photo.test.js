import test from 'node:test';
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
import assert from 'node:assert/strict';
import { validateRecognition, normalizePhotoService, validPhotoDataUrl, MAX_PHOTO_BODY } from '../photo-core.js';
import { createPhotoHandler } from '../worker/index.js';
import { requestPhotoService } from '../photo-client.js';
import { dashscopeEndpoint } from '../worker/providers.js';
const token='test-only-access-token-32-characters';
const env={OPENAI_API_KEY:'test-only-provider-key',PHOTO_ACCESS_TOKEN:token,ALLOWED_ORIGIN:'https://example.org',VISION_MODEL:'gpt-4.1-mini'};
const image=`data:image/jpeg;base64,${Buffer.from([255,216,255,...Array(120).fill(0)]).toString('base64')}`;
const item={name:'米饭',grams:150,calories:195,protein:4,carbs:42,fat:null,confidence:'medium',note:'份量可能有误差'};
const result={is_food:true,items:[item],warning:'仅供估算，需核对'};
function req(body={image,language:'zh-CN'},options={}) {return new Request('https://worker.example/api/recognize-meal',{method:'POST',headers:{Origin:'https://example.org',Authorization:`Bearer ${token}`,'Content-Type':'application/json',...options.headers},body:JSON.stringify(body)});}
const providerResponse=(data=result)=>new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(data)}]}]}),{status:200});

test('recognition validates uncertainty, bounds, food detection and all nutrients',()=>{
 assert.equal(validateRecognition(result).items[0].fat,null);assert.deepEqual(validateRecognition({is_food:false,items:[],warning:''}),{is_food:false,items:[],warning:''});
 for(const change of [{calories:-1},{protein:undefined},{grams:0},{confidence:'100%'},{name:''},{calories:1.5}])assert.throws(()=>validateRecognition({...result,items:[{...item,...change}]}));
 assert.throws(()=>validateRecognition({...result,items:Array(11).fill(item)}));assert.throws(()=>validateRecognition({...result,is_food:false}));
});
test('service address and image payload reject insecure remote URLs and non-image data',()=>{
 assert.equal(normalizePhotoService('https://worker.example/'),'https://worker.example');assert.equal(normalizePhotoService('http://localhost:8787'),'http://localhost:8787');
 for(const url of ['http://external.example','javascript:alert(1)','https://user:pass@worker.example','https://worker.example/path','https://worker.example/?token=secret'])assert.throws(()=>normalizePhotoService(url));
 assert.equal(validPhotoDataUrl(image),true);assert.equal(validPhotoDataUrl('https://example.org/image.jpg'),false);assert.equal(validPhotoDataUrl('data:image/svg+xml;base64,aaaa'),false);assert.equal(validPhotoDataUrl('data:image/jpeg;base64,aaaa'),false);
});
test('worker enforces exact origin and access code before any provider call',async()=>{
 let calls=0;const handler=createPhotoHandler({fetcher:async()=>{calls++;return providerResponse();}});
 assert.equal((await handler(req(undefined,{headers:{Origin:'https://other.example'}}),env)).status,403);
 assert.equal((await handler(req(undefined,{headers:{Authorization:'Bearer wrong'}}),env)).status,401);
 assert.equal((await handler(req(),{...env,OPENAI_API_KEY:''})).status,503);assert.equal(calls,0);
 const preflight=await handler(new Request('https://worker.example/api/recognize-meal',{method:'OPTIONS',headers:{Origin:'https://example.org'}}),env);assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://example.org');
});
test('worker sends only image/language to the fixed Responses API and does not leak credentials',async()=>{
 const handler=createPhotoHandler({fetcher:async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.headers.Authorization,`Bearer ${env.OPENAI_API_KEY}`);
  const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.equal(body.input[0].content[1].image_url,image);assert.ok(!options.body.includes(token));assert.ok(!options.body.includes(env.OPENAI_API_KEY));return providerResponse();
 }});
 const response=await handler(req(),env);assert.equal(response.status,200);assert.deepEqual(await response.json(),result);assert.equal(response.headers.get('Cache-Control'),'no-store');
});
test('worker handles oversized bodies, invalid model data, refusal and provider errors',async()=>{
 let calls=0;const handler=createPhotoHandler({fetcher:async()=>{calls++;return providerResponse({...result,items:[{...item,calories:-99}]});}});
 assert.equal((await handler(req({image:'x'.repeat(MAX_PHOTO_BODY),language:'en'}),env)).status,413);assert.equal(calls,0);
 assert.equal((await handler(req(),env)).status,422);
 assert.equal((await createPhotoHandler({fetcher:async()=>new Response('',{status:429})})(req(),env)).status,429);
 assert.equal((await createPhotoHandler({fetcher:async()=>new Response(JSON.stringify({status:'incomplete'}))})(req(),env)).status,422);
});
test('worker isolate limit caps repeated requests without calling the provider again',async()=>{
 let calls=0;const handler=createPhotoHandler({now:()=>1000,fetcher:async()=>{calls++;return providerResponse();}});
 for(let i=0;i<6;i++)assert.equal((await handler(req(),env)).status,200);
 assert.equal((await handler(req(),env)).status,429);assert.equal(calls,6);
});
test('client uses service access code, preserves null values and reports unavailable configuration',async()=>{
 const data=await requestPhotoService({url:'https://worker.example',token:'browser-code',image,language:'ja',fetcher:async(url,options)=>{
  assert.equal(url,'https://worker.example/api/recognize-meal');assert.equal(options.headers.Authorization,'Bearer browser-code');assert.equal(options.credentials,'omit');assert.equal(JSON.parse(options.body).language,'ja');return new Response(JSON.stringify(result));
 }});assert.equal(data.items[0].fat,null);
 await assert.rejects(()=>requestPhotoService({url:'https://worker.example',token:'code',fetcher:async()=>new Response(JSON.stringify({error:{code:'not_configured'}}),{status:503})}),/not_configured/);
});

const qwenEnv={VISION_PROVIDER:'dashscope',DASHSCOPE_API_KEY:'test-only-bailian-provider-key-32-chars',DASHSCOPE_BASE_URL:'https://workspace-test.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',PHOTO_ACCESS_TOKEN:token,ALLOWED_ORIGIN:'https://example.org',VISION_MODEL:'gpt-4.1-mini'};
const qwenResponse=(data=result,finish='stop')=>new Response(JSON.stringify({choices:[{finish_reason:finish,message:{role:'assistant',content:JSON.stringify(data)}}]}));
test('Qwen uses official regional chat completions with image data, JSON mode and disabled thinking',async()=>{
 const handler=createPhotoHandler({fetcher:async(url,options)=>{
  assert.equal(url,qwenEnv.DASHSCOPE_BASE_URL+'/chat/completions');assert.equal(options.headers.Authorization,`Bearer ${qwenEnv.DASHSCOPE_API_KEY}`);assert.equal(options.redirect,'error');
  const body=JSON.parse(options.body);assert.equal(body.model,'qwen3-vl-flash');assert.equal(body.enable_thinking,false);assert.equal(body.stream,false);assert.deepEqual(body.response_format,{type:'json_object'});assert.equal(body.messages[1].content[0].image_url.url,image);assert.match(body.messages[1].content[1].text,/ja/);assert.match(body.messages[0].content,/JSON schema/);
  assert.equal(body.store,undefined);assert.ok(!options.body.includes(token));assert.ok(!options.body.includes(qwenEnv.DASHSCOPE_API_KEY));assert.ok(!options.body.includes('never-forward'));assert.ok(!options.body.includes('"profile"'));return qwenResponse();
 }});
 const response=await handler(req({image,language:'ja',profile:{weight:80},records:['never-forward'],provider:'openai'}),qwenEnv);assert.equal(response.status,200);assert.deepEqual(await response.json(),result);
});
test('Qwen base URLs allow only official hosts and paths, and never accept redirects or arbitrary proxies',()=>{
 for(const [base,region] of [['https://dashscope.aliyuncs.com/compatible-mode/v1','cn-beijing'],['https://dashscope-intl.aliyuncs.com/compatible-mode/v1/','ap-southeast-1'],['https://dashscope-us.aliyuncs.com/compatible-mode/v1','us-east-1'],['https://workspace-test.eu-central-1.maas.aliyuncs.com/compatible-mode/v1','eu-central-1'],['https://cn-hongkong.dashscope.aliyuncs.com/compatible-mode/v1','cn-hongkong']])assert.equal(dashscopeEndpoint(base).region,region);
 for(const base of ['https://evil.example/compatible-mode/v1','https://constructor/compatible-mode/v1','https://__proto__/compatible-mode/v1','https://dashscope.aliyuncs.com.evil.example/compatible-mode/v1','http://dashscope.aliyuncs.com/compatible-mode/v1','https://secret@dashscope.aliyuncs.com/compatible-mode/v1','https://dashscope.aliyuncs.com:8443/compatible-mode/v1','https://dashscope.aliyuncs.com/compatible-mode/v1?key=secret','https://dashscope.aliyuncs.com/api/v1','https://workspace.unknown.maas.aliyuncs.com/compatible-mode/v1'])assert.equal(dashscopeEndpoint(base),null,base);
});
test('Qwen health exposes selected provider/model/region, does not bill or return keys, and needs only Qwen credentials',async()=>{
 let calls=0;const handler=createPhotoHandler({fetcher:async()=>{calls++;return qwenResponse();}});
 const request=new Request('https://worker.example/api/health',{headers:{Origin:'https://example.org',Authorization:`Bearer ${token}`}});
 const response=await handler(request,{...qwenEnv,DASHSCOPE_MODEL:'qwen3-vl-plus'});assert.equal(response.status,200);assert.deepEqual(await response.json(),{ready:true,provider:'dashscope',model:'qwen3-vl-plus',region:'cn-beijing'});assert.equal(calls,0);
 for(const change of [{DASHSCOPE_API_KEY:''},{DASHSCOPE_BASE_URL:'https://evil.example/compatible-mode/v1'},{VISION_PROVIDER:'other'},{DASHSCOPE_MODEL:'bad\nmodel'},{PHOTO_ACCESS_TOKEN:qwenEnv.DASHSCOPE_API_KEY}])assert.equal((await handler(req(),{...qwenEnv,...change})).status,503);
 assert.equal(calls,0);
});
test('Qwen rejects truncated, refused, malformed and out-of-range results without falling back to another provider',async()=>{
 for(const response of [qwenResponse(result,'length'),qwenResponse({...result,items:[{...item,grams:9000}]}),new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'```json\n{}\n```'}}]})),new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{refusal:'cannot',content:JSON.stringify(result)}}]}))]) {
  let calls=0;const handler=createPhotoHandler({fetcher:async()=>{calls++;return response;}});assert.equal((await handler(req(),{...qwenEnv,OPENAI_API_KEY:'unused-openai-key'})).status,422);assert.equal(calls,1);
 }
 const noFood=await createPhotoHandler({fetcher:async()=>qwenResponse({is_food:false,items:[],warning:''})})(req(),qwenEnv);assert.equal(noFood.status,200);assert.equal((await noFood.json()).is_food,false);
 for(const status of [401,403,429,500]) {const response=await createPhotoHandler({fetcher:async()=>new Response('provider secret error',{status})})(req(),qwenEnv);assert.equal(response.status,status===429?429:502);assert.ok(!(await response.text()).includes('provider secret error'));}
});
