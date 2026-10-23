import { localDate } from './records.js';
import { nutrientTotals } from './nutrition.js';
import { foodFingerprint } from './next-day.js';
import { weekSummary } from './fitness.js';
export function weeklyReport(records,fitness,planner,date){
 const day=new Date(`${date}T12:00:00`);day.setDate(day.getDate()-(day.getDay()+6)%7);
 const days=Array.from({length:7},(_,index)=>{const d=new Date(day);d.setDate(d.getDate()+index);const date=localDate(d),items=records.filter(item=>item.date===date),review=planner?.reviews?.[date];
  return {date,count:items.length,calories:items.reduce((sum,item)=>sum+(item.calories??0),0),missing:items.filter(item=>item.calories==null).length,complete:Boolean(items.length&&review?.complete&&review.fingerprint===foodFingerprint(items))};});
 const items=records.filter(item=>item.date>=days[0].date&&item.date<=days[6].date),confirmed=days.filter(day=>day.complete),recorded=days.filter(day=>day.count);
 const completeEnergy=days.filter(day=>day.complete&&!day.missing);
 return {days,start:days[0].date,end:days[6].date,recordedDays:recorded.length,completeDays:confirmed.length,foodNames:new Set(items.map(item=>item.food.trim().toLocaleLowerCase())).size,
  averageEnergy:completeEnergy.length?Math.round(completeEnergy.reduce((sum,day)=>sum+day.calories,0)/completeEnergy.length):null,energyDays:completeEnergy.length,nutrients:nutrientTotals(items),count:items.length,
  exercise:fitness?weekSummary(fitness.workouts,date):null};
}
