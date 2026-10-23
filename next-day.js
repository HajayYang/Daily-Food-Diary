import { buildMenuPlan } from './menu-plan.js';
import { NUTRIENTS, nutrientTotals } from './nutrition.js';
import { localDate } from './records.js';
import { bodyEstimate } from './training.js';
import { proteinRange } from './fitness.js';

export const REVIEW_GROUPS = { vegetables:'蔬菜', fruit:'水果', grains:'全谷物', protein:'优质蛋白食物', calcium:'乳品或钙强化替代品' };
export const DIETS = ['balanced','vegetarian','vegan'];
export function nextDate(date) { const day=new Date(`${date}T12:00:00`);day.setDate(day.getDate()+1);return localDate(day); }
export function foodFingerprint(records) {
  return JSON.stringify(records.map(record=>[record.id,record.date,record.meal,record.food,record.portion,record.calories,record.protein??null,record.carbs??null,record.fat??null,...Object.keys(NUTRIENTS).filter(key=>key!=='saturatedFat').map(key=>record[key]??null),record.nutritionSource??null,...(record.saturatedFat==null?[]:['saturatedFat',record.saturatedFat])]).sort((a,b)=>a[0].localeCompare(b[0])));
}
export function validReview(review) {
  return Boolean(review&&typeof review.fingerprint==='string'&&typeof review.complete==='boolean'&&review.groups&&Object.keys(REVIEW_GROUPS).every(key=>['unknown','present','missing'].includes(review.groups[key])));
}
export function validPlanner(data) {
  return Boolean(data&&DIETS.includes(data.diet)&&data.reviews&&typeof data.reviews==='object'&&!Array.isArray(data.reviews)&&Object.entries(data.reviews).every(([date,review])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(new Date(`${date}T12:00:00`).getTime())&&localDate(new Date(`${date}T12:00:00`))===date&&validReview(review)));
}
export function buildNextDayAdvice({ records, date, fitness=null, review=null, diet='balanced', restrictions={allergens:[],exclude:[]} }) {
  const daily=records.filter(record=>record.date===date), targetDate=nextDate(date);
  const fingerprint=foodFingerprint(daily), reviewCurrent=Boolean(review&&review.fingerprint===fingerprint);
  const complete=Boolean(daily.length&&reviewCurrent&&review.complete);
  const groups=Object.fromEntries(Object.keys(REVIEW_GROUPS).map(key=>[key,reviewCurrent?review.groups[key]:'unknown']));
  const totals=Object.fromEntries(['calories','protein','carbs','fat'].map(key=>[key,{total:Math.round(daily.reduce((sum,record)=>sum+(record[key]??0),0)*10)/10,missing:daily.filter(record=>record[key]==null).length}]));
  const nutrientData=nutrientTotals(daily);
  const profile=fitness?.profile??{}, nextWorkouts=(fitness?.workouts??[]).filter(workout=>workout.date===targetDate);
  const active=nextWorkouts.some(workout=>workout.type!=='mobility');
  const demanding=nextWorkouts.some(workout=>workout.type!=='mobility'&&(workout.intensity==='vigorous'||workout.minutes>=60));
  const resting=bodyEstimate(profile)?.resting;
  const targetNeedsReview=Boolean(profile.target&&resting&&profile.target<resting);
  const target=targetNeedsReview?null:(profile.target??null);
  const protein=proteinRange(profile,profile.experience==='regular');
  const insights=[];
  const add=(code,text)=>insights.push({code,text});
  if(!daily.length)add('no_records','这一天没有饮食记录，先给出通用配餐，不判断吃多、吃少或营养缺乏。');
  else if(!complete)add('incomplete','尚未确认全天记录完整；仅展示已记录合计，不把漏记当作没有摄入。');
  if(targetNeedsReview)add('target_review','手填目标低于估算静息代谢，暂不据此分配次日热量；请先核对需求，静息代谢也不是个人安全阈值。');
  if(complete&&totals.calories.missing===0&&target){
    if(totals.calories.total>target*1.1)add('energy_above','已记录热量高于手填参考；次日回到规律三餐，不跳餐，也不扣除今天的差额。');
    else if(totals.calories.total<target*.9)add('energy_below','已记录热量低于手填参考；先核对是否漏记，次日规律进餐，按饥饿和活动调整，不补吃固定差额。');
    else add('energy_near','已记录热量接近手填参考；次日继续均衡搭配，这不等于整体营养已经达标。');
  }
  let lowProtein=false;
  if(complete&&protein&&totals.protein.missing===0){
    if(totals.protein.total<protein[0]){lowProtein=true;add('protein_below','已记录蛋白质低于规律运动者参考下限；次日在各餐安排蛋白食物，不把差额集中到一顿。');}
    else if(totals.protein.total>protein[1])add('protein_above','已记录蛋白质超过运动人群参考范围；次日无需继续堆叠蛋白食物或补剂，也要留出主食和蔬果。');
    else add('protein_within','已记录蛋白质处于运动人群参考范围；次日继续分配到各餐，不因此忽略其他食物。');
  }
  let shares=null;
  if(complete&&['protein','carbs','fat'].every(key=>totals[key].missing===0)){
    const macroEnergy=totals.protein.total*4+totals.carbs.total*4+totals.fat.total*9;
    const inconsistent=macroEnergy>0&&totals.calories.missing===0&&Math.abs(macroEnergy-totals.calories.total)/Math.max(macroEnergy,totals.calories.total)>.25;
    if(inconsistent)add('macro_mismatch','宏量营养素换算能量与记录热量差异较大，请先核对单位和份量，暂不比较供能比例。');
    else if(macroEnergy>0){
      shares={carbs:totals.carbs.total*4/macroEnergy*100,fat:totals.fat.total*9/macroEnergy*100};
      if(shares.carbs<45)add('carbs_below','碳水占宏量换算能量的比例偏低于一般成人参考；次日主食不省略，优先全谷物和薯类。');
      else if(shares.carbs>65)add('carbs_above','碳水供能比例偏高于一般成人参考；次日搭配蛋白食物和适量健康油脂，不简单地戒掉主食。');
      if(shares.fat>35)add('fat_above','脂肪供能比例偏高于一般成人参考；次日可更多选择蒸、煮、炖，按实际情况减少额外油和酱汁。');
      else if(shares.fat<20)add('fat_below','脂肪供能比例偏低于一般成人参考；次日可搭配适量植物油或坚果，不追求完全无脂。');
    }
  }
  if(complete&&nutrientData.fiber.missing===0&&nutrientData.fiber.total<25)add('fiber_below','已记录膳食纤维低于一般成人每日 25 g 的参考；次日可逐步增加全谷物、豆类和蔬果，并正常补水。');
  if(complete&&nutrientData.sodium.missing===0&&nutrientData.sodium.total>=2000)add('sodium_high','已记录钠达到或超过一般成人每日少于 2000 mg 的参考；次日优先清淡烹调，留意酱汁和包装标签，不用极端限盐补偿。');
  if(daily.some(record=>record.sugars!=null))add('sugar_data','这里记录的是总糖，包含水果和乳品中的糖；没有游离糖数据，不能用总糖判断是否超过游离糖建议。');
  if(daily.some(record=>record.water!=null))add('water_data','水合计包含已记录食物中的水，不等于额外饮水需求；按天气、活动与个人医嘱安排补水，不据此判断脱水。');
  if(daily.some(record=>['vitaminC','vitaminA','vitaminD','vitaminB12','calcium','iron','potassium'].some(key=>record[key]!=null)))add('micro_data','维生素和矿物质仅展示已填写项目与完整度；单日数值和有限项目不能用于诊断缺乏，也不自动建议补剂剂量。');
  const groupTexts={
    vegetables:'你标记当天未包含蔬菜：次日午晚餐各搭配蔬菜，并轮换颜色；这不是纤维或维生素缺乏诊断。',
    fruit:'你标记当天未包含水果：次日可加入一份完整水果，计入全天总量，不用补吃昨天的量。',
    grains:'你标记当天未包含全谷物：次日可用燕麦、杂粮饭等替换部分精制主食，逐步增加。',
    protein:'你标记当天未包含优质蛋白食物：次日三餐安排豆类、蛋、乳、鱼或肉中的适合选项。',
    calcium:'你标记当天未包含乳品或钙强化替代品：次日可安排合适的乳品或明确标注钙强化的植物饮品。',
  };
  if(daily.length)for(const key of Object.keys(REVIEW_GROUPS))if(groups[key]==='missing')add(`group_${key}`,groupTexts[key]);
  if(active)add('next_active',demanding?'次日有较长或高强度运动：保留主食，按运动时间安排餐食和补水，不把估算消耗直接加到目标上。':'次日有运动安排：正常进餐，训练前饿了可选择易消化加餐，训练后搭配主食与蛋白食物。');
  else add('next_rest','次日没有记录运动安排，不代表一定休息；仍要规律进餐，按实际活动和饥饿感调整。');
  if(diet==='vegan')add('vegan','纯素饮食需关注维生素 B12，选择可靠强化食品或在专业指导下补充；植物饮品是否含钙需看标签。');
  else if(profile.goal==='muscle')add('muscle','增肌重在渐进力量训练、足够能量与恢复；蛋白食物分散到各餐，不为一天的数据而过量补充。');
  else if(profile.goal==='fatloss')add('weight_goal','体重管理优先规律三餐、饱腹感和长期趋势；本建议不根据单日摄入自动生成减脂缺口。');
  if(restrictions===null)add('restrictions_unreadable','饮食禁忌资料无法读取，暂不生成具体食材菜单。');
  else if(restrictions.allergens.length||restrictions.exclude.length)add('restrictions','已按禁忌筛选已知食材；品牌配方、配料与交叉接触仍需自行核对，不能据此保证无过敏原。');
  const saturatedMismatch=complete&&nutrientData.fat.missing===0&&nutrientData.saturatedFat.missing===0&&nutrientData.saturatedFat.total>nutrientData.fat.total+.2;
  if(saturatedMismatch)add('saturated_mismatch','饱和脂肪高于总脂肪，请先核对标签、单位和份量，暂不比较饱和脂肪供能比例。');
  if(!saturatedMismatch&&!insights.some(insight=>insight.code==='macro_mismatch')&&complete&&totals.calories.missing===0&&totals.calories.total>0&&nutrientData.saturatedFat.missing===0&&nutrientData.saturatedFat.total*9/totals.calories.total>=.1)add('saturated_fat','已记录饱和脂肪供能达到或超过一般成人 10% 的参考；次日可用适量不饱和油脂替换部分动物油，保持整体均衡。');
  const selectedDiet=DIETS.includes(diet)?diet:'balanced';
  const missingGroups=daily.length&&Object.values(groups).some(value=>value==='unknown');
  const focus=lowProtein||groups.protein==='missing'?'各餐分散安排适合你的蛋白食物。':groups.grains==='missing'?'用全谷物替换部分精制主食，逐步增加。':'主食、蛋白食物和蔬果一起搭配。';
  const menus=(restrictions===null?[]:buildMenuPlan(selectedDiet,restrictions)).map((plan,index)=>({...plan,text:plan.ingredients.map(food=>food.label).join('＋'),energy:target?Math.round(target*[.25,.35,.3,.1][index]):null,
    focus:index===3?(groups.fruit==='missing'?'完整水果优先，计入全天总量，不追求补偿。':'加餐是可选项，可根据饥饿和活动并入正餐。'):index===1||index===2?(groups.vegetables==='missing'?'午晚餐增加不同颜色蔬菜，不替代主食和蛋白。':demanding?'次日活动较多，主食不省略，留意补水与恢复。':focus):focus}));
  return {sourceDate:date,targetDate,dailyCount:daily.length,complete,reviewCurrent,reviewChanged:Boolean(review&&!reviewCurrent),groups,totals,nutrientData,target,targetNeedsReview,protein,shares,nextWorkouts,insights,menus,missingGroups};
}
