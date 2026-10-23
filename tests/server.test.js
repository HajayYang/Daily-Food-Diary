import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../server.js';
test('development web server serves browser assets while denying secrets and server code',async t=>{
 const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
 const base=`http://127.0.0.1:${server.address().port}`;
 const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/photo-open/);
 assert.equal((await fetch(`${base}/photo-ui.js`)).status,200);
 for(const path of ['/worker/.dev.vars','/worker/index.js','/.git/config','/server.js','/package.json','/%2e%2e/worker/.dev.vars'])assert.equal((await fetch(`${base}${path}`)).status,404,path);
});
