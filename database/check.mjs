import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { sha256, DEFAULT_DATABASE, DEFAULT_MANIFEST } from './build.mjs';
import { openCatalog } from './api.js';
import { sourceCatalog } from './catalog.js';
export async function checkCatalog({databasePath=DEFAULT_DATABASE,manifestPath=DEFAULT_MANIFEST,compareSources=true}={}) {
 const manifest=JSON.parse(await readFile(manifestPath,'utf8')),bytes=await readFile(databasePath);
 assert.equal(bytes.subarray(0,16).toString(),'SQLite format 3\0');
 assert.equal(bytes.length,manifest.bytes);assert.equal(sha256(bytes),manifest.sha256);
 const catalog=openCatalog(databasePath);
 try {
  assert.equal(catalog.db.prepare('pragma integrity_check').get().integrity_check,'ok');
  assert.deepEqual(catalog.db.prepare('pragma foreign_key_check').all(),[]);
  const meta=catalog.repository.metadata();
  assert.equal(meta.version,manifest.version);assert.equal(meta.total,manifest.recipes);assert.equal(meta.cuisines.length,manifest.cuisines);
  if(compareSources) {
   const source=sourceCatalog(),schema=await readFile(new URL('./schema.sql',import.meta.url),'utf8');
   assert.equal(manifest.version,sha256(schema+JSON.stringify(source)).slice(0,24),'Run npm run db:build after changing catalog sources');
   assert.equal(meta.total,source.recipes.length);assert.deepEqual(meta.translations,source.translations);
   for(const recipe of source.recipes) {
    const actual=catalog.repository.detail(recipe.id);
    for(const key of ['id','name','cuisine','category','emoji','minutes','servings','tip','steps'])assert.deepEqual(actual[key],recipe[key],`${recipe.id}.${key}`);
    assert.deepEqual(actual.aliases,[...new Set(recipe.aliases)].sort());
    assert.deepEqual(actual.ingredients.map(i=>({key:i.key,amount:i.amount})),recipe.ingredients);
    for(const item of actual.ingredients) {
     assert.equal(item.name,source.ingredients[item.key].name);assert.equal(item.unit,source.ingredients[item.key].unit);
     assert.deepEqual(item.allergens,source.ingredients[item.key].allergens);
    }
   }
  }
  return manifest;
 } finally {catalog.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
 const manifest=await checkCatalog();console.log(`PASS SQLite integrity, manifest checksum, foreign keys and all ${manifest.recipes} recipe imports`);
}
