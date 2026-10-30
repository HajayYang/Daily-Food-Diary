/* A dedicated worker queries the same public SQLite file served by GitHub Pages. */
let initialization, engine;
const catalogUrl=new URL('./data/cookbook.sqlite',self.location.href);
const manifestUrl=new URL('./data/cookbook-manifest.json',self.location.href);
const cacheName='daily-bites.cookbook.sqlite.v1';
const failure=code=>Object.assign(Error(code),{code});
async function digest(bytes) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
function validManifest(m) {
  return m?.schemaVersion===1 && m.applicationId===1145194836 && /^[a-f0-9]{24}$/.test(m.version)
    && /^[a-f0-9]{64}$/.test(m.sha256) && Number.isSafeInteger(m.bytes) && m.bytes>0 && m.bytes<=8*1024*1024
    && Number.isSafeInteger(m.recipes) && m.recipes>0 && Number.isSafeInteger(m.cuisines) && m.cuisines>0;
}
async function checkedBytes(response,manifest) {
  if (!response?.ok) throw failure('catalog_unavailable');
  const bytes=await response.arrayBuffer();
  if (bytes.byteLength!==manifest.bytes || await digest(bytes)!==manifest.sha256) throw failure('catalog_checksum_mismatch');
  return bytes;
}
async function fetchFile(url) {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try {
    const response=await fetch(url,{signal:controller.signal,credentials:'omit',cache:'no-store'});
    if(!response.ok)throw failure('catalog_unavailable');
    if(Number(response.headers.get('Content-Length'))>8*1024*1024)throw failure('catalog_unavailable');
    const bytes=await response.arrayBuffer();
    if(bytes.byteLength>8*1024*1024)throw failure('catalog_unavailable');
    return new Response(bytes,{status:response.status,headers:{'Content-Type':response.headers.get('Content-Type')??'application/octet-stream'}});
  } catch(error){throw error.code?error:failure('catalog_unavailable');}
  finally { clearTimeout(timer); }
}
async function loadEngine() {
  if(typeof WebAssembly==='object'&&typeof WebAssembly.instantiate==='function')try {
    importScripts('./vendor/sqljs/sql-wasm.js');
    const response=await fetchFile(new URL('./vendor/sqljs/sql-wasm.wasm',self.location.href));
    const SQL=await initSqlJs({wasmBinary:await response.arrayBuffer(),printErr:()=>{}});
    return {SQL,name:'wasm'};
  }catch { /* A blocked WASM download or runtime must not hide the cookbook. */ }
  try {
    importScripts('./vendor/sqljs/sql-asm.js');
    return {SQL:await initSqlJs(),name:'javascript'};
  }catch {throw failure('recipe_engine_unavailable');}
}
async function loadCatalog() {
  let cache;
  try { cache=await caches.open(cacheName); } catch { /* Read without persistent cache when unavailable. */ }
  try {
    const response=await fetchFile(manifestUrl);
    if (!response.ok) throw failure('catalog_unavailable');
    const manifest=await response.json();
    if (!validManifest(manifest)) throw failure('invalid_catalog_manifest');
    const versioned=new URL(catalogUrl); versioned.searchParams.set('v',manifest.version);
    const bytes=await checkedBytes(await fetchFile(versioned),manifest);
    return {manifest,bytes,source:'sqlite-network',cache,versioned};
  } catch(error) {
    if (!cache) throw error;
    const manifestResponse=await cache.match(manifestUrl);
    if (!manifestResponse) throw error;
    const manifest=await manifestResponse.json();
    if (!validManifest(manifest)) throw failure('invalid_catalog_manifest');
    const versioned=new URL(catalogUrl); versioned.searchParams.set('v',manifest.version);
    const bytes=await checkedBytes(await cache.match(versioned),manifest);
    return {manifest,bytes,source:'sqlite-cache'};
  }
}
async function initialize() {
  const [{createRecipeRepository},runtime,loaded]=await Promise.all([
    import('./recipe-query.js'),
    engine??=loadEngine(),
    loadCatalog()
  ]);
  const db=new runtime.SQL.Database(new Uint8Array(loaded.bytes));
  try {
    db.run('pragma query_only=on');
    const repository=createRecipeRepository((sql,params=[])=>{
      const stmt=db.prepare(sql),rows=[];
      try { stmt.bind(params); while(stmt.step()) rows.push(stmt.getAsObject()); return rows; }
      finally { stmt.free(); }
    });
    const meta=repository.metadata();
    if(meta.version!==loaded.manifest.version || meta.total!==loaded.manifest.recipes || meta.cuisines.length!==loaded.manifest.cuisines) throw failure('invalid_catalog');
    if (loaded.cache) {
      try {
        await loaded.cache.put(loaded.versioned,new Response(loaded.bytes,{headers:{'Content-Type':'application/vnd.sqlite3'}}));
        await loaded.cache.put(manifestUrl,new Response(JSON.stringify(loaded.manifest),{headers:{'Content-Type':'application/json'}}));
        for(const request of await loaded.cache.keys()) if(request.url!==manifestUrl.href && request.url!==loaded.versioned.href) await loaded.cache.delete(request);
      } catch { /* Quota or private browsing must not block the verified in-memory database. */ }
    }
    return {repository,meta:{...meta,source:loaded.source,engine:runtime.name}};
  } catch(error) { db.close(); throw error; }
}
self.addEventListener('message',async event=>{
  const {id,action,params}=event.data??{};
  if (!Number.isSafeInteger(id)) return;
  try {
    const catalog=await(initialization??=initialize().catch(error=>{initialization=undefined;throw error;}));
    let data;
    if (action==='init') data=catalog.meta;
    else if (action==='search') data=catalog.repository.search(params);
    else if (action==='detail') data=catalog.repository.detail(params?.id);
    else throw Error('unsupported_action');
    self.postMessage({id,data});
  } catch(error) { self.postMessage({id,error:{code:error.code??'recipe_database_unavailable'}}); }
});
