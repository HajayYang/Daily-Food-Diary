import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
// Serve only browser assets. Local model keys in worker/.dev.vars must never be public.
const assets=new Set(['index.html','style.css','appearance.css','app.js','records.js','fitness.js','fitness-ui.js','training.js','charts.js','appearance.js','i18n.js','locales.js','food-discovery.js','food-online.js','food-api.js','photo-core.js','photo-client.js','photo-ui.js','next-day.js','next-day-ui.js','nutrition.js']);
export function createAppServer(){return createServer(async(req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';}catch{res.writeHead(400);res.end();return;}
  if(!['GET','HEAD'].includes(req.method)||!assets.has(name)){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');return;}
  try{const data=await readFile(new URL(name,import.meta.url));res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);}catch{res.writeHead(404);res.end();}
});}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const server=createAppServer();server.listen(3000,'0.0.0.0',()=>console.log('Daily Bites listening on port 3000.'));}
