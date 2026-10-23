import test from 'node:test';
import assert from 'node:assert/strict';
import { calorieGroup, chartData } from '../charts.js';
const r = (date, meal, calories) => ({ date, meal, calories });
test('groups known calories while preserving unknown and zero records', () => {
  assert.deepEqual(calorieGroup([r('2026-01-01','lunch',0),r('2026-01-01','lunch',null),r('2026-01-01','lunch',500)]),{total:500,count:3,known:2,missing:1});
  assert.deepEqual(calorieGroup([]),{total:0,count:0,known:0,missing:0});
});
test('daily meal totals agree with the daily sum and exclude other dates', () => {
  const data=chartData([r('2026-01-02','breakfast',200),r('2026-01-02','lunch',500),r('2026-01-02','lunch',null),r('2026-01-02','snack',0),r('2026-01-03','dinner',999)],'2026-01-02');
  assert.equal(data.total,700);assert.equal(data.missing,1);assert.equal(data.known,3);
  assert.deepEqual(data.meals.map(meal=>meal.total),[200,500,0,0]);
  assert.equal(data.meals.reduce((sum,meal)=>sum+meal.total,0),data.total);
  assert.equal(data.meals[2].count,0);assert.equal(data.meals[3].known,1);
});
test('seven day window crosses year boundary and includes selected day only', () => {
  const data=chartData([r('2025-12-26','lunch',100),r('2025-12-27','lunch',200),r('2026-01-02','dinner',300),r('2026-01-03','lunch',400)],'2026-01-02');
  assert.equal(data.days.length,7);assert.equal(data.days[0].date,'2025-12-27');assert.equal(data.days[6].date,'2026-01-02');
  assert.deepEqual(data.days.map(day=>day.total),[200,0,0,0,0,0,300]);
  assert.equal(chartData([],'2024-03-01').days[4].date,'2024-02-28');
});
test('histogram handles exact bin boundaries, unknowns, and the open upper interval', () => {
  const values=[0,199,200,399,400,599,600,799,800,20000,null];
  const data=chartData(values.map(value=>r('2026-01-02','snack',value)),'2026-01-02');
  assert.deepEqual(data.bins.map(bin=>bin.count),[2,2,2,2,2]);
  assert.equal(data.bins.reduce((sum,bin)=>sum+bin.count,0),data.known);
});
test('empty dates have zero counts without invented sample entries', () => {
  const data=chartData([],'2026-10-23');
  assert.equal(data.count,0);assert.equal(data.total,0);assert.equal(data.days.every(day=>day.count===0),true);assert.equal(data.bins.every(bin=>bin.count===0),true);
});
