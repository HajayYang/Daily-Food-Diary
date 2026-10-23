import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPES, CUISINES, RECIPE_INGREDIENTS, searchRecipes, recipeIngredients } from '../recipes.js';
import { ALLERGENS } from '../lifestyle.js';
import { MESSAGES } from '../locales.js';
import { setLanguage, translateText } from '../i18n.js';

const home = ['tomato-eggs','potato','broccoli','chicken','pork','tofu','greens','fish','cucumber','custard','fried-rice','noodles'];
test('original home collection stays first, followed by exactly twelve dishes in each of the eight cuisines', () => {
  assert.deepEqual(CUISINES.map(c => c.id), ['home','lu','chuan','yue','su','min','zhe','xiang','hui']);
  assert.equal(RECIPES.length, 108);
  assert.equal(new Set(RECIPES.map(recipe => recipe.id)).size, RECIPES.length);
  assert.equal(new Set(RECIPES.map(recipe => recipe.name)).size, RECIPES.length);
  assert.deepEqual(RECIPES.slice(0, 12).map(recipe => recipe.id), home);
  for (const cuisine of CUISINES) {
    assert.equal(RECIPES.filter(recipe => recipe.cuisine === cuisine.id).length, 12, cuisine.name);
    assert.equal(searchRecipes('', 'all', value => value, cuisine.id).length, 12, cuisine.name);
  }
});
test('every dish has valid ingredients, practical steps, serving amounts and supported allergen labels', () => {
  for (const recipe of RECIPES) {
    assert.ok(['plant','meat','staple'].includes(recipe.category));
    assert.ok(CUISINES.some(cuisine => cuisine.id === recipe.cuisine));
    assert.ok(recipe.minutes > 0 && recipe.servings === 2);
    assert.ok(recipe.ingredients.length >= 3 && recipe.steps.length >= 4, recipe.name);
    assert.ok(recipe.steps.every(step => typeof step === 'string' && step.length > 10), recipe.name);
    assert.equal(new Set(recipe.ingredients.map(item => item.key)).size, recipe.ingredients.length, recipe.name);
    for (const item of recipeIngredients(recipe)) {
      assert.ok(item.amount > 0 && Number.isFinite(item.amount), recipe.name);
      assert.ok(item.unit && item.name, recipe.name);
      assert.ok(item.allergens.every(key => Object.hasOwn(ALLERGENS, key)), recipe.name);
    }
  }
});
test('search matches regional dishes, ingredients, aliases and cuisine names while combining filters', () => {
  assert.equal(searchRecipes('西红柿炒蛋')[0].id, 'tomato-eggs');
  assert.equal(searchRecipes('  CHICKEN  ')[0].id, 'chicken');
  assert.equal(searchRecipes('番茄 鸡蛋', 'all', value => value, 'home').length, 2);
  assert.equal(searchRecipes('', 'staple', value => value, 'home').length, 2);
  assert.equal(searchRecipes('宫爆鸡丁', 'all', value => value, 'chuan')[0].id, 'chuan-kungpao');
  assert.equal(searchRecipes('宫保鸡丁', 'all', value => value, 'yue').length, 0);
  assert.equal(searchRecipes('龙井')[0].id, 'zhe-tea-shrimp');
  assert.equal(searchRecipes('徽菜').length, 12);
  assert.equal(searchRecipes('广东').length, 12);
  assert.ok(searchRecipes('川菜', 'plant').every(recipe => recipe.cuisine === 'chuan' && recipe.category === 'plant'));
  for (const cuisine of CUISINES) for (const recipe of RECIPES.filter(r => r.cuisine === cuisine.id)) {
    assert.ok(searchRecipes(recipe.name, 'all', value => value, cuisine.id).some(result => result.id === recipe.id), recipe.name);
  }
  for (const query of ['不存在的菜谱','<img src=x onerror=alert(1)>','__proto__','$&']) assert.equal(searchRecipes(query).length, 0);
});
test('servings scale every recipe, do not mutate shared data, and distinguish eggs from gram amounts', () => {
  const before = JSON.stringify(RECIPES);
  for (const recipe of RECIPES) {
    const base = recipeIngredients(recipe, 2), one = recipeIngredients(recipe, 1), four = recipeIngredients(recipe, 4);
    for (let i = 0; i < base.length; i++) {
      assert.ok(Math.abs(one[i].amount * 2 - base[i].amount) <= 0.010001, recipe.name);
      assert.ok(Math.abs(four[i].amount - base[i].amount * 2) <= 0.010001, recipe.name);
    }
  }
  assert.equal(RECIPE_INGREDIENTS['preserved-egg'].unit, '个');
  assert.equal(recipeIngredients(RECIPES[0], 4)[0].amount, 600);
  assert.equal(JSON.stringify(RECIPES), before);
  assert.throws(() => recipeIngredients(RECIPES[0], 0), RangeError);
  assert.throws(() => recipeIngredients(RECIPES[0], '2'), RangeError);
});
test('all cuisine introductions and recipe text translate; localized names remain searchable', () => {
  const keys = [...CUISINES.flatMap(c => [c.name,c.region,c.description]), ...RECIPES.flatMap(r => [r.name,r.tip,...r.steps]), ...Object.values(RECIPE_INGREDIENTS).map(item => item.name)];
  for (const key of keys) assert.ok(MESSAGES[key], key);
  try {
    for (const language of ['en','ja','ko']) {
      setLanguage(language);
      for (const recipe of RECIPES) assert.ok(searchRecipes(translateText(recipe.name), 'all', translateText, recipe.cuisine).some(item => item.id === recipe.id), recipe.name);
      assert.notEqual(translateText('找到 108 道菜，点击查看做法'), '找到 108 道菜，点击查看做法');
      assert.notEqual(translateText('第 2 / 9 页'), '第 2 / 9 页');
    }
  } finally { setLanguage('zh-CN'); }
});
test('recipes preserve ingredient-specific food safety instructions and known allergens', () => {
  const get = id => RECIPES.find(recipe => recipe.id === id);
  assert.match(get('chuan-green-beans').steps.join(' '), /10–15 分钟至完全熟透/);
  assert.match(get('hui-tofu').steps.join(' '), /正规冷藏毛豆腐/);
  assert.match(get('hui-fish').steps.join(' '), /不在家自行发酵生鱼/);
  assert.ok(recipeIngredients(get('chuan-kungpao')).some(item => item.allergens.includes('peanut')));
  assert.ok(recipeIngredients(get('zhe-tangyuan')).some(item => item.allergens.includes('sesame')));
  assert.ok(recipeIngredients(get('xiang-fish-head')).some(item => item.allergens.includes('fish')));
});
