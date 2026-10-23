// Broad MET estimates for common activity categories, informed by the Adult Compendium.
// These are reference values, not measurements of an individual's expenditure.
export const ACTIVITIES = {
  strength: { name: '器械 / 自由重量', type: 'strength', mets: [3, 3.5, 6] },
  bodyweight: { name: '自重训练', type: 'strength', mets: [2.8, 3.8, 7.5] },
  cardio: { name: '一般有氧', type: 'cardio', mets: [2.5, 5, 8] },
  walking: { name: '步行 / 快走', type: 'cardio', mets: [2.8, 3.8, 4.8] },
  cycling: { name: '骑行', type: 'cardio', mets: [3.5, 6.8, 10] },
  jogging: { name: '慢跑 / 跑步', type: 'cardio', mets: [6, 8.3, 11] },
  mobility: { name: '舒缓拉伸', type: 'mobility', mets: [2.3, 2.3, 2.3] },
};
export const ACTIVITY_LEVELS = { sedentary: { label: '久坐 / 很少运动', factor: 1.2 }, light: { label: '轻活动 / 每周约 1–3 次运动', factor: 1.375 }, moderate: { label: '中活动 / 每周约 3–5 次运动', factor: 1.55 }, active: { label: '高活动 / 体力工作或频繁训练', factor: 1.725 } };
const inRange = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
export function validBody(profile) {
  return (profile.height == null || inRange(profile.height, 120, 230)) && (profile.age == null || Number.isInteger(profile.age) && inRange(profile.age, 18, 100)) && (profile.sex == null || ['male', 'female'].includes(profile.sex)) && (profile.activity == null || Object.hasOwn(ACTIVITY_LEVELS, profile.activity)) && (profile.experience == null || ['beginner', 'regular'].includes(profile.experience));
}
export function validTraining(workout) {
  return (workout.exercise == null || Object.hasOwn(ACTIVITIES, workout.exercise) && ACTIVITIES[workout.exercise].type === workout.type) && (workout.details == null || typeof workout.details === 'string' && workout.details.length <= 1500) && (workout.weight == null || inRange(workout.weight, 30, 300));
}
export function bodyEstimate(profile) {
  if (!validBody(profile) || !inRange(profile.weight, 30, 300) || !profile.height || !profile.age || !profile.sex) return null;
  const resting = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + (profile.sex === 'male' ? 5 : -161);
  return { resting: Math.round(resting), maintenance: profile.activity ? Math.round(resting * ACTIVITY_LEVELS[profile.activity].factor) : null };
}
export function workoutEnergy(workout, profile) {
  const weight = workout.weight ?? profile.weight;
  const exercise = workout.exercise ?? workout.type;
  if (!inRange(weight, 30, 300) || !Object.hasOwn(ACTIVITIES, exercise) || ACTIVITIES[exercise].type !== workout.type || !['light', 'moderate', 'vigorous'].includes(workout.intensity) || !inRange(workout.minutes, 5, 300)) return null;
  const met = ACTIVITIES[exercise].mets[['light', 'moderate', 'vigorous'].indexOf(workout.intensity)];
  const base = 3.5 * weight / 200 * workout.minutes;
  return { gross: Math.round(met * base), net: Math.round((met - 1) * base), met, weight, currentWeight: workout.weight == null };
}
export function dailyEnergy(workouts, profile) {
  const result = { planned: 0, completed: 0, netCompleted: 0, unknown: 0 };
  for (const workout of workouts) {
    const energy = workoutEnergy(workout, profile);
    if (!energy) { result.unknown++; continue; }
    result.planned += energy.gross;
    if (workout.done) { result.completed += energy.gross; result.netCompleted += energy.net; }
  }
  return result;
}
export function dailyTemplate(date, profile) {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const beginner = profile.experience !== 'regular';
  const strengthDays = profile.goal === 'muscle' ? [1, 3, 5] : [1, 4];
  if (strengthDays.includes(weekday)) return { type: 'strength', exercise: 'bodyweight', intensity: 'moderate', minutes: beginner ? 25 : 35, details: `热身 5 分钟：原地踏步、肩髋活动。\n主训练 ${beginner ? '15' : '25'} 分钟：椅子深蹲、靠墙俯卧撑、臀桥、弹力带划船，各 ${beginner ? '1–2' : '2–3'} 组，每组 8–12 次，组间休息 60–90 秒；按时间减少动作或组数。\n放松 5 分钟：轻走与舒缓拉伸。选择可控难度，保留约 2–3 次余力，不追求力竭。无弹力带时可跳过划船。` };
  if ([0, 3].includes(weekday)) return { type: 'mobility', exercise: 'mobility', intensity: 'light', minutes: 15, details: '恢复日，可完全休息。若想活动：5 分钟轻走，随后 10 分钟肩背、髋部和小腿的温和活动与拉伸；不弹震、不拉到疼痛。' };
  return { type: 'cardio', exercise: 'walking', intensity: 'moderate', minutes: beginner ? 25 : 40, details: `热身慢走 5 分钟；${beginner ? '15' : '30'} 分钟舒适快走（能说话，难以唱歌）；最后 5 分钟慢走放松。初学者可拆成数段，按体感降低速度或时长。` };
}
export function trainingAdvice(profile, workouts) {
  const estimate = bodyEstimate(profile);
  const notes = [];
  if (!estimate) notes.push('补充体重、身高、年龄和公式性别后，可查看静息代谢参考；只填体重也能估算运动消耗。');
  else if (!estimate.maintenance) notes.push('已计算静息代谢；再选择日常活动水平，可查看包含日常训练的维持能量参考。');
  else notes.push(`维持能量估计约 ${estimate.maintenance} kcal/天；活动系数已包含平常训练，不要再叠加运动消耗。用数周体重、饥饿感、训练表现来校准。`);
  if (profile.goal === 'muscle') notes.push('增肌优先渐进力量训练与充足恢复，三餐均匀安排蛋白质，训练前后保留适量主食；无需为追求热量消耗而加练。');
  else if (profile.goal === 'fatloss') notes.push('体重管理先保证规律饮食、蛋白质和蔬果，结合有氧与力量；不自动减去固定热量，也不根据一天记录判断是否吃得过多。');
  else notes.push('健康维持重在每周有氧、至少两天力量和规律三餐；休息日同样需要营养与睡眠。');
  if (estimate && profile.target && profile.target < estimate.resting) notes.push('当前手填能量目标低于估算静息代谢；这不是个人安全阈值，建议与营养师核对需求，避免自行长期严格限制摄入。');
  if (workouts.some(workout => workout.minutes >= 90 || workout.intensity === 'vigorous')) notes.push('今天含较长或高强度训练，注意分段休息、补水与主食供能；刚开始锻炼时先降低强度。');
  if (workouts.some(workout => workout.type === 'strength')) notes.push('同一肌群较高负荷训练之间一般留约 48 小时恢复；动作质量优先于重量，疲劳时减少组数。');
  notes.push('如出现胸痛、明显头晕或异常气短，应停止运动并及时就医；有关节疼痛时调整动作。');
  return notes;
}
