const {contextBridge,ipcRenderer}=require('electron');
const sync=(operation,...args)=>{const result=ipcRenderer.sendSync('daily-bites:storage',operation,...args);if(!result?.ok)throw Error(result?.error||'Storage unavailable');return result.value;};
const invoke=async(action,value)=>{const result=await ipcRenderer.invoke('daily-bites:desktop',action,value);if(!result?.ok)throw Error(result?.error||'Desktop operation failed');return result.value;};
contextBridge.exposeInMainWorld('dailyBitesDesktop',Object.freeze({
  isDesktop:true,
  storage:Object.freeze({get:key=>sync('get',key),set:(key,value)=>sync('set',key,value),remove:key=>sync('remove',key),keys:()=>sync('keys'),batch:changes=>sync('batch',changes)}),
  status:()=>invoke('status'),settings:value=>invoke('settings',value),backup:()=>invoke('backup'),chooseBackupFolder:()=>invoke('backup-folder'),
  importFile:()=>invoke('import'),restore:id=>invoke('restore',id),openDataFolder:()=>invoke('data-folder'),notify:()=>invoke('notify'),erase:()=>invoke('erase'),
  checkUpdate:()=>invoke('update-check'),downloadUpdate:()=>invoke('update-download'),installUpdate:()=>invoke('update-install')
}));
