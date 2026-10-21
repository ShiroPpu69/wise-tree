import {createRequire} from 'node:module';import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const require=createRequire(import.meta.url),{localSpeech,validate}=require('../apps/desktop/neural-voice.cjs');
const root=path.resolve('private/neural-voice/runtime'),out=path.resolve('private/reports/growth-voice');await fs.mkdir(out,{recursive:true});
for(const args of [['x','other','zh'],['x','young','auto'],['x'.repeat(129),'young','zh'],['','mature','zh']])assert.throws(()=>validate(...args));
const original=process.env.PATH;process.env.PATH=path.join(process.env.SystemRoot,'System32');const results=[];
try{
 for(const voice of ['young','mature']){
  const at=performance.now(),result=await localSpeech(root,'你好，我是智慧树。别看我站着不动，我可一直在长见识。',voice,'zh',new AbortController().signal);
  const b=Buffer.from(result.bytes);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(result.voice,voice);assert.equal(result.local,true);assert.equal(b.readUInt32LE(24),24000);
  const samples=(b.length-44)/2;let peak=0;for(let i=44;i<b.length;i+=2)peak=Math.max(peak,Math.abs(b.readInt16LE(i)));assert.ok(peak>100&&peak<32767);
  await fs.writeFile(path.join(out,voice+'.wav'),b);results.push({voice,backend:result.backend,ms:performance.now()-at,duration:samples/24000,sha256:crypto.createHash('sha256').update(b).digest('hex')});
 }
 assert.notEqual(results[0].sha256,results[1].sha256);
 const unicodeRoot=path.resolve('private/neural-voice/中文 路径/runtime');
 async function copyTree(from,to){await fs.mkdir(to,{recursive:true});for(const e of await fs.readdir(from,{withFileTypes:true})){const a=path.join(from,e.name),b=path.join(to,e.name);if(e.isDirectory())await copyTree(a,b);else await fs.copyFile(a,b);}}
 await copyTree(path.join(root,'bin'),path.join(unicodeRoot,'bin'));await fs.mkdir(path.join(unicodeRoot,'models'),{recursive:true});
 for(const name of await fs.readdir(path.join(root,'models')))try{await fs.link(path.join(root,'models',name),path.join(unicodeRoot,'models',name));}catch(e){if(e.code!=='EEXIST')throw e;}
 const previousTemp=process.env.TEMP,previousTmp=process.env.TMP;process.env.TEMP=path.join(unicodeRoot,'临时文件');process.env.TMP=process.env.TEMP;await fs.mkdir(process.env.TEMP,{recursive:true});
 try{const unicode=await localSpeech(unicodeRoot,'你好。','young','zh',new AbortController().signal);assert.ok(unicode.bytes.length>1000);results.push({unicodeModelAndExecutableAndTemporaryPaths:true,bytes:unicode.bytes.length});}finally{process.env.TEMP=previousTemp;process.env.TMP=previousTmp;}
 const abort=new AbortController(),pending=localSpeech(root,'取消这段语音。','young','zh',abort.signal);setTimeout(()=>abort.abort(),300);await assert.rejects(pending,/取消/);
 const before=await fs.readdir(process.env.TEMP);assert.ok(!before.some(f=>f.startsWith('wisdom-local-voice-')),'Cancelled/successful jobs must remove temporary audio');
 await fs.writeFile(path.join(out,'native.json'),JSON.stringify({scope:'Real bundled Qwen C++ CPU inference, PATH limited to Windows System32; no Python, Node child, GPU, SAPI voice, provider key or network API. Unicode executable/model/temp paths exercised. Not a clean Windows VM or all-hardware benchmark.',results,cancelled:true,invalidRejected:true},null,2));console.log(results);
}finally{process.env.PATH=original;}
