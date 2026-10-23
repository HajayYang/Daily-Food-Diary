import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { CatalogError, createRecipeRepository } from '../recipe-query.js';
export function openCatalog(path=fileURLToPath(new URL('../data/cookbook.sqlite',import.meta.url))) {
  const db=new DatabaseSync(path,{readOnly:true});
  try {
    db.exec('pragma query_only=on');
    const repository=createRecipeRepository((sql,params=[])=>db.prepare(sql).all(...params));
    repository.metadata();
    return {db,repository,close:()=>db.close()};
  } catch(error) { db.close(); throw error; }
}
export function createRecipeApi(options={}) {
  let catalog;
  function json(value,status=200,head=false) {
    return new Response(head?null:JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(status===405?{Allow:'GET, HEAD'}:{})}});
  }
  async function fetch(request) {
    const head=request.method==='HEAD';
    if (!['GET','HEAD'].includes(request.method)) return json({error:{code:'method_not_allowed'}},405,head);
    try {
      catalog??=openCatalog(options.path);
      const url=new URL(request.url), path=url.pathname;
      if (path==='/api/recipes/meta') return json(catalog.repository.metadata(),200,head);
      if (path==='/api/recipes') {
        const allowed=['query','cuisine','category','language','page'];
        if ([...url.searchParams.keys()].some(key=>!allowed.includes(key)) || allowed.some(key=>url.searchParams.getAll(key).length>1)) throw new CatalogError('invalid_recipe_query');
        const params=Object.fromEntries(url.searchParams);
        if (params.page!==undefined) params.page=/^[1-9]\d{0,5}$/.test(params.page)?Number(params.page):NaN;
        return json(catalog.repository.search(params),200,head);
      }
      if (path.startsWith('/api/recipes/')) return json(catalog.repository.detail(decodeURIComponent(path.slice('/api/recipes/'.length))),200,head);
      return json({error:{code:'recipe_not_found'}},404,head);
    } catch(error) {
      return json({error:{code:error instanceof CatalogError?error.code:'recipe_database_unavailable'}},error instanceof CatalogError?error.status:503,head);
    }
  }
  return {fetch,close(){catalog?.close();catalog=undefined;}};
}
