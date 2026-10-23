import { createFoodClient } from './food-api.js';
export function setupOnlineFood({ $, element, renderLocal }) {
  const client = createFoodClient();
  let mode = 'local', requestId = 0, controller, query = '', page = 1, result;
  function cancel() { requestId++; controller?.abort(); controller = undefined; }
  function controls(busy = false) {
    $('#food-online-submit').disabled = busy;
    $('#food-online-retry').disabled = busy;
    $('#food-online-previous').disabled = busy || !result || page <= 1;
    $('#food-online-next').disabled = busy || !result?.hasNext;
    $('#food-discovery-grid').setAttribute('aria-busy', String(busy));
  }
  function display(products) {
    $('#food-discovery-grid').replaceChildren(...products.map(product => {
      const card = element('article', 'food-guide-card online-food-card');
      const top = element('div', 'online-food-heading');
      top.append(element('span', 'online-food-symbol', '▤'), element('span', 'online-food-source', 'OPEN FOOD FACTS'));
      const content = element('div', 'food-guide-content');
      content.append(element('h3', '', product.name), element('p', 'food-tag', product.brand || '品牌未填写'), element('p', 'food-state', '营养基准：每 100 克 / 100 毫升，以商品原标签为准'));
      const dl = element('dl', 'online-nutrients');
      for (const [key, label, unit] of [['kcal','热量','kcal'],['protein','蛋白质','g'],['carbs','碳水','g'],['fat','脂肪','g'],['fiber','膳食纤维','g'],['sugars','糖','g'],['salt','盐','g']]) {
        const row = element('div'); row.append(element('dt', '', label), element('dd', '', product[key] === null ? '未提供' : `${product[key]} ${unit}`)); dl.append(row);
      }
      content.append(dl);
      const details = element('details', 'food-pairing'); details.append(element('summary', '', '配料、过敏原与标签份量'));
      for (const [label, value] of [['配料',product.ingredients],['过敏原',product.allergens],['标签份量（非摄入建议）',product.serving]]) details.append(element('p', '', `${label}：${value || '未提供，请查看原包装'}`));
      const link = element('a', 'online-source-link', '查看原始商品与数据 →'); link.href = product.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      content.append(details, link); card.append(top, content); return card;
    }));
  }
  async function search(targetPage = 1, retry = false) {
    const text = retry ? query : $('#food-search').value.trim();
    if (!text) { $('#food-results').textContent = '请输入食品名称后点击“在线查询”，例如牛奶、燕麦，或尝试英文名称。'; return; }
    cancel();
    const id = requestId;
    const requestController = new AbortController();
    controller = requestController;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; requestController.abort(); }, 15000);
    query = text; page = targetPage; result = undefined;
    $('#food-online-pages').hidden = true; $('#food-online-retry').hidden = true;
    $('#food-results').textContent = `正在查询“${text}” · 第 ${targetPage} 页…`;
    $('#food-discovery-grid').replaceChildren(); controls(true);
    try {
      const data = await client.search(text, targetPage, requestController.signal);
      if (id !== requestId || mode !== 'online') return;
      result = data; page = data.page; display(data.products);
      $('#food-results').textContent = data.products.length ? `“${text}” · 第 ${page} 页 · 当前 ${data.products.length} 项${data.count !== null ? `，食品库匹配约 ${data.count} 项` : ''} · 社区数据，缺失项标为未提供` : '当前页没有可展示的食品。可尝试其他名称或英文关键词；常见食材的科普可切回“精选食材”。';
      $('#food-online-pages').hidden = !data.products.length && page === 1;
      $('#food-online-page').textContent = `第 ${page} 页`;
    } catch (error) {
      if (id !== requestId || mode !== 'online') return;
      $('#food-results').textContent = timedOut ? '在线查询超时，请稍后重试；精选食材仍可离线浏览。' : error.name === 'TypeError' ? '无法连接在线食品库，请检查网络或稍后重试；精选食材仍可离线浏览。' : error.message;
      $('#food-online-retry').hidden = false;
    } finally {
      clearTimeout(timer);
      if (id === requestId) { controller = undefined; controls(); }
    }
  }
  function switchMode(next) {
    cancel(); mode = next; result = undefined; page = 1;
    for (const button of document.querySelectorAll('[data-food-mode]')) button.setAttribute('aria-pressed', String(button.dataset.foodMode === mode));
    $('.food-filters').hidden = mode === 'online';
    $('#food-online-notice').hidden = mode !== 'online';
    $('#food-online-submit').hidden = mode !== 'online';
    $('#food-online-pages').hidden = true; $('#food-online-retry').hidden = true;
    $('#food-search').placeholder = mode === 'online' ? '食品名称，如牛奶 / milk' : '搜索食物或营养特点';
    controls();
    if (mode === 'local') renderLocal();
    else { $('#food-results').textContent = '输入名称并点击在线查询。支持中文；国际食品也可尝试英文名称。'; $('#food-discovery-grid').replaceChildren(); }
  }
  for (const button of document.querySelectorAll('[data-food-mode]')) button.addEventListener('click', () => switchMode(button.dataset.foodMode));
  $('#food-online-submit').addEventListener('click', () => search());
  $('#food-search').addEventListener('keydown', event => { if (event.key === 'Enter' && mode === 'online' && !$('#food-online-submit').disabled) { event.preventDefault(); search(); } });
  $('#food-online-retry').addEventListener('click', () => search(page, true));
  $('#food-online-previous').addEventListener('click', () => search(page - 1, true));
  $('#food-online-next').addEventListener('click', () => search(page + 1, true));
  return { isOnline: () => mode === 'online' };
}
