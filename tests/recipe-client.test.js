import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeClient } from '../recipe-client.js';
import { registerTranslations, setLanguage, translateText } from '../i18n.js';
import { MESSAGES } from '../locales.js';
class WorkerFixture extends EventTarget {
 messages=[];terminated=false;
 postMessage(message){this.messages.push(message);}
 reply(data){this.dispatchEvent(new MessageEvent('message',{data}));}
 terminate(){this.terminated=true;}
}
test('worker client correlates out-of-order replies and rejects failed queries without inventing results',async()=>{
 const worker=new WorkerFixture(),client=createRecipeClient({workerFactory:()=>worker});
 const init=client.initialize();worker.reply({id:1,data:{total:108}});assert.equal((await init).total,108);
 const slow=client.search({query:'宫保'}),fast=client.search({query:'龙井'});
 worker.reply({id:3,data:{total:1,recipes:[{id:'tea'}]}});worker.reply({id:2,data:{total:1,recipes:[{id:'chicken'}]}});
 assert.equal((await fast).recipes[0].id,'tea');assert.equal((await slow).recipes[0].id,'chicken');
 const bad=assert.rejects(client.detail('missing'),/recipe_not_found/);worker.reply({id:4,error:{code:'recipe_not_found'}});await bad;
 client.close();assert.equal(worker.terminated,true);
});
test('worker errors and timeouts reject pending work and allow a fresh worker to be initialized',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const workers=[],client=createRecipeClient({workerFactory:()=>{const worker=new WorkerFixture();workers.push(worker);return worker;}});
 const timeout=assert.rejects(client.initialize(),/recipe_database_unavailable/);t.mock.timers.tick(45000);await timeout;assert.equal(workers[0].terminated,true);
 const error=assert.rejects(client.initialize(),/recipe_database_unavailable/);workers[1].dispatchEvent(new Event('error',{cancelable:true}));await error;
 const retry=client.initialize();workers[2].reply({id:3,data:{total:108}});assert.equal((await retry).total,108);client.close();
});
test('catalog translations can add new dish names without prototype pollution or partial invalid updates',()=>{
 const phrase='数据库新增菜名测试';const original=Object.getPrototypeOf(MESSAGES);
 try {
  registerTranslations({[phrase]:['Database dish','データベース料理','데이터베이스 요리']});setLanguage('en');assert.equal(translateText(phrase),'Database dish');
  assert.throws(()=>registerTranslations({[phrase]:['changed','changed','changed'],bad:['only one']}));assert.equal(translateText(phrase),'Database dish');
  assert.throws(()=>registerTranslations(Object.fromEntries([['__proto__',['bad','bad','bad']]])));assert.equal(Object.getPrototypeOf(MESSAGES),original);
 }finally{delete MESSAGES[phrase];setLanguage('zh-CN');}
});
