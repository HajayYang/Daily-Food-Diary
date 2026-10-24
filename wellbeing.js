import { localDate, validRecord, MEALS } from './records.js';
import { foodFingerprint } from './next-day.js';

export const WELLBEING_KEY = 'daily-bites.wellbeing.v1';
export const BACKUP_META_KEY = 'daily-bites.backup-meta.v1';
export const PANTRY_UNITS = ['g', 'ml', '个', '份'];
export const defaultWellbeing = () => ({pantry:[], measurements:[], hydration:[], mealPlans:[], preferences:{waterGoal:1600, weather:'mild', reminders:false, mealTime:'12:00', exerciseTime:'18:00', backupDays:7}});
const number = (n,min,max) => typeof n==='number' && Number.isFinite(n) && n>=min && n<=max;
const text = (s,max) => typeof s==='string' && s.trim().length>0 && s.length<=max;
export const validDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(`${value}T12:00:00`).getTime()) && localDate(new Date(`${value}T12:00:00`))===value;
const id = item => text(item?.id,120);
const unique = (items,max,check) => Array.isArray(items) && items.length<=max && items.every(check) && new Set(items.map(item=>item.id)).size===items.length;
export function validPreferences(p) {
  return Boolean(p && number(p.waterGoal,500,5000) && Number.isInteger(p.waterGoal) && ['mild','hot'].includes(p.weather) && typeof p.reminders==='boolean' && [p.mealTime,p.exerciseTime].every(t=>typeof t==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) && [0,7,14,30].includes(p.backupDays));
}
export function validWellbeing(data) {
  return Boolean(data && validPreferences(data.preferences)
    && unique(data.pantry,300,i=>id(i)&&text(i.name,120)&&number(i.amount,0,100000)&&PANTRY_UNITS.includes(i.unit)&&(i.expires===null||validDate(i.expires)))
    && unique(data.measurements,3000,i=>id(i)&&validDate(i.date)&&number(i.weight,30,300)&&(i.waist===null||number(i.waist,30,250))&&(i.hip===null||number(i.hip,30,250)))
    && new Set(data.measurements.map(i=>i.date)).size===data.measurements.length
    && unique(data.hydration,20000,i=>id(i)&&validDate(i.date)&&Number.isInteger(i.ml)&&number(i.ml,1,3000))
    && unique(data.mealPlans,1000,i=>id(i)&&validDate(i.date)&&MEALS.some(m=>m.id===i.meal)&&text(i.recipeId,100)&&text(i.name,120)&&['planned','eaten'].includes(i.status)&&validRecord({...i.food,id:`plan-${i.id}`,date:i.date,meal:i.meal})));
}
export function shiftDate(date,days) {const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+days);return localDate(d);}
export function expiryState(item,today=localDate()) {
  if (!item.expires) return 'none';
  return item.expires<today?'expired':item.expires<=shiftDate(today,3)?'soon':'fresh';
}
const normalize = text => text.normalize('NFKC').toLocaleLowerCase().replace(/\([^)]*\)|（[^）]*）/g,'').replace(/\s/g,'');
export function pantryMatches(ingredients,pantry,today=localDate()) {
  const useful=ingredients.filter(i=>!['oil','salt','water'].includes(i.key));
  const available=pantry.filter(i=>i.amount>0&&expiryState(i,today)!=='expired');
  const same=(p,i)=>[i.name,...(i.aliases??[])].some(name=>normalize(p.name)===normalize(name));
  const matched=useful.filter(i=>available.some(p=>same(p,i)));
  const urgent=matched.filter(i=>available.some(p=>same(p,i)&&expiryState(p,today)==='soon'));
  return {matched:matched.length,total:useful.length,urgent:urgent.length,missing:useful.filter(i=>!matched.includes(i)).map(i=>i.name),score:urgent.length*100+matched.length*10-(useful.length-matched.length)};
}
export function bodyTrend(measurements,date) {
  const points=measurements.filter(i=>i.date>=shiftDate(date,-27)&&i.date<=date).sort((a,b)=>a.date.localeCompare(b.date));
  const previous=points.filter(i=>i.date>=shiftDate(date,-13)&&i.date<shiftDate(date,-6));
  const recent=points.filter(i=>i.date>=shiftDate(date,-6));
  const average=items=>items.reduce((n,i)=>n+i.weight,0)/items.length;
  const sufficient=previous.length>=2&&recent.length>=2;
  const change=sufficient?Math.round((average(recent)-average(previous))*100)/100:null;
  return {points,previous:previous.length?average(previous):null,recent:recent.length?average(recent):null,change,percent:sufficient?change/average(previous)*100:null};
}
export function confirmedEnergy(records,planner,date) {
  const values=[];
  for(let d=shiftDate(date,-13);d<=date;d=shiftDate(d,1)) {
    const items=records.filter(i=>i.date===d),review=planner?.reviews?.[d];
    if(items.length&&items.every(i=>i.calories!==null)&&review?.complete&&review.fingerprint===foodFingerprint(items))values.push(items.reduce((n,i)=>n+i.calories,0));
  }
  return {days:values.length,average:values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null};
}
export function hydrationSummary(state,workouts,date) {
  const total=state.hydration.filter(i=>i.date===date).reduce((n,i)=>n+i.ml,0);
  const minutes=workouts.filter(i=>i.date===date&&i.done&&i.type!=='mobility').reduce((n,i)=>n+i.minutes,0);
  return {total,goal:state.preferences.waterGoal,minutes,exerciseRange:minutes?[Math.round(minutes/60*400),Math.round(minutes/60*800)]:null};
}
export function dueReminders(prefs,now,lastSent={}) {
  if(!prefs.reminders)return [];
  const time=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,date=localDate(now);
  return [['meal',prefs.mealTime],['exercise',prefs.exerciseTime]].filter(([kind,t])=>t===time&&lastSent[kind]!==date).map(([kind])=>({kind,date}));
}
export function backupDue(lastExportAt,days,now=Date.now()) {
  if(!days)return false;
  const timestamp=Date.parse(lastExportAt);
  return !Number.isFinite(timestamp)||now-timestamp>=days*86400000;
}
