// Shared prepared SQL for node:sqlite and the browser's sql.js engine.
export const CATALOG_SCHEMA_VERSION = 1;
export const CATALOG_APPLICATION_ID = 1145194836;
export const RECIPE_PAGE_SIZE = 12;
export class CatalogError extends Error {
  constructor(code,status=400) { super(code); this.code=code; this.status=status; }
}
export function createRecipeRepository(all) {
  function metadata() {
    const schema = all('pragma user_version')[0]?.user_version;
    const appId = all('pragma application_id')[0]?.application_id;
    if (schema !== CATALOG_SCHEMA_VERSION || appId !== CATALOG_APPLICATION_ID) throw new CatalogError('unsupported_catalog',503);
    const values = Object.fromEntries(all('select key,value from catalog_meta').map(r => [r.key,r.value]));
    const cuisines = all(`select c.id,c.name,c.region,c.description,count(r.id) as count
      from cuisines c left join recipes r on r.cuisine_id=c.id group by c.id order by c.position`);
    const translations = Object.fromEntries(all('select source,en,ja,ko from translations').map(r => [r.source,[r.en,r.ja,r.ko]]));
    return {schemaVersion:schema,version:values.data_version,total:all('select count(*) as count from recipes')[0].count,cuisines,translations};
  }
  function detail(id) {
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,100}$/.test(id)) throw new CatalogError('invalid_recipe_id');
    const row = all('select id,cuisine_id as cuisine,name,category,emoji,minutes,servings,tip from recipes where id=?',[id])[0];
    if (!row) throw new CatalogError('recipe_not_found',404);
    row.ingredients = all(`select i.id as key,i.name,i.unit,i.allergens,ri.amount
      from recipe_ingredients ri join ingredients i on i.id=ri.ingredient_id where ri.recipe_id=? order by ri.position`,[id]).map(i => ({...i,allergens:JSON.parse(i.allergens),
        nutrition:Object.fromEntries(all(`select n.nutrient_key,n.value,d.unit,n.basis_grams,n.source from ingredient_nutrients n
          join nutrient_definitions d on d.key=n.nutrient_key where n.ingredient_id=?`,[i.key]).map(n => [n.nutrient_key,{value:n.value,unit:n.unit,basisGrams:n.basis_grams,source:n.source}]))}));
    row.steps = all('select instruction from recipe_steps where recipe_id=? order by position',[id]).map(r => r.instruction);
    row.aliases = all('select alias from recipe_aliases where recipe_id=? order by alias',[id]).map(r => r.alias);
    return row;
  }
  function search({query='',cuisine='all',category='all',language='zh-CN',page=1}={}) {
    if (typeof query !== 'string' || query.length>80 || !['zh-CN','en','ja','ko'].includes(language)
      || !['all','plant','meat','staple'].includes(category) || typeof cuisine!=='string'
      || !Number.isSafeInteger(page) || page<1 || page>100000) throw new CatalogError('invalid_recipe_query');
    if (cuisine!=='all' && !all('select id from cuisines where id=?',[cuisine]).length) throw new CatalogError('invalid_cuisine');
    const terms = query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    if (terms.length>12) throw new CatalogError('invalid_recipe_query');
    const clauses=['s.language=?'], params=[language];
    if (cuisine!=='all') { clauses.push('r.cuisine_id=?'); params.push(cuisine); }
    if (category!=='all') { clauses.push('r.category=?'); params.push(category); }
    for (const term of terms) { clauses.push('instr(s.search_text,?)>0'); params.push(term); }
    const from=`from recipes r join recipe_search s on s.recipe_id=r.id where ${clauses.join(' and ')}`;
    const total=all(`select count(*) as count ${from}`,params)[0].count;
    const pages=Math.max(1,Math.ceil(total/RECIPE_PAGE_SIZE));
    page=Math.min(page,pages);
    const rows=all(`select r.id ${from} order by r.position limit ? offset ?`,[...params,RECIPE_PAGE_SIZE,(page-1)*RECIPE_PAGE_SIZE]);
    return {total,page,pages,pageSize:RECIPE_PAGE_SIZE,recipes:rows.map(row=>detail(row.id))};
  }
  return {metadata,search,detail};
}
export function scaleRecipeIngredients(recipe,servings=2) {
  if (![1,2,4].includes(servings)) throw new RangeError('Unsupported servings');
  return recipe.ingredients.map(i=>({...i,amount:Math.round(i.amount*servings/recipe.servings*100)/100}));
}
