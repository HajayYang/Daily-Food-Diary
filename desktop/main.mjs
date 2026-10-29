import { app, BrowserWindow, protocol, net, ipcMain, dialog, shell, Tray, Menu, nativeImage, Notification, session } from 'electron';
import { readFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PersonalStore, validateSettings, readSQLiteSnapshot } from './personal-store.mjs';
import { DesktopUpdater } from './updater.mjs';
import { PUBLIC_ASSETS } from '../offline-assets.js';
import { createFoodSearchHandler } from '../food-search.js';
import { parseBackup, MAX_BACKUP_BYTES } from '../backup.js';
import { defaultWellbeing, validWellbeing, dueReminders } from '../wellbeing.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const testMode=process.argv.includes('--desktop-test');
if(testMode){const dir=process.argv.find(a=>a.startsWith('--test-data='))?.slice(12);if(!dir)throw Error('Test data directory required');app.setPath('userData',dir);}
app.setName('Daily Bites');app.setAppUserModelId('io.github.hajayyang.dailybites');
protocol.registerSchemesAsPrivileged([{scheme:'daily-bites',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,allowServiceWorkers:false,corsEnabled:true}}]);
let window,tray,store,quitting=false,ticking=false,lastError='',maintenance=false,cameraGranted=false,writeBlocked=false;
const assets=new Set(PUBLIC_ASSETS),origin='daily-bites://app';
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.wasm':'application/wasm','.sqlite':'application/vnd.sqlite3','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const mime=name=>Object.entries(types).find(([ext])=>name.endsWith(ext))?.[1]??'text/plain';
const allowedSender=event=>event.sender===window?.webContents&&event.senderFrame===window.webContents.mainFrame&&event.senderFrame.url.startsWith(`${origin}/`);
const show=()=>{window?.show();window?.focus();};
const foodHandler=createFoodSearchHandler({fetcher:(...args)=>net.fetch(...args)});
const backupDir=()=>store.meta('backupDirectory',join(app.getPath('userData'),'backups'));
async function makeBackup(kind='manual'){const item=await store.backup(backupDir(),kind);await store.prune(store.settings().retention);lastError='';return item;}
function notify(body){if(!Notification.isSupported())throw Error('System notifications unavailable');const n=new Notification({title:'Daily Bites · 一日食记',body,icon:join(root,'app-icon-192.png')});n.on('click',show);n.show();}
function status(){return {version:app.getVersion(),platform:process.platform,dataPath:store.path,backupDirectory:backupDir(),settings:store.settings(),backups:store.meta('backups',[]).map(({id,name,kind,createdAt})=>({id,name,kind,createdAt})),lastBackupAt:store.meta('lastBackupAt'),lastError,notifications:Notification.isSupported(),autoStartSupported:process.platform==='win32'&&app.isPackaged};}
async function runExclusive(action){if(maintenance||ticking)throw Error('Another backup or restore is in progress');maintenance=true;try{return await action();}finally{maintenance=false;}}
async function tick(){if(ticking||maintenance||quitting)return;ticking=true;try{
  const p=store.settings(),last=Date.parse(store.meta('lastBackupAt'));
  if(p.backupHours&&(!Number.isFinite(last)||Date.now()-last>=p.backupHours*3600000))await makeBackup('automatic');
  let wellbeing;try{wellbeing=JSON.parse(store.getItem('daily-bites.wellbeing.v1')??'null');}catch{}
  const preferences=validWellbeing(wellbeing)?wellbeing.preferences:defaultWellbeing().preferences,sent=store.meta('remindersSent',{});
  for(const item of dueReminders(preferences,new Date(),sent)){notify(item.kind==='meal'?'到用餐时间了，记得规律吃饭并记录。':'到运动时间了，按身体状态安排运动与恢复。');sent[item.kind]=item.date;store.setMeta('remindersSent',sent);}
}catch(error){lastError=error.message;}finally{ticking=false;}}
async function desktopAction(action,value){
  switch(action){
    case 'status':return status();
    case 'settings':{
      if(!validateSettings(value))throw Error('Invalid desktop settings');
      if(value.autoStart&&!(process.platform==='win32'&&app.isPackaged))throw Error('Startup is supported by the installed Windows app');
      if(process.platform==='win32'&&app.isPackaged)app.setLoginItemSettings({openAtLogin:value.autoStart,args:['--hidden']});
      store.setMeta('settings',value);return status();
    }
    case 'backup':return runExclusive(async()=>{await makeBackup();return status();});
    case 'backup-folder':return runExclusive(async()=>{const r=await dialog.showOpenDialog(window,{properties:['openDirectory','createDirectory']});if(!r.canceled){await store.backup(r.filePaths[0],'folder-check');store.setMeta('backupDirectory',r.filePaths[0]);await store.prune(store.settings().retention);}return status();});
    case 'import':return runExclusive(async()=>{
      const r=await dialog.showOpenDialog(window,{properties:['openFile'],filters:[{name:'Daily Bites backup',extensions:['json','sqlite']}]});if(r.canceled)return null;
      const path=r.filePaths[0];let snapshot;
      if(path.toLowerCase().endsWith('.sqlite'))snapshot=await readSQLiteSnapshot(path);else{if((await stat(path)).size>MAX_BACKUP_BYTES)throw Error('JSON backup must be smaller than 2 MiB');snapshot=parseBackup(await readFile(path,'utf8'));}
      await makeBackup('before-import');return snapshot;
    });
    case 'restore':return runExclusive(async()=>{if(typeof value!=='string')throw Error('Invalid backup');const item=store.meta('backups',[]).find(i=>i.id===value);if(!item)throw Error('Backup not found');const snapshot=await readSQLiteSnapshot(item.path);await makeBackup('before-restore');return snapshot;});
    case 'data-folder':{const error=await shell.openPath(dirname(store.path));if(error)throw Error(error);return true;}
    case 'notify':notify('系统通知测试成功。程序运行或留在托盘时可以提醒；完全退出后不提醒。');return true;
    case 'erase':return runExclusive(async()=>{const r=await dialog.showMessageBox(window,{type:'warning',buttons:['取消','删除本机记录及应用创建的备份'],defaultId:0,cancelId:0,message:'清除 Daily Bites 的个人数据库、背景及已登记的自动/手动备份？',detail:'此操作不能撤销；外部导出的 JSON 文件和云端记录不会被删除。'});if(r.response!==1)return false;await store.eraseBackups();writeBlocked=true;if(process.platform==='win32'&&app.isPackaged)app.setLoginItemSettings({openAtLogin:false});store.clear();await session.defaultSession.clearStorageData();writeBlocked=false;return true;});
    case 'update-check':return updater.check();
    case 'update-download':return updater.download();
    case 'update-install':{if(process.platform!=='win32')throw Error('Updates currently support Windows only');const path=await updater.verifiedPath();await runExclusive(()=>makeBackup('before-update'));const error=await shell.openPath(path);if(error)throw Error(error);return true;}
    default:throw Error('Unsupported operation');
  }
}
let updater;
if(!app.requestSingleInstanceLock())app.quit();else{
app.on('second-instance',show);
app.on('before-quit',()=>{quitting=true;});
app.on('window-all-closed',()=>{if(!store?.settings().closeToTray||!tray)app.quit();});
app.on('will-quit',()=>{store?.close();});
app.whenReady().then(async()=>{
try{store=await PersonalStore.open(app.getPath('userData'));}catch(error){dialog.showErrorBox('Daily Bites · 数据库无法打开',`${error.message}\n现有数据库未被覆盖。请保留数据文件并联系维护者。`);app.quit();}
if(store){
updater=new DesktopUpdater({version:app.getVersion(),directory:join(app.getPath('userData'),'updates'),cachePath:join(app.getPath('userData'),'sigstore'),fetcher:(...args)=>net.fetch(...args)});
protocol.handle('daily-bites',async request=>{
  try{const url=new URL(request.url);if(url.host!=='app'||request.method!=='GET')return new Response('Not found',{status:404});
  if(url.pathname==='/api/food-search')return foodHandler(new Request(`https://daily-bites.invalid${url.pathname}${url.search}`));
  const name=decodeURIComponent(url.pathname).slice(1)||'index.html';if(!assets.has(name))return new Response('Not found',{status:404});
  return new Response(await readFile(join(root,name)),{headers:{'Content-Type':mime(name),'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: http://localhost:* http://127.0.0.1:*; worker-src 'self'; object-src 'none'; base-uri 'self'; frame-src 'none'; form-action 'none'"}});
  }catch{return new Response('Unavailable',{status:404});}
});
ipcMain.on('daily-bites:storage',(event,operation,...args)=>{
 try{
  if(!allowedSender(event)||quitting||(maintenance||writeBlocked)&&operation!=='get'&&operation!=='keys')throw Error('Storage is busy or unavailable');
  let value;
  if(operation==='get')value=store.getItem(args[0]);else if(operation==='set')store.setItem(args[0],args[1]);else if(operation==='remove')store.removeItem(args[0]);else if(operation==='keys')value=store.keys();else if(operation==='batch')store.batch(args[0]);else throw Error('Unsupported storage operation');
  event.returnValue={ok:true,value};
 }catch(error){event.returnValue={ok:false,error:error.message};}
});
ipcMain.handle('daily-bites:desktop',async(event,action,value)=>{try{if(!allowedSender(event))throw Error('Invalid caller');return {ok:true,value:await desktopAction(action,value)};}catch(error){return {ok:false,error:error.message};}});
window=new BrowserWindow({width:1440,height:960,minWidth:1000,minHeight:700,show:false,backgroundColor:'#f6f7f1',icon:join(root,'app-icon-512.png'),webPreferences:{preload:join(root,'desktop/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
window.setMenuBarVisibility(false);
window.webContents.on('did-finish-load',()=>{writeBlocked=false;});
window.webContents.setWindowOpenHandler(({url})=>{if(/^https?:\/\//.test(url))shell.openExternal(url);return {action:'deny'};});
window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(`${origin}/`)){event.preventDefault();if(/^https?:\/\//.test(url))shell.openExternal(url);}});
window.webContents.on('will-redirect',event=>event.preventDefault());
session.defaultSession.setPermissionRequestHandler(async(contents,permission,callback,details)=>{
  if(contents!==window.webContents||!details.requestingUrl?.startsWith(`${origin}/`)||permission!=='media'||details.mediaTypes?.some(t=>t!=='video'))return callback(false);
  const result=await dialog.showMessageBox(window,{type:'question',message:'允许本次使用摄像头拍照或扫码？',detail:'摄像头仅在你开启时使用。照片识别需另行确认上传。',buttons:['不允许','允许'],defaultId:0,cancelId:0});cameraGranted=result.response===1;callback(cameraGranted);
});
session.defaultSession.setPermissionCheckHandler((_contents,permission,requestingOrigin)=>cameraGranted&&permission==='media'&&requestingOrigin===origin);
try{tray=new Tray(nativeImage.createFromPath(join(root,'app-icon-192.png')).resize({width:24,height:24}));tray.setToolTip('Daily Bites · 一日食记');tray.setContextMenu(Menu.buildFromTemplate([{label:'打开一日食记',click:show},{type:'separator'},{label:'退出',click:()=>app.quit()}]));tray.on('double-click',show);}catch{/* Without a tray, closing always quits. */}
window.on('close',event=>{if(!quitting&&tray&&store.settings().closeToTray){event.preventDefault();window.hide();}});
window.once('ready-to-show',()=>{if(!process.argv.includes('--hidden')||!tray)show();});
await window.loadURL(`${origin}/index.html`);
if(!testMode){setInterval(tick,30000).unref();tick();}
}
}).catch(error=>{dialog.showErrorBox('Daily Bites',error.message);app.quit();});
}
