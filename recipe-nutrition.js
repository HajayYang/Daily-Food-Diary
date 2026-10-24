import { NUTRIENTS } from './nutrition.js';
import { validRecord } from './records.js';

// USDA SR Legacy generic raw edible ingredients, except explicitly cooked rice.
// Do not apply the app's cooked chicken/egg/broccoli values to raw recipe weights.
export const RAW_REFERENCE = {
  tomato:{calories:18,protein:.88,carbs:3.89,fat:.2,water:94.52,vitaminC:13.7,fiber:1.2},
  egg:{calories:143,protein:12.56,carbs:.72,fat:9.51,water:76.15},
  chicken:{calories:120,protein:22.5,carbs:0,fat:2.62},
  broccoli:{calories:34,protein:2.82,carbs:6.64,fat:.37},
  potato:{calories:77,protein:2.05,carbs:17.49,fat:.09},
  garlic:{calories:149,protein:6.36,carbs:33.06,fat:.5},
  ginger:{calories:80,protein:1.82,carbs:17.77,fat:.75},
  carrot:{calories:41,protein:.93,carbs:9.58,fat:.24},
  onion:{calories:40,protein:1.1,carbs:9.34,fat:.1},
  oil:{calories:884,protein:0,carbs:0,fat:100},
  salt:{calories:0,protein:0,carbs:0,fat:0,sodium:39300},
  sugar:{calories:387,protein:0,carbs:99.98,fat:0},
  water:{calories:0,protein:0,carbs:0,fat:0,water:100},
  rice:{calories:130,protein:2.7,carbs:28.2,fat:.3},
};
export const ESTIMATE_KEYS = ['calories',...Object.keys(NUTRIENTS)];
export function recipeRows(ingredients) {
  return ingredients.map(i=>({key:i.key,name:i.name,unit:i.unit,amount:i.amount,
    grams:i.unit==='g'||i.key==='water'&&i.unit==='ml'?i.amount:i.key==='egg'&&i.unit==='个'?i.amount*50:i.key==='garlic'&&i.unit==='瓣'?i.amount*3:null,
    approximate:i.unit!=='g'&&i.key!=='water',values:{...RAW_REFERENCE[i.key]}}));
}
export function estimateRecipe(rows,servings,eaten=1) {
  if(!Number.isFinite(servings)||servings<.1||servings>20||!Number.isFinite(eaten)||eaten<.1||eaten>servings)throw Error('请检查总份数和实际食用份数。');
  if(!rows.length||rows.length>100||rows.some(i=>i.grams!==null&&(!Number.isFinite(i.grams)||i.grams<0||i.grams>20000)))throw Error('请检查食材克数。');
  const nutrients={};
  for(const key of ESTIMATE_KEYS) {
    const max=key==='calories'?1000:NUTRIENTS[key].unit==='g'?100:NUTRIENTS[key].unit==='mg'?100000:100000000;
    if(rows.some(i=>i.values[key]!=null&&(!Number.isFinite(i.values[key])||i.values[key]<0||i.values[key]>max)))throw Error('请核对每 100 克营养值。');
    const missing=rows.filter(i=>i.grams!==0&&(i.grams===null||i.values[key]==null)).length;
    const total=rows.reduce((n,i)=>n+(i.grams??0)*(i.values[key]??0)/100,0)*eaten/servings;
    nutrients[key]={value:key==='calories'?Math.round(total):Math.round(total*1000)/1000,missing};
  }
  return nutrients;
}
export function recipeFood(name,estimate,eaten) {
  const food={food:name,portion:`${eaten} 份`,note:'菜谱食材估算；生重基准，未计算烹调营养流失。',source:'recipe',nutritionSource:'USDA SR Legacy 生食材近似值 / 用户核对标签；缺失项保留未知'};
  for(const key of ESTIMATE_KEYS)food[key]=estimate[key].missing?null:estimate[key].value;
  if(!validRecord({...food,id:'recipe',date:'2026-01-01',meal:'lunch'}))throw Error('本份营养值超出记录范围，请调整实际份量。');
  return food;
}
