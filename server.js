import * as http from 'node:http';
import { PUBLIC_ASSETS } from './public-assets.js';
import { createFoodSearchHandler } from './food-search.js';
import { createRecipeApi } from './database/api.js';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
// Only this public catalog and browser assets are served. User diaries stay private.
const assets=new Set(PUBLIC_ASSETS);
function contentType(name) {
 if(name.endsWith('.sqlite'))return 'application/vnd.sqlite3';
 if(name.endsWith('.wasm'))return 'application/wasm';
 if(name.endsWith('.html'))return 'text/html; charset=utf-8';
 if(name.endsWith('.css'))return 'text/css; charset=utf-8';
 if(name.endsWith('.json'))return 'application/json; charset=utf-8';
 if(name.endsWith('.js'))return 'application/javascript; charset=utf-8';
 return 'text/plain; charset=utf-8';
}
export function createAppServer({foodHandler=createFoodSearchHandler()}={}) {
 const recipes=createRecipeApi();
 const server=http.createServer(async(req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';}catch{res.writeHead(400);res.end();return;}
  const recipeRoute=name==='api/recipes'||name.startsWith('api/recipes/');
  if(name==='api/food-search'||recipeRoute) {
   try {
    const protocol=req.headers['x-forwarded-proto']==='https'?'https':'http';
    const request=new Request(`${protocol}://${req.headers.host}${req.url}`,{method:req.method,headers:req.headers});
    const result=await(recipeRoute?recipes.fetch(request):foodHandler(request));
    res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
   } catch {
    res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{code:recipeRoute?'recipe_database_unavailable':'food_service_unavailable'}}));
   }
   return;
  }
  if(!['GET','HEAD'].includes(req.method)||!assets.has(name)){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');return;}
  try {
   const data=await readFile(new URL(name,import.meta.url));
   res.writeHead(200,{'Content-Type':contentType(name),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
  } catch {res.writeHead(404);res.end();}
 });
 server.on('close',()=>recipes.close());return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(typeof http.setGlobalProxyFromEnv==='function'&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY))http.setGlobalProxyFromEnv();
 const server=createAppServer();server.listen(3000,'0.0.0.0',()=>console.log('Daily Bites listening on port 3000.'));
}
