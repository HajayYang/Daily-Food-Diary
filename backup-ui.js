import { isDesktop, localStore } from './app-storage.js';
import { MAX_BACKUP_BYTES, parseBackup, readSnapshot, canonical, planImport, applyImport } from './backup.js';
import { createSyncClient, validSyncConfig } from './sync-client.js';
import { translateText } from './i18n.js';
export function setupBackup({$,element,toast}){
 const dialog=$('#backup-dialog');let incoming=null,baseline=null,plan=null,busy=false,client,remoteRevision=null;
 const configKey='daily-bites.sync-config.v1',sessionKey='daily-bites.sync-session.v1';
 const status=text=>$('#backup-status').textContent=text;
 const cloudStatus=text=>$('#sync-status').textContent=text;
 function saveSession(value){try{if(value)sessionStorage.setItem(sessionKey,JSON.stringify({url:$('#sync-url').value,...value}));else sessionStorage.removeItem(sessionKey);}catch{/* Session remains usable in memory. */}}
 try{const config=JSON.parse(localStore.getItem(configKey)??'null');if(validSyncConfig(config)){$('#sync-url').value=config.url;$('#sync-key').value=config.key;client=createSyncClient(config,{onSession:saveSession});const saved=JSON.parse(sessionStorage.getItem(sessionKey)??'null');if(saved?.url===config.url)client.restore(saved);}}catch{/* Optional cloud configuration never blocks local tools. */}
 function controls(){for(const id of ['sync-login','sync-register','sync-check','sync-upload','sync-download','sync-logout'])$(`#${id}`).disabled=busy;$('#sync-upload').disabled=busy||!client?.user()||remoteRevision===null;$('#sync-download').disabled=busy||!client?.user();$('#sync-check').disabled=busy||!client?.user();$('#sync-logout').disabled=busy||!client?.user();$('#sync-url').disabled=busy||Boolean(client?.user());$('#sync-key').disabled=busy||Boolean(client?.user());$('#sync-email').disabled=busy||Boolean(client?.user());$('#sync-password').disabled=busy||Boolean(client?.user());$('#sync-login').disabled=busy||Boolean(client?.user());$('#sync-register').disabled=busy||Boolean(client?.user());$('#sync-account').textContent=client?.user()?.email??'';$('#sync-account').translate=false;}
 $('#backup-open').addEventListener('click',()=>{dialog.showModal();controls();});$('#close-backup').addEventListener('click',()=>dialog.close());
 function preview(data){incoming=data;baseline=readSnapshot();$('#import-preview').hidden=false;updatePreview();}
 function updatePreview(){if(!incoming)return;try{plan=planImport(baseline,incoming,{conflict:$('#import-conflict').value,settings:$('#import-settings').checked});const c=plan.counts;$('#import-counts').textContent=`新增饮食 ${c.records} 条、运动 ${c.workouts} 项、收藏 ${c.favorites} 项、购物 ${c.shopping} 项、健康习惯 ${c.habits} 项；冲突 ${c.conflicts} 项，重复 ${c.duplicates} 项。`;$('#import-apply').disabled=false;status('已校验备份，请核对数量和冲突处理后再导入。');}catch(error){plan=null;$('#import-apply').disabled=true;status(error.message);}}
 $('#import-file').addEventListener('change',async()=>{incoming=null;plan=null;$('#import-preview').hidden=true;const file=$('#import-file').files?.[0];if(!file)return;try{if(file.size>MAX_BACKUP_BYTES)throw Error('备份文件必须小于 2 MiB。');preview(parseBackup(await file.text()));}catch(error){status(error.message);}});
 for(const id of ['import-conflict','import-settings'])$(`#${id}`).addEventListener('change',updatePreview);
 $('#import-apply').addEventListener('click',async()=>{if(!plan||busy)return;const applying=plan,baselineAtStart=baseline;busy=true;$('#import-apply').disabled=true;try{if(isDesktop)await globalThis.dailyBitesDesktop.backup();if(plan!==applying||baseline!==baselineAtStart||canonical(readSnapshot())!==canonical(baseline))throw Error('本地数据在预览后发生变化，请重新选择备份或下载云端数据。');applyImport(applying.snapshot);toast('导入成功，即将刷新显示。');location.reload();}catch(error){status(error.message);}finally{busy=false;$('#import-apply').disabled=!plan;}});
 async function task(action){if(busy)return;busy=true;controls();try{await action();}catch(error){cloudStatus(error.message);}finally{busy=false;controls();}}
 async function auth(register){const config={url:$('#sync-url').value.trim().replace(/\/$/,''),key:$('#sync-key').value.trim()},email=$('#sync-email').value.trim(),password=$('#sync-password').value;
  if(!validSyncConfig(config))throw Error('请填写 Supabase 项目地址和公开 publishable / anon key，不能使用 service_role 或 secret key。');if(!email||password.length<8)throw Error('请填写邮箱和至少 8 位密码。');
  $('#sync-url').value=config.url;client=createSyncClient(config,{onSession:saveSession});remoteRevision=null;try{const user=await client[register?'signUp':'signIn'](email,password);try{localStore.setItem(configKey,JSON.stringify(config));}catch{toast('云同步配置未能保存，本次连接仍可使用。');}$('#sync-password').value='';cloudStatus(user?'已登录。请先检查云端版本，再选择上传或下载。':'注册已提交，请前往邮箱验证后登录。');}finally{$('#sync-password').value='';}
 }
 $('#sync-login').addEventListener('click',()=>task(()=>auth(false)));$('#sync-register').addEventListener('click',()=>task(()=>auth(true)));
 $('#sync-logout').addEventListener('click',()=>task(async()=>{await client.signOut();remoteRevision=null;cloudStatus('已退出云同步，本地记录保留。');}));
 $('#sync-check').addEventListener('click',()=>task(async()=>{const remote=await client.download();remoteRevision=remote?.revision??0;cloudStatus(remote?'已检查云端版本。建议先下载预览并合并，再上传本机记录。':'云端暂无备份，可以上传本机数据。');}));
 $('#sync-download').addEventListener('click',()=>task(async()=>{const remote=await client.download();remoteRevision=remote?.revision??0;if(!remote){cloudStatus('云端暂无备份，可以上传本机数据。');return;}preview(remote.payload);cloudStatus('云端数据已读取，仅生成导入预览，尚未修改本地记录。');$('#import-preview').scrollIntoView({block:'nearest',behavior:'smooth'});}));
 $('#sync-upload').addEventListener('click',()=>task(async()=>{const snapshot=readSnapshot();if(remoteRevision===null)throw Error('请先检查云端版本。');
  const current=await client.download();if((current?.revision??0)!==remoteRevision)throw Error('云端已被另一设备更新，请先下载并合并，再重新上传。');
  const collections=data=>[data.records,data.fitness?.workouts??[],data.lifestyle?.favorites??[],data.lifestyle?.shopping??[],...['pantry','measurements','hydration','mealPlans'].map(key=>data.wellbeing?.[key]??[])];
  if(current&&collections(current.payload).some((items,index)=>items.some(item=>!collections(snapshot)[index].some(local=>local.id===item.id)))){preview(current.payload);cloudStatus('云端含本机没有的记录，请先在预览中合并，再上传。');return;}
  if(!confirm(translateText('将把本机饮食、运动、收藏、禁忌、购物清单、库存、身体测量、饮水和用餐计划上传到你的 Supabase 账号，并更新该账号的云端备份。确定继续？')))return;if(canonical(readSnapshot())!==canonical(snapshot))throw Error('本地数据在预览后发生变化，请重新选择备份或下载云端数据。');const revision=await client.upload(snapshot,remoteRevision);if(!Number.isSafeInteger(revision))throw Error('云服务响应无效，请检查部署配置。');remoteRevision=revision;cloudStatus('已上传云端备份。另一设备登录同一账号后可下载预览并合并。');}));
 controls();return {preview};
}
