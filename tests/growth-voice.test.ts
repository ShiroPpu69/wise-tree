import test from 'node:test';import assert from 'node:assert/strict';
import {growthVoice,speechSegments} from '../packages/voice-core/growth.ts';
import {defaultVoiceConfig,upgradeVoiceConfig,VoiceController} from '../packages/voice-core/index.ts';
test('voice follows height without changing growth, money or inventory',()=>{
 for(const h of [10,49])assert.equal(growthVoice(h),'young');
 for(const h of [1,2,9])assert.equal(growthVoice(h),'child');
 for(const h of [50,51,100,500,1000,1001])assert.equal(growthVoice(h),'mature');
 assert.equal(growthVoice(1,'mature'),'mature');assert.equal(growthVoice(1001,'young'),'young');
 for(const h of [0,-1,NaN,1.5])assert.throws(()=>growthVoice(h));
});
test('speech segments keep long replies bounded, retain sentence order, omit code and links',()=>{
 const text='你好。'+'这一句比较长，'.repeat(45)+'最后一句。';const segments=speechSegments(text);
 assert.equal(segments.join(''),text);assert.ok(segments.every(s=>s.length<=65));
 assert.deepEqual(speechSegments('```html\n<button>代码</button>\n```\n[你好](https://example.com)。'),['你好。']);
});
test('one-time voice upgrade selects accepted natural growth voices and preserves custom/disabled preferences',()=>{
 const old={...defaultVoiceConfig(),setupVersion:2 as const,ttsMode:'system' as const,autoRead:false,inputEnabled:false};
 const next=upgradeVoiceConfig(old);assert.equal(next.setupVersion,4);assert.equal(next.ttsMode,'online');assert.equal(next.treeVoice,'auto');assert.equal(next.autoRead,false);assert.equal(next.inputEnabled,false);
 const custom=upgradeVoiceConfig({...old,ttsMode:'custom',customEnabled:true,ttsModel:'mine'});assert.equal(custom.ttsMode,'custom');
 assert.deepEqual(upgradeVoiceConfig({...next,ttsMode:'system',treeVoice:'young'}),{...next,ttsMode:'system',treeVoice:'young'});
});
test('local playback queues audio, captures voice at start, preserves pause, and cancels pending work',async()=>{
 const originalWindow=globalThis.window,originalAudio=globalThis.Audio;
 const requests:{voice:string;text:string;resolve:(value:unknown)=>void}[]=[],audios:FakeAudio[]=[],cancelled:string[]=[],errors:string[]=[];
 class FakeAudio{
  src:string;volume=1;playbackRate=1;onended:(()=>void)|null=null;onerror:(()=>void)|null=null;plays=0;pauses=0;
  constructor(src:string){this.src=src;audios.push(this);}play(){this.plays++;return Promise.resolve();}pause(){this.pauses++;}
 }
 globalThis.Audio=FakeAudio as unknown as typeof Audio;
 globalThis.window={wisdomDesktop:{localSpeech:(_id:string,text:string,voice:string)=>new Promise(resolve=>requests.push({voice,text,resolve})),cancel:(id:string)=>cancelled.push(id)}} as unknown as Window&typeof globalThis;
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 const respond=()=>requests.at(-1)!.resolve({bytes:[1,2],voice:'test',backend:'simd',local:true});
 const controller=new VoiceController(e=>errors.push(e));controller.configure({...defaultVoiceConfig(),outputEnabled:true,ttsMode:'neural'},'','');
 try{
  const first=controller.speak('第一句。第二句。',49);assert.equal(requests[0].voice,'young');
  respond();await tick();assert.equal(audios.length,1);assert.equal(requests.length,1,'Must await playback end before next sentence');
  controller.pause();audios[0].onended!();await tick();assert.equal(requests.length,2);respond();await tick();assert.equal(audios[1].plays,0,'Pause must survive generation of the next segment');
  controller.resume();assert.equal(audios[1].plays,1);audios[1].onended!();await first;
  const second=controller.speak('长大了。',50);assert.equal(requests.at(-1)!.voice,'mature');controller.stop();respond();await second;assert.equal(audios.length,2,'Cancelled generation must never start audio');assert.equal(cancelled.length,1);
  assert.deepEqual(errors,[]);
 }finally{controller.dispose();globalThis.window=originalWindow;globalThis.Audio=originalAudio;}
});
