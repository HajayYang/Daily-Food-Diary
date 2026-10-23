import { setupLifestyle } from './lifestyle-ui.js';
import { setupBarcode } from './barcode-ui.js';
import { setupBackup } from './backup-ui.js';
import { writeLocal, recoverImport, blockExternalWrites } from './storage.js';
import { NUTRIENTS, renderNutrition } from './nutrition.js';
import { setupNextDayAdvice } from './next-day-ui.js';
import { setupPhotoDiary } from './photo-ui.js';
import { setupLanguage, translateText, formatDateLabel } from './i18n.js';
import { setupFoodDiscovery } from './food-discovery.js';
import { setupAppearance } from './appearance.js';
import { renderCharts } from './charts.js';
import { setupFitness } from './fitness-ui.js';
import { MEALS, localDate, validRecord, summarize } from './records.js';

const STORAGE_KEY = 'daily-bites.records.v1';
const $ = selector => document.querySelector(selector);
let records = [];
const recovered = recoverImport();
let storageReadable = recovered;
try {
  if(!recovered)throw new Error('unfinished import');
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  if (!Array.isArray(saved) || !saved.every(validRecord) || new Set(saved.map(record => record.id)).size !== saved.length) throw new Error('Invalid records');
  records = saved;
} catch {
  storageReadable = false;
}
let selectedDate = localDate();
let toastTimer;
function toast(message) {
  $('#toast').textContent = translateText(message);
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
}
function persist(next) {
  if (!storageReadable) { toast('无法读取原有记录，为保护数据，暂不能修改。请检查浏览器存储设置。'); return false; }
  try { writeLocal(STORAGE_KEY, JSON.stringify(next)); records = next; return true; }
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
  $('#date-heading').textContent = formatDateLabel(selectedDate, isToday);
  $('#day-description').textContent = isToday ? '今天吃了什么好吃的？' : '每一餐，都是生活的一个小片段。';
  const daily = records.filter(record => record.date === selectedDate);
  const stats = summarize(daily);
  for (const [id, value, unit] of [['record-count', stats.count, '条'], ['food-count', stats.foods, '种'], ['calorie-count', stats.calories, 'kcal']]) {
    const target = $(`#${id}`);
    target.replaceChildren(document.createTextNode(`${value} `), element('small', '', unit));
  }
  fitness.render();
  nextDay.render();
  lifestyle.render();
  renderCharts({ records, date: selectedDate, readable: storageReadable, $, element, selectDate: date => { selectedDate = date; render(); } });
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
      const name = element('h4', '', record.food); name.translate = false;
      const portion = element('p', '', [record.portion, record.calories === null ? translateText('未填写热量') : `${record.calories} kcal`].filter(Boolean).join(' · ')); portion.translate = false;
      info.append(name, portion);
      const nutrition = ['protein', 'carbs', 'fat'].map((key, index) => record[key] == null ? null : `${translateText(['蛋白质', '碳水', '脂肪'][index])} ${record[key]}g`).filter(Boolean);
      if (nutrition.length) { const macroText = element('p', '', nutrition.join(' · ')); macroText.translate = false; info.append(macroText); }
      info.append(renderNutrition(record, element));
      if (record.note) { const note = element('p', 'record-note', record.note); note.translate = false; info.append(note); }
      const actions = element('div', 'record-actions');
      const favorite = element('button','text-button','收藏');favorite.addEventListener('click',()=>lifestyle.favoriteFood(record));
      const edit = element('button', 'text-button', '编辑');
      edit.addEventListener('click', () => openForm(meal.id, record));
      const remove = element('button', 'text-button delete-button', '删除');
      remove.addEventListener('click', () => {
        if (confirm(translateText('删除「{name}」这条记录？').replace('{name}', () => record.food)) && persist(records.filter(item => item.id !== record.id))) { render(); toast('记录已删除'); }
      });
      actions.append(favorite,edit, remove); row.append(info, actions); body.append(row);
    }
    const add = element('button', 'add-meal', `＋ 记录${meal.name}`);
    add.addEventListener('click', () => openForm(meal.id));
    card.append(body, add);
    return card;
  }));
}
let pendingSource=null;
function openForm(meal = 'breakfast', record) {
  pendingSource=record?.source?{source:record.source,...(record.barcode?{barcode:record.barcode}:{})}:null;
  const form = $('#record-form');
  form.reset();
  for (const [key, value] of Object.entries(record ?? { id: '', date: selectedDate, meal })) {
    if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value ?? '';
  }
  $('#dialog-title').textContent = record?.id ? '编辑这一餐' : '记下这一餐';
  $('#record-dialog').showModal();
}
$('#record-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const record = { id: data.get('id') || crypto.randomUUID(), date: data.get('date'), meal: data.get('meal'), food: data.get('food').trim(), portion: data.get('portion').trim(), calories: data.get('calories') === '' ? null : Number(data.get('calories')), note: data.get('note').trim() };
  record.nutritionSource = data.get('nutritionSource').trim();
  for (const key of Object.keys(NUTRIENTS)) record[key] = data.get(key) === '' ? null : Number(data.get(key));
  if (!validRecord(record)) { toast('请检查日期、食物名称和热量是否填写正确。'); return; }
  const previous = records.find(item => item.id === record.id);
  if (previous?.source) record.source = previous.source;
  if (previous?.barcode) record.barcode=previous.barcode;
  if (pendingSource&&!previous){record.source=pendingSource.source;if(pendingSource.barcode)record.barcode=pendingSource.barcode;}
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
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), records, fitness: fitness.exportData(), nextDay: nextDay.exportData(), lifestyle:lifestyle.exportData() }, null, 2)], { type: 'application/json' }));
  const link = element('a'); link.href = url; link.download = `一日食记-${localDate()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
setupLanguage({ refresh: render, toast });
setupPhotoDiary({ $, element, getDate: () => selectedDate, saveRecords: entries => {
  if (!entries.length || !entries.every(validRecord)) return false;
  if (!persist([...records, ...entries])) return false;
  selectedDate = entries[0].date; render(); toast('已保存拍照识别的食物记录'); return true;
} });
setupFoodDiscovery({ $, element });
setupAppearance({ $, toast });
$('#appearance-done').addEventListener('click', () => $('#appearance-dialog').close());
const lifestyle=setupLifestyle({$,element,toast,refresh:render,recordsReadable:()=>storageReadable,getRecords:()=>records,getDate:()=>selectedDate,getFitness:()=>fitness.exportData(),getPlanner:()=>nextDay.exportData(),saveRecords:entries=>{if(!entries.length||!entries.every(validRecord)||!persist([...records,...entries]))return false;selectedDate=entries[0].date;render();return true;}});
setupBarcode({$,element,getDate:()=>selectedDate,openForm,getRestrictions:()=>lifestyle.getRestrictions()});
setupBackup({$,element,toast});
const fitness = setupFitness({ $, element, toast, refresh: render, getDate: () => selectedDate, getRecords: () => records, getRestrictions:()=>lifestyle.getRestrictions() });
const nextDay = setupNextDayAdvice({ $, element, getDate: () => selectedDate, getRecords: () => records, getFitness: () => fitness.exportData(), recordsReadable: () => storageReadable, getRestrictions:()=>lifestyle.getRestrictions(),generateShopping:advice=>lifestyle.generateShopping(advice),refresh:render });
render();
if (!storageReadable) toast('本地记录读取失败。原数据未被覆盖，请检查浏览器存储设置。');

window.addEventListener('storage',event=>{if(event.key===null||['daily-bites.records.v1','daily-bites.fitness.v1','daily-bites.next-day.v1','daily-bites.lifestyle.v1','daily-bites.import-journal.v1'].includes(event.key)){blockExternalWrites();storageReadable=false;render();$('#lifestyle-status').textContent='另一标签页更新了数据，请刷新后继续编辑。';toast('另一标签页更新了数据，请刷新后继续编辑。');}});
