import { RECIPES, searchRecipes, recipeIngredients } from './recipes.js';
import { ALLERGENS } from './lifestyle.js';
import { translateText } from './i18n.js';

export function setupCookbook({ $, element }) {
  let category = 'all', selected = RECIPES[0].id;
  const search = $('#recipe-search'), results = $('#recipe-results'), detail = $('#recipe-detail');
  function showRecipe(recipe) {
    detail.hidden = !recipe;
    detail.replaceChildren();
    if (!recipe) return;
    const ingredients = recipeIngredients(recipe, Number($('#recipe-servings').value));
    const heading = element('div', 'recipe-detail-heading');
    const title = element('h3', '', recipe.name); title.id = 'recipe-current-title';
    heading.append(title, element('span', 'section-tag', `约 ${recipe.minutes} 分钟`));
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
    detail.append(heading, columns, tip, allergy);
  }
  function render() {
    const matches = searchRecipes(search.value, category, translateText);
    if (!matches.some(recipe => recipe.id === selected)) selected = matches[0]?.id;
    $('#recipe-status').textContent = matches.length ? `找到 ${matches.length} 道菜，点击查看做法` : '暂未收录这道菜，试试其他菜名或食材，也可以切换分类。';
    results.replaceChildren(...matches.map(recipe => {
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
    showRecipe(matches.find(recipe => recipe.id === selected));
  }
  search.addEventListener('input', render);
  $('#recipe-servings').addEventListener('change', () => showRecipe(RECIPES.find(recipe => recipe.id === selected)));
  for (const button of document.querySelectorAll('[data-recipe-category]')) {
    button.addEventListener('click', () => {
      category = button.dataset.recipeCategory;
      document.querySelectorAll('[data-recipe-category]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      render();
    });
  }
  $('#recipe-reset').addEventListener('click', () => {
    search.value = ''; category = 'all';
    document.querySelectorAll('[data-recipe-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.recipeCategory === 'all')));
    render(); search.focus();
  });
  document.addEventListener('languagechange', render);
  render();
}
