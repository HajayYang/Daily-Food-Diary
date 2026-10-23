import { MEALS, localDate, validRecord, summarize } from './records.js';

const STORAGE_KEY = 'daily-bites.records.v1';
const $ = selector => document.querySelector(selector);
let records = [];
let storageReadable = true;
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  if (!Array.isArray(saved) || !saved.every(validRecord) || new Set(saved.map(record => record.id)).size !== saved.length) throw new Error('Invalid records');
  records = saved;
} catch {
  storageReadable = false;
}
let selectedDate = localDate();
let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
}
function persist(next) {
  if (!storageReadable) { toast('无法读取原有记录，为保护数据，暂不能修改。请检查浏览器存储设置。'); return false; }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); records = next; return true; }
  catch { toast('保存失败：浏览器存储不可用或空间不足，请先导出已有记录。'); return false; }
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function render() {
  $('#date').value = selectedDate;
  const date = new Date(`${selectedDate}T12:00:00`);
  const isToday = selectedDate === localDate();
  $('#date-heading').textContent = `${date.getMonth() + 1}月${date.getDate()}日 ${date.toLocaleDateString('zh-CN', { weekday: 'long' })}${isToday ? ' · 今天' : ''}`;
  $('#day-description').textContent = isToday ? '今天吃了什么好吃的？' : '每一餐，都是生活的一个小片段。';
  const daily = records.filter(record => record.date === selectedDate);
  const stats = summarize(daily);
  for (const [id, value, unit] of [['record-count', stats.count, '条'], ['food-count', stats.foods, '种'], ['calorie-count', stats.calories, 'kcal']]) {
    const target = $(`#${id}`);
    target.replaceChildren(document.createTextNode(`${value} `), element('small', '', unit));
  }
  $('#meals').replaceChildren(...MEALS.map(meal => {
    const card = element('article', `meal-card ${meal.color}`);
    const head = element('div', 'meal-head');
    const symbol = element('span', 'meal-symbol', meal.emoji);
    const title = element('div', 'meal-title');
    title.append(element('h3', '', meal.name), element('span', '', meal.english));
    const entries = daily.filter(record => record.meal === meal.id);
    head.append(symbol, title, element('span', 'meal-total', entries.length ? `${summarize(entries).calories} kcal` : meal.time));
    card.append(head);
    const body = element('div', 'meal-body');
    if (!entries.length) {
      const empty = element('div', 'empty');
      empty.append(element('span', 'empty-doodle', '⌁'), element('p', '', meal.hint), element('small', '', '还没有记录，来记下这一餐吧'));
      body.append(empty);
    }
    for (const record of entries) {
      const row = element('div', 'record');
      const info = element('div', 'record-info');
      info.append(element('h4', '', record.food), element('p', '', [record.portion, record.calories === null ? '未填写热量' : `${record.calories} kcal`].filter(Boolean).join(' · ')));
      if (record.note) info.append(element('p', 'record-note', record.note));
      const actions = element('div', 'record-actions');
      const edit = element('button', 'text-button', '编辑');
      edit.addEventListener('click', () => openForm(meal.id, record));
      const remove = element('button', 'text-button delete-button', '删除');
      remove.addEventListener('click', () => {
        if (confirm(`删除「${record.food}」这条记录？`) && persist(records.filter(item => item.id !== record.id))) { render(); toast('记录已删除'); }
      });
      actions.append(edit, remove); row.append(info, actions); body.append(row);
    }
    const add = element('button', 'add-meal', `＋ 记录${meal.name}`);
    add.addEventListener('click', () => openForm(meal.id));
    card.append(body, add);
    return card;
  }));
}
function openForm(meal = 'breakfast', record) {
  const form = $('#record-form');
  form.reset();
  for (const [key, value] of Object.entries(record ?? { id: '', date: selectedDate, meal })) {
    if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value ?? '';
  }
  $('#dialog-title').textContent = record ? '编辑这一餐' : '记下这一餐';
  $('#record-dialog').showModal();
}
$('#record-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const record = { id: data.get('id') || crypto.randomUUID(), date: data.get('date'), meal: data.get('meal'), food: data.get('food').trim(), portion: data.get('portion').trim(), calories: data.get('calories') === '' ? null : Number(data.get('calories')), note: data.get('note').trim() };
  if (!validRecord(record)) { toast('请检查日期、食物名称和热量是否填写正确。'); return; }
  const next = records.some(item => item.id === record.id) ? records.map(item => item.id === record.id ? record : item) : [...records, record];
  if (persist(next)) { selectedDate = record.date; $('#record-dialog').close(); render(); toast('已保存，记得好好吃饭'); }
});
$('#add-record').addEventListener('click', () => openForm());
$('#close-dialog').addEventListener('click', () => $('#record-dialog').close());
$('#date').addEventListener('change', event => { if (event.target.value) { selectedDate = event.target.value; render(); } });
for (const [id, offset] of [['previous-day', -1], ['next-day', 1]]) {
  $(`#${id}`).addEventListener('click', () => { const date = new Date(`${selectedDate}T12:00:00`); date.setDate(date.getDate() + offset); selectedDate = localDate(date); render(); });
}
$('#today').addEventListener('click', () => { selectedDate = localDate(); render(); });
$('#export').addEventListener('click', () => {
  if (!storageReadable) { toast('原有数据无法读取，暂不能导出。'); return; }
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), records }, null, 2)], { type: 'application/json' }));
  const link = element('a'); link.href = url; link.download = `一日食记-${localDate()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
render();
if (!storageReadable) toast('本地记录读取失败。原数据未被覆盖，请检查浏览器存储设置。');
