import { NUTRIENTS } from './nutrition.js';
import { REVIEW_GROUPS, buildNextDayAdvice, foodFingerprint, validPlanner } from './next-day.js';
import { MEALS } from './records.js';
export function setupNextDayAdvice({ $, element, getDate, getRecords, getFitness, recordsReadable }) {
  const key='daily-bites.next-day.v1';
  let state={diet:'balanced',reviews:{}},readable=true;
  try{const saved=JSON.parse(localStorage.getItem(key)??'null');if(saved!==null){if(!validPlanner(saved))throw new Error('Invalid planner');state=saved;}}catch{readable=false;}
  function write(){
    if(!readable){$('#next-day-status').textContent='饮食建议偏好读取失败，暂不能保存修改；原饮食和运动记录不受影响。';return false;}
    try{localStorage.setItem(key,JSON.stringify(state));return true;}catch{$('#next-day-status').textContent='建议偏好保存失败，请检查浏览器存储空间。';return false;}
  }
  $('#next-day-diet').addEventListener('change',()=>{const previous=state.diet;state={...state,diet:$('#next-day-diet').value};if(write())render();else {state={...state,diet:previous};$('#next-day-diet').value=previous;}});
  function saveReview(){
    const date=getDate(),daily=getRecords().filter(record=>record.date===date);
    const review={fingerprint:foodFingerprint(daily),complete:$('#day-complete').checked,groups:Object.fromEntries(Object.keys(REVIEW_GROUPS).map(key=>[key,$(`[data-review-group="${key}"]`).value]))};
    const previous=state;state={...state,reviews:{...state.reviews,[date]:review}};if(write())render();else {state=previous;const saved=state.reviews[date];const current=saved?.fingerprint===foodFingerprint(daily);$('#day-complete').checked=Boolean(current&&saved.complete);for(const key of Object.keys(REVIEW_GROUPS))$(`[data-review-group="${key}"]`).value=current?saved.groups[key]:'unknown';}
  }
  $('#day-complete').addEventListener('change',saveReview);
  for(const select of document.querySelectorAll('[data-review-group]'))select.addEventListener('change',saveReview);
  function render(){
    const date=getDate(),fitness=getFitness();
    const data=buildNextDayAdvice({records:getRecords(),date,fitness,review:readable?state.reviews[date]:null,diet:state.diet});
    $('#next-day-date').textContent=`${data.sourceDate} → ${data.targetDate}`;
    $('#next-day-diet').value=state.diet;
    $('#day-complete').checked=data.complete;$('#day-complete').disabled=!recordsReadable()||!readable||data.dailyCount===0;
    for(const [key,value] of Object.entries(data.groups)){$(`[data-review-group="${key}"]`).value=value;$(`[data-review-group="${key}"]`).disabled=!readable||!recordsReadable()||!data.dailyCount;}
    $('#next-day-diet').disabled=!readable;
    $('#next-day-insights').replaceChildren();$('#next-day-meals').replaceChildren();$('#next-day-metrics').replaceChildren();$('#next-day-nutrient-totals').replaceChildren();
    for(const id of ['next-day-activity','next-day-protein','next-day-shares','next-day-energy-note'])$(`#${id}`).textContent='';
    if(!recordsReadable()){$('#next-day-status').textContent='原有饮食记录无法读取，暂不生成次日建议。';return;}
    $('#next-day-status').textContent=!readable?'饮食建议偏好读取失败，暂用默认设置展示；原数据未覆盖。':data.reviewChanged?'这一天的记录已改变，请重新确认完整性与食物类别；目前不做摄入高低判断。':!data.dailyCount?'无当天记录：以下为通用配餐，不是基于实际摄入的个性化评估。':data.complete?'按你确认的完整记录分析；手填或照片估算仍可能有误差。':'先看配餐结构；确认全天饮食已记录后，才比较能量与营养比例。';
    for(const [key,label,unit] of [['calories','已记录热量','kcal'],['protein','蛋白质','g'],['carbs','碳水','g'],['fat','脂肪','g']]){
      const metric=element('div');metric.append(element('small','',label),element('strong','',`${data.totals[key].total} ${unit}`),element('small','',data.totals[key].missing?`${data.totals[key].missing} 条未填写`:'仅为已填合计'));$('#next-day-metrics').append(metric);
    }
    for(const [key,{label,unit}] of Object.entries(NUTRIENTS)){
      if(['protein','carbs','fat'].includes(key))continue;
      const value=data.nutrientData[key],row=element('div');
      const dd=element('dd');dd.append(document.createTextNode(`${value.total} ${unit} · `),element('span','',`${value.missing} 条未填写`));
      row.append(element('dt','',label),dd);$('#next-day-nutrient-totals').append(row);
    }
    const activityCount=data.nextWorkouts.length,minutes=data.nextWorkouts.reduce((sum,workout)=>sum+workout.minutes,0);
    $('#next-day-activity').textContent=fitness?`次日已记录 ${activityCount} 项活动，共 ${minutes} 分钟；只用于安排进餐，不抵扣摄入。`:'运动资料无法读取，次日建议暂不结合个人目标和活动。';
    $('#next-day-protein').textContent=data.protein?`规律运动人群蛋白质参考 ${data.protein[0]}–${data.protein[1]} g/天；需结合个体情况，不是当天必须补足的差额。`:'未建立适用的运动蛋白质参考，只给出各餐均衡搭配。';
    $('#next-day-shares').textContent=data.shares?`按蛋白质/碳水/脂肪 4/4/9 换算：碳水约 ${Math.round(data.shares.carbs)}%，脂肪约 ${Math.round(data.shares.fat)}%；不是食物重量百分比。`:'宏量供能比例暂不比较：需完整记录与可用的营养数据。';
    $('#next-day-insights').replaceChildren(...data.insights.map(insight=>{const li=element('li','',insight.text);li.dataset.insight=insight.code;return li;}));
    if(data.missingGroups)$('#next-day-insights').append(element('li','','食物类别尚未全部确认；不能从菜名或热量判断纤维、维生素、钙是否不足。'));
    for(const menu of data.menus){
      const meal=MEALS.find(meal=>meal.id===menu.meal),card=element('article','next-day-meal');card.dataset.meal=menu.meal;
      const head=element('div','next-day-meal-head');head.append(element('span','',meal.emoji),element('h4','',meal.name));
      if(menu.energy!==null)head.append(element('small','',`${menu.energy} kcal 分配参考`));
      card.append(head,element('p','',menu.text),element('small','next-day-focus',menu.focus));$('#next-day-meals').append(card);
    }
    $('#next-day-energy-note').textContent=data.target?'餐次热量来自你的手填目标分配，不是以上食谱的营养计算值；加餐可按需要并入正餐，次日不加减当天差额。':'未采用个人热量目标，只给出配餐结构和食物选择，不生成固定热量处方。';
  }
  return {render,exportData:()=>readable?state:null};
}
