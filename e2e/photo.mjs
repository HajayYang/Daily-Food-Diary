import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createPhotoHandler} from '../worker/index.js';

const base=process.env.APP_URL??'http://127.0.0.1:3000';
const token='test-only-photo-access-code-32-chars',providerKey='test-only-qwen-provider-key';
const service='https://qwen-photo.example';
const env={VISION_PROVIDER:'dashscope',DASHSCOPE_API_KEY:providerKey,DASHSCOPE_BASE_URL:'https://dashscope.aliyuncs.com/compatible-mode/v1',ALLOWED_ORIGIN:new URL(base).origin,PHOTO_ACCESS_TOKEN:token};
let calls=0,truncate=false;
const handler=createPhotoHandler({fetcher:async(url,options)=>{
  calls++;assert.equal(url,env.DASHSCOPE_BASE_URL+'/chat/completions');assert.equal(options.headers.Authorization,`Bearer ${providerKey}`);
  const input=JSON.parse(options.body);assert.equal(input.enable_thinking,false);assert.equal(input.response_format.type,'json_object');assert.match(input.messages[1].content[0].image_url.url,/^data:image\/jpeg;base64,/);
  return new Response(JSON.stringify({choices:[{finish_reason:truncate?'length':'stop',message:{content:JSON.stringify({is_food:true,items:[{name:'米饭（Qwen 测试）',grams:150,calories:195,protein:4,carbs:42,fat:null,confidence:'medium',note:'受控测试值，非真实识别'}],warning:'仅供估算，需人工核对'})}}]}));
}});
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
try {
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route(service+'/**',async route=>{
    const request=route.request(),headers=await request.allHeaders();
    const response=await handler(new Request(request.url(),{method:request.method(),headers,...(['GET','HEAD','OPTIONS'].includes(request.method())?{}:{body:request.postData()})}),env);
    await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
  });
  await page.goto(base);await page.locator('#photo-open').click();await page.locator('#photo-service-url').fill(service);await page.locator('#photo-service-token').fill(token);await page.locator('#photo-save-service').click();
  assert.equal(await page.locator('#photo-consent').isChecked(),false);assert.equal(await page.locator('#photo-recognize').isDisabled(),true);await page.locator('#photo-close').click();
  for(const language of ['en','ja','ko','zh-CN']) {
    await page.locator('#language-select').selectOption(language);await page.locator('#photo-open').click();await page.locator('#photo-service-settings').evaluate(el=>el.open=true);await page.locator('#photo-check-service').click();await page.waitForFunction(()=>document.querySelector('#photo-status').textContent.includes('qwen3-vl-flash'));
    if(language==='en')assert.doesNotMatch(await page.locator('#photo-status').textContent(),/[\u4e00-\u9fff]/);
    assert.equal(await page.locator('#photo-dialog').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);await page.locator('#photo-close').click();
  }
  assert.equal(calls,0,'health checks must not call the billed model');
  await page.locator('#photo-open').click();await page.locator('#photo-upload').setInputFiles(new URL('../app-icon-192.png',import.meta.url).pathname);await page.locator('#photo-preview').waitFor({state:'visible'});assert.equal(calls,0);await page.locator('#photo-consent').check();await page.locator('#photo-recognize').click();await page.locator('#photo-review').waitFor({state:'visible'});assert.equal(calls,1);assert.equal(await page.locator('.record').count(),0);assert.equal(await page.locator('.photo-item [name=fat]').inputValue(),'');
  await page.locator('.photo-item [name=food]').fill('人工核对后的米饭');await page.locator('.photo-item [name=calories]').fill('180');await page.locator('#photo-review-save').click();assert.equal(await page.locator('.record').count(),1);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('daily-bites.records.v1'))[0]);assert.equal(stored.food,'人工核对后的米饭');assert.equal(stored.calories,180);assert.equal(stored.fat,null);assert.equal(stored.source,'photo');
  const storage=await page.evaluate(()=>JSON.stringify(localStorage));assert.ok(!storage.includes(providerKey));assert.ok(!storage.includes(token));
  truncate=true;await page.locator('#photo-open').click();await page.locator('#photo-upload').setInputFiles(new URL('../app-icon-192.png',import.meta.url).pathname);await page.locator('#photo-preview').waitFor({state:'visible'});await page.locator('#photo-consent').check();await page.locator('#photo-recognize').click();await page.waitForFunction(()=>!document.querySelector('#photo-recognize').disabled);assert.equal(calls,2);assert.equal(await page.locator('#photo-review').isHidden(),true);assert.equal(await page.locator('.record').count(),1);assert.match(await page.locator('#photo-status').textContent(),/无法可靠识别/);
  assert.deepEqual(errors,[]);console.log('PASS Qwen adapter through photo UI: four-language provider health, local image compression, consent before sending, no auto-save, editable/null-safe review, confirmed diary entry, secret exclusion and truncated-response rejection');
} finally {await browser.close();}
