import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MESSAGES } from '../locales.js';
import { LANGUAGES, setLanguage, getLanguage, translateText, formatDateLabel } from '../i18n.js';
import { SPORT_TEMPLATES, dailyTemplate, workoutEnergy } from '../training.js';
import { TYPES, validWorkout, validFitness, weekSummary } from '../fitness.js';
import { FOOD_GUIDE } from '../food-discovery.js';

test('every sport template is valid, has an expenditure estimate and counts completed aerobic activity', () => {
 const records=[];
 for(const type of ['swimming','running','badminton','tabletennis','tennis','hiking']) {
  assert.ok(TYPES[type]);
  const workout={...dailyTemplate('2026-10-23',{experience:'beginner'},type),id:type,date:'2026-10-23',done:true,weight:70};
  assert.equal(validWorkout(workout),true,type);assert.ok(workoutEnergy(workout,{}).gross>0);records.push(workout);
 }
 assert.equal(weekSummary(records,'2026-10-23').aerobic,records.reduce((sum,w)=>sum+w.minutes,0));
 assert.equal(validWorkout({...records[0],exercise:'running'}),false);
 assert.equal(validFitness({profile:{goal:'health',weight:70,target:null},workouts:[{id:'old',date:'2026-10-23',type:'cardio',minutes:30,intensity:'moderate',done:false}]}),true);
});
test('all UI copy, local food descriptions and sport instructions have three translations',()=>{
 for(const [source,values] of Object.entries(MESSAGES)){assert.equal(values.length,3,source);assert.ok(values.every(value=>typeof value==='string'&&value.length>0),source);}
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const keys=[...html.matchAll(/>([^<>]*[\u4e00-\u9fff][^<>]*)</g)].map(m=>m[1].trim());
 for(const m of html.matchAll(/(?:placeholder|aria-label|title)="([^"]*[\u4e00-\u9fff][^"]*)"/g))keys.push(m[1]);
 for(const key of keys.filter(key=>!['食','简体中文','日本語'].includes(key)))assert.ok(MESSAGES[key],key);
 for(const food of FOOD_GUIDE)for(const field of ['name','tag','state','feature','portion','pairing'])assert.ok(MESSAGES[food[field]],`${food.name}.${field}`);
 for(const plan of Object.values(SPORT_TEMPLATES))for(const field of ['beginner','regular'])assert.ok(MESSAGES[plan[field]],field);
});
test('language roundtrip translates parameterized labels and preserves literal query data',()=>{
 for(const language of ['en','ja','ko']){
  setLanguage(language);assert.notEqual(translateText('游泳'),'游泳');
  assert.ok(translateText('游泳 · 30 分钟').includes('30'));
  assert.ok(translateText('正在查询“$&苹果{n}” · 第 2 页…').includes('$&苹果{n}'));
 }
 setLanguage('en');assert.equal(translateText('constructor'),'constructor');assert.equal(translateText('__proto__'),'__proto__');assert.equal(translateText('完成游泳'),'Complete Swimming');assert.equal(translateText('0 kcal 已记录 · 尚未设置个人能量参考'),'0 kcal logged · no personal energy target set');
 assert.equal(translateText('蛋白质'),'Protein');
 assert.ok(!/[\u4e00-\u9fff]/.test(translateText(dailyTemplate('2026-10-19',{goal:'health',experience:'beginner'}).details)));
 assert.match(formatDateLabel('2026-10-23',true),/Oct/);
 setLanguage('zh-CN');assert.equal(translateText('游泳'),'游泳');assert.equal(getLanguage(),'zh-CN');
 assert.throws(()=>setLanguage('fr'));assert.equal(LANGUAGES.length,4);
});
