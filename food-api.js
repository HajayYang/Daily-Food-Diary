// Public API docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
export const FOOD_API_ORIGIN = 'https://world.openfoodfacts.org';
export const PAGE_SIZE = 8;
const aliases = { 苹果: 'apple', 橙子: 'orange', 猕猴桃: 'kiwi', 香蕉: 'banana', 西兰花: 'broccoli', 燕麦: 'oats', 鸡蛋: 'egg', 酸奶: 'yogurt', 牛奶: 'milk', 面包: 'bread', 米饭: 'rice', 豆腐: 'tofu' };
function cleanText(value, limit = 600) { return typeof value === 'string' ? value.trim().slice(0, limit) : ''; }
export function nutrient(value) {
  if (typeof value === 'string' && !value.trim()) return null;
  if (value === '' || value === null || value === undefined || typeof value === 'boolean' || !['number', 'string'].includes(typeof value)) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Number(number.toPrecision(6)) : null;
}
export function normalizeProduct(product) {
  if (!product || typeof product !== 'object') return null;
  const code = String(product.code ?? '');
  const name = cleanText(product.product_name_zh) || cleanText(product.product_name) || cleanText(product.generic_name);
  if (!name || !/^\d{8,14}$/.test(code)) return null;
  const nutrients = product.nutriments && typeof product.nutriments === 'object' ? product.nutriments : {};
  const kj = nutrient(nutrients['energy-kj_100g']) ?? nutrient(nutrients.energy_100g);
  return { code, name, brand: cleanText(product.brands, 160), ingredients: cleanText(product.ingredients_text_zh, 1800) || cleanText(product.ingredients_text, 1800), allergens: cleanText(product.allergens, 300), serving: cleanText(product.serving_size, 200),
    kcal: nutrient(nutrients['energy-kcal_100g']) ?? (kj === null ? null : Math.round(kj / 4.184)),
    protein: nutrient(nutrients.proteins_100g), carbs: nutrient(nutrients.carbohydrates_100g), fat: nutrient(nutrients.fat_100g), fiber: nutrient(nutrients.fiber_100g), sugars: nutrient(nutrients.sugars_100g), salt: nutrient(nutrients.salt_100g),
    url: `${FOOD_API_ORIGIN}/product/${code}` };
}
export function searchURL(query, page = 1) {
  const text = query.trim().slice(0, 60);
  if (!text || !Number.isInteger(page) || page < 1 || page > 100) throw new Error('请输入食品名称，页码应为 1–100。');
  const url = new URL('/cgi/search.pl', FOOD_API_ORIGIN);
  const fields = 'code,product_name,product_name_zh,generic_name,brands,ingredients_text,ingredients_text_zh,allergens,serving_size,nutriments';
  url.search = new URLSearchParams({ search_terms: aliases[text] ?? text, search_simple: '1', action: 'process', json: '1', page: String(page), page_size: String(PAGE_SIZE), fields, sort_by: 'unique_scans_n', user_agent: 'DailyFoodDiary/1.0 (https://github.com/HajayYang/Daily-Food-Diary)' });
  return url.href;
}
export function normalizeSearch(data, page) {
  if (!data || !Array.isArray(data.products)) throw new Error('食品库返回了无法识别的数据，请稍后重试。');
  const seen = new Set();
  const products = data.products.map(normalizeProduct).filter(product => product && !seen.has(product.code) && seen.add(product.code));
  const count = nutrient(data.count);
  return { products, count: count === null ? null : Math.floor(count), page, hasNext: page < 100 && (count === null ? data.products.length >= PAGE_SIZE : page * PAGE_SIZE < count) };
}
export function createFoodClient({ fetcher = globalThis.fetch, now = Date.now } = {}) {
  const cache = new Map();
  let lastRequest = -Infinity;
  return { async search(query, page = 1, signal) {
    const url = searchURL(query, page);
    const cached = cache.get(url);
    if (cached && now() - cached.time < 10 * 60 * 1000) return cached.data;
    if (now() - lastRequest < 6500) throw new Error('查询较频繁，请间隔约 7 秒再试，避免触发食品库限流。');
    lastRequest = now();
    const response = await fetcher(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(response.status === 429 ? '食品库请求次数过多，请稍后再试。' : `食品库暂不可用（HTTP ${response.status}），请稍后重试。`);
    let payload;
    try { payload = await response.json(); } catch { throw new Error('食品库响应不是有效的 JSON 数据，请稍后重试。'); }
    const result = normalizeSearch(payload, page);
    if (cache.size >= 20) cache.delete(cache.keys().next().value);
    cache.set(url, { time: now(), data: result });
    return result;
  } };
}
