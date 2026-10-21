import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),api=require('../apps/desktop/online-voice-source.cts');
const base='https://confucius4-tts.youdao.com/gradio',file='/tmp/gradio/'+'a'.repeat(64)+'/voice.wav';
function wav(){const b=Buffer.alloc(46);b.write('RIFF');b.writeUInt32LE(38,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(22050,24);b.writeUInt32LE(44100,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(2,40);return b;}
test('public demo paths cannot redirect speech or fetch arbitrary server files',()=>{
 assert.equal(api.safePath(file),file);for(const value of ['https://evil.test/audio.wav','/etc/passwd',file+'/../x.wav',file+'?a=1','/tmp/gradio/a/voice.wav'])assert.throws(()=>api.safePath(value));
 for(const args of [['','child','zh',1],['a','other','zh',1],['a','young','other',1],['a'.repeat(513),'mature','en',1],['a','young','zh',3]])assert.throws(()=>api.validate(...args));
});
test('Gradio completion handles split CRLF and rejects errors or incomplete streams',async()=>{
 const bytes=new TextEncoder().encode('event: heartbeat\r\ndata: null\r\n\r\nevent: complete\r\ndata: [1,"好"]\r\n\r\n');
 const stream=new ReadableStream({start(c){for(const b of bytes)c.enqueue(new Uint8Array([b]));c.close();}});assert.deepEqual(await api.completion(new Response(stream)),[1,'好']);
 await assert.rejects(()=>api.completion(new Response('event: error\ndata: null\n\n')));await assert.rejects(()=>api.completion(new Response('event: heartbeat\ndata: null\n\n')));
 await assert.rejects(()=>api.completion(new Response('x'.repeat(262145))));
});
test('voice clips require complete bounded playable WAV data',()=>{
 assert.equal(api.validateWave(wav()).length,46);assert.throws(()=>api.validateWave(Buffer.from('<html>blocked</html>')));assert.throws(()=>api.validateWave(wav().subarray(0,45)));
 const bad=wav();bad.writeUInt32LE(999999,40);assert.throws(()=>api.validateWave(bad));
});
test('Youdao adapter uploads only a synthetic clip and text; ignores output URL and never sends credentials',async()=>{
 const calls:{url:string;init:RequestInit}[]=[];
 const transport=async(url:string,init:RequestInit)=>{calls.push({url,init});if(url.endsWith('/upload'))return Response.json([file]);if(url.endsWith('/call/_gradio_predict'))return Response.json({event_id:'b'.repeat(32)});if(url.includes('/call/_gradio_predict/'))return new Response('event: complete\ndata: '+JSON.stringify([{path:file,url:'https://evil.test/steal'},'成功'])+'\n\n');if(url===base+'/file='+file)return new Response(wav());throw Error('Unexpected endpoint');};
 const result=await api.onlineSpeech('你好。','child','zh',1.2,new AbortController().signal,transport);
 assert.equal(result.mime,'audio/wav');assert.equal(result.playbackRate,1.2);assert.equal(result.voice,'Confucius4-child');assert.ok(calls.every(c=>c.url.startsWith(base+'/')&&c.init.credentials==='omit'&&c.init.redirect==='error'&&!new Headers(c.init.headers).has('authorization')));
 const post=calls.find(c=>c.url.endsWith('/call/_gradio_predict'))!;assert.deepEqual(JSON.parse(post.init.body as string).data,['你好。','zh',{path:file,meta:{_type:'gradio.FileData'}},'']);
 assert.ok(calls.find(c=>c.url.endsWith('/upload'))!.init.body instanceof FormData);
});
test('cancelled and unavailable public services fail without retry or paid fallback',async()=>{
 const abort=new AbortController();abort.abort();let count=0;const failed=async()=>{count++;return new Response('busy',{status:429});};
 await assert.rejects(()=>api.onlineSpeech('你好。','young','zh',1,abort.signal,failed),/取消/);assert.equal(count,0);
 await assert.rejects(()=>api.onlineSpeech('你好。','young','zh',1,new AbortController().signal,failed),/免费联网语音暂不可用/);assert.equal(count,1);
});
test('cancelling a shared-reference follower returns promptly and does not evict the owner reference',async()=>{
 let uploads=0,release!:(r:Response)=>void;const transport=async(url:string)=>{if(url.endsWith('/upload')){uploads++;return new Promise<Response>(r=>{release=r;});}if(url.endsWith('/call/_gradio_predict'))return Response.json({event_id:'c'.repeat(32)});if(url.includes('/call/_gradio_predict/'))return new Response('event: complete\ndata: '+JSON.stringify([{path:file},'成功'])+'\n\n');return new Response(wav());};
 const owner=api.onlineSpeech('第一句。','mature','zh',1,new AbortController().signal,transport);await new Promise(r=>setImmediate(r));const abort=new AbortController(),follower=api.onlineSpeech('第二句。','mature','zh',1,abort.signal,transport);abort.abort();
 await Promise.race([assert.rejects(()=>follower,/取消/),new Promise((_,reject)=>setTimeout(()=>reject(Error('Cancelled follower was blocked by another request')),200))]);release(Response.json([file]));await owner;await api.onlineSpeech('第三句。','mature','zh',1,new AbortController().signal,transport);assert.equal(uploads,1);
});
