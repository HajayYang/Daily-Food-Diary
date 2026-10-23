import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNextDayAdvice, foodFingerprint, nextDate, validPlanner, REVIEW_GROUPS } from '../next-day.js';
import { setLanguage, translateText } from '../i18n.js';
const date='2026-12-31';
const record={id:'food1',date,meal:'lunch',food:'米饭',portion:'一碗',note:'',calories:1800,protein:90,carbs:225,fat:60,fiber:28,sodium:1500};
const profile={goal:'health',weight:60,target:2000,experience:'regular'};
const fitness={profile,workouts:[]};
function review(records,complete=true,groups={}){return {fingerprint:foodFingerprint(records),complete,groups:{...Object.fromEntries(Object.keys(REVIEW_GROUPS).map(key=>[key,'unknown'])),...groups}};}
const codes=data=>data.insights.map(item=>item.code);
const build=(records=[record],extra={})=>buildNextDayAdvice({records,date,fitness,review:review(records),...extra});
test('next-day advice uses the selected date across year, month and leap-day boundaries',()=>{
 assert.equal(nextDate(date),'2027-01-01');assert.equal(nextDate('2024-02-28'),'2024-02-29');assert.equal(nextDate('2026-02-28'),'2026-03-01');
 const data=build([record,{...record,id:'other',date:'2027-01-01',calories:20000}]);assert.equal(data.dailyCount,1);assert.equal(data.totals.calories.total,1800);
});
test('empty or incomplete diaries never infer low intake, protein or macro ratios',()=>{
 for(const data of [build([]),build([record],{review:null}),build([record],{review:review([record],false)})]){
  assert.equal(data.complete,false);assert.equal(data.shares,null);assert.equal(codes(data).some(code=>/^(energy_|protein_|carbs_|fat_|fiber_|sodium_)/.test(code)),false);
 }
});
test('unknown nutrients differ from zero and suppress unsupported comparisons',()=>{
 const partial={...record,protein:null,fiber:undefined,sodium:undefined};const data=build([partial]);
 assert.equal(data.totals.protein.missing,1);assert.equal(data.shares,null);assert.ok(!codes(data).includes('protein_below'));assert.ok(!codes(data).includes('fiber_below'));assert.ok(!codes(data).includes('sodium_high'));
 const zero={...record,protein:0,fiber:0,sodium:2000};const known=build([zero]);assert.ok(codes(known).includes('protein_below'));assert.ok(codes(known).includes('fiber_below'));assert.ok(codes(known).includes('sodium_high'));
});
test('confirmation is tied to all food nutrient values and resets after edits',()=>{
 const confirmed=review([record],true,{fruit:'missing'});
 for(const changed of [{...record,calories:1801},{...record,vitaminC:2},{...record,water:100}]){
  const data=build([changed],{review:confirmed});assert.equal(data.complete,false);assert.equal(data.reviewChanged,true);assert.equal(data.groups.fruit,'unknown');assert.ok(!codes(data).includes('group_fruit'));
 }
 assert.equal(foodFingerprint([record,{...record,id:'b'}]),foodFingerprint([{...record,id:'b'},record]));
});
test('meal allocation uses entered targets without compensating daily intake or adding exercise',()=>{
 const low=build([{...record,calories:1000}]);const high=build([{...record,calories:3500}]);
 assert.ok(codes(low).includes('energy_below'));assert.ok(codes(high).includes('energy_above'));
 assert.deepEqual(low.menus.map(item=>item.energy),[500,700,600,200]);assert.deepEqual(low.menus.map(item=>item.energy),high.menus.map(item=>item.energy));
 const belowRmr=build([record],{fitness:{profile:{...profile,target:1200,height:180,age:30,sex:'male',activity:'moderate'},workouts:[]}});
 assert.equal(belowRmr.target,null);assert.ok(codes(belowRmr).includes('target_review'));assert.ok(belowRmr.menus.every(menu=>menu.energy===null));
});
test('tomorrow activity and reported food groups change suggestions without guessing from food names',()=>{
 const workouts=[{date,type:'running',minutes:120,intensity:'vigorous'},{date:'2027-01-01',type:'swimming',minutes:60,intensity:'moderate'}];
 const data=build([record],{fitness:{profile,workouts},review:review([record],true,{vegetables:'missing',fruit:'missing'})});
 assert.equal(data.nextWorkouts.length,1);assert.match(data.insights.find(item=>item.code==='next_active').text,/较长/);assert.ok(codes(data).includes('group_vegetables'));assert.match(data.menus[1].focus,/蔬菜/);
 assert.ok(!codes(build([record])).includes('group_vegetables'));
});
test('macro energy discrepancies block ratios; total sugar and water never become free-sugar or drinking goals',()=>{
 assert.equal(build([{...record,calories:500}]).shares,null);assert.ok(codes(build([{...record,calories:500}])).includes('macro_mismatch'));
 const data=build([{...record,sugars:100,water:100,vitaminC:4}]);assert.ok(data.shares);assert.ok(codes(data).includes('sugar_data'));assert.ok(codes(data).includes('water_data'));assert.ok(codes(data).includes('micro_data'));assert.equal(data.nutrientData.vitaminD.missing,1);
});
test('diet preferences persist a strict valid schema, and vegan menus exclude animal foods',()=>{
 assert.equal(validPlanner({diet:'vegan',reviews:{[date]:review([record])}}),true);
 for(const bad of [{diet:'bad',reviews:{}},{diet:'balanced',reviews:{'2026-02-30':review([])}},{diet:'balanced',reviews:{[date]:{complete:true}}}])assert.equal(validPlanner(bad),false);
 const data=build([record],{diet:'vegan'});assert.ok(codes(data).includes('vegan'));assert.ok(data.menus.every(menu=>!/[蛋乳奶鱼肉]/.test(menu.text)));
});
test('all generated advice and menus translate in English, Japanese and Korean',()=>{
 const scenarios=[build([]),build([record],{review:null}),build(),build([{...record,calories:500,protein:10,sodium:2000,fiber:0,sugars:1,water:100,vitaminC:4}]),build([{...record,protein:180,carbs:0,fat:60,calories:1260}]),build([{...record,protein:90,carbs:400,fat:5,calories:2005}]),...['balanced','vegetarian','vegan'].map(diet=>build([record],{diet,review:review([record],true,Object.fromEntries(Object.keys(REVIEW_GROUPS).map(key=>[key,'missing'])))}))];
 for(const language of ['en','ja','ko']){setLanguage(language);for(const data of scenarios)for(const source of [...data.insights.map(item=>item.text),...data.menus.flatMap(item=>[item.text,item.focus])])assert.notEqual(translateText(source),source,`${language}: ${source}`);}
 setLanguage('zh-CN');
});
