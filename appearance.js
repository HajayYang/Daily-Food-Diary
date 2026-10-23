export const DEFAULT_APPEARANCE = Object.freeze({ theme: 'green', buttonStyle: 'normal', opacity: 25 });
export function validAppearance(value) {
  return Boolean(value && ['white', 'black', 'green', 'blue'].includes(value.theme) && ['normal', 'glass'].includes(value.buttonStyle) && Number.isInteger(value.opacity) && value.opacity >= 0 && value.opacity <= 100);
}
export function imageDimensions(width, height, maximum = 2400) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || width * height > 80000000) throw new Error('图片尺寸无效或过大，请选择小于 8000 万像素的图片。');
  const ratio = Math.min(1, maximum / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}
export async function prepareBackground(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 图片。');
  if (file.size > 12 * 1024 * 1024) throw new Error('图片超过 12 MB，请缩小后重试。');
  const image = await createImageBitmap(file).catch(() => { throw new Error('图片无法读取，请尝试其他图片。'); });
  try {
    const size = imageDimensions(image.width, image.height);
    const canvas = document.createElement('canvas'); canvas.width = size.width; canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('浏览器不支持图片处理，请升级浏览器后重试。');
    context.drawImage(image, 0, 0, size.width, size.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .85));
    if (!blob) throw new Error('图片处理失败，请尝试其他图片。');
    return blob;
  } finally { image.close(); }
}
function backgroundStore(operation, value) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('daily-bites.appearance', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images');
    request.onerror = () => reject(new Error('无法打开图片存储'));
    request.onblocked = () => reject(new Error('图片存储被其他页面占用'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      let result;
      try {
        const transaction = db.transaction('images', operation === 'get' ? 'readonly' : 'readwrite');
        const store = transaction.objectStore('images');
        const action = operation === 'get' ? store.get('background') : operation === 'put' ? store.put(value, 'background') : store.delete('background');
        action.onsuccess = () => { result = action.result; };
        transaction.oncomplete = () => { db.close(); resolve(result); };
        transaction.onabort = transaction.onerror = () => { db.close(); reject(new Error('图片保存失败')); };
      } catch (error) { db.close(); reject(error); }
    };
  });
}
export function setupAppearance({ $, toast }) {
  const key = 'daily-bites.appearance.v1';
  let settings = { ...DEFAULT_APPEARANCE };
  let backgroundUrl;
  let busy = true;
  let settingsReadable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (saved !== null) { if (!validAppearance(saved)) throw new Error('Invalid settings'); settings = saved; }
  } catch { settingsReadable = false; }
  function apply() {
    $('#appearance-status').textContent = settingsReadable ? '即时预览并自动保存，仅对当前浏览器生效。' : '外观设置读取失败，已临时使用默认样式。可恢复默认外观，不影响其他数据。';
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.buttonStyle = settings.buttonStyle;
    document.documentElement.style.setProperty('--background-opacity', String(1 - settings.opacity / 100));
    document.querySelector('meta[name="theme-color"]').content = { white: '#f5f6f8', black: '#14181f', green: '#f6f7f2', blue: '#eff5fc' }[settings.theme];
    for (const input of document.querySelectorAll('#appearance-dialog input[type=radio]')) input.checked = settings[input.name] === input.value;
    $('#background-opacity').value = settings.opacity;
    $('#opacity-value').value = `${settings.opacity}%`;
    $('#background-opacity').disabled = !backgroundUrl;
    $('#remove-background').disabled = busy || !backgroundUrl;
    $('#background-upload').disabled = busy;
    $('#background-preview').style.backgroundImage = backgroundUrl ? `url("${backgroundUrl}")` : '';
    $('#background-preview').classList.toggle('has-image', Boolean(backgroundUrl));
  }
  function change(next) {
    if (!settingsReadable) { toast('外观设置读取失败，请先点击“恢复默认外观”，不会影响饮食或训练记录。'); apply(); return; }
    try { localStorage.setItem(key, JSON.stringify(next)); settings = next; apply(); }
    catch { toast('外观设置保存失败，请检查浏览器存储空间。'); apply(); }
  }
  function showImage(blob) {
    if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
    backgroundUrl = blob ? URL.createObjectURL(blob) : undefined;
    $('#page-background').style.backgroundImage = backgroundUrl ? `url("${backgroundUrl}")` : '';
    $('#background-status').textContent = backgroundUrl ? '已使用自定义背景，仅保存在此浏览器。' : '未设置图片，使用主题背景。';
    apply();
  }
  $('#appearance-button').addEventListener('click', () => $('#appearance-dialog').showModal());
  $('#close-appearance').addEventListener('click', () => $('#appearance-dialog').close());
  for (const input of document.querySelectorAll('#appearance-dialog input[type=radio]')) input.addEventListener('change', () => change({ ...settings, [input.name]: input.value }));
  $('#background-opacity').addEventListener('input', event => change({ ...settings, opacity: Number(event.target.value) }));
  $('#background-upload').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file || busy) return;
    busy = true; apply(); $('#background-status').textContent = '正在处理并保存图片…';
    try {
      const blob = await prepareBackground(file);
      await backgroundStore('put', blob);
      showImage(blob); toast('背景图片已保存');
    } catch (error) { $('#background-status').textContent = `${error.message} 原背景保持不变。`; toast(error.message); }
    finally { busy = false; event.target.value = ''; apply(); }
  });
  $('#remove-background').addEventListener('click', async () => {
    busy = true; apply();
    try { await backgroundStore('delete'); showImage(); toast('已移除背景图片'); }
    catch { toast('移除失败，请检查浏览器图片存储权限。'); }
    finally { busy = false; apply(); }
  });
  $('#reset-appearance').addEventListener('click', () => {
    try { localStorage.setItem(key, JSON.stringify(DEFAULT_APPEARANCE)); settingsReadable = true; settings = { ...DEFAULT_APPEARANCE }; apply(); toast('已恢复默认配色与按钮，背景图片保留，可单独移除'); }
    catch { toast('恢复失败，请检查浏览器存储权限。'); }
  });
  apply();
  $('#appearance-status').textContent = settingsReadable ? '即时预览并自动保存，仅对当前浏览器生效。' : '外观设置读取失败，已临时使用默认样式。可恢复默认外观，不影响其他数据。';
  backgroundStore('get').then(blob => {
    if (blob instanceof Blob && ['image/webp', 'image/png', 'image/jpeg'].includes(blob.type)) showImage(blob);
    else if (blob !== undefined) $('#background-status').textContent = '已保存的背景数据无效，请重新上传图片。';
  }).catch(() => { $('#background-status').textContent = '本地图片存储不可用。可切换配色与按钮，上传图片需允许浏览器本地存储。'; })
    .finally(() => { busy = false; apply(); });
  return { getSettings: () => ({ ...settings }) };
}
