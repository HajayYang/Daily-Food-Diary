export const MAX_PHOTO_BYTES = 1500000;
export const MAX_PHOTO_BODY = 2100000;
export const PHOTO_LANGUAGES = ['zh-CN', 'en', 'ja', 'ko'];
export const PHOTO_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    is_food: { type: 'boolean' },
    items: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      properties: {
        name: { type: 'string' }, grams: { type: ['number', 'null'] },
        calories: { type: ['integer', 'null'] }, protein: { type: ['number', 'null'] },
        carbs: { type: ['number', 'null'] }, fat: { type: ['number', 'null'] },
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] }, note: { type: 'string' },
      }, required: ['name', 'grams', 'calories', 'protein', 'carbs', 'fat', 'confidence', 'note'],
    } },
    warning: { type: 'string' },
  }, required: ['is_food', 'items', 'warning'],
};
const numberOrNull = (value, max, integer = false) => value === null || typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max && (!integer || Number.isInteger(value));
export function validateRecognition(data) {
  if (!data || typeof data.is_food !== 'boolean' || !Array.isArray(data.items) || data.items.length > 10 || typeof data.warning !== 'string' || data.warning.length > 1200) throw new Error('invalid_recognition');
  if (data.is_food !== Boolean(data.items.length)) throw new Error('invalid_recognition');
  const items = data.items.map(item => {
    if (!item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 120 || typeof item.note !== 'string' || item.note.length > 400 || !['low','medium','high'].includes(item.confidence) || !numberOrNull(item.grams, 5000) || item.grams === 0 || !numberOrNull(item.calories, 20000, true) || !['protein','carbs','fat'].every(key => numberOrNull(item[key], 2000))) throw new Error('invalid_recognition');
    return { name: item.name.trim(), grams: item.grams, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, confidence: item.confidence, note: item.note.trim() };
  });
  return { is_food: data.is_food, items, warning: data.warning.trim() };
}
export function validPhotoDataUrl(value) {
  if (typeof value !== 'string' || value.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 + 30) return false;
  const match = value.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[1].length % 4 !== 0) return false;
  const bytes = match[1].length * 3 / 4 - (match[1].endsWith('==') ? 2 : match[1].endsWith('=') ? 1 : 0);
  return bytes >= 100 && bytes <= MAX_PHOTO_BYTES && match[1].startsWith('/9j/');
}
export function normalizePhotoService(value) {
  let url;
  try { url = new URL(value.trim()); } catch { throw new Error('photo_service_invalid'); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!(url.protocol === 'https:' || url.protocol === 'http:' && loopback) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw new Error('photo_service_invalid');
  return url.origin;
}
