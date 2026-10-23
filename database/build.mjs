import { DatabaseSync } from 'node:sqlite';
import { readFile, writeFile, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sourceCatalog, searchText } from './catalog.js';
export const DEFAULT_DATABASE = fileURLToPath(new URL('../data/cookbook.sqlite',import.meta.url));
export const DEFAULT_MANIFEST = fileURLToPath(new URL('../data/cookbook-manifest.json',import.meta.url));
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export async function buildCatalog({databasePath=DEFAULT_DATABASE,manifestPath=DEFAULT_MANIFEST}={}) {
  const catalog = sourceCatalog(), schema = await readFile(new URL('./schema.sql',import.meta.url),'utf8');
  const version = sha256(schema + JSON.stringify(catalog)).slice(0,24);
  await mkdir(dirname(databasePath),{recursive:true});
  const temp = await mkdtemp(join(dirname(databasePath),'.cookbook-build-'));
  const tempPath = join(temp,'catalog.sqlite');
  let db;
  try {
    db = new DatabaseSync(tempPath); db.exec(schema); db.exec('begin');
    const meta = db.prepare('insert into catalog_meta values (?,?)');
    for (const [key,value] of Object.entries({data_version:version,schema_version:'1',license:'MIT',scope:'public-recipes-only'})) meta.run(key,value);
    const cuisine = db.prepare('insert into cuisines values (?,?,?,?,?)');
    catalog.cuisines.forEach((c,index) => cuisine.run(c.id,c.name,c.region,c.description,index));
    const ingredient = db.prepare('insert into ingredients values (?,?,?,?)');
    for (const [id,i] of Object.entries(catalog.ingredients)) ingredient.run(id,i.name,i.unit,JSON.stringify(i.allergens));
    const recipe = db.prepare('insert into recipes values (?,?,?,?,?,?,?,?,?)');
    const amount = db.prepare('insert into recipe_ingredients values (?,?,?,?)');
    const step = db.prepare('insert into recipe_steps values (?,?,?)');
    const alias = db.prepare('insert into recipe_aliases values (?,?)');
    const search = db.prepare('insert into recipe_search values (?,?,?)');
    catalog.recipes.forEach((r,index) => {
      recipe.run(r.id,r.cuisine,r.name,r.category,r.emoji,r.minutes,r.servings,r.tip,index);
      r.ingredients.forEach((i,n) => amount.run(r.id,i.key,i.amount,n));
      r.steps.forEach((text,n) => step.run(r.id,n,text));
      [...new Set(r.aliases)].forEach(text => alias.run(r.id,text));
      for (const lang of ['zh-CN','en','ja','ko']) search.run(r.id,lang,searchText(catalog,r,lang));
    });
    const translation = db.prepare('insert into translations values (?,?,?,?)');
    for (const [source,values] of Object.entries(catalog.translations)) translation.run(source,...values);
    const definition = db.prepare('insert into nutrient_definitions values (?,?,?,?)');
    for (const [key,n] of Object.entries(catalog.nutrientDefinitions)) definition.run(key,n.label,n.unit,n.max);
    const nutrient = db.prepare('insert into ingredient_nutrients values (?,?,?,?,?)');
    for (const [id,values] of Object.entries(catalog.ingredientNutrition)) for (const [key,n] of Object.entries(values)) nutrient.run(id,key,n.value,100,n.source);
    db.exec('commit');
    if (db.prepare('pragma integrity_check').get().integrity_check !== 'ok' || db.prepare('pragma foreign_key_check').all().length) throw Error('Catalog integrity check failed');
    db.exec('vacuum'); db.close(); db = null;
    const bytes = await readFile(tempPath);
    const manifest = {schemaVersion:1,applicationId:1145194836,version,sha256:sha256(bytes),bytes:bytes.length,
      recipes:catalog.recipes.length,cuisines:catalog.cuisines.length,ingredients:Object.keys(catalog.ingredients).length,languages:['zh-CN','en','ja','ko']};
    // Build the whole catalog before replacing the published artifacts.
    await rename(tempPath,databasePath);
    await mkdir(dirname(manifestPath),{recursive:true});
    await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
    return manifest;
  } finally { db?.close(); await rm(temp,{recursive:true,force:true}); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const manifest = await buildCatalog(); console.log(`Built SQLite catalog ${manifest.version}: ${manifest.recipes} recipes / ${manifest.cuisines} cuisines / ${manifest.ingredients} ingredients`);
}
