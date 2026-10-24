import { validRecord, localDate } from './records.js';
import { NUTRIENTS } from './nutrition.js';
export const LIFESTYLE_KEY='daily-bites.lifestyle.v1';
export const ALLERGENS={milk:'乳',egg:'蛋',soy:'大豆',gluten:'含麸质谷物',peanut:'花生',nuts:'树坚果',fish:'鱼',shellfish:'甲壳类与贝类',sesame:'芝麻'};
export const defaultLifestyle=()=>({favorites:[],shopping:[],restrictions:{allergens:[],exclude:[]}});
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
export function validRestrictions(data){return Boolean(data&&Array.isArray(data.allergens)&&data.allergens.every(key=>Object.hasOwn(ALLERGENS,key))&&new Set(data.allergens).size===data.allergens.length&&Array.isArray(data.exclude)&&data.exclude.length<=20&&data.exclude.every(value=>text(value,40)));}
export function foodTemplate(record){
  return Object.fromEntries(['meal','food','portion','calories','note','nutritionSource','source','barcode',...Object.keys(NUTRIENTS)].filter(key=>record[key]!==undefined).map(key=>[key,record[key]]));
}
export function validFavorite(item){return Boolean(item&&text(item.id,120)&&text(item.name,120)&&Array.isArray(item.items)&&item.items.length>0&&item.items.length<=50&&item.items.every(food=>validRecord({...food,id:'template',date:'2026-01-01'})));}
export function validShopping(item){return Boolean(item&&text(item.id,120)&&text(item.name,120)&&typeof item.checked==='boolean'&&(item.date===null||typeof item.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)&&Number.isFinite(new Date(`${item.date}T12:00:00`).getTime())&&localDate(new Date(`${item.date}T12:00:00`))===item.date));}
export function validLifestyle(data){return Boolean(data&&validRestrictions(data.restrictions)&&Array.isArray(data.favorites)&&data.favorites.length<=100&&data.favorites.every(validFavorite)&&new Set(data.favorites.map(item=>item.id)).size===data.favorites.length&&Array.isArray(data.shopping)&&data.shopping.length<=200&&data.shopping.every(validShopping)&&new Set(data.shopping.map(item=>item.id)).size===data.shopping.length);}
export function instantiateFavorite(favorite,date,meal,uuid=()=>crypto.randomUUID(),ratios=[]){
  const records=favorite.items.map((food,index)=>{
    const ratio=ratios[index]??1;
    if(!Number.isFinite(ratio)||ratio<.1||ratio>10)throw new Error('份量倍率应为 0.1–10。');
    const scaled={...food,id:uuid(),date,meal};
    if(ratio!==1){
      scaled.portion=`${food.portion} × ${ratio}`.trim().slice(0,40);
      for(const key of ['calories',...Object.keys(NUTRIENTS)])if(food[key]!=null)scaled[key]=Math.round(food[key]*ratio*(key==='calories'?1:1000))/(key==='calories'?1:1000);
    }
    return scaled;
  });
  if(!records.every(validRecord))throw new Error('请检查日期、餐次与收藏内容。');return records;
}
export function addShopping(current,ingredients,date,uuid=()=>crypto.randomUUID()){
  const next=current.map(item=>({...item}));
  for(const food of ingredients){if(!next.some(item=>item.date===date&&item.name===food.label))next.push({id:uuid(),name:food.label,checked:false,date,...(food.id?{ingredientId:food.id}:{})});}
  if(next.length>200)throw new Error('购物清单最多保存 200 项，请先整理已有项目。');return next;
}
