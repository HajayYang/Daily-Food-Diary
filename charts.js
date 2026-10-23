import { MEALS, localDate } from './records.js';

export const MEAL_COLORS = ['#cd956b', '#77935e', '#a394ba', '#c6ac53'];
export function calorieGroup(records) {
  return {
    total: records.reduce((sum, record) => sum + (record.calories ?? 0), 0),
    count: records.length,
    known: records.filter(record => record.calories !== null).length,
    missing: records.filter(record => record.calories === null).length,
  };
}
export function chartData(records, date) {
  const daily = records.filter(record => record.date === date);
  const meals = MEALS.map((meal, index) => ({ ...meal, color: MEAL_COLORS[index], ...calorieGroup(daily.filter(record => record.meal === meal.id)) }));
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(`${date}T12:00:00`); day.setDate(day.getDate() - 6 + index);
    const key = localDate(day);
    const entries = records.filter(record => record.date === key);
    return { date: key, label: `${day.getMonth() + 1}/${day.getDate()}`, ...calorieGroup(entries), meals: MEALS.map(meal => calorieGroup(entries.filter(record => record.meal === meal.id))) };
  });
  const bins = ['0–199', '200–399', '400–599', '600–799', '≥800'].map((label, index) => ({ label, count: daily.filter(record => record.calories !== null && Math.min(4, Math.floor(record.calories / 200)) === index).length }));
  return { ...calorieGroup(daily), meals, days, bins };
}
function status(group) {
  if (!group.count) return '未记录';
  if (!group.known) return `${group.missing} 条未填热量`;
  return `${group.total} kcal${group.missing ? ` · ${group.missing} 条未填` : ''}`;
}
export function renderCharts({ records, date, readable, $, element, selectDate }) {
  const data = chartData(records, date);
  const note = $('#chart-status');
  note.textContent = !readable ? '原有饮食数据无法读取，暂不能展示图表。' : !data.count ? '所选日期尚无饮食记录。添加记录后，图表会自动更新。' : `${data.total} kcal 已记录 · ${data.known} 条有热量${data.missing ? ` · ${data.missing} 条未填热量，图表合计不完整` : ''}`;
  $('#chart-range').textContent = `${data.days[0].date} 至 ${date}`;
  $('#chart-pie').replaceChildren();
  $('#chart-meals').replaceChildren();
  $('#chart-week').replaceChildren();
  $('#chart-histogram').replaceChildren();
  $('#chart-table-body').replaceChildren();
  $('.charts-grid').hidden = !readable;
  $('.chart-table-details').hidden = !readable;
  if (!readable) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svgNode = (name, attrs) => {
    const node = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };
  const donut = element('div', 'donut-wrap');
  const svg = svgNode('svg', { viewBox: '0 0 200 200', role: 'img', 'aria-label': data.total ? `各餐热量占比：${data.meals.map(meal => `${meal.name} ${meal.total} kcal`).join('，')}` : '暂无正数热量，无法计算占比' });
  svg.append(svgNode('circle', { cx: 100, cy: 100, r: 74, fill: 'none', stroke: '#edf0e7', 'stroke-width': 24 }));
  let offset = 0;
  const circumference = 2 * Math.PI * 74;
  for (const meal of data.meals.filter(meal => meal.total > 0)) {
    const length = meal.total / data.total * circumference;
    const circle = svgNode('circle', { cx: 100, cy: 100, r: 74, fill: 'none', stroke: meal.color, 'stroke-width': 24, 'stroke-dasharray': `${length} ${circumference}`, 'stroke-dashoffset': -offset, transform: 'rotate(-90 100 100)' });
    const title = svgNode('title', {}); title.textContent = `${meal.name}：${meal.total} kcal（${(meal.total / data.total * 100).toFixed(1)}%）`; circle.append(title); svg.append(circle); offset += length;
  }
  const center = element('div', 'donut-center'); center.append(element('strong', '', data.total.toLocaleString('zh-CN')), element('small', '', data.total ? 'kcal · 已填合计' : '暂无正数热量'));
  donut.append(svg, center);
  const legend = element('ul', 'chart-legend');
  for (const meal of data.meals) {
    const row = element('li'); const swatch = element('span', 'chart-swatch'); swatch.style.background = meal.color;
    const label = element('div'); label.append(element('strong', '', meal.name), element('small', '', status(meal)));
    const percent = element('span', 'chart-percent', data.total && meal.known ? `${(meal.total / data.total * 100).toFixed(1)}%` : '—');
    row.append(swatch, label, percent); legend.append(row);
  }
  $('#chart-pie').append(donut, legend);
  const mealMax = Math.max(1, ...data.meals.map(meal => meal.total));
  for (const meal of data.meals) {
    const row = element('div', 'meal-chart-row');
    const label = element('div', 'bar-label'); label.append(element('span', '', meal.name), element('small', '', status(meal)));
    const track = element('div', 'bar-track'); const bar = element('div', 'bar-fill'); bar.style.width = `${meal.total / mealMax * 100}%`; bar.style.background = meal.color;
    track.append(bar); row.append(label, track); $('#chart-meals').append(row);
  }
  const weekMax = Math.max(1, ...data.days.map(day => day.total));
  $('#week-scale').textContent = `纵轴：已填 kcal · 本区间最高 ${Math.max(...data.days.map(day => day.total))} kcal`;
  for (const day of data.days) {
    const column = element('button', `week-column${day.date === date ? ' selected' : ''}`);
    column.dataset.date = day.date;
    column.type = 'button'; column.setAttribute('aria-label', `${day.date}：${status(day)}，查看当天`);
    column.title = `${day.date} · ${status(day)}`;
    const value = element('span', 'week-value', day.known ? String(day.total) : '—');
    const track = element('span', 'week-track');
    const stack = element('span', 'week-stack'); stack.style.height = `${day.total / weekMax * 100}%`;
    for (const [index, meal] of day.meals.entries()) {
      const part = element('span'); part.style.background = MEAL_COLORS[index]; part.style.height = `${day.total ? meal.total / day.total * 100 : 0}%`; stack.append(part);
    }
    track.append(stack);
    column.append(value, track, element('span', 'week-date', day.label), element('small', 'week-state', !day.count ? '未记录' : day.missing ? '有缺失' : '已填写'));
    column.addEventListener('click', () => {
      selectDate(day.date);
      document.querySelector(`#chart-week button[data-date="${day.date}"]`)?.focus({ preventScroll: true });
    });
    $('#chart-week').append(column);
    const tableRow = element('tr');
    for (const value of [day.date, ...day.meals.map(status), status(day)]) tableRow.append(element('td', '', value));
    $('#chart-table-body').append(tableRow);
  }
  const histogramMax = Math.max(1, ...data.bins.map(bin => bin.count));
  for (const bin of data.bins) {
    const column = element('div', 'hist-column');
    const track = element('div', 'hist-track'); const bar = element('div', 'hist-fill'); bar.style.height = `${bin.count / histogramMax * 100}%`; track.append(bar);
    column.append(element('strong', '', `${bin.count} 条`), track, element('span', '', bin.label));
    $('#chart-histogram').append(column);
  }
  $('#histogram-note').textContent = `横轴：单条食物记录的热量区间（kcal）；纵轴：记录条数。最后一组为 ≥800 kcal。${data.missing ? `已排除 ${data.missing} 条未填热量的记录。` : !data.known ? '暂无已填写热量的记录。' : `共 ${data.known} 条已填热量记录，含明确填写的 0 kcal。`}`;
}
