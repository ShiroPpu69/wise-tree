import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {listPackage,extractFile} from '@electron/asar';
const version=JSON.parse(await fs.readFile('package.json','utf8')).version;if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Invalid release version');
const personal=process.argv.includes('--personal');
const root=path.resolve(personal?'private/releases/personal':'private/releases'),archive=path.join(root,'win-unpacked/resources/app.asar');
const all=listPackage(archive).map(p=>p.replaceAll('\\','/').replace(/^\//,''));
const prohibited=all.filter(p=>/(^|\/)(private|research|tests|dev-harness)(\/|$)|(^|\/)\.env($|\.)|main\.pak|\.(pak|compiled|reanim|mo3|ogg|wav|png|jpg|gif)$/i.test(p));
assert.deepEqual(prohibited,[],'Release must not include user-owned media, credentials, research or test entry');
assert.ok(all.includes('apps/desktop/windows-tts.ps1'),'Native speech adapter must be included');assert.ok(all.includes('apps/desktop/windows-stt.ps1'),'Native recognition adapter must be included');
const files=[];for(const p of all){if(p==='package.json'||p==='THIRD_PARTY_NOTICES.txt'||p.startsWith('dist/web/')&&/\.(js|css|html|txt|ttf|json)$/.test(p)||p.startsWith('apps/desktop/')&&/\.(cjs|ps1)$/.test(p)){const bytes=extractFile(archive,path.normalize(p));files.push({path:p,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}}
for(const file of files.filter(f=>f.path!=='package.json'))assert.deepEqual(extractFile(archive,path.normalize(file.path)),await fs.readFile(file.path),'Packaged file differs from current source/build: '+file.path);
const packagedMetadata=JSON.parse(extractFile(archive,'package.json').toString());assert.equal(packagedMetadata.version,version);
let bundledAssets=null;
assert.equal(packagedMetadata.bundledAssets,true);const media=await fs.readFile(path.join(root,'win-unpacked/resources/goty/main.pak'));const sha256=crypto.createHash('sha256').update(media).digest('hex');assert.equal(sha256,'5878326408285cb01f83b4fa4edcc66d65e727f6d6ee88563b5b3b287dd259fc');bundledAssets={scope:'Owner-requested resource bundle; excluded from the code MIT license',bytes:media.length,sha256};
let localizedAssets=null;const localizedPath='dist/web/goty/zh.json';
{const data=extractFile(archive,path.normalize(localizedPath)),digest=crypto.createHash('sha256').update(data).digest('hex');assert.equal(digest,'2592b8fc84524f805b934391580823285aa19491a1f88f96a113ff3be2a67875');assert.deepEqual(data,await fs.readFile(path.join(root,'win-unpacked/resources/goty/zh.json')));localizedAssets={scope:'Community localization; excluded from MIT and not verified as official Chinese GOTY',bytes:data.length,sha256:digest};}
const installer=path.join(root,'智慧树 安装程序 '+version+'.exe'),bytes=await fs.readFile(installer);
const report={time:new Date().toISOString(),scope:'ASAR path audit, expected source/build byte equality, installer digest. Not NSIS installation or a complete secret scanner.',prohibitedEntries:prohibited,archiveEntries:all.length,archiveBytes:(await fs.stat(archive)).size,files,installer:{name:path.basename(installer),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}};
report.bundledAssets=bundledAssets;report.localizedAssets=localizedAssets;
const reportDir=personal?'private/reports/personal-release-audit':'private/reports/release-audit';await fs.mkdir(reportDir,{recursive:true});await fs.writeFile(reportDir+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify({archiveEntries:all.length,archiveBytes:report.archiveBytes,installer:report.installer,excludedResearchAndTestData:true,localizedAssets,bundledAssets,currentSourcesMatch:true}));
