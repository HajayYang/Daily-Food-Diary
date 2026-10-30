import { localStore } from './app-storage.js';
import { MESSAGES } from './locales.js';
import { HABIT_MESSAGES } from './habit-locales.js';
import { DESKTOP_MESSAGES } from './desktop-locales.js';
import { CATALOG_MESSAGES } from './catalog-locales.js';
Object.assign(MESSAGES,HABIT_MESSAGES,DESKTOP_MESSAGES,CATALOG_MESSAGES);
export const LANGUAGES = ['zh-CN', 'en', 'ja', 'ko'];
const key = 'daily-bites.language.v1';
let language = 'zh-CN';
try { const saved = localStore.getItem(key); if (LANGUAGES.includes(saved)) language = saved; } catch { /* Default remains usable when storage is disabled. */ }
export const getLanguage = () => language;
// Catalog phrases can be updated together with the database, without changing UI code.
export function registerTranslations(translations) {
  if (!translations || typeof translations !== 'object' || Array.isArray(translations) || Object.keys(translations).length>20000) throw Error('Invalid catalog translations');
  for (const [source,values] of Object.entries(translations)) {
    if (['__proto__','constructor','prototype'].includes(source) || source.length>5000 || !Array.isArray(values) || values.length!==3 || values.some(value=>typeof value!=='string'||value.length>5000)) throw Error('Invalid catalog translations');
  }
  for (const [source,values] of Object.entries(translations)) Object.defineProperty(MESSAGES,source,{value:values,enumerable:true,writable:true,configurable:true});
}

const index = () => ({ en: 0, ja: 1, ko: 2 })[language];
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = Object.entries(MESSAGES).filter(([source]) => /\{\w+\}/.test(source)).map(([source, values]) => {
  const names = [...source.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
  return { literalLength: source.replace(/\{\w+\}/g, '').length, names, regex: new RegExp(`^${source.split(/\{\w+\}/).map(escape).join('([\\s\\S]*?)')}$`), values };
}).sort((a, b) => b.literalLength - a.literalLength);
export function translateText(source) {
  if (typeof source !== 'string' || language === 'zh-CN') return source;
  const trimmed = source.trim();
  const exact = Object.hasOwn(MESSAGES, trimmed) ? MESSAGES[trimmed] : null;
  if (exact) return source.replace(trimmed, () => exact[index()]);
  for (const pattern of patterns) {
    const match = trimmed.match(pattern.regex);
    if (!match) continue;
    const values = Object.fromEntries(pattern.names.map((name, i) => [name, ['meal', 'activity', 'status', 'intensity', 'extra', 'reference', 'detail', 'suffix', 'prefix', 'snack', 'provider'].includes(name) ? translateText(match[i + 1]) : match[i + 1]]));
    return source.replace(trimmed, () => pattern.values[index()].replace(/\{(\w+)\}/g, (_, name) => values[name] ?? ''));
  }
  return source;
}
export function setLanguage(next) {
  if (!LANGUAGES.includes(next)) throw new Error('Unsupported language');
  language = next;
}
export function formatDateLabel(dateString, today) {
  const date = new Date(`${dateString}T12:00:00`);
  const formatted = date.toLocaleDateString(language, { month: 'short', day: 'numeric', weekday: 'short' });
  return `${formatted}${today ? ` · ${translateText('今天')}` : ''}`;
}
export function setupLanguage({ refresh, toast }) {
  const sources = new WeakMap();
  let updating = false;
  function excluded(node) {
    const parent = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return parent?.closest('script,style,textarea,[translate="no"],#language-select option');
  }
  function transform(node, attr) {
    if (excluded(node)) return;
    const current = attr ? node.getAttribute(attr) : node.nodeValue;
    if (!current?.trim()) return;
    let entries = sources.get(node); if (!entries) { entries = new Map(); sources.set(node, entries); }
    const old = entries.get(attr ?? 'text');
    const source = old && old.output === current ? old.source : current;
    const output = translateText(source);
    entries.set(attr ?? 'text', { source, output });
    if (output !== current) { if (attr) node.setAttribute(attr, output); else node.nodeValue = output; }
  }
  function apply() {
    if (updating) return;
    updating = true;
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) transform(walker.currentNode);
    for (const node of document.querySelectorAll('[placeholder],[aria-label],[title]')) for (const attr of ['placeholder','aria-label','title']) if (node.hasAttribute(attr)) transform(node, attr);
    document.documentElement.lang = language;
    document.querySelector('#language-select').value = language;
    updating = false;
  }
  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder','aria-label','title'] });
  document.querySelector('#language-select').addEventListener('change', event => {
    setLanguage(event.target.value);
    try { localStore.setItem(key, language); } catch { toast(translateText('语言已切换，但浏览器无法保存偏好。')); }
    refresh(); apply();
    document.dispatchEvent(new CustomEvent('languagechange'));
  });
  apply();
  return { apply };
}
