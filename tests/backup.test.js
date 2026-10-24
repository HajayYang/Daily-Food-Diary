import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBackup, planImport, applyImport, readSnapshot, DATA_KEYS } from '../backup.js';
import { recoverImport, JOURNAL_KEY, writeLocal } from '../storage.js';
import { defaultLifestyle } from '../lifestyle.js';
const record={id:'a',date:'2026-10-23',meal:'lunch',food:'米饭',portion:'100g',calories:null,note:''};
const snapshot=(records=[])=>({version:4,records,fitness:null,nextDay:null,lifestyle:defaultLifestyle(),wellbeing:null});
function storage(){const map=new Map();return {map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};}
test('backup accepts legacy exports, unknown nutrients and zeroes but rejects malformed or duplicate records before writing',()=>{
 assert.equal(parseBackup(JSON.stringify({version:1,records:[record]})).records[0].calories,null);
 for(const data of [{version:3,records:[record,record]},{version:3,records:[{...record,sodium:-1}]},{version:99,records:[]}])assert.throws(()=>parseBackup(JSON.stringify(data)));
 assert.throws(()=>parseBackup('{'));assert.throws(()=>parseBackup(' '.repeat(2*1024*1024+1)));
 const data=parseBackup(JSON.stringify({...snapshot([record]),apiKey:'never-import',password:'not-copied'}));assert.equal(data.apiKey,undefined);assert.equal(data.password,undefined);
});
test('merge previews explicit ID conflicts, skips duplicates and preserves local settings by default',()=>{
 const local=snapshot([record]),incoming=snapshot([{...record,calories:130},{...record,id:'b'}]);local.lifestyle.restrictions.allergens=['milk'];incoming.lifestyle.restrictions.allergens=['soy'];
 const keep=planImport(local,incoming);assert.deepEqual(keep.counts,{records:1,workouts:0,favorites:0,shopping:0,habits:0,conflicts:1,duplicates:0});assert.equal(keep.snapshot.records[0].calories,null);assert.deepEqual(keep.snapshot.lifestyle.restrictions.allergens,['milk']);
 const replace=planImport(local,incoming,{conflict:'backup',settings:true});assert.equal(replace.snapshot.records[0].calories,130);assert.deepEqual(replace.snapshot.lifestyle.restrictions.allergens,['soy']);assert.equal(planImport(local,snapshot([record])).counts.duplicates,1);assert.equal(local.records[0].calories,null);
});
test('multi-store import commits all data and leaves no journal on success',()=>{
 const store=storage();const data=snapshot([record]);applyImport(data,store);assert.equal(store.getItem(JOURNAL_KEY),null);assert.deepEqual(readSnapshot(store),data);
});
test('quota failure during import rolls every changed store back and preserves original raw data',()=>{
 const store=storage(),old=JSON.stringify([record]);store.setItem(DATA_KEYS.records,old);const original=store.setItem;let failed=false;
 store.setItem=(key,value)=>{if(key===DATA_KEYS.lifestyle&&!failed){failed=true;throw Error('quota');}return original(key,value);};
 assert.throws(()=>applyImport(snapshot([{...record,id:'b'}]),store),/恢复/);assert.equal(store.getItem(DATA_KEYS.records),old);assert.equal(store.getItem(DATA_KEYS.lifestyle),null);assert.equal(store.getItem(JOURNAL_KEY),null);
});
test('journal quota failure changes nothing; persistent rollback failure blocks writes until recovery',()=>{
 const store=storage();store.setItem(DATA_KEYS.records,JSON.stringify([record]));const original=store.setItem;store.setItem=()=>{throw Error('full');};assert.throws(()=>applyImport(snapshot([]),store));assert.equal(store.getItem(DATA_KEYS.records),JSON.stringify([record]));
 store.setItem=original;store.setItem(JOURNAL_KEY,JSON.stringify([[DATA_KEYS.records,JSON.stringify([record])]]));store.setItem(DATA_KEYS.records,'[]');assert.throws(()=>writeLocal(DATA_KEYS.records,'[]',store));assert.ok(recoverImport(store));assert.equal(store.getItem(DATA_KEYS.records),JSON.stringify([record]));
});
