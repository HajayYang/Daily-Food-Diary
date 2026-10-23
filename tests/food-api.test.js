import test from 'node:test';
import assert from 'node:assert/strict';
import { nutrient, normalizeProduct, normalizeSearch, searchURL, createFoodClient } from '../food-api.js';
const product={code:'12345678',product_name:'Apple yogurt',nutriments:{'energy-kcal_100g':65,proteins_100g:3.5,fat_100g:0,salt_100g:.04}};
test('preserves zero and small nutrients while keeping unknown or invalid values null',()=>{
 for(const value of [null,undefined,'',' ',false,'oops',-1,Infinity]) assert.equal(nutrient(value),null);
 assert.equal(nutrient(0),0);assert.equal(nutrient('0.04'),.04);
 const p=normalizeProduct(product);assert.equal(p.kcal,65);assert.equal(p.protein,3.5);assert.equal(p.fat,0);assert.equal(p.sugars,null);assert.equal(p.salt,.04);
});
test('converts kJ only when kcal missing and generates trusted source links',()=>{
 const p=normalizeProduct({...product,nutriments:{energy_100g:418.4}});assert.equal(p.kcal,100);assert.equal(p.url,'https://world.openfoodfacts.org/product/12345678');
 assert.equal(normalizeProduct({...product,code:'javascript:alert(1)'}),null);assert.equal(normalizeProduct({...product,product_name:''}),null);
});
test('builds encoded public search URLs with pagination and exact Chinese aliases',()=>{
 const url=new URL(searchURL('苹果',2));assert.equal(url.hostname,'search.openfoodfacts.org');assert.equal(url.searchParams.get('q'),'apple');assert.equal(url.searchParams.get('page'),'2');
 assert.equal(new URL(searchURL('milk & oats')).searchParams.get('q'),'milk & oats');assert.throws(()=>searchURL(''));assert.throws(()=>searchURL('apple',0));
});
test('normalizes duplicates, malformed products, counts and last-page state',()=>{
 const result=normalizeSearch({count:9,products:[product,product,{},null]},1);assert.equal(result.products.length,1);assert.equal(result.hasNext,true);
 assert.equal(normalizeSearch({count:9,products:[product]},2).hasNext,false);assert.throws(()=>normalizeSearch({products:null},1));
});
test('client caches requests and enforces network request spacing',async()=>{
 let time=0,calls=0;const client=createFoodClient({now:()=>time,fetcher:async()=>{calls++;return{ok:true,json:async()=>({count:1,products:[product]})};}});
 await client.search('apple');await client.search('apple');assert.equal(calls,1);
 await assert.rejects(()=>client.search('milk'),/频繁/);time=7000;await client.search('milk');assert.equal(calls,2);
 time=700000;await client.search('apple');assert.equal(calls,3);
});
test('client reports rate limits and propagates aborted requests',async()=>{
 const client=createFoodClient({fetcher:async()=>({ok:false,status:429})});await assert.rejects(()=>client.search('apple'),/次数过多/);
 const aborted=createFoodClient({fetcher:async(url,options)=>{assert.equal(options.credentials,'omit');throw new DOMException('Aborted','AbortError');}});
 await assert.rejects(()=>aborted.search('apple',1,new AbortController().signal),{name:'AbortError'});
});
