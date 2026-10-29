import { localStore } from './app-storage.js';
import { WELLBEING_KEY, defaultWellbeing, validWellbeing, expiryState, pantryMatches, bodyTrend, confirmedEnergy, hydrationSummary, shiftDate } from './wellbeing.js';
import { localDate, MEALS } from './records.js';
import { writeLocal } from './storage.js';
import { instantiateFavorite, foodTemplate } from './lifestyle.js';
import { translateText } from './i18n.js';

export function setupWellbeing({$,element,toast,refresh,getDate,getRecords,getFitness,getPlanner,getRestrictions,commitRecords,getRecipes,openRecipe}) {
  let state=defaultWellbeing(),readable=true,lastDate,selectedPlan,recommendations=[],request=0;
  try {const saved=JSON.parse(localStore.getItem(WELLBEING_KEY)??'null');if(saved!==null){if(!validWellbeing(saved))throw Error();state=saved;}} catch {readable=false;}
  function save(next) {
    if(!readable){toast('健康习惯数据无法读取，原数据已保留。');return false;}
    if(!validWellbeing(next)){toast('请检查输入范围、日期或项目数量。');return false;}
    try{writeLocal(WELLBEING_KEY,JSON.stringify(next));state=next;refresh();return true;}catch{toast('保存失败，请检查浏览器存储空间。');return false;}
  }
  const userText=(tag,text)=>{const node=element(tag,'',text);node.translate=false;return node;};
  const action=(label,callback)=>{const button=element('button','text-button',label);button.type='button';button.addEventListener('click',callback);button.disabled=!readable;return button;};
  const nullable=value=>value===''?null:Number(value);
  $('#pantry-form').addEventListener('submit',event=>{
    event.preventDefault();const form=event.currentTarget,data=new FormData(form),id=data.get('id')||crypto.randomUUID();
    const item={id,name:data.get('name').trim(),amount:Number(data.get('amount')),unit:data.get('unit'),expires:data.get('expires')||null};
    const next={...state,pantry:[...state.pantry.filter(i=>i.id!==id),item]};
    if(save(next)){form.reset();recommendations=[];render();toast('库存已保存');}
  });
  $('#pantry-cancel').addEventListener('click',()=>$('#pantry-form').reset());
  $('#pantry-recommend').addEventListener('click',async()=>{
    const button=$('#pantry-recommend'),current=++request,baseline=JSON.stringify(state.pantry),restrictions=getRestrictions();
    if(!readable||!restrictions){toast('请先恢复库存或饮食禁忌数据。');return;}
    button.disabled=true;$('#pantry-recommend-status').textContent='正在按库存查找菜谱…';
    try {
      const recipes=await getRecipes();
      if(current!==request||baseline!==JSON.stringify(state.pantry))return;
      recommendations=recipes.filter(recipe=>!recipe.ingredients.some(i=>i.allergens.some(a=>restrictions.allergens.includes(a))||restrictions.exclude.some(word=>i.name.toLocaleLowerCase().includes(word.toLocaleLowerCase()))))
        .map(recipe=>({recipe,...pantryMatches(recipe.ingredients.map(i=>({...i,aliases:[translateText(i.name)]})),state.pantry)})).filter(i=>i.matched).sort((a,b)=>b.score-a.score).slice(0,6);
      renderRecommendations();
    }catch{$('#pantry-recommend-status').textContent='菜谱暂时无法载入，请重试；其他饮食记录功能仍可使用。';}finally{button.disabled=!readable;}
  });
  function renderRecommendations() {
    $('#pantry-recommendations').replaceChildren(...recommendations.map(({recipe,matched,total,urgent})=>{
      const row=element('div','utility-row'),info=element('div');info.append(element('strong','',recipe.name),element('small','',translateText('匹配 {matched}/{total} 项主食材，临期 {urgent} 项').replace('{matched}',matched).replace('{total}',total).replace('{urgent}',urgent)));
      row.append(info,action('查看做法',()=>openRecipe(recipe)));return row;
    }));
    $('#pantry-recommend-status').textContent=recommendations.length?'按名称匹配，不保证库存足量；请核对实际配料。':'添加库存后查询；过期和数量为零的食材不参与推荐。';
  }
  $('#measure-form').addEventListener('submit',event=>{
    event.preventDefault();const data=new FormData(event.currentTarget),date=data.get('date');
    const item={id:`measure-${date}`,date,weight:Number(data.get('weight')),waist:nullable(data.get('waist')),hip:nullable(data.get('hip'))};
    if(save({...state,measurements:[...state.measurements.filter(i=>i.date!==date),item]}))toast('身体趋势已更新');
  });
  $('#body-trend-metric').addEventListener('change',renderBody);
  function drink(ml) {if(save({...state,hydration:[...state.hydration,{id:crypto.randomUUID(),date:getDate(),ml}]}))toast('饮水已记录');}
  for(const button of document.querySelectorAll('[data-drink]'))button.addEventListener('click',()=>drink(Number(button.dataset.drink)));
  $('#hydration-form').addEventListener('submit',event=>{event.preventDefault();drink(Number($('#hydration-ml').value));});
  $('#water-settings').addEventListener('submit',event=>{
    event.preventDefault();save({...state,preferences:{...state.preferences,waterGoal:Number($('#water-goal').value),weather:$('#water-weather').value}});
  });
  $('#close-eat-plan').addEventListener('click',()=>$('#eat-plan-dialog').close());
  $('#eat-plan-form').addEventListener('submit',event=>{
    event.preventDefault();const plan=state.mealPlans.find(i=>i.id===selectedPlan);if(!plan||!readable)return;
    try {
      const date=$('#eat-plan-date').value,meal=$('#eat-plan-meal').value;
      const [record]=instantiateFavorite({items:[plan.food]},date,meal,()=>`plan-${plan.id}`,[Number($('#eat-plan-ratio').value)]);
      if(getRecords().some(i=>i.id===record.id)){toast('这份计划已经入账，请在我的餐桌编辑。');return;}
      const next={...state,mealPlans:state.mealPlans.map(i=>i.id===plan.id?{...i,date,meal,status:'eaten',food:foodTemplate(record)}:i)};
      if(!validWellbeing(next))throw Error('请检查输入范围、日期或项目数量。');
      if(commitRecords([record],{[WELLBEING_KEY]:JSON.stringify(next)})){state=next;$('#eat-plan-dialog').close();refresh();toast('计划已记入饮食，未自动扣减库存。');}
    }catch(error){toast(error.message);}
  });
  function renderPlans() {
    const plans=state.mealPlans.filter(i=>i.date>=getDate()&&i.date<=shiftDate(getDate(),6)).sort((a,b)=>a.date.localeCompare(b.date));
    $('#meal-plans').replaceChildren(...plans.map(plan=>{
      const row=element('div','utility-row'),info=element('div'),recorded=getRecords().some(i=>i.id===`plan-${plan.id}`);
      info.append(userText('strong',plan.name),element('small','',`${plan.date} · ${translateText(MEALS.find(i=>i.id===plan.meal).name)} · ${recorded?translateText('已入账'):translateText('待用餐')}`));
      const controls=element('div','record-actions');
      if(!recorded)controls.append(action('吃完后核对入账',()=>{selectedPlan=plan.id;$('#eat-plan-name').textContent=plan.name;$('#eat-plan-date').value=plan.date;$('#eat-plan-meal').value=plan.meal;$('#eat-plan-ratio').value=1;$('#eat-plan-dialog').showModal();}));
      controls.append(action('移除',()=>save({...state,mealPlans:state.mealPlans.filter(i=>i.id!==plan.id)})));row.append(info,controls);return row;
    }));
    if(!plans.length)$('#meal-plans').append(element('p','muted','还没有计划，去“今天吃什么”选择菜谱并安排日期。'));
  }
  function renderBody() {
    const trend=bodyTrend(state.measurements,getDate()),energy=confirmedEnergy(getRecords(),getPlanner(),getDate());
    $('#body-trend-chart').replaceChildren();
    const metric=$('#body-trend-metric').value,points=trend.points.filter(i=>i[metric]!=null),unit=metric==='weight'?'kg':'cm';
    if(points.length) {
      const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 560 190');svg.setAttribute('role','img');svg.setAttribute('aria-label',translateText({weight:'最近 28 天体重趋势（kg）',waist:'最近 28 天腰围趋势（cm）',hip:'最近 28 天臀围趋势（cm）'}[metric]));
      const values=points.map(i=>i[metric]),min=Math.min(...values)-1,max=Math.max(...values)+1,start=Date.parse(`${shiftDate(getDate(),-27)}T00:00:00Z`);
      const positions=points.map(i=>[45+(Date.parse(`${i.date}T00:00:00Z`)-start)/86400000/27*470,150-(i[metric]-min)/(max-min)*120]);
      const line=document.createElementNS(ns,'polyline');line.setAttribute('points',positions.map(i=>i.join(',')).join(' '));line.setAttribute('class','trend-line');svg.append(line);
      positions.forEach(([x,y],index)=>{const point=document.createElementNS(ns,'circle');point.setAttribute('cx',x);point.setAttribute('cy',y);point.setAttribute('r','4');const title=document.createElementNS(ns,'title');title.textContent=`${points[index].date}: ${points[index][metric]} ${unit}`;point.append(title);svg.append(point);});
      for(const [x,y,label] of [[3,30,`${max.toFixed(1)} ${unit}`],[3,150,`${min.toFixed(1)} ${unit}`],[45,178,shiftDate(getDate(),-27)],[435,178,getDate()]]){const text=document.createElementNS(ns,'text');text.setAttribute('x',x);text.setAttribute('y',y);text.setAttribute('font-size','10');text.setAttribute('fill','currentColor');text.textContent=label;svg.append(text);}
      $('#body-trend-chart').append(svg);
    }else $('#body-trend-chart').append(element('p','muted','这项测量暂无记录。'));
    $('#body-trend-summary').textContent=trend.change===null?'相邻两周各至少记录 2 天体重后，展示周均值变化。':translateText('相邻两周平均体重变化：{change} kg').replace('{change}',`${trend.change>0?'+':''}${trend.change}`);
    const profile=getFitness()?.profile;
    $('#body-trend-advice').textContent=trend.change===null?'尽量在相同时间和条件下测量，先观察多周趋势，不因单日波动改变饮食。':Math.abs(trend.percent)>1?'周均体重变化较快，请先核对测量和记录；避免补偿性节食或突然增加运动。':'结合目标、训练表现与饥饿感观察趋势，保持规律用餐和恢复，不自动增减热量目标。';
    if(profile?.goal==='muscle'&&trend.change!==null&&trend.change<0)$('#body-trend-advice').textContent='增肌期间体重周均值下降，可先检查是否漏餐、训练负荷和恢复，再与专业人员讨论能量安排。';
    $('#body-energy-context').textContent=energy.days?translateText('近 14 天有 {days} 个完整日，平均记录摄入 {energy} kcal。').replace('{days}',energy.days).replace('{energy}',energy.average):'尚无已确认且热量无缺失的完整日，不把漏记算成零摄入。';
    $('#measurement-history').replaceChildren(...trend.points.slice().reverse().map(i=>{const row=element('div','utility-row'),info=element('div');info.append(element('strong','',`${i.date} · ${i.weight} kg`),element('small','',`${translateText('腰围')} ${i.waist??'—'} cm · ${translateText('臀围')} ${i.hip??'—'} cm`));const controls=element('div','record-actions');controls.append(action('编辑',()=>{for(const key of ['date','weight','waist','hip'])$('#measure-form').elements.namedItem(key).value=i[key]??'';}),action('移除',()=>save({...state,measurements:state.measurements.filter(m=>m.id!==i.id)})));row.append(info,controls);return row;}));
  }
  function render() {
    $('#wellbeing-status').textContent=readable?'库存、饮水与身体趋势默认仅保存在本浏览器。':'健康习惯数据无法读取，原数据已保留。';
    if(lastDate!==getDate()){$('#measure-form [name=date]').value=getDate();lastDate=getDate();}
    for(const control of document.querySelectorAll('#daily-habits input,#daily-habits select,#daily-habits button'))control.disabled=!readable;
    $('#pantry-list').replaceChildren(...state.pantry.slice().sort((a,b)=>(a.expires??'9999').localeCompare(b.expires??'9999')).map(item=>{
      const row=element('div',`utility-row expiry-${expiryState(item)}`),info=element('div');info.append(userText('strong',item.name),element('small','',`${item.amount} ${translateText(item.unit)} · ${item.expires??translateText('未设保质期')}`),element('small','expiry-label',translateText({expired:'已过期，不参与推荐',soon:'临期，优先安排',fresh:'保质期内',none:'请自行检查新鲜度'}[expiryState(item)])));
      const controls=element('div','record-actions');controls.append(action('修改 / 消耗',()=>{const form=$('#pantry-form');for(const key of ['id','name','amount','unit','expires'])form.elements.namedItem(key).value=item[key]??'';form.scrollIntoView({block:'center',behavior:'smooth'});}),action('移除',()=>{if(save({...state,pantry:state.pantry.filter(i=>i.id!==item.id)})){recommendations=[];renderRecommendations();}}));row.append(info,controls);return row;
    }));
    if(!state.pantry.length)$('#pantry-list').append(element('p','muted','把家里已有的食材加入库存，临期食材会优先推荐。'));
    renderRecommendations();renderPlans();renderBody();
    const water=hydrationSummary(state,getFitness()?.workouts??[],getDate());
    $('#water-total').textContent=`${water.total} / ${water.goal} ml`;$('#water-progress').max=water.goal;$('#water-progress').value=Math.min(water.total,water.goal);
    $('#water-goal').value=state.preferences.waterGoal;$('#water-weather').value=state.preferences.weather;
    $('#water-advice').textContent=water.exerciseRange?translateText('已完成运动 {minutes} 分钟；运动期间饮水可参考 {low}–{high} ml，按出汗与口渴调整，不自动追加到目标。').replace('{minutes}',water.minutes).replace('{low}',water.exerciseRange[0]).replace('{high}',water.exerciseRange[1]):'一般健康成人温和环境饮水参考约 1500–1700 ml/天，可按个人情况调整。';
    $('#water-weather-advice').textContent=state.preferences.weather==='hot'?'炎热或潮湿时留意出汗，少量多次补水；不短时间强行补足。':'饮水与食物含水量分开记录，不相加为总需水量。';
    $('#hydration-history').replaceChildren(...state.hydration.filter(i=>i.date===getDate()).slice().reverse().map(i=>{const row=element('div','utility-row');row.append(element('span','',`${i.ml} ml`),action('撤销',()=>save({...state,hydration:state.hydration.filter(h=>h.id!==i.id)})));return row;}));
  }
  return {render,exportData:()=>readable?state:null,getPreferences:()=>state.preferences,
    savePreferences:preferences=>save({...state,preferences}),
    addPlan(plan){if(save({...state,mealPlans:[...state.mealPlans,plan]})){toast('已安排，吃完后核对份量再入账。');return true;}return false;}};
}
