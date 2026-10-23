import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultLifestyle, validLifestyle, foodTemplate, instantiateFavorite, addShopping } from '../lifestyle.js';
import { buildMenuPlan, allowedIngredient } from '../menu-plan.js';
import { buildNextDayAdvice, foodFingerprint, REVIEW_GROUPS } from '../next-day.js';
import { weeklyReport } from '../reports.js';
const food={id:'a',date:'2026-10-19',meal:'lunch',food:'米饭',portion:'100g',calories:130,note:'',protein:2.7,saturatedFat:.077};
test('food/meal favorites reuse fresh IDs and selected dates without changing source records or losing nutrients',()=>{
 const favorite={id:'f',name:'午餐',items:[foodTemplate(food),foodTemplate({...food,food:'豆腐',calories:null})]};const before=JSON.stringify(food);let id=0;const rows=instantiateFavorite(favorite,'2026-10-20','dinner',()=>`new${++id}`);
 assert.deepEqual(rows.map(row=>row.id),['new1','new2']);assert.ok(rows.every(row=>row.date==='2026-10-20'&&row.meal==='dinner'));assert.equal(rows[0].saturatedFat,.077);assert.equal(rows[1].calories,null);assert.equal(JSON.stringify(food),before);assert.equal(validLifestyle({...defaultLifestyle(),favorites:[favorite]}),true);
 assert.throws(()=>instantiateFavorite(favorite,'2026-02-30','lunch'));assert.equal(validLifestyle({...defaultLifestyle(),favorites:[favorite,favorite]}),false);
});
test('restrictions remove allergens and multilingual ingredient keywords from every selected recipe and shopping item',()=>{
 for(const diet of ['balanced','vegetarian','vegan']){
  const restrictions={allergens:['milk','soy','egg','fish','gluten'],exclude:['apple','にんじん','렌틸콩']};const menus=buildMenuPlan(diet,restrictions);for(const menu of menus)for(const item of menu.ingredients){assert.ok(allowedIngredient(item,restrictions));assert.ok(!['apple','carrot','lentils'].includes(item.id));}
  assert.ok(menus[0].ingredients.some(item=>item.id==='riceDrink'));assert.ok(menus.every(menu=>new Set(menu.ingredients.map(item=>item.id)).size===menu.ingredients.length));
 }
 const impossible=buildMenuPlan('vegan',{allergens:['soy'],exclude:['扁豆','鹰嘴豆','水果','薯类','糙米饭','燕麦']});assert.ok(impossible.some(menu=>menu.unavailable));
});
test('shopping generation deduplicates per date and preserves checked pantry items without changing existing list',()=>{
 const ingredient={label:'苹果'},current=[{id:'a',name:'苹果',date:'2026-10-20',checked:true}];const result=addShopping(current,[ingredient,ingredient,{label:'豆腐'}],'2026-10-20',()=> 'new');assert.equal(result.length,2);assert.equal(result[0].checked,true);assert.equal(current.length,1);assert.equal(addShopping(current,[ingredient],'2026-10-21',()=> 'new').length,2);
});
test('weekly report separates empty, partial and confirmed days across month/year boundaries',()=>{
 const date='2026-12-31',record={...food,date},partial={...food,id:'b',date:'2026-12-30',calories:500},missing={...food,id:'c',date:'2027-01-01',calories:null};const planner={reviews:{[date]:{fingerprint:foodFingerprint([record]),complete:true}}};
 const report=weeklyReport([record,partial,missing],null,planner,date);assert.equal(report.start,'2026-12-28');assert.equal(report.end,'2027-01-03');assert.equal(report.completeDays,1);assert.equal(report.recordedDays,3);assert.equal(report.averageEnergy,130);assert.equal(report.energyDays,1);assert.equal(report.days.filter(day=>!day.count).length,4);assert.equal(report.foodNames,1);
 assert.equal(weeklyReport([{...record,protein:3}],null,planner,date).completeDays,0);
});
test('saturated-fat advice requires a complete day and complete energy/nutrient values',()=>{
 const record={...food,calories:1000,saturatedFat:20};const review={fingerprint:foodFingerprint([record]),complete:true,groups:Object.fromEntries(Object.keys(REVIEW_GROUPS).map(key=>[key,'unknown']))};
 const build=(records,review)=>buildNextDayAdvice({records,date:record.date,review});assert.ok(build([record],review).insights.some(note=>note.code==='saturated_fat'));assert.ok(!build([record],null).insights.some(note=>note.code==='saturated_fat'));assert.ok(!build([{...record,saturatedFat:null}],review).insights.some(note=>note.code==='saturated_fat'));
 assert.equal(buildNextDayAdvice({records:[food],date:food.date,restrictions:null}).menus.length,0);
});

test('inconsistent total and saturated fat values block saturated-fat percentage advice',()=>{
 const record={...food,fat:0,saturatedFat:20,calories:1000};const review={complete:true,fingerprint:foodFingerprint([record]),groups:Object.fromEntries(Object.keys(REVIEW_GROUPS).map(key=>[key,'unknown']))};const data=buildNextDayAdvice({records:[record],date:record.date,review});assert.ok(data.insights.some(note=>note.code==='saturated_mismatch'));assert.ok(!data.insights.some(note=>note.code==='saturated_fat'));
});
