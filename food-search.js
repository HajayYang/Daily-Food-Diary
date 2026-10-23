import { searchURL, searchPayload, normalizeSearch } from './food-api.js';
const MAX_BODY=1024*1024;
async function readJSON(response){
 if(Number(response.headers.get('content-length'))>MAX_BODY)throw Error('invalid_upstream');
 const reader=response.body?.getReader();if(!reader)throw Error('invalid_upstream');let length=0;const chunks=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>MAX_BODY){await reader.cancel();throw Error('invalid_upstream');}chunks.push(value);}}
 finally{reader.releaseLock();}
 const data=new Uint8Array(length);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}return JSON.parse(new TextDecoder().decode(data));
}
// Fixed upstream and fields: this endpoint is a food lookup, not an arbitrary URL proxy.
export function createFoodSearchHandler({fetcher=globalThis.fetch,now=Date.now,timeoutMs=12000}={}){
 const cache=new Map(),pending=new Map();let windowStart=now(),requests=0;
 return async function handle(request,env={}){
  const url=new URL(request.url),origin=request.headers.get('Origin');
  const allowed=(env.ALLOWED_ORIGIN??url.origin).split(',').map(value=>value.trim()).filter(value=>value&&value!=='*');
  const cors=origin&&allowed.includes(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept','Vary':'Origin'}:{Vary:'Origin'};
  const respond=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
  const fail=(code,status,extra)=>respond({error:{code}},status,extra);
  if(origin&&!allowed.includes(origin))return fail('origin_not_allowed',403);
  if(url.pathname!=='/api/food-search')return fail('not_found',404);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='GET')return fail('method_not_allowed',405);
  const query=url.searchParams.get('query')?.trim(),rawPage=url.searchParams.get('page')??'1',page=Number(rawPage);
  if(!query||query.length>60||/[\u0000-\u001f\u007f]/.test(query)||!/^\d{1,3}$/.test(rawPage)||page<1||page>100||[...url.searchParams.keys()].some(key=>!['query','page'].includes(key)))return fail('invalid_query',400);
  const upstreamURL=searchURL(query,page),time=now(),cached=cache.get(upstreamURL);
  if(cached&&time-cached.time<600000)return respond(cached.data,200,{'X-Food-Cache':'HIT'});
  if(pending.has(upstreamURL)){const result=await pending.get(upstreamURL);return respond(result.data,result.status,result.extra);}
  if(time-windowStart>=60000){windowStart=time;requests=0;}
  if(requests>=10)return fail('rate_limited',429,{'Retry-After':String(Math.max(1,Math.ceil((60000-time+windowStart)/1000)))});
  requests++;
  const work=(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
   try{
    const response=await fetcher(upstreamURL,{signal:controller.signal,method:'GET',redirect:'error',credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/json','User-Agent':'DailyFoodDiary/1.0 (https://github.com/HajayYang/Daily-Food-Diary)'}});
    if(!response.ok)return {status:response.status===429?429:502,data:{error:{code:response.status===429?'upstream_rate_limited':'upstream_unavailable'}},extra:response.status===429?{'Retry-After':'60'}:{}};
    const data=searchPayload(await readJSON(response));normalizeSearch(data,page);
    if(cache.size>=50)cache.delete(cache.keys().next().value);cache.set(upstreamURL,{time:now(),data});
    return {status:200,data,extra:{'X-Food-Cache':'MISS'}};
   }catch(error){return {status:error.name==='AbortError'?504:502,data:{error:{code:error.name==='AbortError'?'upstream_timeout':'upstream_unavailable'}}};}
   finally{clearTimeout(timer);}
  })();
  pending.set(upstreamURL,work);
  try{const result=await work;return respond(result.data,result.status,result.extra);}finally{pending.delete(upstreamURL);}
 };
}
