// Starts one previously stopped space for a private inspection, then stops it again.
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {inspectCodespaces,encryptReport} from './inspect-codespaces.mjs';
export const fingerprint=space=>createHash('sha256').update(JSON.stringify([space.repository.toLowerCase(),space.name,space.created_at])).digest('hex');
const remoteScript=String.raw`
import os,json,subprocess,pathlib,base64
out={'version':1,'cwd':os.getcwd(),'home':str(pathlib.Path.home()),'repositories':[],'workspace_entries':[],'home_entries':[]}
def run(args,limit=6000000):
 p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=120)
 return {'code':p.returncode,'stdout':p.stdout[:limit].decode('utf-8','replace'),'stderr':p.stderr[:10000].decode('utf-8','replace'),'bytes':len(p.stdout),'truncated':len(p.stdout)>limit}
for base,key in [('/workspaces','workspace_entries'),(str(pathlib.Path.home()),'home_entries')]:
 try:
  for e in os.scandir(base):out[key].append({'name':e.name,'directory':e.is_dir(follow_symlinks=False),'symlink':e.is_symlink(),'bytes':e.stat(follow_symlinks=False).st_size})
 except Exception as e:out[key]=[{'error':type(e).__name__}]
roots=[]
for parent,dirs,files in os.walk('/workspaces',followlinks=False):
 dirs[:]=[d for d in dirs if d not in ['node_modules','.cache','.venv','.vscode-server','.vscode-remote']]
 if '.git' in dirs or '.git' in files:
  roots.append(parent)
  if '.git' in dirs:dirs.remove('.git')
for root in roots:
 g=lambda *args:run(['git','-C',root,*args])
 item={'path':root,'head':g('rev-parse','HEAD'),'branch':g('branch','--show-current'),'status':g('status','--porcelain=v1','-z','--untracked-files=all'),'branches':g('for-each-ref','--format=%(refname) %(objectname) %(upstream) %(upstream:track)','refs/heads/'),'diff':g('diff','--binary','HEAD'),'untracked':[],'ignored':g('ls-files','--others','--ignored','--exclude-standard','-z',limit=1000000)}
 paths=g('ls-files','--others','--exclude-standard','-z')
 item['untracked_listing']=paths
 total=0
 for path in paths['stdout'].split('\0'):
  if not path:continue
  p=pathlib.Path(root)/path
  if p.is_symlink():item['untracked'].append({'path':path,'symlink':os.readlink(p)});continue
  if not p.is_file():continue
  size=p.stat().st_size;entry={'path':path,'bytes':size}
  if size<=1000000 and total+size<=5000000:
   entry['base64']=base64.b64encode(p.read_bytes()).decode();total+=size
  else:entry['omitted']=True
  item['untracked'].append(entry)
 out['repositories'].append(item)
out['sizes']=run(['du','-sk','/workspaces',str(pathlib.Path.home())],limit=20000)
print(json.dumps(out))
`;
export async function probe({token,target,fetcher=fetch,command=runSsh,wait=ms=>new Promise(r=>setTimeout(r,ms))}){
 if(!/^[a-f0-9]{64}$/.test(target??''))throw Error('A verified inventory fingerprint is required.');
 const inventory=await inspectCodespaces({token,fetcher});
 const space=inventory.codespaces.find(s=>fingerprint(s)===target);
 if(!space)throw Error('The requested space is not in the verified repository inventory.');
 if(space.state!=='Shutdown')throw Error('Probe only accepts a stopped Codespace; active spaces are left untouched.');
 const result={version:1,operation:'probe',space,before:inventory.inspected_at};let started=false;
 async function api(method,suffix=''){
  const response=await fetcher(`https://api.github.com/user/codespaces/${space.name}${suffix}`,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`Codespaces ${method} returned HTTP ${response.status}.`);
  return response.status===204?null:response.json();
 }
 try{
  await api('POST','/start');started=true;
  let ready=false;
  for(let i=0;i<100;i++){const current=await api('GET');if(current.state==='Available'){ready=true;break;}if(['Failed','Deleted','Archived'].includes(current.state))throw Error('Codespace failed to start.');await wait(3000);}
  if(!ready)throw Error('Codespace startup timed out.');
  result.command=await command(space.name,token,remoteScript);
  if(result.command.code!==0)result.inspection_error='SSH inspection did not complete.';
  else try{result.files=JSON.parse(result.command.stdout.trim().split('\n').at(-1));delete result.command.stdout;}catch{result.inspection_error='Remote inspection did not return valid JSON.';}
 }catch(error){result.inspection_error=error.message;}
 finally{
  if(started)try{
   await api('POST','/stop');
   let stopped=false;
   for(let i=0;i<60;i++){if((await api('GET')).state==='Shutdown'){stopped=true;break;}await wait(2000);}
   result.stopped=stopped;if(!stopped)result.stop_error='Shutdown did not finish in time.';
  }catch(error){result.stopped=false;result.stop_error=error.message;}
 }
 return result;
}
async function runSsh(name,token,script){
 return new Promise(resolve=>{
  const child=spawn('gh',['codespace','ssh','-c',name,'--','python3','-'],{env:{...process.env,GH_TOKEN:token},stdio:['pipe','pipe','pipe']});
  const stdout=[],stderr=[];let size=0,killed=false;
  const timer=setTimeout(()=>{killed=true;child.kill('SIGTERM');},300000);
  child.stdout.on('data',b=>{size+=b.length;if(size>20000000){killed=true;child.kill('SIGTERM');}else stdout.push(b);});
  child.stderr.on('data',b=>{if(stderr.reduce((n,s)=>n+s.length,0)<1000000)stderr.push(b);});
  child.on('error',()=>{clearTimeout(timer);resolve({code:-1,stdout:'',stderr:'Could not start GitHub CLI.'});});
  child.on('close',code=>{clearTimeout(timer);resolve({code:killed?-1:code,stdout:Buffer.concat(stdout).toString(),stderr:Buffer.concat(stderr).toString(),killed});});
  child.stdin.on('error',()=>{});child.stdin.end(script);
 });
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{
  const report=await probe({token:process.env.GH_CODESPACES_TOKEN,target:process.env.CODESPACE_FINGERPRINT});
  const publicKey=await readFile(new URL('./codespaces-backup-public.pem',import.meta.url),'utf8');
  await mkdir('codespaces-inspection',{recursive:true,mode:0o700});
  await writeFile('codespaces-inspection/probe.encrypted.json',JSON.stringify(encryptReport(report,publicKey)),{mode:0o600});
  console.log('Encrypted probe report saved. No source files were committed or deleted.');
  if(report.inspection_error||!report.stopped)process.exitCode=1;
 }catch(error){console.error(error.message);process.exitCode=1;}
}
