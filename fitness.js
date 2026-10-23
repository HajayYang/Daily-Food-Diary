import { REFERENCE_NUTRITION, REFERENCE_SOURCE, scaleNutrients } from './nutrition.js';
import { validBody, validTraining } from './training.js';
import { localDate } from './records.js';

// Approximate values per 100 g edible portion, based on generic USDA FoodData Central foods.
export const FOODS = [
  { name: '熟白米饭', kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
  { name: '熟鸡胸肉（去皮）', kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: '水煮全蛋', kcal: 155, protein: 12.6, carbs: 1.1, fat: 10.6 },
  { name: '香蕉（去皮）', kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  { name: '原味干燕麦', kcal: 379, protein: 13.2, carbs: 67.7, fat: 6.5 },
  { name: '熟西兰花（不加油）', kcal: 35, protein: 2.4, carbs: 7.2, fat: 0.4 },
].map((food,index)=>({...REFERENCE_NUTRITION[['rice','chicken','egg','banana','oats','broccoli'][index]],...food,nutritionSource:REFERENCE_SOURCE}));
export const TYPES = { strength: '健身 / 力量', swimming: '游泳', running: '跑步', badminton: '羽毛球', tabletennis: '乒乓球', tennis: '网球', hiking: '徒步', cardio: '其他有氧 / 骑行', mobility: '拉伸 / 恢复' };
export const AEROBIC_TYPES = new Set(['cardio', 'swimming', 'running', 'badminton', 'tabletennis', 'tennis', 'hiking']);
const numberBetween = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
export function validProfile(profile) {
  return Boolean(profile && validBody(profile) && ['health', 'muscle', 'fatloss'].includes(profile.goal) && (profile.weight === null || numberBetween(profile.weight, 30, 300)) && (profile.target === null || Number.isInteger(profile.target) && numberBetween(profile.target, 1200, 6000)));
}
export function validWorkout(workout) {
  return Boolean(workout && validTraining(workout) && typeof workout.id === 'string' && workout.id && typeof workout.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(workout.date) && Number.isFinite(new Date(`${workout.date}T12:00:00`).getTime()) && localDate(new Date(`${workout.date}T12:00:00`)) === workout.date && Object.hasOwn(TYPES, workout.type) && Number.isInteger(workout.minutes) && numberBetween(workout.minutes, 5, 300) && ['light', 'moderate', 'vigorous'].includes(workout.intensity) && typeof workout.done === 'boolean');
}
export function validFitness(data) {
  return Boolean(data && validProfile(data.profile) && Array.isArray(data.workouts) && data.workouts.every(validWorkout) && new Set(data.workouts.map(workout => workout.id)).size === data.workouts.length);
}
export function scaleFood(index, grams) {
  const food = FOODS[index];
  if (!food || !numberBetween(grams, 1, 2000)) throw new Error('请选择食物并填写 1–2000 克');
  return {kcal:Math.round(food.kcal*grams/100*10)/10,...scaleNutrients(food,grams)};
}
export function weekSummary(workouts, date) {
  const start = new Date(`${date}T12:00:00`);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const end = new Date(start); end.setDate(end.getDate() + 7);
  const completed = workouts.filter(workout => workout.done && workout.date >= localDate(start) && workout.date < localDate(end));
  return {
    aerobic: completed.filter(workout => AEROBIC_TYPES.has(workout.type)).reduce((sum, workout) => sum + (workout.intensity === 'moderate' ? workout.minutes : workout.intensity === 'vigorous' ? workout.minutes * 2 : 0), 0),
    strengthDays: new Set(completed.filter(workout => workout.type === 'strength').map(workout => workout.date)).size,
  };
}
export function proteinRange(profile, training) {
  if (!profile.weight || !(training || profile.goal === 'muscle')) return null;
  return [Math.round(profile.weight * 1.4), Math.round(profile.weight * 2)];
}
export function macroSummary(records) {
  return Object.fromEntries(['protein', 'carbs', 'fat'].map(key => [key, {
    total: Math.round(records.reduce((sum, record) => sum + (record[key] ?? 0), 0) * 10) / 10,
    missing: records.filter(record => record[key] == null).length,
  }]));
}
