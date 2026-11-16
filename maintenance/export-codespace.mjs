// GitHub's supported recovery export does not require launching a Codespace.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {inspectCodespaces,encryptReport} from './inspect-codespaces.mjs';
import {fingerprint} from './probe-codespace.mjs';
export async function exportSpace({token,target,fetcher=fetch,wait=ms=>new Promise(r=>setTimeout(r,ms))}){
 if(!/^[a-f0-9]{64}$/.test(target??''))throw Error('A verified inventory fingerprint is required.');
 const inventory=await inspectCodespaces({token,fetcher}),space=inventory.codespaces.find(s=>fingerprint(s)===target);
 if(!space)throw Error('The target is not in the verified repository inventory.');
 if(space.state!=='Shutdown')throw Error('Only previously stopped spaces may be exported by this workflow.');
 const report={version:1,operation:'export',space,inspected_at:inventory.inspected_at,scope:'current-branch-only',source:'https://docs.github.com/en/codespaces/troubleshooting/exporting-changes-to-a-branch'};
 async function api(method,suffix){
  const response=await fetcher(`https://api.github.com/user/codespaces/${space.name}${suffix}`,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(30000)});
  const text=await response.text();let body;try{body=text?JSON.parse(text):null;}catch{body=null;}
  if(!response.ok){report.api_error={status:response.status,message:body?.message??null};throw Error(`Recovery export returned HTTP ${response.status}.`);}return body;
 }
 try{
  report.requested=await api('POST','/exports');
  let done=false;
  for(let i=0;i<120;i++){
   const state=await api('GET','/exports/latest');report.export=state;
   if(state?.state==='succeeded'){
    if(typeof state.branch!=='string'||!state.branch||!/^[a-f0-9]{40}$/.test(state.sha??''))throw Error('Export succeeded without a verifiable branch and commit.');
    done=true;break;
   }
   if(['failed','cancelled'].includes(state?.state))throw Error('GitHub recovery export did not succeed.');
   await wait(3000);
  }
  if(!done)throw Error('Recovery export timed out; verify the latest export before retrying.');
  report.after=await api('GET','');
 }catch(error){report.error=error.message;}
 return report;
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{
  const report=await exportSpace({token:process.env.GH_CODESPACES_TOKEN,target:process.env.CODESPACE_FINGERPRINT});
  await mkdir('codespaces-inspection',{recursive:true,mode:0o700});
  const publicKey=await readFile(new URL('./codespaces-backup-public.pem',import.meta.url),'utf8');
  await writeFile('codespaces-inspection/export.encrypted.json',JSON.stringify(encryptReport(report,publicKey)),{mode:0o600});
  console.log('Encrypted recovery-export report saved. No Codespaces were deleted.');if(report.error)process.exitCode=1;
 }catch(error){console.error(error.message);process.exitCode=1;}
}
