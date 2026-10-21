// Deliberately separate local-only build. Never put GOTY media in the public build configuration.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const pak=path.resolve(process.argv[2]??'D:/Steam/steamapps/common/Plants Vs Zombies/main.pak');
const data=await fs.readFile(pak);
const sha256=crypto.createHash('sha256').update(data).digest('hex');
assert.equal(sha256,'5878326408285cb01f83b4fa4edcc66d65e727f6d6ee88563b5b3b287dd259fc','Only the audited local Steam GOTY package may be bundled');
const base=JSON.parse(await fs.readFile('electron-builder.json','utf8'));
const overlay=await fs.readFile('private/localization-research/zh-overlay.json');assert.equal(crypto.createHash('sha256').update(overlay).digest('hex'),'2592b8fc84524f805b934391580823285aa19491a1f88f96a113ff3be2a67875');
assert.ok(base.extraResources.every(item=>!item.from.startsWith('private/')),'Repository build must not depend on private output');
const config={...base,directories:{...base.directories,output:'private/releases/personal'},
  artifactName:'智慧树 安装程序 ${version}.exe',
  extraMetadata:{...base.extraMetadata,bundledAssets:true},
  extraResources:[{from:pak,to:'goty/main.pak'},{from:path.resolve('private/localization-research/zh-overlay.json'),to:'goty/zh.json'},{from:path.resolve('private/branding/tree.ico'),to:'branding/tree.ico'},{from:path.resolve('private/branding/tree.png'),to:'branding/tree.png'}]};
await fs.mkdir('private',{recursive:true});
await fs.writeFile('private/personal-builder.json',JSON.stringify(config,null,2));
await fs.writeFile('private/personal-assets.json',JSON.stringify({scope:'Local personal-use build only. Contains user-owned copyrighted media; do not publish.',sha256,bytes:data.length,original:pak},null,2));
console.log('Prepared local personal-use build with verified GOTY assets; public build configuration unchanged.');
