import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../server.js';
test('development web server serves browser assets while denying secrets and server code',async t=>{
 const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
 const base=`http://127.0.0.1:${server.address().port}`;
 const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/photo-open/);
 for(const path of ['recipes.js','recipes-ui.js','regional-recipes.js','photo-ui.js','next-day.js','next-day-ui.js','nutrition.js','lifestyle.js','lifestyle-ui.js','menu-plan.js','storage.js','reports.js','barcode.js','barcode-ui.js','backup.js','backup-ui.js','sync-client.js','food-snapshot.js','food-cache.json'])assert.equal((await fetch(`${base}/${path}`)).status,200,path);
 for(const path of ['/worker/.dev.vars','/worker/index.js','/.git/config','/server.js','/package.json','/sync/schema.sql','/food-search.js','/food-worker/index.js','/sync/README.md','/%2e%2e/worker/.dev.vars'])assert.equal((await fetch(`${base}${path}`)).status,404,path);
});
