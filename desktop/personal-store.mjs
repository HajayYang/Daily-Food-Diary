import { DatabaseSync, backup } from 'node:sqlite';
import { mkdir, rename, unlink, chmod, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DATA_KEYS, parseBackup, readSnapshot } from '../backup.js';

const MAX_VALUE=2*1024*1024;
const allowed=key=>typeof key==='string'&&/^daily-bites\.[a-z0-9.-]{1,100}$/.test(key);
export const defaults=()=>({backupHours:24,retention:14,closeToTray:false,autoStart:false});
export function validateSettings(value){return value&&!Array.isArray(value)&&Object.keys(value).length===4&&[0,6,12,24,72,168].includes(value.backupHours)&&Number.isInteger(value.retention)&&value.retention>=1&&value.retention<=30&&typeof value.closeToTray==='boolean'&&typeof value.autoStart==='boolean';}
export class PersonalStore {
  static async open(directory){await mkdir(directory,{recursive:true,mode:0o700});const store=new PersonalStore(join(directory,'personal.sqlite'));await chmod(store.path,0o600);return store;}
  constructor(path){
    this.path=path;this.db=new DatabaseSync(path);
    const version=this.db.prepare('PRAGMA user_version').get().user_version;
    if(version>1){this.db.close();throw Error('This database requires a newer Daily Bites version.');}
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
    this.db.exec('CREATE TABLE IF NOT EXISTS app_state(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS desktop_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL); PRAGMA user_version=1;');
    if(this.db.prepare('PRAGMA quick_check').get().quick_check!=='ok'){this.db.close();throw Error('Database integrity check failed. Restore a backup before continuing.');}
  }
  getItem(key){if(!allowed(key))throw Error('Invalid storage key');return this.db.prepare('SELECT value FROM app_state WHERE key=?').get(key)?.value??null;}
  setItem(key,value){this.batch({[key]:value});}
  removeItem(key){this.batch({[key]:null});}
  keys(){return this.db.prepare('SELECT key FROM app_state ORDER BY key').all().map(r=>r.key);}
  batch(changes){
    if(!changes||typeof changes!=='object'||Array.isArray(changes)||Object.keys(changes).length>50)throw Error('Invalid storage transaction');
    for(const [key,value] of Object.entries(changes))if(!allowed(key)||(value!==null&&(typeof value!=='string'||Buffer.byteLength(value)>MAX_VALUE)))throw Error('Invalid storage value');
    this.db.exec('BEGIN IMMEDIATE');
    try{
      const put=this.db.prepare('INSERT INTO app_state VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at'),del=this.db.prepare('DELETE FROM app_state WHERE key=?');
      for(const [key,value] of Object.entries(changes))if(value===null)del.run(key);else put.run(key,value,new Date().toISOString());
      this.db.exec('COMMIT');
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  meta(key,fallback=null){try{return JSON.parse(this.db.prepare('SELECT value FROM desktop_meta WHERE key=?').get(key)?.value??'null')??fallback;}catch{return fallback;}}
  setMeta(key,value){this.db.prepare('INSERT INTO desktop_meta VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value));}
  settings(){const s=this.meta('settings');return validateSettings(s)?s:defaults();}
  async backup(directory,kind='manual'){
    // SQLite's online backup includes committed WAL data without copying an open file.
    await mkdir(directory,{recursive:true,mode:0o700});
    const id=randomUUID(),name=`daily-bites-${new Date().toISOString().replace(/[:.]/g,'-')}-${id}.sqlite`,path=join(directory,name),temp=`${path}.partial`;
    try{await backup(this.db,temp);const check=new DatabaseSync(temp);try{check.exec('PRAGMA journal_mode=DELETE');if(check.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw Error('Backup integrity check failed');}finally{check.close();}await chmod(temp,0o600);await rename(temp,path);}catch(error){await unlink(temp).catch(()=>{});throw error;}
    const item={id,path,name,kind,createdAt:new Date().toISOString()};
    this.setMeta('backups',[item,...this.meta('backups',[])]);this.setMeta('lastBackupAt',item.createdAt);return item;
  }
  async prune(retention){
    const list=this.meta('backups',[]),keep=list.slice(0,retention),failed=[];
    for(const item of list.slice(retention)){try{await unlink(item.path);}catch(error){if(error.code!=='ENOENT')failed.push(item);}}
    this.setMeta('backups',[...keep,...failed]);
  }
  async eraseBackups(){const failed=[];for(const item of this.meta('backups',[]))try{await unlink(item.path);}catch(e){if(e.code!=='ENOENT')failed.push(item);}this.setMeta('backups',failed);if(failed.length)throw Error('Some backup files could not be deleted.');}
  clear(){this.db.exec('PRAGMA secure_delete=ON; BEGIN IMMEDIATE; DELETE FROM app_state; DELETE FROM desktop_meta; COMMIT; PRAGMA wal_checkpoint(TRUNCATE); VACUUM; PRAGMA wal_checkpoint(TRUNCATE);');}
  close(){this.db.close();}
}
export async function readSQLiteSnapshot(path){
  if((await stat(path)).size>64*1024*1024)throw Error('Backup exceeds 64 MiB');
  const db=new DatabaseSync(path,{readOnly:true});
  try{
    db.exec('PRAGMA trusted_schema=OFF; PRAGMA query_only=ON;');
    if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw Error('Invalid SQLite backup');
    // Extract only validated health collections, never external SQL, settings or paths.
    const rows=db.prepare('SELECT key,value FROM app_state WHERE key IN (?,?,?,?,?)').all(...Object.values(DATA_KEYS));
    const map=new Map(rows.map(r=>[r.key,r.value]));
    const snapshot=readSnapshot({getItem:key=>map.get(key)??null});
    return parseBackup(JSON.stringify(snapshot));
  }finally{db.close();}
}
