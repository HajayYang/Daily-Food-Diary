/* A dedicated worker queries the same public SQLite file served by GitHub Pages. */
importScripts('./vendor/sqljs/sql-wasm.js');
let initialization, engine;
const catalogUrl=new URL('./data/cookbook.sqlite',self.location.href);
const manifestUrl=new URL('./data/cookbook-manifest.json',self.location.href);
const cacheName='daily-bites.cookbook.sqlite.v1';
async function digest(bytes) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
function validManifest(m) {
  return m?.schemaVersion===1 && m.applicationId===1145194836 && /^[a-f0-9]{24}$/.test(m.version)
    && /^[a-f0-9]{64}$/.test(m.sha256) && Number.isSafeInteger(m.bytes) && m.bytes>0 && m.bytes<=8*1024*1024
    && Number.isSafeInteger(m.recipes) && m.recipes>0 && Number.isSafeInteger(m.cuisines) && m.cuisines>0;
}
async function checkedBytes(response,manifest) {
  if (!response?.ok) throw Error('catalog_unavailable');
  const bytes=await response.arrayBuffer();
  if (bytes.byteLength!==manifest.bytes || await digest(bytes)!==manifest.sha256) throw Error('catalog_checksum_mismatch');
  return bytes;
}
async function fetchFile(url) {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try { return await fetch(url,{signal:controller.signal,credentials:'omit',cache:'no-store'}); }
  finally { clearTimeout(timer); }
}
async function loadCatalog() {
  let cache;
  try { cache=await caches.open(cacheName); } catch { /* Read without persistent cache when unavailable. */ }
  try {
    const response=await fetchFile(manifestUrl);
    if (!response.ok) throw Error('catalog_unavailable');
    const manifest=await response.json();
    if (!validManifest(manifest)) throw Error('invalid_catalog_manifest');
    const versioned=new URL(catalogUrl); versioned.searchParams.set('v',manifest.version);
    const bytes=await checkedBytes(await fetchFile(versioned),manifest);
    return {manifest,bytes,source:'sqlite-network',cache,versioned};
  } catch {
    if (!cache) throw Error('catalog_unavailable');
    const manifestResponse=await cache.match(manifestUrl);
    if (!manifestResponse) throw Error('catalog_unavailable');
    const manifest=await manifestResponse.json();
    if (!validManifest(manifest)) throw Error('invalid_catalog_manifest');
    const versioned=new URL(catalogUrl); versioned.searchParams.set('v',manifest.version);
    const bytes=await checkedBytes(await cache.match(versioned),manifest);
    return {manifest,bytes,source:'sqlite-cache'};
  }
}
async function initialize() {
  const [{createRecipeRepository},SQL,loaded]=await Promise.all([
    import('./recipe-query.js'),
    engine??=initSqlJs({locateFile:name=>new URL(`./vendor/sqljs/${name}`,self.location.href).href}),
    loadCatalog()
  ]);
  const db=new SQL.Database(new Uint8Array(loaded.bytes));
  try {
    db.run('pragma query_only=on');
    const repository=createRecipeRepository((sql,params=[])=>{
      const stmt=db.prepare(sql),rows=[];
      try { stmt.bind(params); while(stmt.step()) rows.push(stmt.getAsObject()); return rows; }
      finally { stmt.free(); }
    });
    const meta=repository.metadata();
    if(meta.version!==loaded.manifest.version || meta.total!==loaded.manifest.recipes || meta.cuisines.length!==loaded.manifest.cuisines) throw Error('invalid_catalog');
    if (loaded.cache) {
      try {
        await loaded.cache.put(loaded.versioned,new Response(loaded.bytes,{headers:{'Content-Type':'application/vnd.sqlite3'}}));
        await loaded.cache.put(manifestUrl,new Response(JSON.stringify(loaded.manifest),{headers:{'Content-Type':'application/json'}}));
        for(const request of await loaded.cache.keys()) if(request.url!==manifestUrl.href && request.url!==loaded.versioned.href) await loaded.cache.delete(request);
      } catch { /* Quota or private browsing must not block the verified in-memory database. */ }
    }
    return {repository,meta:{...meta,source:loaded.source}};
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
