import {_electron} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const out=path.resolve('private/reports/desktop-bundled');await fs.mkdir(out,{recursive:true});
const run=path.join(out,'run-'+Date.now());await fs.mkdir(run);
const profile=path.join(run,'profile'),archive=path.resolve('private/releases/personal/win-unpacked/resources/app.asar');
const bundled=path.resolve('private/releases/personal/win-unpacked/resources/goty/main.pak');
let electron,page;const errors=[];
async function launch(dataDir,pak){
 electron=await _electron.launch({executablePath:path.resolve('node_modules/electron/dist/electron.exe'),args:[archive,'--use-angle=swiftshader','--enable-unsafe-swiftshader'],env:{...process.env,WISDOM_TEST_DATA:dataDir,WISDOM_TEST_BUNDLED_PAK:pak,WISDOM_TEST_CHINESE_ASSETS:path.resolve('private/releases/personal/win-unpacked/resources/goty/zh.json')}});
 page=await electron.firstWindow();page.on('pageerror',e=>errors.push(String(e)));await page.route(/^https?:/,route=>route.abort());
}
async function state(){return page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ai-tree-of-wisdom-production-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await new Promise((resolve,reject)=>{const r=db.transaction('records').objectStore('records').get('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}});}
try{
 await launch(profile,bundled);await page.locator('canvas').waitFor({timeout:90000});
 assert.equal(await page.locator('input[type=file]').count(),0,'Fresh personal install must not ask user to select any resource');
 assert.equal(await electron.evaluate(({app})=>app.getVersion()),JSON.parse(await fs.readFile('package.json','utf8')).version);
 let s=await state();assert.equal(s.height,1);assert.equal(s.food,5);assert.equal(s.coins,0);
 const box=await page.locator('canvas').boundingBox();const click=(x,y)=>page.mouse.click(box.x+x*box.width/800,box.y+y*box.height/600);
 await click(60,30);await click(400,400);await page.waitForTimeout(4000);s=await state();assert.equal(s.height,2);assert.equal(s.food,4);
 await page.screenshot({path:path.join(out,'first-launch-no-import.png')});await electron.close();electron=null;
 // Cached restart must not need even the bundled PAK again.
 await launch(profile,path.join(run,'not-present.pak'));await page.locator('canvas').waitFor({timeout:30000});s=await state();assert.equal(s.height,2);assert.equal(s.food,4);
 // Damage only the local asset cache; the shipped bundle must rebuild it without resetting the save.
 await page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('ai-tree-of-wisdom-production-v1');r.onsuccess=()=>resolve(r.result);});await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').delete('assets');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();});
 await electron.close();electron=null;await launch(profile,bundled);await page.locator('canvas').waitFor({timeout:90000});s=await state();assert.equal(s.height,2);assert.equal(s.food,4);assert.equal(await page.locator('input[type=file]').count(),0);await electron.close();electron=null;
 await launch(path.join(run,'missing-profile'),path.join(run,'missing.pak'));await page.getByRole('alert').filter({hasText:'内置原版资源无法读取'}).waitFor();assert.equal(await page.locator('input[type=file][accept=".pak"]').count(),0);assert.equal(await page.getByRole('button',{name:'重试启动'}).count(),1);await electron.close();electron=null;
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(out,'result.json'),JSON.stringify({scope:'Actual personal archive and shipped GOTY PAK, isolated Electron profiles, network blocked; no file selection and no original installation path used at runtime. Not an interactive NSIS installation test.',freshLaunchWithoutImport:true,initial:{height:1,food:5,coins:0},manualFeedAndRestart:{height:s.height,food:s.food},cachedRestartWithoutPak:true,missingCacheRebuiltFromBundleWithoutSaveReset:true,missingBundledPakShowsRepairNotImport:true,pageErrors:errors},null,2));
 console.log('Personal package: fresh offline launch without import, feed/restart, automatic cache rebuild and missing-bundle handling passed.');
}catch(error){if(page&&!page.isClosed())await fs.writeFile(path.join(out,'failure.txt'),String(error)+'\n'+await page.locator('body').innerText());throw error;}finally{if(electron)await electron.close();}
