import { backupDue, dueReminders, BACKUP_META_KEY } from './wellbeing.js';
import { translateText } from './i18n.js';

export function setupOffline({$,toast,getPreferences,savePreferences}) {
  let installPrompt,registration,lastSent={};
  const sentKey='daily-bites.reminders-sent.v1';
  try{const saved=JSON.parse(localStorage.getItem(sentKey)??'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))lastSent=saved;}catch{/* Invalid reminder metadata does not block the diary. */}
  const secure=window.isSecureContext;
  function connection() {
    $('#offline-status').textContent=!secure?'离线安装需要 HTTPS 或 localhost。':!('serviceWorker' in navigator)?'此浏览器不支持离线安装，仍可在线使用。':navigator.onLine?'已联网，正在检查离线准备状态。':'当前离线；已缓存的功能仍可使用。';
  }
  function notificationStatus() {
    $('#notification-status').textContent=!('Notification' in window)?'此浏览器暂不支持系统通知，仍可使用页面内提醒。':Notification.permission==='granted'?'系统通知已允许；仅在应用打开时触发。':Notification.permission==='denied'?'系统通知已被浏览器禁止，仍可使用页面内提醒。':'系统通知未授权，可自行选择允许。';
    $('#notification-enable').disabled=!('Notification' in window)||Notification.permission!=='default';
  }
  function backupStatus() {
    let at;try{at=JSON.parse(localStorage.getItem(BACKUP_META_KEY)??'{}').lastExportAt;}catch{/* Treat absent/invalid backup metadata as not backed up. */}
    $('#backup-reminder').textContent=backupDue(at,getPreferences().backupDays)?'到备份时间了，建议导出并妥善保存完整 JSON 备份。':getPreferences().backupDays?'备份提醒已设置；导出操作不代表文件已完成保存。':'备份提醒已关闭，可随时手动导出。';
  }
  function settings() {
    const p=getPreferences();$('#reminders-enabled').checked=p.reminders;$('#reminder-meal-time').value=p.mealTime;$('#reminder-exercise-time').value=p.exerciseTime;$('#backup-frequency').value=p.backupDays;notificationStatus();backupStatus();
  }
  $('#reminder-form').addEventListener('submit',event=>{
    event.preventDefault();if(savePreferences({...getPreferences(),reminders:$('#reminders-enabled').checked,mealTime:$('#reminder-meal-time').value,exerciseTime:$('#reminder-exercise-time').value,backupDays:Number($('#backup-frequency').value)})){settings();toast('提醒设置已保存');tick();}
  });
  $('#notification-enable').addEventListener('click',async()=>{if(!('Notification' in window))return;try{await Notification.requestPermission();}catch{toast('系统通知暂不可用，仍可使用页面内提醒。');}notificationStatus();});
  $('#backup-now').addEventListener('click',()=>$('#export').click());
  $('#install-app').addEventListener('click',async()=>{if(!installPrompt)return;try{await installPrompt.prompt();await installPrompt.userChoice;}finally{installPrompt=null;$('#install-app').hidden=true;}});
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('#install-app').hidden=false;});
  window.addEventListener('appinstalled',()=>{$('#install-app').hidden=true;$('#install-help').textContent='已安装到桌面，可以像应用一样打开。';});
  $('#offline-update').addEventListener('click',()=>{registration?.waiting?.postMessage({type:'SKIP_WAITING'});});
  let updateRequested=false;
  $('#offline-update').addEventListener('click',()=>{updateRequested=true;});
  navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(updateRequested)location.reload();});
  function readyStatus() {
    if(registration?.active)$('#offline-status').textContent=navigator.onLine?'离线资源已准备好，可断网使用本地功能。':'当前离线，正在使用已缓存的应用资源。';
    $('#offline-update').hidden=!registration?.waiting;
  }
  connection();settings();
  for(const event of ['online','offline'])window.addEventListener(event,()=>{connection();readyStatus();});
  if(secure&&'serviceWorker' in navigator) {
    navigator.serviceWorker.register(new URL('./service-worker.js',import.meta.url),{type:'module',scope:'./',updateViaCache:'none'}).then(value=>{
      registration=value;readyStatus();
      const watch=()=>{const worker=value.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){$('#offline-status').textContent='离线资源已准备好，可断网使用本地功能。';$('#offline-update').hidden=!value.waiting;}if(worker.state==='activated')readyStatus();if(worker.state==='redundant')$('#offline-status').textContent='离线准备未完成，请联网后刷新重试。';});};
      watch();value.addEventListener('updatefound',watch);navigator.serviceWorker.ready.then(readyStatus);
    }).catch(()=>{$('#offline-status').textContent='离线准备未完成，请联网后刷新重试。';});
  }
  function tick() {
    for(const event of dueReminders(getPreferences(),new Date(),lastSent)) {
      // A second tab seeing this key will not deliver another copy in this minute.
      try {const raw=JSON.parse(localStorage.getItem(sentKey)??'{}'),saved=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};if(saved[event.kind]===event.date)continue;lastSent={...saved,[event.kind]:event.date};localStorage.setItem(sentKey,JSON.stringify(lastSent));}catch{lastSent[event.kind]=event.date;}
      const message=event.kind==='meal'?'到用餐提醒时间了，记得规律吃饭并核对记录。':'到运动提醒时间了，按身体状态安排运动与恢复。';
      $('#reminder-status').textContent=message;toast(message);
      if('Notification' in window&&Notification.permission==='granted')try {
        if(registration)registration.showNotification(translateText('一日食记'),{body:translateText(message),tag:`daily-bites-${event.kind}`,icon:new URL('./app-icon-192.png',import.meta.url).href}).catch(()=>{});
        else new Notification(translateText('一日食记'),{body:translateText(message)});
      }catch{/* In-page reminder remains visible. */}
    }
    backupStatus();
  }
  setInterval(tick,30000);tick();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  document.addEventListener('backup-exported',backupStatus);
  document.addEventListener('languagechange',()=>{settings();connection();readyStatus();});
  return {refresh:settings};
}
