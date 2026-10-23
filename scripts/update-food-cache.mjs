// Public production data only. No staging database and no invented nutrient values.
import * as http from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {searchURL,searchPayload,normalizeProduct} from '../food-api.js';
if(typeof http.setGlobalProxyFromEnv==='function'&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY))http.setGlobalProxyFromEnv();
const path=new URL('../food-cache.json',import.meta.url);let previous={version:1,queries:{},products:[]};try{previous=JSON.parse(await readFile(path,'utf8'));}catch{/* Initial snapshot. */}
const queries={...previous.queries},products=new Map(previous.products.map(product=>[product.code,product]));
const terms=process.argv.slice(2);const selected=terms.length?terms:['bread','milk','rice','apple','banana','oats','egg','yogurt','tofu','chicken','fish','potato','noodles','orange','broccoli','beans'];
let successful=0;
for(const [index,query] of selected.entries()){
 if(index)await new Promise(resolve=>setTimeout(resolve,6500));
 try{const response=await fetch(searchURL(query),{signal:AbortSignal.timeout(12000),redirect:'error',headers:{Accept:'application/json','User-Agent':'DailyFoodDiary/1.0 (https://github.com/HajayYang/Daily-Food-Diary)'}});if(!response.ok)throw Error(`HTTP ${response.status}`);const data=searchPayload(await response.json()),valid=data.products.filter(normalizeProduct);if(!valid.length)throw Error('no usable products');for(const product of valid)products.set(product.code,product);queries[query]={capturedAt:new Date().toISOString(),codes:valid.map(product=>product.code)};successful++;console.log(`${query}: ${valid.length} production products`);}catch(error){console.error(`${query}: kept previous snapshot (${error.message})`);}
}
if(!successful)throw Error('No successful production queries; snapshot unchanged.');
const used=new Set(Object.values(queries).flatMap(group=>group.codes));await writeFile(path,JSON.stringify({version:1,source:'https://search.openfoodfacts.org',license:'ODbL-1.0',queries,products:[...products.values()].filter(product=>used.has(product.code))},null,2)+'\n');
console.log(`Saved ${used.size} products across ${Object.keys(queries).length} query groups.`);
