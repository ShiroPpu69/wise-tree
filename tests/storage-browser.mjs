import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='private/reports/storage-browser';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5180/');
 const result=await page.evaluate(async()=>{
  const {LocalStore}=await import('/@fs/F:/vibecoding/wise-tree/packages/storage-core/index.ts');
  const name='isolated-storage-acceptance-'+crypto.randomUUID(),store=await LocalStore.open(name);
  const initial=await store.state();
  await Promise.all(Array.from({length:20},(_,i)=>store.act({type:'usage',id:'usage-'+i,prompt:19999,completion:1,basis:'exact',allowEstimate:false})));
  await Promise.all(Array.from({length:10},()=>store.act({type:'usage',id:'usage-0',prompt:19999,completion:1,basis:'exact',allowEstimate:false})));
  const settled=await store.state();
  await Promise.all(Array.from({length:5},(_,i)=>store.act({type:'buy',id:'buy-'+i})));
  let fullRejected=false;try{await store.act({type:'buy',id:'over-cap'});}catch{fullRejected=true;}
  const afterCap=await store.state();
  await store.act({type:'feed',id:'feed-recover'});
  const reopened=await LocalStore.open(name),pending=await reopened.state();
  await reopened.act({type:'feed',id:'feed-recover'});
  await reopened.act({type:'finishFeed',id:'feed-recover'});
  const afterRecover=await reopened.state();
  const message=i=>({id:'m'+i,requestId:'r'+i,role:'user',content:'历史 '+i,time:new Date().toISOString(),status:'complete'});
  await Promise.all([reopened.append(message(1)),reopened.append(message(2)),reopened.append(message(3))]);
  await Promise.all([reopened.deleteMessages('m2'),reopened.append(message(4))]);
  const messages=await reopened.messages();
  await reopened.put('memories',[{id:'consent',text:'明确保存的偏好',time:new Date().toISOString()}]);
  const exported=await reopened.exportSave(),copy=await LocalStore.open(name+'-copy');await copy.importSave(exported);
  const restored=await copy.exportSave();
  return {initial,settled,fullRejected,afterCap,pending,afterRecover,messages,exported,restored};
 });
 assert.equal(result.initial.food,5);assert.equal(result.initial.height,1);
 assert.equal(result.settled.coins,50000);assert.equal(result.settled.ledger.length,20);assert.equal(result.settled.observedTokens,400000);
 assert.equal(result.fullRejected,true);assert.equal(result.afterCap.food,10);assert.equal(result.afterCap.coins,37500);
 assert.equal(result.pending.height,2);assert.equal(result.pending.food,9);assert.ok(result.pending.pendingFeed);
 assert.equal(result.afterRecover.height,2);assert.equal(result.afterRecover.food,9);assert.equal(result.afterRecover.pendingFeed,null);
 assert.deepEqual(result.messages.map(m=>m.id).sort(),['m1','m3','m4']);
 assert.deepEqual(result.restored.state,result.exported.state);assert.deepEqual(result.restored.memories,result.exported.memories);
 await page.evaluate(async()=>{const {LocalStore}=await import('/@fs/F:/vibecoding/wise-tree/packages/storage-core/index.ts');const store=await LocalStore.open();await store.put('state',{version:1,height:-1});await store.put('stateBackups',[]);});await page.reload();const recovery=page.getByLabel('从备份恢复存档');await recovery.waitFor();await recovery.setInputFiles({name:'recovery.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(result.exported))});await page.getByRole('status').filter({hasText:'存档已恢复'}).waitFor();await recovery.waitFor({state:'detached'});await page.evaluate(async()=>{const {LocalStore}=await import('/@fs/F:/vibecoding/wise-tree/packages/storage-core/index.ts');await(await LocalStore.open()).put('assets',{hash:'corrupt-test-fixture'});});await page.reload();await page.getByRole('alert').filter({hasText:'资源缓存不完整'}).waitFor();assert.equal(await page.locator('input[type=file]').first().isEnabled(),true);const retained=await page.evaluate(async()=>{const {LocalStore}=await import('/@fs/F:/vibecoding/wise-tree/packages/storage-core/index.ts');return(await LocalStore.open()).state();});assert.deepEqual(retained,result.exported.state);
 await fs.writeFile(out+'/result.json',JSON.stringify({scope:'Real Chromium IndexedDB transactions in unique test databases; synthetic usage only',concurrentUniqueSettlements:20,duplicateSettlements:10,noDuplicateReward:true,stockCapRollback:true,pendingFeedRecovery:true,atomicHistoryDeletion:true,saveAndMemoryRoundTrip:true,corruptBootBackupImport:true,corruptAssetsPreserveGameAndImport:true},null,2));
 console.log('IndexedDB concurrency / duplicate settlement / inventory rollback / feed recovery / memory and save round-trip passed.');
}finally{await browser.close();}

