import * as http from 'node:http';
import { createFoodSearchHandler } from './food-search.js';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
// Serve only browser assets. Local model keys in worker/.dev.vars must never be public.
const assets=new Set(['recipes.js','recipes-ui.js','regional-recipes.js','index.html','style.css','appearance.css','app.js','records.js','fitness.js','fitness-ui.js','training.js','charts.js','appearance.js','i18n.js','locales.js','food-discovery.js','food-online.js','food-api.js','food-snapshot.js','food-cache.json','photo-core.js','photo-client.js','photo-ui.js','next-day.js','next-day-ui.js','nutrition.js','lifestyle.js','lifestyle-ui.js','menu-plan.js','storage.js','reports.js','barcode.js','barcode-ui.js','backup.js','backup-ui.js','sync-client.js']);
export function createAppServer({foodHandler=createFoodSearchHandler()}={}){return http.createServer(async(req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';}catch{res.writeHead(400);res.end();return;}
  if(name==='api/food-search'){
    try{const protocol=req.headers['x-forwarded-proto']==='https'?'https':'http';const request=new Request(`${protocol}://${req.headers.host}${req.url}`,{method:req.method,headers:req.headers});const result=await foodHandler(request);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}
    catch{res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{code:'food_service_unavailable'}}));}return;
  }
  if(!['GET','HEAD'].includes(req.method)||!assets.has(name)){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');return;}
  try{const data=await readFile(new URL(name,import.meta.url));res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.json')?'application/json; charset=utf-8':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);}catch{res.writeHead(404);res.end();}
});}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(typeof http.setGlobalProxyFromEnv==='function'&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY))http.setGlobalProxyFromEnv();const server=createAppServer();server.listen(3000,'0.0.0.0',()=>console.log('Daily Bites listening on port 3000.'));}
