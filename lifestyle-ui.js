import { localStore } from './app-storage.js';
import { ALLERGENS, LIFESTYLE_KEY, defaultLifestyle, validLifestyle, foodTemplate, instantiateFavorite, addShopping } from './lifestyle.js';
import { ingredient } from './menu-plan.js';
import { weeklyReport } from './reports.js';
import { MEALS } from './records.js';
import { writeLocal } from './storage.js';
import { translateText } from './i18n.js';
export function setupLifestyle({$,element,toast,refresh,getRecords,getDate,getFitness,getPlanner,saveRecords,recordsReadable}){
 let state=defaultLifestyle(),readable=true;
 try{const saved=JSON.parse(localStore.getItem(LIFESTYLE_KEY)??'null');if(saved!==null){if(!validLifestyle(saved))throw Error();state=saved;}}catch{readable=false;}
 function save(next){if(!readable){toast('生活工具数据无法读取，原数据已保留。');return false;}if(!validLifestyle(next)){toast('请检查内容长度或项目数量。');return false;}try{writeLocal(LIFESTYLE_KEY,JSON.stringify(next));state=next;refresh();return true;}catch{toast('保存失败，请检查浏览器存储空间。');return false;}}
 function favorite(records,name){if(!records.length){toast('请先记录食物再收藏。');return;}if(state.favorites.length>=100){toast('收藏最多保存 100 项，请先整理。');return;}if(save({...state,favorites:[...state.favorites,{id:crypto.randomUUID(),name:name.slice(0,120),items:records.map(foodTemplate)}]}))toast('已加入收藏，可在常吃食物与餐单中复用。');}
 $('#save-meal-favorite').addEventListener('click',()=>{const meal=$('#favorite-meal').value;favorite(getRecords().filter(record=>record.date===getDate()&&record.meal===meal),$('#favorite-save-name').value.trim()||`${translateText(MEALS.find(item=>item.id===meal).name)} · ${getDate()}`);});
 let selectedFavorite;
 $('#favorite-form').addEventListener('submit',event=>{event.preventDefault();const item=state.favorites.find(item=>item.id===selectedFavorite);if(!item)return;try{const ratios=[...document.querySelectorAll('#favorite-portions input')].map(input=>Number(input.value));const records=instantiateFavorite(item,$('#favorite-date').value,$('#favorite-target-meal').value,()=>crypto.randomUUID(),ratios);if(saveRecords(records)){$('#favorite-dialog').close();toast('收藏已添加为新的饮食记录。');}}catch(error){toast(error.message);}});
 $('#close-favorite').addEventListener('click',()=>$('#favorite-dialog').close());
 $('#dietary-settings').addEventListener('click',()=>{for(const input of document.querySelectorAll('[data-allergen]'))input.checked=state.restrictions.allergens.includes(input.value);$('#excluded-foods').value=state.restrictions.exclude.join(', ');$('#restrictions-dialog').showModal();});
 $('#close-restrictions').addEventListener('click',()=>$('#restrictions-dialog').close());
 $('#restrictions-form').addEventListener('submit',event=>{event.preventDefault();const restrictions={allergens:[...document.querySelectorAll('[data-allergen]:checked')].map(input=>input.value),exclude:[...new Set($('#excluded-foods').value.split(/[,，、\n]/).map(value=>value.trim()).filter(Boolean))]};if(save({...state,restrictions}))$('#restrictions-dialog').close();});
 for(const [key,label] of Object.entries(ALLERGENS)){const wrapper=element('label','restriction-option'),input=element('input');input.type='checkbox';input.value=key;input.dataset.allergen=key;wrapper.append(input,element('span','',label));$('#allergen-options').append(wrapper);}
 $('#shopping-form').addEventListener('submit',event=>{event.preventDefault();const input=$('#shopping-name');if(save({...state,shopping:[...state.shopping,{id:crypto.randomUUID(),name:input.value.trim(),date:null,checked:false}]}))input.value='';});
 $('#clear-shopping-done').addEventListener('click',()=>{save({...state,shopping:state.shopping.filter(item=>!item.checked)});});
 function render(){
  $('#lifestyle-status').textContent=readable?'收藏、禁忌和购物清单默认只保存在本浏览器。':'生活工具数据无法读取，原数据已保留。';
  for(const id of ['save-meal-favorite','dietary-settings','shopping-name','shopping-add','clear-shopping-done'])$(`#${id}`).disabled=!readable;
  $('#favorites-list').replaceChildren();
  if(!state.favorites.length)$('#favorites-list').append(element('p','muted','收藏常吃的食物，或保存当前餐次，下一次直接复用。'));
  for(const item of state.favorites){const row=element('div','utility-row'),name=element('strong','',item.name);name.translate=false;const info=element('div');info.append(name,element('small','',`${item.items.length} 项食物`));
   const actions=element('div','record-actions'),use=element('button','text-button','使用收藏'),remove=element('button','text-button','移除');use.addEventListener('click',()=>{selectedFavorite=item.id;$('#favorite-date').value=getDate();$('#favorite-target-meal').value=item.items[0].meal;const preview=item.items.map(food=>food.food).join(' · ');$('#favorite-preview').textContent=preview;$('#favorite-preview').translate=false;$('#favorite-portions').replaceChildren(...item.items.map(food=>{const label=element('label'),title=element('span','',`${food.food} · ${food.portion}`);title.translate=false;const input=element('input');Object.assign(input,{type:'number',min:'.1',max:'10',step:'.1',value:'1',required:true});label.append(title,element('small','','份量倍率'),input);return label;}));$('#favorite-dialog').showModal();});remove.addEventListener('click',()=>save({...state,favorites:state.favorites.filter(favorite=>favorite.id!==item.id)}));actions.append(use,remove);row.append(info,actions);$('#favorites-list').append(row);}
  $('#restrictions-summary').textContent=state.restrictions.allergens.length||state.restrictions.exclude.length?'已设置禁忌，次日示例将筛选已知食材；仍需核对包装与交叉接触风险。':'可在饮食禁忌中排除过敏原与不吃的食材。';
  $('#shopping-list').replaceChildren();
  if(!state.shopping.length)$('#shopping-list').append(element('p','muted','从次日菜单生成清单，或手动添加；已有食材可勾选。'));
  for(const item of state.shopping){const row=element('li','shopping-row'),label=element('label'),input=element('input');input.type='checkbox';input.checked=item.checked;input.disabled=!readable;input.addEventListener('change',()=>{if(!save({...state,shopping:state.shopping.map(other=>other.id===item.id?{...other,checked:input.checked}:other)}))input.checked=item.checked;});const name=element('span','',item.name);name.translate=false;if(item.ingredientId){try{if(ingredient(item.ingredientId).label===item.name)name.translate=true;}catch{/* Preserve manual or unknown names. */}}label.append(input,name);const info=element('small','',item.date??'手动添加');const remove=element('button','text-button','移除');remove.addEventListener('click',()=>save({...state,shopping:state.shopping.filter(other=>other.id!==item.id)}));row.append(label,info,remove);$('#shopping-list').append(row);}
  renderReport();
 }
 function renderReport(){
  if(!recordsReadable()){for(const id of ['weekly-metrics','weekly-days','weekly-nutrients'])$(`#${id}`).replaceChildren();$('#weekly-note').textContent='饮食资料无法读取，周报暂不可用。';$('#weekly-exercise').textContent='';return;}
  const report=weeklyReport(getRecords(),getFitness(),getPlanner(),getDate());$('#weekly-range').textContent=`${report.start} → ${report.end}`;
  $('#weekly-metrics').replaceChildren();for(const [label,value] of [['有记录天数',`${report.recordedDays} / 7`],['确认完整天数',`${report.completeDays} / 7`],['不同食物名称',report.foodNames],['完整日平均热量',report.averageEnergy===null?'暂无可用完整日':`${report.averageEnergy} kcal`]]){const card=element('div');card.append(element('small','',label),element('strong','',String(value)));$('#weekly-metrics').append(card);}
  $('#weekly-days').replaceChildren(...report.days.map(day=>{const row=element('div','weekly-day'),label=element('span','',day.date.slice(5)),bar=element('div','weekly-bar'),fill=element('span');fill.style.width=`${Math.max(0,day.calories)/Math.max(1,...report.days.map(item=>item.calories))*100}%`;bar.append(fill);row.append(label,bar,element('small','',day.count?(day.missing===day.count?'未填写热量':`${day.calories} kcal`):'未记录'),element('small','',!day.count?'无记录':day.complete&&!day.missing?'确认完整':'部分记录'));return row;}));
  $('#weekly-nutrients').replaceChildren();for(const [key,label,unit] of [['protein','蛋白质','g'],['fiber','膳食纤维','g'],['sodium','钠','mg'],['saturatedFat','饱和脂肪','g']]){const row=element('div');row.append(element('dt','',label),element('dd','',`${report.nutrients[key].total} ${unit}`),element('small','',`${report.nutrients[key].missing} 条未填写`));$('#weekly-nutrients').append(row);}
  $('#weekly-exercise').textContent=report.exercise?`本周已完成有氧 ${report.exercise.aerobic} 等效分钟，力量训练 ${report.exercise.strengthDays} 天。`:'运动资料无法读取，周报未包含运动统计。';
  $('#weekly-note').textContent=report.energyDays?`平均热量仅采用 ${report.energyDays} 个已确认且热量无缺失的完整日。食物名称数不是食材多样性评分。`:'暂无完整日，不计算每日平均摄入。漏记不计为零摄入；食物名称数不是食材多样性评分。';
 }
 return {render,favoriteFood:record=>favorite([record],record.food),getRestrictions:()=>readable?state.restrictions:null,exportData:()=>readable?state:null,
  generateShopping(advice){try{if(!advice?.menus.length){toast('暂时没有可生成清单的菜单。');return;}const ingredients=advice.menus.flatMap(menu=>menu.ingredients);if(save({...state,shopping:addShopping(state.shopping,ingredients,advice.targetDate)}))toast('已加入购物清单，同日相同食材不会重复添加。');}catch(error){toast(error.message);}}};
}
