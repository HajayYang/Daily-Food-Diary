import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAppServer} from '../server.js';

const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[];let prefixServer;
try {
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1100}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{window.notificationRequests=0;window.deliveredNotifications=[];window.Notification=class {static permission='default';static async requestPermission(){window.notificationRequests++;this.permission='granted';return 'granted';}constructor(title,options){window.deliveredNotifications.push({title,...options});}};});
  await page.goto(process.env.APP_URL??'http://127.0.0.1:3000');
  await page.waitForFunction(()=>document.querySelector('#recipe-database-status').dataset.state==='ready');
  const date=await page.locator('#date').inputValue();
  assert.equal(await page.locator('#reminders-enabled').isChecked(),false);
  assert.equal(await page.evaluate(()=>window.notificationRequests),0);
  const pantry=page.locator('#pantry-form');await pantry.locator('[name=name]').fill('番茄');await pantry.locator('[name=amount]').fill('500');await pantry.locator('[name=expires]').fill(date);await pantry.locator('[type=submit]').click();assert.match(await page.locator('#pantry-list').textContent(),/临期/);
  await page.locator('#pantry-recommend').click();await page.waitForFunction(()=>document.querySelectorAll('#pantry-recommendations .utility-row').length>0);assert.match(await page.locator('#pantry-recommend-status').textContent(),/不保证库存足量/);
  // Recipe plans are not food records until explicitly confirmed, with portion scaling.
  await page.locator('#recipe-detail .recipe-estimator .primary').click();await page.locator('#recipe-plan-form [type=submit]').click();assert.equal(await page.locator('.record').count(),0);assert.equal(await page.locator('#meal-plans .utility-row').count(),1);
  await page.locator('#meal-plans button').filter({hasText:'吃完后核对入账'}).click();await page.locator('#eat-plan-ratio').fill('0.5');await page.locator('#eat-plan-form [type=submit]').click();assert.equal(await page.locator('.record').count(),1);assert.equal(await page.locator('#meal-plans button').filter({hasText:'吃完后核对入账'}).count(),0);
  const food=await page.evaluate(()=>JSON.parse(localStorage.getItem('daily-bites.records.v1'))[0]);assert.equal(food.source,'recipe');assert.ok(food.calories>0);assert.equal(food.vitaminC,null);
  await page.locator('.record-actions button').filter({hasText:/^收藏$/}).click();await page.locator('#favorites-list button').filter({hasText:'使用收藏'}).click();await page.locator('#favorite-portions input').fill('1.5');await page.locator('#favorite-target-meal').selectOption('dinner');await page.locator('#favorite-form [type=submit]').click();
  const foods=await page.evaluate(()=>JSON.parse(localStorage.getItem('daily-bites.records.v1')));assert.equal(foods.length,2);assert.equal(foods[1].calories,Math.round(food.calories*1.5));assert.equal(foods[1].vitaminC,null);
  await page.locator('[data-drink="250"]').click();await page.locator('#hydration-ml').fill('150');await page.locator('#hydration-form [type=submit]').click();assert.match(await page.locator('#water-total').textContent(),/400/);await page.locator('#hydration-history button').first().click();assert.match(await page.locator('#water-total').textContent(),/250/);
  await page.locator('#measure-form [name=weight]').fill('70');await page.locator('#measure-form [name=waist]').fill('80');await page.locator('#measure-form [name=hip]').fill('95');await page.locator('#measure-form [type=submit]').click();assert.equal(await page.locator('#body-trend-chart circle').count(),1);assert.match(await page.locator('#body-trend-summary').textContent(),/至少记录 2 天/);
  await page.locator('#body-trend-metric').selectOption('waist');assert.equal(await page.locator('#body-trend-chart circle').count(),1);assert.match(await page.locator('#body-trend-chart svg').getAttribute('aria-label'),/腰围/);
  await page.locator('#notification-enable').click();assert.equal(await page.evaluate(()=>window.notificationRequests),1);
  const reminderNow=await page.evaluate(()=>{const n=new Date();return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;});
  await page.locator('#reminders-enabled').check();await page.locator('#reminder-meal-time').fill(reminderNow);await page.locator('#reminder-form [type=submit]').click();assert.equal(await page.evaluate(()=>window.deliveredNotifications.length),1);await page.locator('#reminder-form [type=submit]').click();assert.equal(await page.evaluate(()=>window.deliveredNotifications.length),1);
  await page.locator('#reminder-meal-time').fill('08:30');await page.locator('#backup-frequency').selectOption('14');await page.locator('#reminder-form [type=submit]').click();await page.reload();assert.equal(await page.locator('#reminders-enabled').isChecked(),true);assert.equal(await page.locator('#reminder-meal-time').inputValue(),'08:30');assert.match(await page.locator('#water-total').textContent(),/250/);
  const downloading=page.waitForEvent('download');await page.locator('#export').click();const backup=JSON.parse(await readFile(await (await downloading).path(),'utf8'));assert.equal(backup.version,4);assert.equal(backup.wellbeing.pantry.length,1);assert.equal(backup.wellbeing.mealPlans[0].status,'eaten');assert.equal(backup.wellbeing.hydration.length,1);assert.equal(backup.wellbeing.measurements.length,1);assert.equal(backup.wellbeing.preferences.backupDays,14);assert.equal(backup.sync,undefined);
  // New collections participate in import preview and merge, not just export.
  const imported=structuredClone(backup);imported.wellbeing.hydration.push({id:'imported-water',date,ml:100});
  await page.locator('#backup-open').click();await page.locator('#import-file').setInputFiles({name:'full-v4.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});await page.waitForFunction(()=>!document.querySelector('#import-preview').hidden);assert.match(await page.locator('#import-counts').textContent(),/健康习惯 1 项/);await Promise.all([page.waitForEvent('load'),page.locator('#import-apply').click()]);assert.match(await page.locator('#water-total').textContent(),/350/);
  for(const language of ['en','ja','ko','zh-CN']) {
    await page.locator('#language-select').selectOption(language);
    for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${language}/${width}`);}
    await page.locator('#privacy-open').click();assert.equal(await page.locator('#privacy-dialog').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);await page.locator('#privacy-close').click();
  }
  // A real subdirectory server verifies GitHub Pages URLs and service-worker scope.
  prefixServer=createAppServer();const handler=prefixServer.listeners('request')[0];prefixServer.removeAllListeners('request');prefixServer.on('request',(req,res)=>{if(!req.url.startsWith('/Daily-Food-Diary/')){res.writeHead(404);res.end();return;}req.url=req.url.slice('/Daily-Food-Diary'.length);handler(req,res);});
  await new Promise(resolve=>prefixServer.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${prefixServer.address().port}/Daily-Food-Diary/`;
  const offlineContext=await browser.newContext(),offline=await offlineContext.newPage();offline.on('pageerror',e=>errors.push(e.message));await offline.goto(base);
  await offline.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration())?.active),{},{timeout:45000});await offline.reload();await offline.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  assert.equal(await offline.evaluate(async()=>JSON.parse(await (await fetch('manifest.webmanifest')).text()).start_url),'./');
  await offline.evaluate(()=>{localStorage.setItem('unrelated-project','keep');return caches.open('unrelated-project-cache');});
  await offlineContext.setOffline(true);await offline.reload();await offline.waitForFunction(()=>document.querySelector('#recipe-database-status').dataset.state==='ready');
  await offline.locator('[data-drink="250"]').click();assert.match(await offline.locator('#water-total').textContent(),/250/);await offline.locator('#add-record').click();await offline.locator('#record-form [name=food]').fill('离线记录');await offline.locator('#record-form [type=submit]').click();assert.equal(await offline.locator('.record').count(),1);
  const cacheURLs=await offline.evaluate(async()=>{const names=await caches.keys(),urls=[];for(const name of names.filter(n=>n.startsWith('daily-bites.shell.')))for(const req of await(await caches.open(name)).keys())urls.push(req.url);return urls;});assert.ok(cacheURLs.length>50);assert.ok(cacheURLs.every(url=>url.startsWith(base)&&!url.includes('/api/')));
  await offlineContext.setOffline(false);await offline.locator('#privacy-open').click();assert.equal(await offline.locator('#privacy-delete').isDisabled(),true);await offline.locator('#privacy-delete-text').fill('DELETE');await Promise.all([offline.waitForEvent('load'),offline.locator('#privacy-delete').click()]);
  assert.equal(await offline.locator('.record').count(),0);assert.equal(await offline.evaluate(()=>localStorage.getItem('unrelated-project')),'keep');assert.equal(await offline.evaluate(()=>localStorage.getItem('daily-bites.wellbeing.v1')),null);assert.equal(await offline.evaluate(async()=>caches.has('unrelated-project-cache')),true);
  assert.deepEqual(errors,[]);console.log('PASS scaled meal templates, recipe plan confirmation, pantry expiry/matching, water, measurements, reminders, v4 backup/merge, four-language mobile layouts, real offline subpath reload and scoped privacy deletion');
} finally {await browser.close();if(prefixServer){prefixServer.closeAllConnections();await new Promise(resolve=>prefixServer.close(resolve));}}
