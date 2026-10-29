import { isDesktop, localStore, storageKeys } from './app-storage.js';
import { BACKUP_META_KEY } from './wellbeing.js';
import { blockExternalWrites } from './storage.js';

export function setupPrivacy({$,element}) {
  const dialog=$('#privacy-dialog');
  async function summary() {
    const pairs=[];
    try {
      const keys=storageKeys().filter(key=>key.startsWith('daily-bites.'));
      const bytes=keys.reduce((n,key)=>n+new TextEncoder().encode(localStore.getItem(key)??'').length,0);
      let last;try{last=JSON.parse(localStore.getItem(BACKUP_META_KEY)??'{}').lastExportAt;}catch{}
      pairs.push(['应用本地存储',`${keys.length} keys · ${(bytes/1024).toFixed(1)} KiB`],['最近发起导出',last?new Date(last).toLocaleString():'尚未导出']);
      const configured=Boolean(localStore.getItem('daily-bites.sync-config.v1')),session=Boolean(sessionStorage.getItem('daily-bites.sync-session.v1'));
      pairs.push(['云同步状态',session?'本标签页存在登录会话；手动同步':configured?'已保存云端配置，当前未登录':'未配置云同步']);
      pairs.push(['饮食与身体资料',isDesktop?'本机 SQLite 数据库':'本浏览器 localStorage'],['背景图片',isDesktop?'本机应用 IndexedDB':'本浏览器 IndexedDB'],['公开离线资源',isDesktop?'安装包内置资源':'本浏览器 Cache Storage']);
      $('#privacy-summary').replaceChildren(...pairs.map(([label,value])=>{const row=element('div');row.append(element('dt','',label),element('dd','',value));return row;}));
    }catch{$('#privacy-status').textContent='浏览器存储不可用，无法读取数据状态。';}
  }
  $('#privacy-open').addEventListener('click',()=>{dialog.showModal();$('#privacy-delete-text').value='';$('#privacy-delete').disabled=true;summary();});
  $('#privacy-close').addEventListener('click',()=>dialog.close());
  $('#privacy-export').addEventListener('click',()=>$('#export').click());
  $('#privacy-backup').addEventListener('click',()=>{dialog.close();$('#backup-open').click();});
  $('#privacy-delete-text').addEventListener('input',event=>{$('#privacy-delete').disabled=event.target.value!=='DELETE';});
  $('#privacy-delete').addEventListener('click',async()=>{
    if($('#privacy-delete-text').value!=='DELETE')return;
    $('#privacy-delete').disabled=true;
    if(isDesktop){try{const erased=await globalThis.dailyBitesDesktop.erase();if(erased){blockExternalWrites();location.reload();}else $('#privacy-delete').disabled=false;}catch(error){$('#privacy-status').textContent=error.message;$('#privacy-delete').disabled=false;}return;}
    blockExternalWrites(); // A partial deletion must not allow stale UI data to be saved back.
    try {
      // Delete only this app's stores and worker scope, never the whole origin.
      for(const key of storageKeys())if(key.startsWith('daily-bites.'))localStore.removeItem(key);
      for(const key of Object.keys(sessionStorage))if(key.startsWith('daily-bites.'))sessionStorage.removeItem(key);
      const scope=new URL('./',import.meta.url).href;
      if('serviceWorker' in navigator)for(const r of await navigator.serviceWorker.getRegistrations())if(r.scope===scope)await r.unregister();
      if('caches' in window)for(const name of await caches.keys())if(name.startsWith('daily-bites.'))await caches.delete(name);
      await new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('daily-bites.appearance');request.onsuccess=resolve;request.onerror=()=>reject(Error());request.onblocked=()=>reject(Error());});
      location.reload();
    }catch{$('#privacy-status').textContent='部分本机数据未能删除，请关闭其他页面后重试；云端数据未修改。';$('#privacy-delete').disabled=false;}
  });
}
