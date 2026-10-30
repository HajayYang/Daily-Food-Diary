import {PUBLIC_ASSETS} from '../offline-assets.js';
const required=(env,key)=>{const value=env[key];if(typeof value!=='string'||!value.trim()||value.length>300||/[\r\n\0]/.test(value))throw Error(`Windows signing requires ${key}`);return value;};
export function desktopConfig(env={}){
 const mode=env.WINDOWS_SIGNING_MODE||'none';if(!['none','azure'].includes(mode))throw Error('Unsupported WINDOWS_SIGNING_MODE');
 const config={appId:'io.github.hajayyang.dailybites',productName:'Daily Bites',copyright:'Copyright © 2026 Hangjay-Yang',directories:{output:'dist/desktop',buildResources:'desktop'},files:[...PUBLIC_ASSETS,'desktop/*.mjs','desktop/preload.cjs','desktop/icon.ico','food-search.js','LICENSE','package.json'],asar:true,npmRebuild:false,forceCodeSigning:mode==='azure',win:{target:[{target:'nsis',arch:['x64']}],icon:'desktop/icon.ico',artifactName:'Daily-Bites-${version}-win-${arch}-setup.${ext}',signAndEditExecutable:true,signExecutable:mode==='azure'},nsis:{oneClick:false,allowToChangeInstallationDirectory:true,perMachine:false,deleteAppDataOnUninstall:false,createDesktopShortcut:true,createStartMenuShortcut:true,shortcutName:'Daily Bites',installerLanguages:['zh_CN','en_US','ja_JP','ko_KR']}};
 if(mode==='azure'){
  // Credentials stay in the step environment, never in generated config or packages.
  for(const key of ['AZURE_TENANT_ID','AZURE_CLIENT_ID','AZURE_CLIENT_SECRET'])required(env,key);
  const endpoint=required(env,'AZURE_SIGNING_ENDPOINT');if(!/^https:\/\/[a-z0-9-]+\.codesigning\.azure\.net\/?$/.test(endpoint))throw Error('Invalid Azure code signing endpoint');
  config.win.azureSignOptions={publisherName:required(env,'WINDOWS_CERTIFICATE_PUBLISHER'),endpoint,codeSigningAccountName:required(env,'AZURE_SIGNING_ACCOUNT'),certificateProfileName:required(env,'AZURE_SIGNING_PROFILE'),fileDigest:'SHA256',timestampDigest:'SHA256',timestampRfc3161:'http://timestamp.acs.microsoft.com'};
 }
 return config;
}
