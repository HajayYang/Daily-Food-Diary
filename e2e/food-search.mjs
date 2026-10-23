import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.APP_URL??'http://127.0.0.1:3000';
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
try{
 const live=await browser.newPage(),errors=[];live.on('pageerror',error=>errors.push(error.message));
 if(!process.env.LIVE_FOOD_SEARCH)await live.route('**/api/food-search?**',route=>route.fulfill({json:{count:1,products:[{code:'12345678',product_name:'Bread fixture',nutriments:{fat_100g:0}}]}}));
 await live.goto(base);await live.locator('[data-food-mode=online]').click();await live.locator('#food-search').fill('面包');await live.locator('#food-online-submit').click();await live.waitForFunction(()=>document.querySelectorAll('.online-food-card').length>0);assert.ok(!(await live.locator('#food-results').textContent()).includes('快照'));assert.match((await live.locator('.online-food-card').allTextContents()).join(' '),/bread|Bread|pain|Pain/);
 // Serve the same assets under a project path, with no API as on GitHub Pages.
 const page=await browser.newPage({viewport:{width:390,height:1000}});page.on('pageerror',error=>errors.push(error.message));await page.clock.install();const app=new URL(base),prefix='/Daily-Food-Diary/';
 await page.route('**/Daily-Food-Diary/**',async route=>{const url=new URL(route.request().url());if(url.pathname===prefix+'api/food-search')return route.fulfill({status:404,body:'Not found'});const response=await route.fetch({url:app.origin+'/'+url.pathname.slice(prefix.length)+url.search});return route.fulfill({response});});
 await page.route('https://world.openfoodfacts.org/cgi/search.pl**',route=>route.abort('failed'));
 await page.goto(app.origin+prefix);await page.locator('[data-food-mode=online]').click();await page.locator('#food-search').fill('面包');await page.locator('#food-online-submit').click();await page.waitForFunction(()=>document.querySelectorAll('.online-food-card').length>0);assert.match(await page.locator('#food-results').textContent(),/快照.*抓取于.*非实时/);assert.ok((await page.locator('.online-food-card').count())>=1);assert.match(await page.locator('.online-food-source').first().textContent(),/SNAPSHOT/);assert.equal(await page.locator('#food-online-next').isDisabled(),true);
 for(const language of ['en','ja','ko','zh-CN']){await page.locator('#language-select').selectOption(language);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);if(language==='en')assert.match(await page.locator('#food-results').textContent(),/snapshot.*Not live/);}
 await page.clock.fastForward(7000);await page.locator('#food-search').fill('unknown-no-snapshot');await page.locator('#food-online-submit').click();await page.waitForFunction(()=>document.querySelector('#food-discovery-grid').getAttribute('aria-busy')==='false');assert.equal(await page.locator('.online-food-card').count(),0);assert.match(await page.locator('#food-results').textContent(),/尚未启用/);
 // Leaving online mode during a pending request must not restore old search cards.
 await page.locator('[data-food-mode=local]').click();await page.locator('#food-search').fill('');assert.equal(await page.locator('.food-guide-card').count(),8);assert.deepEqual(errors,[]);
 console.log(`PASS ${process.env.LIVE_FOOD_SEARCH?'live official':'mock'} gateway search and GitHub Pages project-path fallback: dated snapshot, true missing values, four languages, mobile layout and uncached-query errors`);
}finally{await browser.close();}
