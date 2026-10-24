import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultWellbeing,validWellbeing,expiryState,pantryMatches,bodyTrend,hydrationSummary,dueReminders,backupDue,WELLBEING_KEY,confirmedEnergy} from '../wellbeing.js';
import {recipeRows,estimateRecipe,recipeFood} from '../recipe-nutrition.js';
import {instantiateFavorite} from '../lifestyle.js';
import {parseBackup,planImport,applyImport,readSnapshot,DATA_KEYS} from '../backup.js';
import {transactionalWrite,JOURNAL_KEY} from '../storage.js';
import {foodFingerprint} from '../next-day.js';

test('pantry excludes expired and zero items and prioritizes food expiring within three days',()=>{
  const food={key:'tomato',name:'番茄',amount:200,unit:'g'},today='2026-10-24';
  const items=[{id:'a',name:'番茄',amount:200,unit:'g',expires:'2026-10-26'}];
  assert.equal(expiryState(items[0],today),'soon');assert.equal(pantryMatches([food],items,today).urgent,1);
  assert.equal(pantryMatches([food],[{...items[0],expires:'2026-10-23'}],today).matched,0);
  assert.equal(pantryMatches([food],[{...items[0],amount:0}],today).matched,0);
  assert.equal(pantryMatches([{key:'soy',name:'生抽（核对配料）'}],[{...items[0],name:'生抽'}],today).matched,1);
});
test('weight trends need two real days in each adjacent week, ignore future and do not impute gaps',()=>{
  const readings=[['2026-10-12',70],['2026-10-15',72],['2026-10-20',70],['2026-10-24',70],['2026-10-25',300]].map(([date,weight])=>({date,weight}));
  const trend=bodyTrend(readings,'2026-10-24');assert.equal(trend.change,-1);assert.equal(trend.points.length,4);
  assert.equal(bodyTrend(readings.slice(1),'2026-10-24').change,null);
});
test('water only counts selected-day drinks and completed exercise, without silently increasing a personal goal',()=>{
  const state=defaultWellbeing();state.hydration=[{id:'a',date:'2026-10-24',ml:250},{id:'b',date:'2026-10-23',ml:500}];
  const result=hydrationSummary(state,[{date:'2026-10-24',done:true,type:'running',minutes:60},{date:'2026-10-24',done:false,type:'running',minutes:60}],'2026-10-24');
  assert.equal(result.total,250);assert.equal(result.goal,1600);assert.deepEqual(result.exerciseRange,[400,800]);
});
test('raw recipe estimates scale portions and oil, preserve zeros and keep incomplete nutrients unknown',()=>{
  const rows=recipeRows([{key:'chicken',name:'去皮鸡胸肉',amount:200,unit:'g'},{key:'oil',name:'油',amount:10,unit:'g'}]);
  const value=estimateRecipe(rows,2,1);assert.equal(value.protein.value,22.5);assert.equal(value.calories.value,164);assert.equal(value.carbs.value,0);
  assert.equal(recipeFood('测试菜',value,1).calories,164);
  rows.push({name:'不明调料',grams:5,values:{}});const partial=estimateRecipe(rows,2,1);assert.equal(partial.calories.missing,1);assert.equal(recipeFood('测试菜',partial,1).calories,null);
  rows[2].grams=0;assert.equal(estimateRecipe(rows,2,1).calories.missing,0);
  assert.throws(()=>estimateRecipe(rows,2,3));assert.throws(()=>estimateRecipe([{grams:NaN,values:{}}],2,1));
  assert.throws(()=>estimateRecipe([{grams:100,values:{protein:101}}],1,1));
  assert.equal(recipeRows([{key:'soy',name:'生抽',unit:'ml',amount:10}])[0].grams,null);
});
test('meal template independently scales known nutrients, not nulls, and creates fresh record IDs',()=>{
  const favorite={items:[{food:'常吃食物',meal:'lunch',portion:'100g',calories:100,protein:5,carbs:null,fat:0,note:''}]};
  const [record]=instantiateFavorite(favorite,'2026-10-24','dinner',()=> 'new',[1.5]);
  assert.equal(record.calories,150);assert.equal(record.protein,7.5);assert.equal(record.carbs,null);assert.equal(record.fat,0);assert.equal(record.id,'new');assert.equal(record.meal,'dinner');
  assert.throws(()=>instantiateFavorite(favorite,'2026-10-24','lunch',()=> 'new',[0]));
});
test('reminders are opt-in, exact-time and once per local day; backup reminders can be disabled',()=>{
  const p=defaultWellbeing().preferences,now=new Date(2026,9,24,12,0);
  assert.deepEqual(dueReminders(p,now),[]);assert.equal(dueReminders({...p,reminders:true},now).length,1);
  assert.deepEqual(dueReminders({...p,reminders:true},now,{meal:'2026-10-24'}),[]);
  assert.equal(backupDue(null,0),false);assert.equal(backupDue(null,7),true);assert.equal(backupDue('2026-10-24T00:00:00Z',7,Date.parse('2026-10-25T00:00:00Z')),false);
});
test('full backups retain new data, merge conflicts explicitly, and migrate old snapshots without losing local habits',()=>{
  const habits=defaultWellbeing();habits.pantry=[{id:'a',name:'番茄',amount:200,unit:'g',expires:null}];
  const local=parseBackup(JSON.stringify({version:4,records:[],wellbeing:habits})),incoming=parseBackup(JSON.stringify({version:3,records:[]}));
  assert.equal(planImport(local,incoming).snapshot.wellbeing.pantry[0].amount,200);
  const changed=structuredClone(local);changed.wellbeing.pantry[0].amount=100;changed.wellbeing.preferences.waterGoal=2000;
  assert.equal(planImport(local,changed).counts.conflicts,1);assert.equal(planImport(local,changed).snapshot.wellbeing.pantry[0].amount,200);
  const merged=planImport(local,changed,{conflict:'backup',settings:true}).snapshot;assert.equal(merged.wellbeing.pantry[0].amount,100);assert.equal(merged.wellbeing.preferences.waterGoal,2000);
  const map=new Map(),store={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};
  applyImport(merged,store);assert.deepEqual(readSnapshot(store),merged);
  const broken=structuredClone(local);broken.wellbeing.hydration=[{id:'x',date:'2026-02-30',ml:200}];assert.equal(validWellbeing(broken.wellbeing),false);assert.throws(()=>parseBackup(JSON.stringify(broken)));
});
test('planned meal atomic write rolls both diary and plan state back when a new store exceeds quota',()=>{
  const map=new Map([[DATA_KEYS.records,'[]'],[WELLBEING_KEY,JSON.stringify(defaultWellbeing())]]);let once=true;
  const before=new Map(map),store={getItem:key=>map.get(key)??null,removeItem:key=>map.delete(key),setItem:(key,value)=>{if(key===WELLBEING_KEY&&once){once=false;throw Error('quota');}map.set(key,value);}};
  assert.throws(()=>transactionalWrite({[DATA_KEYS.records]:'["new"]',[WELLBEING_KEY]:'changed'},store));assert.deepEqual(map,before);assert.equal(store.getItem(JOURNAL_KEY),null);
});
test('energy context requires a complete matching fingerprint and no missing calories',()=>{
  const rows=[{id:'a',date:'2026-10-24',meal:'lunch',food:'测试食物',portion:'',note:'',calories:100}];
  const planner={reviews:{'2026-10-24':{complete:true,fingerprint:foodFingerprint(rows)}}};
  assert.equal(confirmedEnergy(rows,planner,'2026-10-24').average,100);
  assert.equal(confirmedEnergy([{...rows[0],calories:null}],planner,'2026-10-24').average,null);
});
