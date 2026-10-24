import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const base=process.env.APP_URL??'http://127.0.0.1:3000';
const settle=page=>page.waitForFunction(()=>document.querySelector('#recipe-database-status').dataset.state==='ready'&&document.querySelector('#recipe-results').getAttribute('aria-busy')==='false');
try {
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),errors=[],loaded=[];
 page.on('pageerror',error=>errors.push(error.message));context.on('request',request=>loaded.push(new URL(request.url()).pathname));
 // A delayed worker reply verifies that an older query cannot overwrite the latest query.
 await context.route('**/recipe-db-worker.js',async route=>{
  const response=await route.fetch(),source=await response.text();
  await route.fulfill({response,body:source.replace('self.postMessage({id,data});',"if(action==='search'&&params.query==='宫保')await new Promise(resolve=>setTimeout(resolve,250));self.postMessage({id,data});")});
 });
 await page.goto(base);await settle(page);
 assert.equal(await page.locator('#recipe-database-status').getAttribute('data-source'),'sqlite-network');
 assert.ok(loaded.some(path=>path.endsWith('/data/cookbook.sqlite')));
 assert.ok(loaded.some(path=>path.endsWith('/vendor/sqljs/sql-wasm.wasm')));
 assert.equal(loaded.some(path=>/\/(?:recipes|regional-recipes)\.js$/.test(path)),false,'UI must not import the original JS recipe arrays');
 await page.locator('[data-recipe-cuisine=all]').click();await settle(page);
 await page.locator('#recipe-search').fill('宫保');await page.locator('#recipe-search').fill('龙井');await settle(page);
 assert.equal(await page.locator('#recipe-current-title').textContent(),'龙井虾仁');
 await page.waitForTimeout(300);assert.equal(await page.locator('#recipe-current-title').textContent(),'龙井虾仁');
 // Stop database requests only. A fresh worker must read and verify the persistent cache.
 await context.route('**/data/cookbook-manifest.json',route=>route.abort('failed'));
 await context.route('**/data/cookbook.sqlite*',route=>route.abort('failed'));
 await page.reload();await settle(page);
 assert.equal(await page.locator('#recipe-database-status').getAttribute('data-source'),'sqlite-cache');
 await context.setOffline(true);
 await page.locator('[data-recipe-cuisine=chuan]').click();await settle(page);
 await page.locator('#recipe-search').fill('宫保');await settle(page);
 assert.equal(await page.locator('#recipe-current-title').textContent(),'宫保鸡丁');
 assert.deepEqual(errors,[]);await context.close();
 // A different browser has no valid cache. Corruption must show a recoverable error.
 const clean=await browser.newContext({serviceWorkers:'block'}),bad=await clean.newPage();let corrupt=true;
 await clean.route('**/data/cookbook.sqlite*',async route=>corrupt?route.fulfill({status:200,body:'not a SQLite database',contentType:'application/vnd.sqlite3'}):route.continue());
 await bad.goto(base);await bad.waitForFunction(()=>document.querySelector('#recipe-database-status').dataset.state==='error');
 assert.equal(await bad.locator('#recipe-results button').count(),0);assert.equal(await bad.locator('#recipe-detail').isHidden(),true);
 assert.equal(await bad.locator('#recipe-database-retry').isVisible(),true);
 await bad.locator('#add-record').click();assert.equal(await bad.locator('#record-dialog').isVisible(),true);await bad.locator('#close-dialog').click();
 corrupt=false;await bad.locator('#recipe-database-retry').click();await settle(bad);
 assert.equal(await bad.locator('#recipe-results button').count(),12);
 // Even a persistent cache is rejected if its bytes no longer match the saved checksum.
 await bad.evaluate(async()=>{
  const cache=await caches.open('daily-bites.cookbook.sqlite.v1');
  for(const request of await cache.keys())if(new URL(request.url).pathname.endsWith('cookbook.sqlite'))await cache.put(request,new Response('corrupt cached bytes'));
 });
 await clean.route('**/data/cookbook-manifest.json',route=>route.abort('failed'));
 await bad.reload();await bad.waitForFunction(()=>document.querySelector('#recipe-database-status').dataset.state==='error');
 assert.equal(await bad.locator('#recipe-results button').count(),0);await clean.close();
 console.log('PASS actual browser SQLite/WASM: no JS recipe-array imports, newest-query wins, verified persistent cache, offline queries, corruption rejection, retry and independent diary');
}finally{await browser.close();}
