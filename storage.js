// A durable rollback journal protects multi-key imports from partial quota failures.
let externalChange=false;
export function blockExternalWrites(){externalChange=true;}
export const JOURNAL_KEY='daily-bites.import-journal.v1';
export function canWrite(storage=globalThis.localStorage){return !externalChange&&storage.getItem(JOURNAL_KEY)===null;}
export function writeLocal(key,value,storage=globalThis.localStorage){if(!canWrite(storage))throw new Error('unfinished import');storage.setItem(key,value);}
export function recoverImport(storage=globalThis.localStorage){
  try{
    const raw=storage.getItem(JOURNAL_KEY);if(raw===null)return true;
    const entries=JSON.parse(raw);
    if(!Array.isArray(entries)||!entries.every(entry=>Array.isArray(entry)&&entry.length===2&&['daily-bites.records.v1','daily-bites.fitness.v1','daily-bites.next-day.v1','daily-bites.lifestyle.v1','daily-bites.wellbeing.v1'].includes(entry[0])&&(entry[1]===null||typeof entry[1]==='string')))return false;
    // Free all affected values first; the old snapshot already fitted before this import.
    for(const [key] of entries)storage.removeItem(key);
    for(const [key,value] of entries)if(value!==null)storage.setItem(key,value);
    storage.removeItem(JOURNAL_KEY);return true;
  }catch{return false;}
}
export function transactionalWrite(changes,storage=globalThis.localStorage){
 if(!canWrite(storage))throw new Error('请先刷新页面以恢复上次未完成的导入。');
 const before=Object.keys(changes).map(key=>[key,storage.getItem(key)]);
 try{storage.setItem(JOURNAL_KEY,JSON.stringify(before));}catch{throw new Error('无法创建导入前备份，现有数据未修改；请释放空间后重试。');}
 try{for(const [key,value] of Object.entries(changes))storage.setItem(key,value);storage.removeItem(JOURNAL_KEY);}
 catch{const recovered=recoverImport(storage);throw new Error(recovered?'保存失败，已恢复导入前的数据；请释放空间后重试。':'导入未完成，原数据副本仍保留；请释放空间并刷新页面恢复。');}
}
