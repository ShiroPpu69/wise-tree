import fs from 'node:fs/promises';import path from 'node:path';
const lock=JSON.parse(await fs.readFile('package-lock.json','utf8'));
const sections=['Tree of Wisdom — third-party runtime notices','Application code is MIT-licensed; game resources are excluded. See resources/README.md for resource provenance and rights.','Electron and Chromium notices are distributed alongside the Windows executable.'];
for(const [folder,pkg] of Object.entries(lock.packages).filter(([folder,pkg])=>folder.startsWith('node_modules/')&&!pkg.dev).sort(([a],[b])=>a.localeCompare(b))){
 const candidates=(await fs.readdir(folder)).filter(file=>/^(licen[cs]e|copying)(\..*)?$/i.test(file));
 let text;
 if(candidates.length)text=await Promise.all(candidates.map(file=>fs.readFile(path.join(folder,file),'utf8')));
 else if(folder==='node_modules/@pixi/colord')text=['License supplied from the published gitHead in pixijs/colord, because the npm tarball omits it. Source: https://raw.githubusercontent.com/pixijs/colord/5344fbf77b736f81cd33c21050021bc09bc9dd1d/LICENSE.md\n'+await fs.readFile('tools/licenses/pixi-colord-LICENSE.txt','utf8')];
 else{
  const readme=await fs.readFile(path.join(folder,'README.md'),'utf8').catch(()=>'');const start=readme.indexOf('(The MIT License)');
  if(pkg.license!=='MIT'||start<0||!readme.includes('Permission is hereby granted'))throw Error('Missing license notice for '+folder);
  text=['Full MIT license supplied in the published package README.md:\n'+readme.slice(start).split(/\n\[[^\]]+\]:/)[0]];
 }
 sections.push('\n'+'='.repeat(72)+'\n'+folder.replace(/^node_modules\//,'')+' '+pkg.version+' ('+pkg.license+')\n'+text.join('\n'));
}
sections.push('ZCOOL KuaiLe — Chinese supplemental font. Source: https://github.com/google/fonts/tree/main/ofl/zcoolkuaile\n'+await fs.readFile('assets/fonts/OFL.txt','utf8'));
await fs.writeFile('THIRD_PARTY_NOTICES.txt',sections.join('\n\n')+'\n');console.log('Collected '+(sections.length-3)+' runtime dependency/font license notices.');
