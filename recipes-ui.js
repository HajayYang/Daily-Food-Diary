import { createRecipeClient } from './recipe-client.js';
import { scaleRecipeIngredients } from './recipe-query.js';
import { ALLERGENS } from './lifestyle.js';
import { getLanguage, registerTranslations } from './i18n.js';

export function setupCookbook({ $, element, tools }) {
  let category = 'all', cuisine = 'home', page = 1, selected, metadata, visible = [], requestId = 0, activeRecipe;
  const client = createRecipeClient();
  const search = $('#recipe-search'), results = $('#recipe-results'), detail = $('#recipe-detail');
  function showRecipe(recipe) {
    activeRecipe=recipe;
    detail.hidden = !recipe;
    detail.replaceChildren();
    if (!recipe) return;
    const ingredients = scaleRecipeIngredients(recipe, Number($('#recipe-servings').value));
    const heading = element('div', 'recipe-detail-heading');
    const titleBlock = element('div');
    const title = element('h3', '', recipe.name); title.id = 'recipe-current-title';
    titleBlock.append(title, element('p', 'recipe-origin', metadata.cuisines.find(item => item.id === recipe.cuisine).name));
    heading.append(titleBlock, element('span', 'section-tag', `约 ${recipe.minutes} 分钟`));
    const columns = element('div', 'recipe-columns');
    const ingredientBlock = element('div');
    ingredientBlock.append(element('h4', '', '需要的食材'));
    const list = element('ul', 'recipe-ingredients');
    for (const ingredient of ingredients) {
      const item = element('li'), quantity = element('span', 'recipe-quantity');
      quantity.append(element('span', '', String(ingredient.amount)), document.createTextNode(' '), element('span', '', ingredient.unit));
      item.append(element('span', '', ingredient.name), quantity); list.append(item);
    }
    ingredientBlock.append(list);
    const method = element('div'); method.append(element('h4', '', '做法步骤'));
    const steps = element('ol', 'recipe-steps');
    steps.append(...recipe.steps.map(step => element('li', '', step))); method.append(steps);
    columns.append(ingredientBlock, method);
    const tip = element('aside', 'recipe-tip');
    tip.append(element('h4', '', '配餐小建议'), element('p', '', recipe.tip));
    const allergens = [...new Set(ingredients.flatMap(ingredient => ingredient.allergens))];
    const allergy = element('p', 'recipe-allergens');
    if (allergens.length) {
      allergy.append(element('strong', '', '以下配方涉及的过敏原'), document.createTextNode('：'));
      allergens.forEach((key, index) => { if (index) allergy.append(document.createTextNode(' / ')); allergy.append(element('span', '', ALLERGENS[key])); });
    } else allergy.textContent = '按所列配方未标出常见过敏原；仍需核对实际食材与交叉接触。';
    detail.append(heading);
    if (recipe.cuisine !== 'home') detail.append(element('p', 'recipe-version', '家庭简化版 · 用料与做法可因地区而异'));
    detail.append(columns, tip, allergy);
    if(tools)detail.append(tools.render(recipe,ingredients,Number($('#recipe-servings').value)));
  }
  function summary() {
    if (!metadata) return;
    const origin = metadata.cuisines.find(item => item.id === cuisine);
    $('#recipe-cuisine-title').textContent = origin?.name ?? `${metadata.total} 道菜，${metadata.cuisines.length} 种餐桌风味`;
    $('#recipe-cuisine-region').textContent = origin?.region ?? '每类 12 道，按地域风味与家常做法整理；同名菜在不同地区可能有不同版本。';
    $('#recipe-cuisine-description').textContent = origin?.description ?? '保留家常菜，并收录鲁、川、粤、苏、闽、浙、湘、徽八大菜系，每类 12 道。';
    document.querySelectorAll('[data-recipe-cuisine]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.recipeCuisine === cuisine)));
    document.querySelectorAll('[data-recipe-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.recipeCategory === category)));
  }
  function busy(value) {
    results.setAttribute('aria-busy', String(value));
    results.querySelectorAll('button').forEach(button => { button.disabled = value; });
    if (value) {
      $('#recipe-previous').disabled = true; $('#recipe-next').disabled = true;
      detail.hidden = true;
    }
  }
  function failed(error) {
    metadata = undefined; visible = []; selected = undefined;
    client.close(); busy(false); results.replaceChildren(); showRecipe();
    $('#recipe-pages').hidden = true;
    $('#recipe-database-status').textContent = '菜谱暂时无法载入，请重试；其他饮食记录功能仍可使用。';
    $('#recipe-database-status').dataset.state = 'error';
    $('#recipe-database-status').dataset.source = '';
    $('#recipe-database-retry').hidden = false;
    const code=error?.code??error?.message;
    const messages={catalog_unavailable:'菜谱数据库下载失败，请检查网络后重试；也可直接查看免加载菜谱目录。',catalog_checksum_mismatch:'菜谱文件校验失败，请重新载入；也可直接查看免加载菜谱目录。',invalid_catalog_manifest:'菜谱版本信息无效，请重新载入。',invalid_catalog:'菜谱内容与版本不一致，请重新载入。',recipe_engine_unavailable:'浏览器无法运行菜谱查询组件，可直接查看免加载菜谱目录。'};
    $('#recipe-status').textContent = messages[code]??'菜谱查询组件无法启动，请更新浏览器或直接查看免加载菜谱目录。';
    $('#recipe-database-status').dataset.error=code??'recipe_database_unavailable';
  }
  async function render() {
    summary();
    if (!metadata) return;
    const id = ++requestId;
    busy(true);
    $('#recipe-status').textContent = '正在查找菜谱…';
    try {
      const result = await client.search({query:search.value,cuisine,category,language:getLanguage(),page});
      if (id !== requestId) return;
      page = result.page; visible = result.recipes;
      if (!visible.some(recipe => recipe.id === selected)) selected = visible[0]?.id;
      $('#recipe-status').textContent = result.total ? `找到 ${result.total} 道菜，点击查看做法` : '暂未收录这道菜，试试其他菜名或食材，也可以切换分类。';
      $('#recipe-pages').hidden = result.pages <= 1;
      $('#recipe-previous').disabled = page === 1;
      $('#recipe-next').disabled = page === result.pages;
      $('#recipe-page-status').textContent = `第 ${page} / ${result.pages} 页`;
      results.replaceChildren(...visible.map(recipe => {
        const button = element('button', 'recipe-choice'); button.type = 'button';
        button.dataset.recipe = recipe.id; button.setAttribute('aria-pressed', String(selected === recipe.id));
        button.setAttribute('aria-controls', 'recipe-detail');
        const icon = element('span', 'recipe-emoji', recipe.emoji); icon.setAttribute('aria-hidden', 'true');
        const text = element('span', 'recipe-choice-text');
        text.append(element('strong', '', recipe.name), element('small', '', `约 ${recipe.minutes} 分钟`));
        button.append(icon, text);
        button.addEventListener('click', () => {
          selected = recipe.id;
          results.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
          showRecipe(recipe);
        });
        return button;
      }));
      busy(false); showRecipe(visible.find(recipe => recipe.id === selected));
    } catch(error) { if (id === requestId) failed(error); }
  }
  async function initialize() {
    const id = ++requestId;
    metadata = undefined;
    busy(true);
    $('#recipe-database-retry').hidden = true;
    $('#recipe-database-status').textContent = '正在载入菜谱…';
    $('#recipe-database-status').dataset.state = 'loading';
    try {
      const next = await client.initialize();
      if (id !== requestId) return;
      registerTranslations(next.translations); metadata = next;
      $('#recipe-database-status').textContent = next.engine==='javascript'?'已启用兼容模式，仍从 SQLite 数据库查询菜谱。':next.source === 'sqlite-cache' ? '正在使用已缓存的菜谱，可离线查询。' : `已载入 ${next.total} 道菜，可离线查询。`;
      $('#recipe-database-status').dataset.state = 'ready';
      $('#recipe-database-status').dataset.source = next.source;
      $('#recipe-database-status').dataset.engine=next.engine??'wasm';
      delete $('#recipe-database-status').dataset.error;
      $('#recipe-catalog-count').textContent = `家常菜与八大菜系 · 共 ${next.total} 道`;
      const cuisines = [...next.cuisines, {id:'all',name:'全部菜系',count:next.total}];
      $('#recipe-cuisines').replaceChildren(...cuisines.map(origin => {
        const button = element('button', 'recipe-cuisine'); button.type = 'button';
        button.dataset.recipeCuisine = origin.id; button.setAttribute('aria-controls', 'recipe-results recipe-detail');
        button.append(element('strong', '', origin.name), element('small', '', `${origin.count} 道`));
        button.addEventListener('click', () => { cuisine = origin.id; page = 1; render(); });
        return button;
      }));
      await render();
    } catch(error) { if (id === requestId) failed(error); }
  }
  function fallbackLink(){const language=getLanguage();$('#cookbook-static-link').href=`./cookbook${language==='zh-CN'?'':'.'+language}.html`;}
  fallbackLink();document.addEventListener('languagechange',fallbackLink);
  search.addEventListener('input', () => { page = 1; render(); });
  $('#recipe-servings').addEventListener('change', () => showRecipe(activeRecipe));
  for (const button of document.querySelectorAll('[data-recipe-category]')) {
    button.addEventListener('click', () => { category = button.dataset.recipeCategory; page = 1; render(); });
  }
  $('#recipe-previous').addEventListener('click', () => { page--; render(); });
  $('#recipe-next').addEventListener('click', () => { page++; render(); });
  $('#recipe-reset').addEventListener('click', () => {
    search.value = ''; category = 'all'; cuisine = 'home'; page = 1;
    render(); search.focus();
  });
  $('#recipe-database-retry').addEventListener('click', initialize);
  document.addEventListener('languagechange', render);
  initialize();
  let catalogPromise;
  return {
    async allRecipes() {
      if(!metadata)throw Error('recipe_database_unavailable');
      if(!catalogPromise)catalogPromise=(async()=>{const first=await client.search({cuisine:'all'}),pages=await Promise.all(Array.from({length:first.pages-1},(_,index)=>client.search({cuisine:'all',page:index+2})));return [...first.recipes,...pages.flatMap(p=>p.recipes)];})().catch(error=>{catalogPromise=null;throw error;});
      return catalogPromise;
    },
    async openRecipe(recipe) {if(!metadata)return;cuisine=recipe.cuisine;category='all';page=1;selected=recipe.id;search.value=recipe.name;await render();$('#recipe-detail').scrollIntoView({block:'start',behavior:'smooth'});}
  };
}
