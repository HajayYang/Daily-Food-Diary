import { RECIPES, CUISINES, searchRecipes, recipeIngredients } from './recipes.js';
import { ALLERGENS } from './lifestyle.js';
import { translateText } from './i18n.js';

const PAGE_SIZE = 12;
export function setupCookbook({ $, element }) {
  let category = 'all', cuisine = 'home', page = 1, selected = RECIPES[0].id;
  const search = $('#recipe-search'), results = $('#recipe-results'), detail = $('#recipe-detail');
  function showRecipe(recipe) {
    detail.hidden = !recipe;
    detail.replaceChildren();
    if (!recipe) return;
    const ingredients = recipeIngredients(recipe, Number($('#recipe-servings').value));
    const heading = element('div', 'recipe-detail-heading');
    const titleBlock = element('div');
    const title = element('h3', '', recipe.name); title.id = 'recipe-current-title';
    titleBlock.append(title, element('p', 'recipe-origin', CUISINES.find(item => item.id === recipe.cuisine).name));
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
  }
  function render() {
    const matches = searchRecipes(search.value, category, translateText, cuisine);
    const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const visible = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    if (!visible.some(recipe => recipe.id === selected)) selected = visible[0]?.id;
    const origin = CUISINES.find(item => item.id === cuisine);
    $('#recipe-cuisine-title').textContent = origin?.name ?? '108 道菜，九种餐桌风味';
    $('#recipe-cuisine-region').textContent = origin?.region ?? '每类 12 道，按地域风味与家常做法整理；同名菜在不同地区可能有不同版本。';
    $('#recipe-cuisine-description').textContent = origin?.description ?? '保留家常菜，并收录鲁、川、粤、苏、闽、浙、湘、徽八大菜系，每类 12 道。';
    $('#recipe-status').textContent = matches.length ? `找到 ${matches.length} 道菜，点击查看做法` : '暂未收录这道菜，试试其他菜名或食材，也可以切换分类。';
    $('#recipe-pages').hidden = pages <= 1;
    $('#recipe-previous').disabled = page === 1;
    $('#recipe-next').disabled = page === pages;
    $('#recipe-page-status').textContent = `第 ${page} / ${pages} 页`;
    document.querySelectorAll('[data-recipe-cuisine]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.recipeCuisine === cuisine)));
    document.querySelectorAll('[data-recipe-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.recipeCategory === category)));
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
    showRecipe(visible.find(recipe => recipe.id === selected));
  }
  const allCuisines = [...CUISINES, {id:'all', name:'全部菜系'}];
  $('#recipe-cuisines').replaceChildren(...allCuisines.map(origin => {
    const button = element('button', 'recipe-cuisine'); button.type = 'button';
    button.dataset.recipeCuisine = origin.id; button.setAttribute('aria-controls', 'recipe-results recipe-detail');
    button.append(element('strong', '', origin.name), element('small', '', origin.id === 'all' ? '108 道' : '12 道'));
    button.addEventListener('click', () => { cuisine = origin.id; page = 1; render(); });
    return button;
  }));
  search.addEventListener('input', () => { page = 1; render(); });
  $('#recipe-servings').addEventListener('change', () => showRecipe(RECIPES.find(recipe => recipe.id === selected)));
  for (const button of document.querySelectorAll('[data-recipe-category]')) {
    button.addEventListener('click', () => { category = button.dataset.recipeCategory; page = 1; render(); });
  }
  $('#recipe-previous').addEventListener('click', () => { page--; render(); });
  $('#recipe-next').addEventListener('click', () => { page++; render(); });
  $('#recipe-reset').addEventListener('click', () => {
    search.value = ''; category = 'all'; cuisine = 'home'; page = 1;
    render(); search.focus();
  });
  document.addEventListener('languagechange', render);
  render();
}
