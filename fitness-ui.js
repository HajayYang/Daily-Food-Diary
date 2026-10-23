import { translateText } from './i18n.js';
import { ACTIVITIES, bodyEstimate, workoutEnergy, dailyEnergy, dailyTemplate, trainingAdvice } from './training.js';
import { FOODS, TYPES, validFitness, validProfile, validWorkout, scaleFood, weekSummary, proteinRange, macroSummary } from './fitness.js';

export function setupFitness({ $, element, toast, refresh, getDate, getRecords }) {
  const key = 'daily-bites.fitness.v1';
  let state = { profile: { goal: 'health', weight: null, target: null }, workouts: [] };
  let readable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (saved !== null) { if (!validFitness(saved)) throw new Error('Invalid fitness data'); state = saved; }
  } catch { readable = false; }
  function save(next) {
    if (!readable) { toast('健身数据无法读取，原数据未被覆盖，暂不能修改。'); return false; }
    try { localStorage.setItem(key, JSON.stringify(next)); state = next; return true; }
    catch { toast('健身计划保存失败，请检查浏览器存储空间。'); return false; }
  }
  for (const [index, food] of FOODS.entries()) {
    const option = element('option', '', `${food.name} · ${food.kcal} kcal/100g`); option.value = index; $('#food-preset').append(option);
  }
  $('#apply-food').addEventListener('click', () => {
    if ($('#food-preset').value === '') { toast('请先选择参考食物'); return; }
    try {
      const index = Number($('#food-preset').value), grams = Number($('#food-grams').value);
      const scaled = scaleFood(index, grams);
      const form = $('#record-form');
      form.elements.food.value = translateText(FOODS[index].name);
      form.elements.portion.value = `${grams} 克`;
      form.elements.calories.value = Math.round(scaled.kcal);
      for (const nutrient of ['protein', 'carbs', 'fat']) form.elements[nutrient].value = scaled[nutrient];
      toast('已填入估算值，可按实际食物修改');
    } catch (error) { toast(error.message); }
  });
  for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => $(`#${button.dataset.close}`).close());
  $('#profile-button').addEventListener('click', () => {
    $('#profile-form').reset();
    for (const [field, value] of Object.entries(state.profile)) { const input = $('#profile-form').elements.namedItem(field); if (input) input.value = value ?? ''; }
    $('#profile-dialog').showModal();
  });
  $('#profile-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const profile = { goal: data.get('goal'), weight: data.get('weight') === '' ? null : Number(data.get('weight')), target: data.get('target') === '' ? null : Number(data.get('target')) };
    for (const field of ['height', 'age']) profile[field] = data.get(field) === '' ? null : Number(data.get(field));
    for (const field of ['sex', 'activity', 'experience']) profile[field] = data.get(field) || null;
    if (!validProfile(profile)) { toast('请检查体重和能量目标的输入范围'); return; }
    if (save({ ...state, profile })) { $('#profile-dialog').close(); refresh(); toast('营养目标已保存'); }
  });
  function openWorkout(workout) {
    const form = $('#workout-form'); form.reset();
    form.elements.id.value = workout?.id ?? '';
    form.elements.date.value = workout?.date ?? getDate();
    if (workout) for (const field of ['type', 'minutes', 'intensity']) form.elements[field].value = workout[field];
    fillExercises(workout?.exercise ?? form.elements.type.value);
    form.elements.details.value = workout?.details ?? '';
    form.elements.weight.value = workout?.weight ?? state.profile.weight ?? '';
    form.elements.done.checked = workout?.done ?? false;
    $('#workout-title').textContent = workout ? '编辑运动' : '安排一次运动';
    updatePreview();
    $('#workout-dialog').showModal();
  }
  function fillExercises(selected) {
    const form = $('#workout-form');
    form.elements.exercise.replaceChildren();
    for (const [id, activity] of Object.entries(ACTIVITIES).filter(([, activity]) => activity.type === form.elements.type.value)) {
      const option = element('option', '', activity.name); option.value = id; form.elements.exercise.append(option);
    }
    if (selected && ACTIVITIES[selected]?.type === form.elements.type.value) form.elements.exercise.value = selected;
  }
  function updatePreview() {
    const form = $('#workout-form');
    const preview = { type: form.elements.type.value, exercise: form.elements.exercise.value, intensity: form.elements.intensity.value, minutes: Number(form.elements.minutes.value), weight: form.elements.weight.value === '' ? null : Number(form.elements.weight.value) };
    const energy = workoutEnergy(preview, state.profile);
    $('#workout-preview').textContent = energy ? `估计总消耗 ${energy.gross} kcal · 额外消耗 ${energy.net} kcal（${energy.met} MET，${energy.weight} kg）。含组间休息的训练仅作粗略参考。` : '补充有效体重和时长后可预览热量消耗；未知消耗不会按 0 计算。';
  }
  $('#workout-form').elements.type.addEventListener('change', () => { fillExercises(); updatePreview(); });
  $('#workout-form').addEventListener('input', updatePreview);
  $('#suggest-workout').addEventListener('click', () => {
    const suggestion = dailyTemplate(getDate(), state.profile, $('#sport-template-select').value);
    openWorkout({ ...suggestion, details: translateText(suggestion.details), date: getDate(), done: false });
    $('#workout-title').textContent = '当天运动示例 · 可调整';
  });
  for (const button of document.querySelectorAll('[data-sport]')) button.addEventListener('click', () => {
    $('#sport-template-select').value = button.dataset.sport;
    const suggestion = dailyTemplate(getDate(), state.profile, button.dataset.sport);
    openWorkout({ ...suggestion, details: translateText(suggestion.details), date: getDate(), done: false });
    $('#workout-title').textContent = '当天运动示例 · 可调整';
  });
  $('#add-workout').addEventListener('click', () => openWorkout());
  $('#workout-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const workout = { id: data.get('id') || crypto.randomUUID(), date: data.get('date'), type: data.get('type'), minutes: Number(data.get('minutes')), intensity: data.get('intensity'), done: data.has('done') };
    workout.exercise = data.get('exercise');
    workout.details = data.get('details').trim();
    workout.weight = data.get('weight') === '' ? state.profile.weight : Number(data.get('weight'));
    if (!validWorkout(workout)) { toast('请检查训练日期、时长和类型'); return; }
    const workouts = state.workouts.some(item => item.id === workout.id) ? state.workouts.map(item => item.id === workout.id ? workout : item) : [...state.workouts, workout];
    if (save({ ...state, workouts })) { $('#workout-dialog').close(); refresh(); toast('运动已保存'); }
  });
  function render() {
    const daily = getRecords().filter(record => record.date === getDate());
    const workouts = state.workouts.filter(workout => workout.date === getDate());
    const profile = state.profile;
    const expenditure = dailyEnergy(workouts, profile);
    $('#workout-energy').textContent = !readable ? '原有健身数据不可读，暂不能估算。' : !workouts.length ? '添加训练后显示预计消耗；标记完成后计入已完成消耗。' : `当日全部计划总消耗约 ${expenditure.planned} kcal（含已完成） · 已完成总消耗约 ${expenditure.completed} kcal · 已完成额外消耗约 ${expenditure.netCompleted} kcal${expenditure.unknown ? ` · ${expenditure.unknown} 次缺少体重等信息，未计入合计` : ''}`;
    const estimate = readable ? bodyEstimate(profile) : null;
    $('#body-estimate').replaceChildren();
    if (estimate) {
      for (const [name, value] of [['静息代谢参考', estimate.resting], ['每日维持能量参考', estimate.maintenance]]) {
        const metric = element('div'); metric.append(element('small', '', name), element('strong', '', value ? `约 ${value} kcal/天` : '待选择活动水平')); $('#body-estimate').append(metric);
      }
    } else $('#body-estimate').append(element('p', 'muted', readable ? '填写身体资料后显示代谢参考；不会自动覆盖手填饮食目标。' : '健身数据读取失败，暂不能显示建议。'));
    $('#personal-advice').replaceChildren(...(readable ? trainingAdvice(profile, workouts).map(note => element('li', '', note)) : []));
    const training = workouts.some(workout => workout.type !== 'mobility');
    const total = daily.reduce((sum, record) => sum + (record.calories ?? 0), 0);
    const missing = daily.filter(record => record.calories === null).length;
    $('#goal-label').textContent = { health: '健康维持', muscle: '增肌与力量', fatloss: '体重管理' }[profile.goal];
    $('#energy-status').textContent = `${total} kcal 已记录${profile.target ? ` / ${profile.target} kcal 个人参考` : ' · 尚未设置个人能量参考'}`;
    $('#energy-progress').value = profile.target ? Math.min(100, total / profile.target * 100) : 0;
    $('#energy-progress').hidden = !profile.target;
    $('#energy-detail').textContent = !daily.length ? '今天还没有饮食记录。' : `${missing ? `${missing} 条未填热量，总量不完整。` : '仅汇总已录入食物，不代表全天实际摄入。'}${profile.target && !missing ? ' 进度用于记录，不代表营养是否均衡。' : ''}`;
    const macros = macroSummary(daily);
    $('#macro-summary').replaceChildren(...Object.entries({ protein: '蛋白质', carbs: '碳水', fat: '脂肪' }).map(([key, name]) => {
      const div = element('div'); div.append(element('small', '', name), element('strong', '', `${macros[key].total} g`), element('small', '', macros[key].missing ? `${macros[key].missing} 条未填写` : '已填写合计')); return div;
    }));
    const protein = proteinRange(profile, training);
    $('#protein-reference').textContent = protein ? `规律训练者蛋白质参考：${protein[0]}–${protein[1]} g/天（体重 × 1.4–2.0）；分配到各餐，按需要调整。` : '可在目标设置中填写体重；有训练安排或增肌目标时显示运动人群蛋白质参考。';
    $('#meal-reference').textContent = profile.target ? `灵活配餐示例：早餐 ${Math.round(profile.target * .25)} · 午餐 ${Math.round(profile.target * .35)} · 晚餐 ${Math.round(profile.target * .3)} · 加餐 ${Math.round(profile.target * .1)} kcal。可按训练时间调整。` : '未设置热量目标也可以用餐盘比例搭配，不必为了记录而刻意限制饮食。';
    $('#workouts').replaceChildren();
    if (!readable) $('#workouts').append(element('p', 'muted', '健身数据读取失败，原数据已保留，暂不能修改。'));
    else if (!workouts.length) $('#workouts').append(element('p', 'workout-empty', '今天还没有运动安排，也可以留给身体休息。'));
    for (const workout of workouts) {
      const row = element('div', 'workout-row');
      const label = element('label', 'workout-check');
      const check = element('input'); check.type = 'checkbox'; check.checked = workout.done; check.setAttribute('aria-label', `完成${TYPES[workout.type]}`);
      check.addEventListener('change', () => {
        if (save({ ...state, workouts: state.workouts.map(item => item.id === workout.id ? { ...item, done: check.checked } : item) })) refresh();
        else check.checked = workout.done;
      });
      label.append(check, element('span', '', `${TYPES[workout.type]} · ${workout.minutes} 分钟`));
      const detail = element('small', 'muted', `${{ light: '轻度', moderate: '中等强度', vigorous: '高强度' }[workout.intensity]} · ${workout.done ? '已完成' : '待完成'}`);
      const actions = element('div', 'record-actions');
      const edit = element('button', 'text-button', '编辑运动'); edit.addEventListener('click', () => openWorkout(workout));
      const remove = element('button', 'text-button delete-button', '删除运动'); remove.addEventListener('click', () => { if (confirm(translateText('删除这次运动安排？')) && save({ ...state, workouts: state.workouts.filter(item => item.id !== workout.id) })) refresh(); });
      const energy = workoutEnergy(workout, profile);
      const energyLabel = element('p', 'exercise-energy', energy ? `约 ${energy.gross} kcal 总消耗 / ${energy.net} kcal 额外消耗 · ${energy.met} MET · ${energy.weight} kg${energy.currentWeight ? '（使用当前体重）' : '（本次保存体重）'}` : '消耗未知：请补充本次或个人体重');
      const activityLabel = element('p', 'muted', ACTIVITIES[workout.exercise ?? workout.type].name);
      actions.append(edit, remove); const info = element('div', 'workout-info'); info.append(label, detail, activityLabel, energyLabel);
      if (workout.details) { const details = element('p', 'workout-details', workout.details); details.translate = false; info.append(details); } row.append(info, actions); $('#workouts').append(row);
    }
    const week = weekSummary(state.workouts, getDate());
    $('#week-summary').textContent = `所选日期所在周（周一至周日）已完成：有氧 ${week.aerobic} 等效分钟 · 力量 ${week.strengthDays} 天`;
    $('#training-advice').textContent = training ? '今天有训练安排。训练前 1–3 小时可吃易消化的主食与少量蛋白，避免临近训练大量高脂饮食；训练后正常进餐，搭配主食与蛋白。按口渴、出汗及环境补水；长时间高强度训练需个体化补给。' : '休息日同样需要规律三餐、足量蛋白和蔬果。保持正常饮水与睡眠，不必因为没有训练就跳餐。';
    $('#meal-example').textContent = `${profile.goal === 'fatloss' ? '体重管理优先关注规律进餐、饱腹感与长期趋势。' : profile.goal === 'muscle' ? '增肌需要渐进力量训练、充足能量与恢复。' : '多样化选择，享受食物。'}早餐：燕麦＋牛奶或豆浆＋水果；正餐：杂粮饭＋鱼、豆腐或瘦肉＋两种蔬菜；${training ? '若训练前饥饿，可用香蕉或酸奶加餐。' : '加餐可选水果或无糖酸奶。'}这是搭配示例，份量和过敏替换按个人需要调整。`;
  }
  return { render, exportData: () => readable ? state : null, readable: () => readable };
}
