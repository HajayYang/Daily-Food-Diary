import { isDesktop } from './app-storage.js';
import { translateText as t } from './i18n.js';
export function setupDesktop({preview}) {
 if(!isDesktop)return;
 const api=globalThis.dailyBitesDesktop,$=s=>document.querySelector(s);
 document.documentElement.classList.add('desktop-app');
 const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='./desktop.css';document.head.append(stylesheet);
 const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text)n.textContent=t(text);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
 const pages=[['overview','每日总览','.intro,.stats,.diary,.next-day-section,.calorie-charts'],['exercise','运动与身体','.wellness'],['plans','餐单与库存','.life-section,#daily-habits'],['recipes','食谱与食物','#cookbook,.food-discovery'],['settings','桌面与数据','#desktop-settings,#app-tools']];
 const nav=el('nav',null,{class:'desktop-sidebar','aria-label':t('桌面工作台')});nav.append(el('p','桌面工作台',{class:'eyebrow'}));
 let page='overview';
 function route(next){page=next;$('.toolbar').hidden=page==='settings';for(const [id,,selector] of pages)for(const node of document.querySelectorAll(selector))node.hidden=id!==page;for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-current',String(b.dataset.page===page));window.scrollTo(0,0);}
 pages.forEach(([id,label])=>{const b=el('button',label,{'data-page':id,type:'button'});b.onclick=()=>route(id);nav.append(b);});
 nav.append(el('small','快捷键：Ctrl+N 记餐 · Ctrl+F 搜索食谱 · Ctrl+1…5 切换 · Ctrl+, 设置 · Ctrl+Shift+B 备份'));
 document.body.prepend(nav);$('.local-badge').textContent=t('个人数据保存在本机 SQLite');
 const panel=el('section',null,{id:'desktop-settings',class:'wellness-card desktop-settings'});panel.append(el('p','WINDOWS · DAILY BITES',{class:'eyebrow'}),el('h2','桌面设置'));
 const status=el('p',null,{id:'desktop-status',role:'status'}),paths=el('p',null,{id:'desktop-paths',translate:'no',class:'muted'});panel.append(status,paths,el('h3','自动备份与迁移'),el('p','每次备份均检查完整性。恢复会先备份当前数据，再预览合并；不会直接覆盖原数据库。'));
 const controls=el('div',null,{class:'desktop-actions'});panel.append(controls);
 let busy=false,current;
 async function task(action){if(busy)return;busy=true;status.textContent=t('处理中…');for(const b of panel.querySelectorAll('button'))b.disabled=true;try{await action();if(status.textContent===t('处理中…'))status.textContent=t('操作完成');}catch(error){status.textContent=error.message;}finally{busy=false;for(const b of panel.querySelectorAll('button'))b.disabled=false;download.hidden=!updateAvailable;install.hidden=!downloaded;}}
 function button(parent,label,id,action){const b=el('button',label,{id,type:'button',class:'text-button'});b.onclick=()=>task(action);parent.append(b);return b;}
 function importPreview(snapshot){if(!snapshot)return;$('#backup-open').click();preview(snapshot);}
 button(controls,'立即备份','desktop-backup',async()=>refresh(await api.backup()));
 button(controls,'导入网页版 JSON / SQLite 备份','desktop-import',async()=>importPreview(await api.importFile()));
 button(controls,'选择备份文件夹','desktop-backup-folder',async()=>refresh(await api.chooseBackupFolder()));
 button(controls,'打开数据文件夹','desktop-data-folder',()=>api.openDataFolder());
 panel.append(el('p','首次使用：在网页版导出完整 JSON 备份，然后点击“导入网页版 JSON / SQLite 备份”。',{class:'muted'}));
 const form=el('form',null,{id:'desktop-settings-form',class:'desktop-settings-form'});
 function field(label,input){const l=el('label',label);l.append(input);form.append(l);return input;}
 const interval=field('备份间隔',el('select',null,{id:'desktop-backup-hours'}));for(const hours of [0,6,12,24,72,168])interval.append(el('option',hours?`${hours} h`:'关闭自动备份',{value:hours}));
 const retention=field('保留备份数量（1–30）',el('input',null,{id:'desktop-retention',type:'number',min:1,max:30,required:''}));
 const tray=field('关闭窗口后留在托盘',el('input',null,{id:'desktop-tray',type:'checkbox'})),startup=field('登录 Windows 时启动',el('input',null,{id:'desktop-startup',type:'checkbox'}));
 form.append(el('button','保存桌面设置',{class:'primary',type:'submit'}));form.onsubmit=event=>{event.preventDefault();task(async()=>refresh(await api.settings({backupHours:Number(interval.value),retention:Number(retention.value),closeToTray:tray.checked,autoStart:startup.checked})));};panel.append(form);
 const backups=el('ul',null,{id:'desktop-backups',class:'desktop-backups'});panel.append(backups);
 panel.append(el('p','提醒时间在下方设置。程序运行或留在托盘时可提醒；完全退出后不会提醒。'));
 button(panel,'测试系统通知','desktop-notify',()=>api.notify());
 panel.append(el('h3','检查更新'),el('p','更新会验证 GitHub Actions 的 Sigstore 签名及 SHA-256。安装前自动备份，是否安装由你决定。'),el('p','此安装包尚无 Windows 发行者证书，系统可能显示“未知发布者”。',{class:'muted'}));
 const updateStatus=el('p',null,{role:'status',id:'desktop-update-status',translate:'no'}),notes=el('pre',null,{id:'desktop-release-notes',translate:'no'});panel.append(updateStatus);
 let updateAvailable=false,downloaded=false;
 button(panel,'检查更新','desktop-update-check',async()=>{updateAvailable=false;downloaded=false;const r=await api.checkUpdate();updateAvailable=r.available;updateStatus.textContent=r.available?`${t('更新签名验证通过')} · ${r.version}`:t('已是最新版本');notes.textContent=r.notes??'';});
 const download=button(panel,'下载已验证的安装包','desktop-update-download',async()=>{await api.downloadUpdate();downloaded=true;updateStatus.textContent=t('安装包已下载并通过校验');});download.hidden=true;
 const install=button(panel,'打开安装包','desktop-update-install',()=>api.installUpdate());install.hidden=true;panel.append(notes);
 $('main').insertBefore(panel,$('#app-tools'));
 function refresh(s){current=s;paths.textContent=`v${s.version}\nSQLite: ${s.dataPath}\nBackup: ${s.backupDirectory}`;interval.value=s.settings.backupHours;retention.value=s.settings.retention;tray.checked=s.settings.closeToTray;startup.checked=s.settings.autoStart;startup.disabled=!s.autoStartSupported;backups.replaceChildren();
 if(!s.backups.length)backups.append(el('li','还没有备份'));for(const item of s.backups){const li=el('li');li.append(el('span',`${new Date(item.createdAt).toLocaleString()} · ${item.kind}`,{translate:'no'}));button(li,'预览恢复',`restore-${item.id}`,async()=>importPreview(await api.restore(item.id)));backups.append(li);}if(s.lastError)status.textContent=s.lastError;
 }
 task(async()=>refresh(await api.status()));route('overview');
 document.addEventListener('click',event=>{const a=event.target.closest('a[href^="#"]');if(!a)return;const target=$(a.getAttribute('href'));if(!target)return;const found=pages.find(([, ,selector])=>[...document.querySelectorAll(selector)].some(n=>n===target||n.contains(target)));if(found)route(found[0]);});
 document.addEventListener('keydown',event=>{if(!(event.ctrlKey||event.metaKey)||event.altKey)return;const key=event.key.toLowerCase();if(key==='n'){event.preventDefault();route('overview');$('#add-record').click();}else if(key==='f'){event.preventDefault();route('recipes');$('#recipe-search')?.focus();}else if(key===','){event.preventDefault();route('settings');}else if(key==='b'&&event.shiftKey){event.preventDefault();task(async()=>refresh(await api.backup()));}else if(/^[1-5]$/.test(key)){event.preventDefault();route(pages[Number(key)-1][0]);}});
 document.addEventListener('languagechange',()=>{if(current)refresh(current);});
}
