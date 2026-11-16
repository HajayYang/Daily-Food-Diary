// Delete only after the user confirms current-branch-only preservation and export is verified.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {inspectCodespaces,encryptReport} from './inspect-codespaces.mjs';
import {fingerprint} from './probe-codespace.mjs';
const repository='HajayYang/Daily-Food-Diary';
export async function deleteExportedSpace({token,repositoryToken,target,exportSha,lastUsedAt,confirmedCurrentBranchOnly=false,fetcher=fetch,wait=ms=>new Promise(r=>setTimeout(r,ms))}){
 if(confirmedCurrentBranchOnly!==true)throw Error('Explicit confirmation of the current-branch-only backup scope is required.');
 if(!/^[a-f0-9]{64}$/.test(target??'')||!/^[a-f0-9]{40}$/.test(exportSha??'')||!Number.isFinite(Date.parse(lastUsedAt??'')))throw Error('Verified export metadata is required.');
 if(!repositoryToken)throw Error('A repository read token is required to verify the backup branch.');
 const inventory=await inspectCodespaces({token,fetcher}),space=inventory.codespaces.find(s=>fingerprint(s)===target);
 if(!space)throw Error('The verified space is not present; no deletion attempted.');
 const report={version:1,operation:'delete',scope:'current-branch-only-confirmed',space,export_sha:exportSha};
 function assertStoppedUnchanged(current){
  const repo=typeof current.repository==='string'?current.repository:current.repository?.full_name;
  if(repo?.toLowerCase()!==repository.toLowerCase()||fingerprint({...current,repository:repo})!==target)throw Error('Space identity changed.');
  if(current.state!=='Shutdown')throw Error('The space is active or not fully stopped; deletion refused.');
  if(Date.parse(current.last_used_at)!==Date.parse(lastUsedAt))throw Error('The space was used after the verified export; deletion refused.');
 }
 async function request(path,{method='GET',auth=token,allowMissing=false}={}){
  const response=await fetcher('https://api.github.com'+path,{method,headers:{Authorization:`Bearer ${auth}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(30000)});
  if(allowMissing&&[404,410].includes(response.status))return {missing:true};
  if(!response.ok)throw Error(`Verified cleanup returned HTTP ${response.status}.`);
  const text=await response.text();return text?JSON.parse(text):null;
 }
 try{
  assertStoppedUnchanged(space);
  const exported=await request(`/user/codespaces/${space.name}/exports/latest`);
  if(exported?.state!=='succeeded'||exported.sha!==exportSha||typeof exported.branch!=='string'||!/^[a-zA-Z0-9/_-]+$/.test(exported.branch))throw Error('Latest export does not match the verified successful backup.');
  const branch=exported.branch.split('/').map(encodeURIComponent).join('/');
  const ref=await request(`/repos/${repository}/git/ref/heads/${branch}`,{auth:repositoryToken});
  if(ref?.object?.sha!==exportSha)throw Error('The exported backup branch is missing or changed.');
  // Check again immediately before deletion; do not touch a newly resumed space.
  assertStoppedUnchanged(await request(`/user/codespaces/${space.name}`));
  await request(`/user/codespaces/${space.name}`,{method:'DELETE'});report.deletion_accepted=true;
  for(let i=0;i<60;i++){
   if((await request(`/user/codespaces/${space.name}`,{allowMissing:true}))?.missing){report.deletion_confirmed=true;break;}
   await wait(2000);
  }
  if(!report.deletion_confirmed)throw Error('Deletion accepted but completion is not yet confirmed; inspect before retrying.');
 }catch(error){report.error=error.message;}
 return report;
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{
  const report=await deleteExportedSpace({token:process.env.GH_CODESPACES_TOKEN,repositoryToken:process.env.GH_REPOSITORY_TOKEN,target:process.env.CODESPACE_FINGERPRINT,exportSha:process.env.VERIFIED_EXPORT_SHA,lastUsedAt:process.env.VERIFIED_LAST_USED_AT,confirmedCurrentBranchOnly:process.env.CURRENT_BRANCH_ONLY_CONFIRMED==='true'});
  await mkdir('codespaces-inspection',{recursive:true,mode:0o700});const publicKey=await readFile(new URL('./codespaces-backup-public.pem',import.meta.url),'utf8');
  await writeFile('codespaces-inspection/deletion.encrypted.json',JSON.stringify(encryptReport(report,publicKey)),{mode:0o600});
  console.log('Encrypted cleanup receipt saved.');if(report.error)process.exitCode=1;
 }catch(error){console.error(error.message);process.exitCode=1;}
}
