import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const directory=await mkdtemp(join(tmpdir(),'daily-bites-desktop-e2e-'));
const errors=[];
let app;
const launch=async()=>{
 const packaged=process.env.DESKTOP_EXECUTABLE;
 app=await electron.launch({...(packaged?{executablePath:packaged}:{}),args:[...(packaged?[]:['.']),'--desktop-test',`--test-data=${directory}`,'--no-sandbox'],env:{...process.env},timeout:60000});
 const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('.desktop-sidebar');return page;
};
try{
 let page=await launch();
 assert.equal(await page.evaluate(()=>typeof window.require),'undefined');
 assert.equal(await page.evaluate(()=>window.dailyBitesDesktop.isDesktop),true);
 await page.keyboard.press('Control+n');await page.locator('[name=food]').fill('桌面测试午餐');await page.locator('[name=calories]').fill('450');await page.locator('#record-form button[type=submit]').click();await page.waitForSelector('#record-dialog',{state:'hidden'});
 assert.equal(await page.evaluate(()=>JSON.parse(window.dailyBitesDesktop.storage.get('daily-bites.records.v1'))[0].food),'桌面测试午餐');
 await page.keyboard.press('Control+f');await page.waitForFunction(()=>document.querySelector('#recipe-database-status').dataset.state==='ready',null,{timeout:60000});await page.locator('[data-recipe-cuisine=chuan]').click();await page.locator('#recipe-search').fill('宫保');await page.waitForFunction(()=>document.querySelector('#recipe-current-title').textContent==='宫保鸡丁');
 await page.keyboard.press('Control+,');await page.waitForSelector('#desktop-settings:not([hidden])');await page.locator('#desktop-backup').click();await page.waitForFunction(()=>document.querySelectorAll('#desktop-backups button').length===1);
 assert.equal((await page.evaluate(()=>window.dailyBitesDesktop.status())).backups.length,1);
 await app.close();app=null;
 page=await launch();assert.equal(await page.evaluate(()=>JSON.parse(window.dailyBitesDesktop.storage.get('daily-bites.records.v1'))[0].calories),450);
 await page.keyboard.press('Control+,');await page.locator('#desktop-backups button').first().click();await page.waitForSelector('#import-preview:not([hidden])');assert.equal(await page.locator('#import-apply').isEnabled(),true);await page.locator('#close-backup').click();
 await page.locator('#language-select').selectOption('en');await page.waitForFunction(()=>document.querySelector('[data-page=settings]').textContent==='Desktop & data');
 const status=await page.evaluate(()=>window.dailyBitesDesktop.status());assert.equal(status.version,'2.0.0');assert.ok(status.dataPath.endsWith('personal.sqlite'));
 // Renderer-controlled arbitrary filesystem paths and SQL are not exposed.
 await assert.rejects(page.evaluate(()=>window.dailyBitesDesktop.storage.get('../../secrets')));
 await page.screenshot({path:process.env.DESKTOP_SCREENSHOT||join(tmpdir(),'daily-bites-desktop.png'),fullPage:true});
 assert.deepEqual(errors,[]);console.log('Desktop passed: isolated renderer, SQLite restart persistence, offline cookbook, shortcuts, verified backup and restore preview, English UI.');
}finally{if(app)await app.close();await rm(directory,{recursive:true,force:true});}
