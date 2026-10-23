import test from 'node:test';
import assert from 'node:assert/strict';
import { validBarcode, productURL, createBarcodeClient, barcodeRecord } from '../barcode.js';
import { normalizeProduct } from '../food-api.js';
const code='3017620422003';
test('barcode checksum accepts EAN/UPC families and rejects invalid digits, lengths and URL injection',()=>{
 for(const value of [code,'96385074','036000291452','03017620422003'])assert.ok(validBarcode(value),value);
 for(const value of ['3017620422004','000','12345678/../',12345678,'3017620422003?x=1'])assert.equal(validBarcode(value),false);assert.match(productURL(code),new RegExp(`/api/v2/product/${code}\\.json`));assert.throws(()=>productURL('../'));
});
test('barcode lookup caches, supports not-found and checks product identity without forwarding credentials',async()=>{
 let calls=0;const client=createBarcodeClient({now:()=>2000,fetcher:async(url,options)=>{calls++;assert.equal(options.credentials,'omit');return new Response(JSON.stringify({status:1,product:{code,product_name:'Spread',nutriments:{'saturated-fat_100g':3.5}}}));}});
 assert.equal((await client.lookup(code)).saturatedFat,3.5);await client.lookup(code);assert.equal(calls,1);
 const missing=createBarcodeClient({fetcher:async()=>new Response('{}',{status:404})});assert.equal(await missing.lookup(code),null);
 const bad=createBarcodeClient({fetcher:async()=>new Response(JSON.stringify({product:{code:'12345678',product_name:'wrong'}}))});await assert.rejects(()=>bad.lookup(code),/无效/);
});
test('package portion scaling keeps zero, missing data, micronutrient units and saturated fat distinct',()=>{
 const product=normalizeProduct({code,product_name:'牛奶',nutriments:{'energy-kcal_100g':60,proteins_100g:3.5,fat_100g:0,'saturated-fat_100g':0,'vitamin-b12_100g':.00000037}});const row=barcodeRecord(product,200,'ml','2026-10-23','breakfast');assert.equal(row.calories,120);assert.equal(row.protein,7);assert.equal(row.fat,0);assert.equal(row.saturatedFat,0);assert.equal(row.carbs,null);assert.equal(row.vitaminB12,.74);assert.equal(row.portion,'200 ml');assert.equal(row.id,'');assert.throws(()=>barcodeRecord(product,0,'g'));assert.throws(()=>barcodeRecord(product,200,'oz'));
});
