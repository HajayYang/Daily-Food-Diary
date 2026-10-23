import test from 'node:test';
import assert from 'node:assert/strict';
import { validRecord } from '../records.js';
import { NUTRIENTS, nutrientTotals, scaleNutrients } from '../nutrition.js';
import { normalizeProduct } from '../food-api.js';
import { scaleFood } from '../fitness.js';
const record={id:'a',date:'2026-10-23',meal:'lunch',food:'牛奶',portion:'200g',calories:122,note:''};
test('six-class nutrition extends old records without inventing zeroes and validates all new fields',()=>{
 assert.ok(validRecord(record));
 for(const [key,{max}] of Object.entries(NUTRIENTS)){
  for(const value of [0,null,max])assert.ok(validRecord({...record,[key]:value}),key);
  for(const value of [-1,Infinity,NaN,'1',max+1])assert.equal(validRecord({...record,[key]:value}),false,key);
 }
 assert.ok(validRecord({...record,nutritionSource:'包装标签'}));assert.equal(validRecord({...record,nutritionSource:12}),false);
});
test('scaling keeps distinct micro units and small trace values, while totals expose data gaps',()=>{
 assert.deepEqual(scaleNutrients({vitaminC:4.6,vitaminB12:.37,water:85.56},50),{...Object.fromEntries(Object.keys(NUTRIENTS).map(key=>[key,null])),vitaminC:2.3,vitaminB12:.185,water:42.78});
 const scaled=scaleFood(3,150);assert.equal(scaled.water,112.365);assert.equal(scaled.sugars,18.345);assert.equal(scaled.vitaminC,13.05);
 const totals=nutrientTotals([{vitaminC:0,water:100},{water:50}]);assert.deepEqual(totals.vitaminC,{total:0,missing:1});assert.deepEqual(totals.water,{total:150,missing:0});
});
test('OFF canonical gram micronutrients convert to mg/µg without treating missing vitamins as zero',()=>{
 const product=normalizeProduct({code:'12345678',product_name:'milk',nutriments:{'vitamin-c_100g':.0046,'vitamin-d_100g':.000002,'vitamin-b12_100g':.00000037,calcium_100g:.12,sodium_100g:0,'vitamin-a_100g':.001}});
 assert.equal(product.vitaminC,4.6);assert.equal(product.vitaminD,2);assert.equal(product.vitaminB12,.37);assert.equal(product.calcium,120);assert.equal(product.sodium,0);assert.equal(product.water,null);assert.equal(product.iron,null);assert.equal(product.vitaminA,null);
});
