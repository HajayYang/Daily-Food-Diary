import { validSnapshot, MAX_BACKUP_BYTES } from './backup.js';
export function validSyncConfig(config){
 if(!config||typeof config.url!=='string'||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url)||typeof config.key!=='string'||config.key.length>3000)return false;
 if(/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.key))return true;
 try{return JSON.parse(atob(config.key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}catch{return false;}
}
export function validSession(session){return Boolean(session&&typeof session.access_token==='string'&&session.access_token.length>0&&typeof session.refresh_token==='string'&&session.refresh_token.length>0&&Number.isFinite(session.expires_at)&&/^[0-9a-f-]{36}$/i.test(session.user?.id));}
export function createSyncClient(config,{fetcher=globalThis.fetch,onSession=()=>{},now=Date.now}={}){
 if(!validSyncConfig(config))throw Error('请填写 Supabase 项目地址和公开 publishable / anon key，不能使用 service_role 或 secret key。');let session=null;
 async function request(path,{body,method='GET',authenticated=false}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const headers={apikey:config.key,'Content-Type':'application/json'};if(authenticated){if(!session)throw Error('请先登录云同步账号。');headers.Authorization=`Bearer ${session.access_token}`;}
   const response=await fetcher(config.url+path,{method,headers,signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',...(body===undefined?{}:{body:JSON.stringify(body)})});
   const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null;}catch{throw Error('云服务响应无效，请检查部署配置。');}
   if(!response.ok){if(data?.message==='sync_conflict')throw Error('云端已被另一设备更新，请先下载并合并，再重新上传。');if(response.status===401||response.status===403)throw Error('登录失效或没有访问权限，请重新登录并检查配置。');throw Error('云服务请求失败，请核对账号、邮箱验证和部署配置。');}return data;
  }catch(error){if(error.name==='AbortError'||error instanceof TypeError)throw Error('无法连接云服务或请求超时，请检查网络。');throw error;}finally{clearTimeout(timer);}
 }
 function accept(data){const next={...data,expires_at:data.expires_at??Math.floor(now()/1000)+(data.expires_in??3600)};if(!validSession(next))throw Error('登录响应无效，未保存会话。');session=next;onSession(session);return session.user;}
 async function ready(){if(!session)throw Error('请先登录云同步账号。');if(session.expires_at<=now()/1000+30){try{accept(await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}}));}catch(error){session=null;onSession(null);throw error;}}}
 return {
  restore(value){if(validSession(value)){session=value;return session.user;}return null;},user:()=>session?.user??null,
  async signIn(email,password){return accept(await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}}));},
  async signUp(email,password){const data=await request('/auth/v1/signup',{method:'POST',body:{email,password}});return data?.access_token?accept(data):null;},
  async signOut(){try{if(session)await request('/auth/v1/logout',{method:'POST',authenticated:true});}finally{session=null;onSession(null);}},
  async download(){await ready();const rows=await request(`/rest/v1/diary_snapshots?user_id=eq.${encodeURIComponent(session.user.id)}&select=revision,payload,updated_at`,{authenticated:true});if(!Array.isArray(rows)||rows.length>1)throw Error('云服务响应无效，请检查部署配置。');if(!rows.length)return null;const row=rows[0];if(!Number.isSafeInteger(row.revision)||row.revision<1||!validSnapshot(row.payload))throw Error('云端备份数据校验失败，没有修改本地记录。');return row;},
  async upload(snapshot,revision){if(!validSnapshot(snapshot)||new TextEncoder().encode(JSON.stringify(snapshot)).length>MAX_BACKUP_BYTES)throw Error('云端备份必须通过校验且小于 2 MiB。');if(!Number.isSafeInteger(revision)||revision<0)throw Error('请先检查云端版本。');await ready();return request('/rest/v1/rpc/put_diary_snapshot',{method:'POST',authenticated:true,body:{expected_revision:revision,new_payload:snapshot}});},
 };
}
