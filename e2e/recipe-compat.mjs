import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const base=(process.env.APP_URL??'http://127.0.0.1:3000').replace(/\/$/,'');
try{
 for(const mode of ['blocked-wasm-download','no-webassembly-or-cache']){
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
  await context.route('**/vendor/sqljs/sql-wasm.wasm',r=>r.abort('failed'));
  if(mode==='no-webassembly-or-cache')await context.route('**/recipe-db-worker.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:"globalThis.WebAssembly=undefined;Object.defineProperty(globalThis,'caches',{value:{open:async()=>{throw Error('disabled')}}});\n"+await response.text()});});
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('#recipe-database-status').dataset.state==='ready'&&document.querySelector('#recipe-results').getAttribute('aria-busy')==='false',null,{timeout:90000});
  assert.equal(await page.locator('#recipe-database-status').getAttribute('data-engine'),'javascript');assert.equal(await page.locator('#recipe-results button').count(),12);
  await page.locator('[data-recipe-cuisine=all]').click();await page.locator('#recipe-search').fill('龙井');await page.waitForFunction(()=>document.querySelector('#recipe-current-title')?.textContent==='龙井虾仁');
  await page.locator('#language-select').selectOption('en');await page.waitForFunction(()=>document.querySelector('#cookbook-static-link').getAttribute('href')==='./cookbook.en.html');
  await context.close();
 }
 const context=await browser.newContext({javaScriptEnabled:false}),page=await context.newPage();
 for(const file of ['cookbook.html','cookbook.en.html','cookbook.ja.html','cookbook.ko.html']){await page.goto(`${base}/${file}`);assert.equal(await page.locator('main article').count(),108);assert.equal(await page.locator('main section').count(),9);assert.ok((await page.locator('#chuan-kungpao li').count())>5);}
 await context.close();console.log('PASS fresh browsers: blocked WASM download, no WebAssembly/cache, SQLite-compatible queries and four complete recipe directories with JavaScript disabled.');
}finally{await browser.close();}
