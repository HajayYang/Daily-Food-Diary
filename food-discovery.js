import { translateText } from './i18n.js';
import { setupOnlineFood } from './food-online.js';
export const FOOD_GUIDE = [
  { name: '苹果', emoji: '🍎', category: 'fruit', tag: '清脆 · 带皮更添纤维', kcal: 52, state: '生，带皮，去核', feature: '提供膳食纤维，带皮吃前充分洗净。苹果含少量维生素 C，但不是高维 C 水果；想补充维 C，也可搭配橙子或猕猴桃。', portion: '一次约 1 个小苹果（可食部分约 150 克），计入全天水果总量。', pairing: '和无糖酸奶一起做加餐，完整水果比果汁更有饱腹感。', tint: 'rose' },
  { name: '橙子', emoji: '🍊', category: 'fruit', tag: '维生素 C 的好来源', kcal: 47, state: '生，去皮', feature: '富含维生素 C，参与正常免疫功能与胶原形成，并帮助植物性食物中的铁吸收。橙瓣中的纤维也值得保留。', portion: '一次约 1 个中等橙子（可食部分约 130 克），不必榨成果汁。', pairing: '可在豆类或绿叶菜餐后搭配，丰富食物种类。', tint: 'orange' },
  { name: '猕猴桃', emoji: '🥝', category: 'fruit', tag: '维生素 C · 膳食纤维', kcal: 61, state: '生，绿肉，去皮', feature: '富含维生素 C，同时提供膳食纤维。不同品种的糖分、酸度和营养含量会有差异。', portion: '一次约 1–2 个（可食部分约 80–150 克），结合当天其他水果调整。', pairing: '切块配原味酸奶；对猕猴桃过敏时改选其他水果。', tint: 'lime' },
  { name: '香蕉', emoji: '🍌', category: 'fruit', tag: '便携碳水 · 钾', kcal: 89, state: '生，去皮', feature: '提供碳水化合物和钾，方便携带，可作为训练前后的一种食物选择；不意味着每次训练都需要额外吃。', portion: '一次约 1 根小香蕉（可食部分约 90–100 克），计入全天水果。', pairing: '训练前饿了可选香蕉；训练后搭配牛奶或豆浆和正常正餐。', tint: 'gold' },
  { name: '西兰花', emoji: '🥦', category: 'vegetable', tag: '蔬菜纤维 · 维生素 C', kcal: 35, state: '煮熟，不加油', feature: '提供维生素 C、叶酸和膳食纤维。蒸煮时间不宜过长，和不同颜色的蔬菜一起搭配。', portion: '一餐约 100–150 克，作为多种蔬菜中的一种，不代替全部蔬菜。', pairing: '搭配米饭、鱼或豆腐；用适量油烹调，酱汁的热量另计。', tint: 'lime' },
  { name: '原味燕麦', emoji: '🌾', category: 'grain', tag: '全谷物 · β-葡聚糖', kcal: 379, state: '干燕麦，不加糖', feature: '提供碳水化合物与可溶性膳食纤维。干重与煮熟后的重量不同，计算热量时要注意单位。', portion: '一次干重约 30–50 克，加水或奶煮熟；按食量调整。', pairing: '搭配牛奶或无糖豆浆，加一点水果，早餐更完整。', tint: 'gold' },
  { name: '水煮鸡蛋', emoji: '🥚', category: 'protein', tag: '优质蛋白 · 胆碱', kcal: 155, state: '全蛋煮熟，去壳', feature: '提供优质蛋白质和胆碱。蛋黄也含多种营养，健康饮食中可与鱼、肉、豆类轮换。', portion: '一般成人每天约 1 个（可食部分约 50 克）可作为搭配参考，特殊需求按专业建议。', pairing: '配全谷物主食和蔬菜；鸡蛋不是训练后唯一的蛋白质来源。', tint: 'sand' },
  { name: '原味无糖酸奶', emoji: '🥛', category: 'protein', tag: '蛋白质 · 钙', kcal: 61, state: '普通全脂原味酸奶，通用参考', feature: '提供蛋白质和钙。产品差异较大，优先看配料表与营养标签，“风味”或“乳饮料”不等于无糖酸奶。', portion: '一次约 150–200 克，计入全天乳品摄入；乳糖耐受和过敏情况需考虑。', pairing: '加苹果丁或燕麦；高蛋白、脱脂等产品的热量请按包装填写。', tint: 'sky' },
];
export function setupFoodDiscovery({ $, element }) {
  let category = 'all';
  const online = setupOnlineFood({ $, element, renderLocal: () => render() });
  const names = { fruit: '水果', vegetable: '蔬菜', grain: '全谷物', protein: '蛋白与乳品' };
  function render() {
    if (online.isOnline()) return;
    const query = $('#food-search').value.trim().toLocaleLowerCase();
    const foods = FOOD_GUIDE.filter(food => (category === 'all' || category === food.category) && `${food.name} ${food.tag} ${food.feature} ${translateText(food.name)} ${translateText(food.tag)} ${translateText(food.feature)}`.toLocaleLowerCase().includes(query));
    $('#food-results').textContent = foods.length ? `共 ${foods.length} 种食物 · 能量单位 kcal / 100 克可食部分` : '没有找到匹配食物，试试“苹果”“维生素”或切换类别。';
    $('#food-discovery-grid').replaceChildren(...foods.map(food => {
      const card = element('article', `food-guide-card food-tint-${food.tint}`);
      const cover = element('div', 'food-cover');
      const emoji = element('span', 'food-emoji', food.emoji); emoji.setAttribute('aria-hidden', 'true');
      cover.append(emoji, element('span', 'food-category', names[food.category]), element('span', 'food-energy', `${food.kcal} kcal / 100g`));
      const content = element('div', 'food-guide-content');
      content.append(element('h3', '', food.name), element('p', 'food-tag', food.tag), element('small', 'food-state', food.state), element('p', 'food-feature', food.feature));
      const portion = element('div', 'food-portion'); portion.append(element('strong', '', '怎么吃 · 吃多少'), element('p', '', food.portion));
      const detail = element('details', 'food-pairing'); detail.append(element('summary', '', '搭配小灵感'), element('p', '', food.pairing));
      content.append(portion, detail); card.append(cover, content); return card;
    }));
  }
  for (const button of document.querySelectorAll('[data-food-category]')) button.addEventListener('click', () => {
    category = button.dataset.foodCategory;
    for (const other of document.querySelectorAll('[data-food-category]')) other.setAttribute('aria-pressed', String(other === button));
    render();
  });
  $('#food-search').addEventListener('input', render);
  document.addEventListener('languagechange', () => { if (!online.isOnline()) render(); });
  render();
}
