import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../server.js';
import { PUBLIC_ASSETS } from '../public-assets.js';
test('development web server serves browser assets while denying secrets and server code',async t=>{
 const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
 const base=`http://127.0.0.1:${server.address().port}`;
 const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/photo-open/);
 for(const path of ['recipe-client.js','recipe-query.js','recipe-db-worker.js','data/cookbook.sqlite','data/cookbook-manifest.json','vendor/sqljs/sql-wasm.js','vendor/sqljs/sql-wasm.wasm','recipes.js','recipes-ui.js','regional-recipes.js','photo-ui.js','next-day.js','next-day-ui.js','nutrition.js','lifestyle.js','lifestyle-ui.js','menu-plan.js','storage.js','reports.js','barcode.js','barcode-ui.js','backup.js','backup-ui.js','sync-client.js','food-snapshot.js','food-cache.json'])assert.equal((await fetch(`${base}/${path}`)).status,200,path);
 for(const path of ['/database/schema.sql','/database/api.js','/database/catalog.js','/database/build.mjs','/worker/.dev.vars','/worker/index.js','/.git/config','/server.js','/package.json','/sync/schema.sql','/food-search.js','/food-worker/index.js','/sync/README.md','/%2e%2e/worker/.dev.vars'])assert.equal((await fetch(`${base}${path}`)).status,404,path);
});
test('every offline asset is publicly readable and install metadata has correct types and relative scope',async t=>{
 const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const path of PUBLIC_ASSETS)assert.equal((await fetch(`${base}/${path}`,{method:'HEAD'})).status,200,path);
 for(const [path,mime] of [['manifest.webmanifest','application/manifest+json'],['app-icon-192.png','image/png'],['app-icon-512.png','image/png'],['app-icon.svg','image/svg+xml'],['service-worker.js','application/javascript; charset=utf-8']])assert.equal((await fetch(`${base}/${path}`)).headers.get('content-type'),mime);
 const manifest=await(await fetch(`${base}/manifest.webmanifest`)).json();assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons)assert.ok(PUBLIC_ASSETS.includes(icon.src));
 assert.ok(!PUBLIC_ASSETS.some(path=>path.startsWith('api/')||path.includes('.env')));
});
