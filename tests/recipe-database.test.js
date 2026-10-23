import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { openCatalog, createRecipeApi } from '../database/api.js';
import { buildCatalog, DEFAULT_DATABASE } from '../database/build.mjs';
import { checkCatalog } from '../database/check.mjs';
import { createRecipeRepository, scaleRecipeIngredients } from '../recipe-query.js';
import { RECIPES, CUISINES } from '../recipes.js';
import { MESSAGES } from '../locales.js';

test('published SQLite is complete, versioned, checksum-verified and matches every original recipe field', async () => {
 const manifest=await checkCatalog();assert.equal(manifest.recipes,108);assert.equal(manifest.cuisines,9);assert.equal(manifest.ingredients,128);
});
test('catalog builds reproducibly in an isolated temporary database', async t => {
 const temp=await mkdtemp(join(tmpdir(),'daily-bites-db-test-'));t.after(()=>rm(temp,{recursive:true,force:true}));
 const options={databasePath:join(temp,'catalog.sqlite'),manifestPath:join(temp,'manifest.json')};
 const first=await buildCatalog(options),bytes=await readFile(options.databasePath);const second=await buildCatalog(options);
 assert.deepEqual(first,second);assert.deepEqual(await readFile(options.databasePath),bytes);await checkCatalog(options);
});
test('SQLite search combines cuisine, type and multilingual terms; literal SQL and wildcard characters cannot change a query', t => {
 const catalog=openCatalog();t.after(()=>catalog.close());const {repository:r}=catalog;
 assert.deepEqual(r.metadata().cuisines.map(c=>[c.id,c.count]),CUISINES.map(c=>[c.id,12]));
 const ids=[];for(let page=1;page<=9;page++){const result=r.search({page});assert.equal(result.recipes.length,12);assert.equal(result.total,108);ids.push(...result.recipes.map(i=>i.id));}
 assert.deepEqual(ids,RECIPES.map(i=>i.id));
 for(const cuisine of CUISINES)assert.equal(r.search({cuisine:cuisine.id}).total,12);
 for(const language of ['en','ja','ko'])for(const recipe of RECIPES){const name=MESSAGES[recipe.name][{en:0,ja:1,ko:2}[language]];assert.ok(r.search({query:name,cuisine:recipe.cuisine,language}).recipes.some(i=>i.id===recipe.id),name);}
 assert.equal(r.search({query:'宫爆鸡丁'}).recipes[0].id,'chuan-kungpao');
 assert.equal(r.search({query:'鲁菜'}).total,12);assert.equal(r.search({query:'番茄 鸡蛋',cuisine:'home'}).total,2);
 assert.equal(r.search({category:'plant',cuisine:'yue'}).total,2);
 for(const query of ["' OR 1=1 --",'%', '_', '<img src=x onerror=alert(1)>'])assert.equal(r.search({query}).total,0,query);
 assert.equal(r.search({page:999}).page,9);
 for(const params of [{page:0},{page:1.2},{language:'fr'},{cuisine:"lu' OR 1=1"},{category:'raw'},{query:'a'.repeat(81)}])assert.throws(()=>r.search(params));
});
test('ingredient nutrition distinguishes unknown from zero, retains units/sources and scales amounts without changing the stored recipe', t => {
 const catalog=openCatalog();t.after(()=>catalog.close());const rice=catalog.repository.detail('fried-rice');
 const nutrition=rice.ingredients.find(i=>i.key==='rice').nutrition;
 assert.equal(nutrition.calories.value,130);assert.equal(nutrition.vitaminC.value,0);assert.equal(nutrition.vitaminC.unit,'mg');assert.equal(nutrition.water.unit,'g');assert.ok(nutrition.calories.source);
 assert.deepEqual(rice.ingredients.find(i=>i.key==='egg').nutrition,{});
 const recipe=catalog.repository.detail('chuan-kungpao'),before=JSON.stringify(recipe);
 assert.equal(scaleRecipeIngredients(recipe,4)[0].amount,500);assert.equal(JSON.stringify(recipe),before);
 assert.throws(()=>catalog.db.prepare('delete from recipes').run(),/readonly/);
});
test('read-only recipe API serves real SQL data and rejects writes, injection parameters and malformed requests', async t => {
 const api=createRecipeApi();t.after(()=>api.close());const call=(path,method='GET')=>api.fetch(new Request('http://localhost/api/recipes'+path,{method}));
 assert.equal((await(await call('/meta')).json()).total,108);
 const search=await(await call('?query='+encodeURIComponent('宫保'))).json();assert.equal(search.recipes[0].id,'chuan-kungpao');
 assert.equal((await(await call('/zhe-tea-shrimp')).json()).name,'龙井虾仁');
 for(const path of ['?page=0','?page=abc','?query=a&query=b','?sql=delete','?cuisine=missing','?language=fr'])assert.equal((await call(path)).status,400,path);
 assert.equal((await call('/missing')).status,404);assert.equal((await call('/%27or1')).status,400);
 const write=await call('','POST');assert.equal(write.status,405);assert.equal(write.headers.get('Allow'),'GET, HEAD');
 assert.equal(await(await call('/meta','HEAD')).text(),'');assert.equal((await(await call('/meta')).json()).total,108);
 const broken=createRecipeApi({path:'/tmp/daily-bites-nonexistent-db/database.sqlite'});t.after(()=>broken.close());
 const response=await broken.fetch(new Request('http://localhost/api/recipes'));assert.equal(response.status,503);assert.equal((await response.json()).error.code,'recipe_database_unavailable');
});
test('vendored browser engine checksums match its pinned npm artifact manifest', async () => {
 const root=new URL('../vendor/sqljs/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 assert.equal(manifest.version,'1.13.0');assert.match(manifest.integrity,/^sha512-/);
 for(const [file,hash] of Object.entries(manifest.files))assert.equal(createHash('sha256').update(await readFile(new URL(file,root))).digest('hex'),hash,file);
});
test('the exact browser WASM engine opens and queries the published SQLite database', async () => {
 const scriptUrl=new URL('../vendor/sqljs/sql-wasm.js',import.meta.url);
 const source=await readFile(scriptUrl,'utf8');
 const prelude=`import {createRequire} from 'node:module'; const require=createRequire(${JSON.stringify(scriptUrl.href)}); const __dirname=${JSON.stringify(dirname(fileURLToPath(scriptUrl)))}; let module={exports:{}}; const exports=module.exports;\n`;
 const {default:initSqlJs}=await import('data:text/javascript;base64,'+Buffer.from(prelude+source+'\nexport default initSqlJs;').toString('base64'));
 const SQL=await initSqlJs({locateFile:file=>fileURLToPath(new URL('../vendor/sqljs/'+file,import.meta.url))});
 const db=new SQL.Database(new Uint8Array(await readFile(DEFAULT_DATABASE)));
 try {
  db.run('pragma query_only=on');
  const repository=createRecipeRepository((sql,params=[])=>{const stmt=db.prepare(sql),rows=[];try{stmt.bind(params);while(stmt.step())rows.push(stmt.getAsObject());return rows;}finally{stmt.free();}});
  assert.equal(repository.metadata().total,108);assert.equal(repository.search({query:'宫保'}).recipes[0].id,'chuan-kungpao');
  assert.equal(repository.search({query:'龍井',language:'ja'}).total,1);
  assert.throws(()=>db.run('delete from recipes'),/readonly/);
 }finally{db.close();}
});
