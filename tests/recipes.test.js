import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPES, RECIPE_INGREDIENTS, searchRecipes, recipeIngredients } from '../recipes.js';
import { ALLERGENS } from '../lifestyle.js';
import { MESSAGES } from '../locales.js';
import { setLanguage, translateText } from '../i18n.js';

test('all original recipes have usable amounts, complete steps and supported allergen labels', () => {
  assert.equal(RECIPES.length, 12);
  assert.equal(new Set(RECIPES.map(recipe => recipe.id)).size, RECIPES.length);
  for (const recipe of RECIPES) {
    assert.ok(['plant','meat','staple'].includes(recipe.category));
    assert.ok(recipe.minutes > 0 && recipe.servings === 2);
    assert.ok(recipe.ingredients.length >= 4 && recipe.steps.length >= 4);
    assert.equal(new Set(recipe.ingredients.map(item => item.key)).size, recipe.ingredients.length);
    for (const item of recipeIngredients(recipe)) {
      assert.ok(item.amount > 0 && Number.isFinite(item.amount));
      assert.ok(item.unit && item.name);
      assert.ok(item.allergens.every(key => Object.hasOwn(ALLERGENS, key)));
    }
  }
});
test('search handles aliases, ingredients, whitespace, English case and independent categories', () => {
  assert.equal(searchRecipes('西红柿炒蛋')[0].id, 'tomato-eggs');
  assert.equal(searchRecipes('  CHICKEN  ')[0].id, 'chicken');
  assert.ok(searchRecipes('鸡蛋').length >= 4);
  assert.equal(searchRecipes('番茄 鸡蛋').length, 2);
  assert.equal(searchRecipes('炒饭', 'meat').length, 0);
  assert.equal(searchRecipes('', 'staple').length, 2);
  for (const query of ['不存在的菜谱', '<img src=x onerror=alert(1)>', '__proto__', '$&']) assert.equal(searchRecipes(query).length, 0);
});
test('serving changes scale every ingredient without mutating source recipes', () => {
  const recipe = RECIPES[0], before = JSON.stringify(recipe);
  assert.equal(recipeIngredients(recipe, 1)[0].amount, 150);
  assert.equal(recipeIngredients(recipe, 1)[1].amount, 1);
  assert.equal(recipeIngredients(recipe, 4)[0].amount, 600);
  assert.equal(recipeIngredients(recipe, 4)[1].amount, 4);
  assert.equal(JSON.stringify(recipe), before);
  assert.throws(() => recipeIngredients(recipe, 0), RangeError);
  assert.throws(() => recipeIngredients(recipe, '2'), RangeError);
});
test('all recipe text translates and search follows the selected language', () => {
  const keys = [...RECIPES.flatMap(recipe => [recipe.name, recipe.tip, ...recipe.steps]), ...Object.values(RECIPE_INGREDIENTS).map(item => item.name)];
  for (const key of keys) assert.ok(MESSAGES[key], key);
  try {
    for (const language of ['en','ja','ko']) {
      setLanguage(language);
      for (const recipe of RECIPES) {
        assert.ok(searchRecipes(translateText(recipe.name), 'all', translateText).some(item => item.id === recipe.id));
      }
      const status = translateText('找到 12 道菜，点击查看做法');
      assert.match(status, /12/);
      assert.notEqual(status, '找到 12 道菜，点击查看做法');
    }
  } finally { setLanguage('zh-CN'); }
});
