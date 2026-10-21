import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='private/reports/offline-browser';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:1000,height:800}}); // Isolated ephemeral browser profile, never the user's production save.
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:5180/');
 await page.locator('input[type=file]').first().setInputFiles('D:/Steam/steamapps/common/Plants Vs Zombies/main.pak');
 await page.locator('canvas').waitFor({timeout:90000});await page.waitForTimeout(1000);
 const state=()=>page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ai-tree-of-wisdom-production-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return new Promise((resolve,reject)=>{const r=db.transaction('records').objectStore('records').get('state');r.onsuccess=()=>{db.close();resolve(r.result)};r.onerror=()=>reject(r.error)});});
 let a=await state();assert.equal(a.height,1);assert.equal(a.food,5);assert.equal(a.coins,0);
 const canvas=page.locator('canvas'),box=await canvas.boundingBox();
 const click=(x,y)=>page.mouse.click(box.x+x*box.width/800,box.y+y*box.height/600);
 await canvas.screenshot({path:out+'/initial.png'});
 await click(60,30);await click(400,400);await page.waitForTimeout(4000);a=await state();assert.equal(a.height,2);assert.equal(a.food,4);assert.equal(a.pendingFeed,null);
 await canvas.screenshot({path:out+'/height2.png'});
 await page.reload();await page.locator('canvas').waitFor();await page.waitForTimeout(500);a=await state();assert.equal(a.height,2);assert.equal(a.food,4);
 await click(60,30);await click(400,400);await page.waitForTimeout(200);await page.reload();await page.locator('canvas').waitFor();await page.waitForTimeout(4000);a=await state();assert.equal(a.height,3);assert.equal(a.food,3);assert.equal(a.pendingFeed,null);
 await click(745,50);await page.waitForTimeout(200);await canvas.screenshot({path:out+'/shop.png'});await click(475,350);await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/金币不足/);
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/result.json',JSON.stringify({scope:'Actual main.pak import and offline UI in isolated Chromium profile; software WebGL; not full visual or platform acceptance',browser:browser.version(),initial:{height:1,food:5,coins:0},afterRestartAndRecovery:{height:a.height,food:a.food},pageErrors:errors},null,2));
 console.log('Offline import/feed/reload/crash-recovery/shop-insufficient-coins checks passed.');
}finally{await browser.close();}
