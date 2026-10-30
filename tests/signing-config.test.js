import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {desktopConfig} from '../scripts/desktop-config.mjs';
import {cookbookPages} from '../scripts/build-cookbook-pages.mjs';
test('unsigned builds keep brand metadata separate from Windows trusted publisher identity',async()=>{
 const config=desktopConfig();assert.equal(config.forceCodeSigning,false);assert.equal(config.win.signExecutable,false);assert.equal(config.win.azureSignOptions,undefined);assert.equal(config.win.signAndEditExecutable,true);
 assert.equal(JSON.parse(await readFile(new URL('../package.json',import.meta.url))).author.name,'Hangjay-Yang');assert.throws(()=>desktopConfig({WINDOWS_SIGNING_MODE:'unknown'}));
});
test('requested Azure Authenticode signing fails closed when credentials or certificate profile are missing; no credentials enter config',()=>{
 const env={WINDOWS_SIGNING_MODE:'azure',AZURE_TENANT_ID:'test-tenant',AZURE_CLIENT_ID:'test-client',AZURE_CLIENT_SECRET:'test-only-never-write-to-config',WINDOWS_CERTIFICATE_PUBLISHER:'Legally Verified Publisher',AZURE_SIGNING_ENDPOINT:'https://eus.codesigning.azure.net/',AZURE_SIGNING_ACCOUNT:'test-account',AZURE_SIGNING_PROFILE:'test-profile'};
 for(const key of Object.keys(env).filter(k=>k!=='WINDOWS_SIGNING_MODE')){const missing={...env};delete missing[key];assert.throws(()=>desktopConfig(missing),key);}
 const config=desktopConfig(env);assert.equal(config.forceCodeSigning,true);assert.equal(config.win.signExecutable,true);assert.equal(config.win.azureSignOptions.publisherName,env.WINDOWS_CERTIFICATE_PUBLISHER);assert.ok(!JSON.stringify(config).includes(env.AZURE_CLIENT_SECRET));assert.ok(!JSON.stringify(config).includes(env.AZURE_CLIENT_ID));assert.throws(()=>desktopConfig({...env,AZURE_SIGNING_ENDPOINT:'https://evil.example'}));
});
test('all four plain HTML directories match the SQLite database and need no scripts',async()=>{
 for(const [file,html] of Object.entries(cookbookPages())){assert.equal((html.match(/<article /g)??[]).length,108);assert.equal((html.match(/<section /g)??[]).length,9);assert.ok(!/<script\b/i.test(html));assert.equal(html,await readFile(new URL('../'+file,import.meta.url),'utf8'));assert.match(html,/Hangjay-Yang/);assert.match(html,/chuan-kungpao/);}
});
