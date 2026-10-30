// No recipe source arrays are imported here: every search runs against SQLite in the worker.
export function createRecipeClient({workerFactory=()=>new Worker(new URL('./recipe-db-worker.js',import.meta.url))}={}) {
  let worker,sequence=0;
  const pending=new Map();
  function fail() {
    worker?.terminate();worker=undefined;
    for(const item of pending.values()) {clearTimeout(item.timer);item.reject(Error('recipe_database_unavailable'));}
    pending.clear();
  }
  function request(action,params) {
    return new Promise((resolve,reject)=>{
      try {
        if(!worker) {
          worker=workerFactory();
          worker.addEventListener('message',event=>{
            const item=pending.get(event.data?.id);if(!item)return;
            pending.delete(event.data.id);clearTimeout(item.timer);
            if(event.data.error)item.reject(Error(event.data.error.code));else item.resolve(event.data.data);
          });
          worker.addEventListener('error',event=>{event.preventDefault();fail();});
          worker.addEventListener('messageerror',fail);
        }
        const id=++sequence;
        const timer=setTimeout(()=>{fail();},action==='init'?90000:45000);
        pending.set(id,{resolve,reject,timer});worker.postMessage({id,action,params});
      } catch {fail();reject(Error('recipe_database_unavailable'));}
    });
  }
  return {initialize:()=>request('init'),search:params=>request('search',params),detail:id=>request('detail',{id}),close:fail};
}
