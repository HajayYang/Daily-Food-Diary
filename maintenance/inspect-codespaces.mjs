// Read-only inspection. No start, export, commit, stop or delete endpoints are used.
import {randomBytes,publicEncrypt,createCipheriv,constants} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const repository='HajayYang/Daily-Food-Diary';
export function encryptReport(report,publicKey){
 const key=randomBytes(32),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
 const ciphertext=Buffer.concat([cipher.update(JSON.stringify(report),'utf8'),cipher.final()]);
 return {version:1,algorithm:'RSA-OAEP-256+AES-256-GCM',key:publicEncrypt({key:publicKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key).toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')};
}
export async function inspectCodespaces({token,fetcher=fetch,now=()=>new Date().toISOString()}){
 if(typeof token!=='string'||!token.trim())throw Error('Configure repository Actions secret GH_CODESPACES_TOKEN.');
 async function get(path){
  const response=await fetcher(`https://api.github.com${path}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`GitHub inspection returned HTTP ${response.status}; check Codespaces permission and repository selection.`);
  return response.json();
 }
 const user=await get('/user');if(user.login!=='HajayYang')throw Error('The credential must belong to the repository owner.');
 const spaces=[];let total;
 for(let page=1;page<=100;page++){
  const data=await get(`/repos/${repository}/codespaces?per_page=100&page=${page}`);
  if(!Array.isArray(data.codespaces)||!Number.isInteger(data.total_count))throw Error('Invalid Codespaces response.');
  total=data.total_count;
  for(const item of data.codespaces){
   if(typeof item.name!=='string'||!/^[a-z0-9-]+$/.test(item.name))throw Error('Invalid Codespaces name.');
   if(item.repository?.full_name?.toLowerCase()!==repository.toLowerCase())throw Error('Unexpected Codespaces repository; inspection stopped.');
   spaces.push({name:item.name,display_name:item.display_name??null,state:item.state??null,repository:item.repository.full_name,git_status:item.git_status??null,last_used_at:item.last_used_at??null,retention_expires_at:item.retention_expires_at??null,created_at:item.created_at??null});
  }
  if(data.codespaces.length<100)break;
 }
 if(spaces.length!==total||new Set(spaces.map(s=>s.name)).size!==spaces.length)throw Error('Incomplete or changing Codespaces inventory; retry before proceeding.');
 return {version:1,repository,inspected_at:now(),codespaces:spaces};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{
  const report=await inspectCodespaces({token:process.env.GH_CODESPACES_TOKEN});
  const publicKey=await readFile(new URL('./codespaces-backup-public.pem',import.meta.url),'utf8');
  await mkdir('codespaces-inspection',{recursive:true,mode:0o700});
  await writeFile('codespaces-inspection/inventory.encrypted.json',JSON.stringify(encryptReport(report,publicKey)),{mode:0o600});
  console.log('Read-only inspection completed. An encrypted report was saved; no Codespaces were changed.');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
