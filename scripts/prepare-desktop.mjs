import { writeFile, mkdir } from 'node:fs/promises';
import { PUBLIC_ASSETS } from '../offline-assets.js';
await mkdir('dist',{recursive:true});
const config={appId:'io.github.hajayyang.dailybites',productName:'Daily Bites',copyright:'Copyright © 2026 Hangjay Yang',directories:{output:'dist/desktop',buildResources:'desktop'},files:[...PUBLIC_ASSETS,'desktop/*.mjs','desktop/preload.cjs','desktop/icon.ico','food-search.js','LICENSE','package.json'],asar:true,npmRebuild:false,win:{target:[{target:'nsis',arch:['x64']}],icon:'desktop/icon.ico',artifactName:'Daily-Bites-${version}-win-${arch}-setup.${ext}',signAndEditExecutable:true},nsis:{oneClick:false,allowToChangeInstallationDirectory:true,perMachine:false,deleteAppDataOnUninstall:false,createDesktopShortcut:true,createStartMenuShortcut:true,shortcutName:'Daily Bites',installerLanguages:['zh_CN','en_US','ja_JP','ko_KR']}};
await writeFile('electron-builder.json',JSON.stringify(config,null,2)+'\n');
console.log('Desktop package allowlist prepared; personal data and model-service secrets are excluded.');
