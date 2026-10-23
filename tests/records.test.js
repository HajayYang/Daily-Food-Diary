import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, validRecord, summarize } from '../records.js';
const record = { id: 'test-1', date: '2026-10-23', meal: 'lunch', food: '番茄鸡蛋面', portion: '一碗', calories: 450, note: '热乎乎的' };
test('validates records and optional calories', () => {
  assert.equal(validRecord(record), true);
  assert.equal(validRecord({ ...record, calories: null }), true);
  for (const override of [{ date: '2026-02-30' }, { food: '  ' }, { calories: -1 }, { calories: 1.5 }, { calories: '450' }, { meal: 'unknown' }, { id: '' }]) assert.equal(validRecord({ ...record, ...override }), false);
});
test('summarizes distinct foods and handles missing calories', () => {
  assert.deepEqual(summarize([record, { ...record, calories: null }, { ...record, food: '苹果', calories: 80 }]), { count: 3, foods: 2, calories: 530 });
  assert.deepEqual(summarize([]), { count: 0, foods: 0, calories: 0 });
});
test('formats dates using the local calendar', () => { assert.equal(localDate(new Date(2026, 0, 2, 0, 1)), '2026-01-02'); });
