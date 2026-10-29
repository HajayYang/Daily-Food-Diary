import { localStore } from './app-storage.js';
import { validRecord } from './records.js';
import { validFitness } from './fitness.js';
import { validPlanner } from './next-day.js';
import { validLifestyle, defaultLifestyle, LIFESTYLE_KEY } from './lifestyle.js';
import { canWrite, transactionalWrite } from './storage.js';
import { WELLBEING_KEY, validWellbeing, defaultWellbeing } from './wellbeing.js';
export const MAX_BACKUP_BYTES=2*1024*1024;
export const DATA_KEYS={records:'daily-bites.records.v1',fitness:'daily-bites.fitness.v1',nextDay:'daily-bites.next-day.v1',lifestyle:LIFESTYLE_KEY,wellbeing:WELLBEING_KEY};
const unique=items=>new Set(items.map(item=>item.id)).size===items.length;
export function validSnapshot(data){return Boolean(data&&[1,2,3,4].includes(data.version)&&Array.isArray(data.records)&&data.records.length<=20000&&data.records.every(validRecord)&&unique(data.records)&&(data.fitness==null||validFitness(data.fitness))&&(data.nextDay==null||validPlanner(data.nextDay))&&(data.lifestyle==null||validLifestyle(data.lifestyle))&&(data.wellbeing==null||validWellbeing(data.wellbeing)));}
export function parseBackup(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw Error('备份文件必须小于 2 MiB。');
 let data;try{data=JSON.parse(text);}catch{throw Error('备份不是有效 JSON 文件。');}if(!validSnapshot(data))throw Error('备份格式或数据校验失败，没有修改现有记录。');
 // Never import model-service settings, tokens, appearance images or arbitrary top-level keys.
 return {version:4,records:data.records,fitness:data.fitness??null,nextDay:data.nextDay??null,lifestyle:data.lifestyle??null,wellbeing:data.wellbeing??null};
}
export function readSnapshot(storage=localStore){
 if(!canWrite(storage))throw Error('请先刷新页面以恢复上次未完成的导入。');
 let result={version:4};try{for(const [key,name] of Object.entries(DATA_KEYS)){const value=storage.getItem(name);result[key]=value===null?(key==='records'?[]:null):JSON.parse(value);}}catch{throw Error('本地数据无法读取，暂不能导入或上传。');}
 if(!validSnapshot(result))throw Error('本地数据无法读取，暂不能导入或上传。');return result;
}
export function canonical(value){if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;return JSON.stringify(value);}
function mergeItems(local,incoming,choice){const map=new Map(local.map(item=>[item.id,item]));let added=0,conflicts=0,duplicates=0;for(const item of incoming){if(!map.has(item.id)){added++;map.set(item.id,item);}else if(canonical(map.get(item.id))===canonical(item))duplicates++;else{conflicts++;if(choice==='backup')map.set(item.id,item);}}return {items:[...map.values()],added,conflicts,duplicates};}
export function planImport(local,incoming,{conflict='local',settings=false}={}){
 if(!validSnapshot(local)||!validSnapshot(incoming)||!['local','backup'].includes(conflict))throw Error('备份格式或数据校验失败，没有修改现有记录。');
 const records=mergeItems(local.records,incoming.records,conflict),workouts=mergeItems(local.fitness?.workouts??[],incoming.fitness?.workouts??[],conflict);
 const favorites=mergeItems(local.lifestyle?.favorites??[],incoming.lifestyle?.favorites??[],conflict),shopping=mergeItems(local.lifestyle?.shopping??[],incoming.lifestyle?.shopping??[],conflict);
 const fitness=local.fitness||incoming.fitness?{profile:settings?(incoming.fitness?.profile??local.fitness.profile):(local.fitness?.profile??incoming.fitness.profile),workouts:workouts.items}:null;
 const nextDay=local.nextDay||incoming.nextDay?{diet:settings?(incoming.nextDay?.diet??local.nextDay.diet):(local.nextDay?.diet??incoming.nextDay.diet),reviews:conflict==='backup'?{...local.nextDay?.reviews,...incoming.nextDay?.reviews}:{...incoming.nextDay?.reviews,...local.nextDay?.reviews}}:null;
 const lifestyle={favorites:favorites.items,shopping:shopping.items,restrictions:settings?(incoming.lifestyle?.restrictions??local.lifestyle?.restrictions??defaultLifestyle().restrictions):(local.lifestyle?.restrictions??incoming.lifestyle?.restrictions??defaultLifestyle().restrictions)};
 const habitKeys=['pantry','measurements','hydration','mealPlans'],habits=Object.fromEntries(habitKeys.map(key=>[key,mergeItems(local.wellbeing?.[key]??[],incoming.wellbeing?.[key]??[],conflict)]));
 const wellbeing=local.wellbeing||incoming.wellbeing?{...Object.fromEntries(habitKeys.map(key=>[key,habits[key].items])),preferences:settings?(incoming.wellbeing?.preferences??local.wellbeing?.preferences):(local.wellbeing?.preferences??incoming.wellbeing?.preferences??defaultWellbeing().preferences)}:null;
 const snapshot={version:4,records:records.items,fitness,nextDay,lifestyle,wellbeing};if(!validSnapshot(snapshot))throw Error('合并后的数据超出限制，请先整理记录。');
 const all=[records,workouts,favorites,shopping,...Object.values(habits)];
 return {snapshot,counts:{records:records.added,workouts:workouts.added,favorites:favorites.added,shopping:shopping.added,habits:Object.values(habits).reduce((n,i)=>n+i.added,0),conflicts:all.reduce((n,i)=>n+i.conflicts,0),duplicates:all.reduce((n,i)=>n+i.duplicates,0)}};
}
export function applyImport(snapshot,storage=localStore){if(!validSnapshot(snapshot))throw Error('备份格式或数据校验失败，没有修改现有记录。');const changes=Object.fromEntries(Object.entries(DATA_KEYS).filter(([key])=>snapshot[key]!==null&&snapshot[key]!==undefined).map(([key,name])=>[name,JSON.stringify(snapshot[key])]));transactionalWrite(changes,storage);}
