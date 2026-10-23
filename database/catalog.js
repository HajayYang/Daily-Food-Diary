// Import sources are retained for a reproducible migration; the webpage queries SQLite.
import { RECIPES, CUISINES, RECIPE_INGREDIENTS } from '../recipes.js';
import { MESSAGES } from '../locales.js';
import { NUTRIENTS } from '../nutrition.js';
import { FOODS } from '../fitness.js';
export function sourceCatalog() {
  const phrases = new Set([
    ...CUISINES.flatMap(c => [c.name,c.region,c.description]),
    ...RECIPES.flatMap(r => [r.name,r.tip,...r.steps]),
    ...Object.values(RECIPE_INGREDIENTS).flatMap(i => [i.name,i.unit])
  ]);
  const translations = Object.fromEntries([...phrases].sort().filter(text => Object.hasOwn(MESSAGES,text)).map(text => [text,MESSAGES[text]]));
  // Only cooked rice matches both the ingredient and the existing documented food state.
  // Raw chicken, raw broccoli and raw eggs must not borrow cooked-food nutrition.
  const rice = FOODS[0];
  const nutrition = Object.fromEntries(['calories',...Object.keys(NUTRIENTS)].filter(key => (key === 'calories' ? rice.kcal : rice[key]) != null).map(key => [key,{value:key === 'calories' ? rice.kcal : rice[key],source:rice.nutritionSource}]));
  return {cuisines:CUISINES,ingredients:RECIPE_INGREDIENTS,recipes:RECIPES,translations,
    nutrientDefinitions:{calories:{label:'热量',unit:'kcal',max:10000},...NUTRIENTS},ingredientNutrition:{rice:nutrition}};
}
export const normalizeSearch = value => String(value).normalize('NFKC').toLocaleLowerCase().trim();
export function searchText(catalog,recipe,language) {
  const index = {'en':0,'ja':1,'ko':2}[language];
  const localize = text => index === undefined ? text : catalog.translations[text]?.[index] ?? text;
  const cuisine = catalog.cuisines.find(c => c.id === recipe.cuisine);
  const labels = [recipe.name,cuisine.name,cuisine.region,...recipe.aliases,...recipe.ingredients.map(i => catalog.ingredients[i.key].name)];
  return normalizeSearch(labels.flatMap(text => [text,localize(text)]).join(' '));
}
