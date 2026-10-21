// Record the real desktop renderer in an isolated profile. Never uses user data.
// Chat is an explicitly labelled local SSE fixture, not a provider benchmark.
import {_electron} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
const executable=process.env.WISDOM_SHOWCASE_EXE;
if(!executable)throw Error('Set WISDOM_SHOWCASE_EXE to a locally built personal executable; media is not bundled in this repository.');
const out=path.resolve('docs/media'),local=path.resolve('private/showcase');
await fs.mkdir(out,{recursive:true});await fs.mkdir(local,{recursive:true});
let language='zh-CN';
const text={
 'zh-CN':'程序员会被人工智能取代吗？先别急着拔根。让它写重复的代码，你负责判断该种什么。毕竟，长得快和长对地方，是两回事。',
 en:'Will AI replace programmers? Let it handle the repetitive digging. You decide what belongs in the garden. Growing fast and growing in the right direction are two different things.'
};
const server=http.createServer((req,res)=>{req.resume();req.on('end',()=>{res.writeHead(200,{'Content-Type':'text/event-stream'});const parts=Array.from(text[language]);let i=0;const timer=setInterval(()=>{if(i<parts.length){const content=parts.slice(i,i+6).join('');i+=6;res.write('data: '+JSON.stringify({choices:[{delta:{content}}]})+'\n\n');}else{clearInterval(timer);res.end('data: '+JSON.stringify({choices:[],usage:{prompt_tokens:700,completion_tokens:120}})+'\n\ndata: [DONE]\n\n');}},75);res.on('close',()=>clearInterval(timer));});});
await new Promise(r=>server.listen(8781,'127.0.0.1',r));
const reports=[];
try{for(language of ['zh-CN','en']){
 const slug=language==='en'?'en':'zh',profile=path.join(local,'profile-'+slug+'-'+Date.now());let app;
 try{
  app=await _electron.launch({executablePath:executable,args:[],env:{...process.env,WISDOM_TEST_DATA:profile}});
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setContentSize(960,752));
  const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.locator('canvas').waitFor({timeout:90000});await page.waitForFunction(()=>!document.querySelector('.speech-toggle')?.disabled);
  // Seed only this disposable demo profile; this is not a production reward API.
  await page.evaluate(async(lang)=>{const db=await new Promise(r=>{const q=indexedDB.open('ai-tree-of-wisdom-production-v1');q.onsuccess=()=>r(q.result);});await new Promise(r=>{const tx=db.transaction('records','readwrite'),s=tx.objectStore('records');s.delete('stateChecksum');s.delete('stateBackups');const q=s.get('state');q.onsuccess=()=>s.put({...q.result,height:19,coins:5000,food:5},'state');s.put({language:'zh-CN',soundEnabled:false},'preferences');tx.oncomplete=r;});db.close();},language);
  await page.reload();await page.locator('canvas').waitFor();await page.waitForFunction(()=>!document.querySelector('.speech-toggle')?.disabled);
  const name=(zh,en)=>language==='en'?en:zh;
  const click=async(x,y)=>{const r=await page.locator('canvas').boundingBox();await page.mouse.click(r.x+x*r.width/800,r.y+y*r.height/600);};
  const captureLanguage=language;language='zh-CN';await click(710,14);await page.getByRole('tab',{name:name('对话模型','AI Model'),exact:true}).click();
  await page.getByLabel(name('服务商','Provider'),{exact:true}).selectOption('custom');
  await page.getByLabel(name('模型','Model'),{exact:true}).fill('showcase-fixture');
  await page.getByText(name('专业配置','Advanced'),{exact:true}).click();
  await page.getByLabel(name('接口地址','Base URL'),{exact:true}).fill('http://127.0.0.1:8781/v1');
  await page.getByLabel(name('接口密钥（不要发送到聊天中）','API key (do not send in chat)'),{exact:true}).fill('showcase-placeholder');
  await page.getByRole('button',{name:name('保存设置','Save settings'),exact:true}).click();
  await page.getByRole('button',{name:name('关闭设置','Close options'),exact:true}).click();
  language=captureLanguage;if(language==='en'){await click(710,14);await page.getByRole('tab',{name:'常规',exact:true}).click();await page.getByLabel('语言',{exact:true}).selectOption('en');await page.getByRole('button',{name:'Close options',exact:true}).click();}
  const game=page.locator('.game');await game.screenshot({path:path.join(out,'scene-'+slug+'.png')});
  await click(760,57);await page.waitForTimeout(500);await game.screenshot({path:path.join(out,'shop-'+slug+'.png')});
  // Store exit returns to tree; use recorded canvas control bounds.
  await click(430,540);await page.waitForTimeout(300);
  // Reload returns to the tree without changing the demo save.
  await page.reload();await page.locator('canvas').waitFor();await page.waitForFunction(()=>!document.querySelector('.speech-toggle')?.disabled);
  const frameDir=path.join(local,'frames-'+slug);await fs.mkdir(frameDir,{recursive:true});let frame=0;
  const shot=()=>game.screenshot({path:path.join(frameDir,String(frame++).padStart(3,'0')+'.png')});
  const capture=async(count)=>{for(let i=0;i<count;i++){await shot();await page.waitForTimeout(100);}};
  await capture(4);await click(65,35);await click(400,350);await capture(22);
  await page.getByLabel(name('对智慧树说','Talk to the tree'),{exact:true}).fill(name('你觉得人工智能会取代程序员吗？','Will AI replace programmers?'));
  await capture(4);await page.getByRole('button',{name:name('发送','Send'),exact:true}).click();await capture(32);await click(550,170);await capture(10);
  await page.waitForTimeout(500);await game.screenshot({path:path.join(out,'conversation-'+slug+'.png')});
  assert.deepEqual(errors,[]);reports.push({language,frames:frame,errors,profile:'isolated disposable profile',chat:'Local SSE fixture; text is application-authored, not original GOTY dialogue or a live provider response.'});
 }finally{await app?.close();}
}}finally{await new Promise(r=>server.close(r));}
await fs.writeFile(path.join(local,'capture.json'),JSON.stringify({version:'0.1.14',reports},null,2));console.log('SHOWCASE_CAPTURE_READY');
