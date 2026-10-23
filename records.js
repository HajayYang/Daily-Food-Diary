import { validNutrients } from './nutrition.js';
export const MEALS = [
  { id: 'breakfast', name: '早餐', english: 'BREAKFAST', emoji: '🍞', hint: '用一顿早餐，唤醒新的一天', time: '晨光里的第一餐', color: 'peach' },
  { id: 'lunch', name: '午餐', english: 'LUNCH', emoji: '🥗', hint: '认真吃午饭，为下午充充电', time: '给自己补充能量', color: 'green' },
  { id: 'dinner', name: '晚餐', english: 'DINNER', emoji: '🍲', hint: '忙碌一天，也要好好吃饭', time: '用美味收尾一天', color: 'purple' },
  { id: 'snack', name: '加餐', english: 'SNACK', emoji: '🍎', hint: '水果、点心，或一份小快乐', time: '生活里的小满足', color: 'yellow' },
];
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validRecord(record) {
  if (!record || typeof record !== 'object' || !validNutrients(record) || (record.source!=null&&(typeof record.source!=='string'||record.source.length>100)) || (record.barcode!=null&&(typeof record.barcode!=='string'||!/^\d{8,14}$/.test(record.barcode)))) return false;
  const date = typeof record.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.date) && new Date(`${record.date}T12:00:00`).getTime();
  return Boolean(date && localDate(new Date(`${record.date}T12:00:00`)) === record.date && typeof record.id === 'string' && record.id.length && MEALS.some(meal => meal.id === record.meal) && typeof record.food === 'string' && record.food.trim().length > 0 && record.food.length <= 120 && typeof record.portion === 'string' && record.portion.length <= 40 && typeof record.note === 'string' && record.note.length <= 500 && (record.calories === null || (Number.isInteger(record.calories) && record.calories >= 0 && record.calories <= 20000)));
}
export function summarize(records) {
  return { count: records.length, foods: new Set(records.map(record => record.food.trim())).size, calories: records.reduce((total, record) => total + (record.calories ?? 0), 0) };
}
