import test from 'node:test';
import assert from 'node:assert/strict';
import { validFitness, validWorkout, validProfile, scaleFood, weekSummary, proteinRange, macroSummary } from '../fitness.js';
import { validRecord } from '../records.js';
const workout = { id: 'a', date: '2026-10-23', type: 'cardio', minutes: 30, intensity: 'moderate', done: true };
test('validates profiles and training data without coercing invalid values', () => {
  assert.equal(validProfile({ goal: 'health', weight: null, target: null }), true);
  assert.equal(validProfile({ goal: 'muscle', weight: 60, target: 2200 }), true);
  assert.equal(validProfile({ goal: 'fatloss', weight: 60, target: 800 }), false);
  for (const change of [{ date: '2026-02-30' }, { minutes: 0 }, { minutes: 30.5 }, { done: 'true' }, { type: 'toString' }]) assert.equal(validWorkout({ ...workout, ...change }), false);
  assert.equal(validFitness({ profile: { goal: 'health', weight: null, target: null }, workouts: [workout, workout] }), false);
});
test('calculates calories and macros from edible weight', () => {
  const food=scaleFood(0,200);
  assert.deepEqual(Object.fromEntries(['kcal','protein','carbs','fat'].map(key=>[key,food[key]])), { kcal: 260, protein: 5.4, carbs: 56.4, fat: .6 });
  assert.equal(food.water,136.88); assert.equal(food.vitaminC,0);
  assert.throws(() => scaleFood(0, -100));
  assert.throws(() => scaleFood(99, 100));
});
test('weekly summary respects Monday boundary, completion, intensity and distinct strength days', () => {
  const items = [workout, { ...workout, id: 'b', intensity: 'vigorous' }, { ...workout, id: 'c', intensity: 'light' }, { ...workout, id: 'd', done: false }, { ...workout, id: 'e', date: '2026-10-18' }, { ...workout, id: 'f', date: '2026-10-26' }, { ...workout, id: 'g', type: 'strength' }, { ...workout, id: 'h', type: 'strength' }, { ...workout, id: 'i', date: '2026-10-22', type: 'strength' }];
  assert.deepEqual(weekSummary(items, '2026-10-23'), { aerobic: 90, strengthDays: 2 });
  assert.deepEqual(weekSummary([], '2026-01-01'), { aerobic: 0, strengthDays: 0 });
});
test('protein reference is conditional and uses body weight', () => {
  assert.equal(proteinRange({ goal: 'health', weight: 60 }, false), null);
  assert.equal(proteinRange({ goal: 'muscle', weight: null }, true), null);
  assert.deepEqual(proteinRange({ goal: 'muscle', weight: 60 }, false), [84, 120]);
});
test('legacy records remain valid and missing macros stay distinguishable from zero', () => {
  const record = { id: 'old', date: '2026-10-23', meal: 'lunch', food: '米饭', portion: '一碗', note: '', calories: null };
  assert.equal(validRecord(record), true);
  assert.equal(validRecord({ ...record, protein: -1 }), false);
  assert.equal(validRecord({ ...record, fat: '10' }), false);
  assert.deepEqual(macroSummary([record, { ...record, protein: 10, carbs: 0, fat: null }]), { protein: { total: 10, missing: 1 }, carbs: { total: 0, missing: 1 }, fat: { total: 0, missing: 2 } });
});
