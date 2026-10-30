import {writeFile,mkdir} from 'node:fs/promises';
import {desktopConfig} from './desktop-config.mjs';
await mkdir('dist',{recursive:true});
await writeFile('electron-builder.json',JSON.stringify(desktopConfig(process.env),null,2)+'\n');
console.log('Desktop package allowlist prepared; signing mode:',process.env.WINDOWS_SIGNING_MODE||'none');
