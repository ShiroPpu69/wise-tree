import test from 'node:test';import assert from 'node:assert/strict';
import {SpeechCache} from '../packages/voice-core/cache.ts';import {VoiceController,defaultVoiceConfig} from '../packages/voice-core/index.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('speech LRU obeys both byte and entry bounds, promotes reads, replaces and clears',()=>{
 const cache=new SpeechCache(6,2),blob=(n:number)=>new Blob([new Uint8Array(n)]);cache.put('a',blob(3));cache.put('b',blob(3));assert.ok(cache.get('a'));cache.put('c',blob(3));assert.equal(cache.get('b'),undefined);assert.ok(cache.get('a'));cache.put('a',blob(4));assert.equal(cache.get('c'),undefined);cache.put('huge',blob(7));assert.equal(cache.get('huge'),undefined);assert.ok(cache.get('a'));cache.clear();assert.equal(cache.get('a'),undefined);
 const entries=new SpeechCache(100,1);entries.put('a',blob(1));entries.put('b',blob(1));assert.equal(entries.get('a'),undefined);assert.ok(entries.get('b'));
});
test('online replay uses session cache, rate stays adjustable, growth separates voices and deletion clears it',async()=>{
 const savedWindow=globalThis.window,savedAudio=globalThis.Audio,calls:{text:string;stage:string}[]=[],audios:FakeAudio[]=[],errors:string[]=[];
 class FakeAudio{src:string;volume=1;playbackRate=1;onended:(()=>void)|null=null;onerror:(()=>void)|null=null;ended=false;constructor(src:string){this.src=src;audios.push(this);}play(){return Promise.resolve();}pause(){}}
 globalThis.Audio=FakeAudio as unknown as typeof Audio;
 globalThis.window={wisdomDesktop:{onlineSpeech:async(_id:string,text:string,stage:string,_lang:string,rate:number)=>{calls.push({text,stage});return {bytes:[1,2,3],mime:'audio/wav',remote:true,voice:stage,playbackRate:rate};},cancel:()=>{}}} as unknown as Window&typeof globalThis;
 const controller=new VoiceController(e=>errors.push(e));const config={...defaultVoiceConfig(),outputEnabled:true};controller.configure(config,'','');
 async function read(height:number){let done=false;const promise=controller.speak('第一句。第二句。第三句。',height).then(()=>{done=true;});for(let i=0;i<40&&!done;i++){await tick();for(const audio of audios){if(!audio.ended&&audio.onended){audio.ended=true;audio.onended();}}}assert.ok(done);await promise;}
 try{await read(10);assert.equal(calls.length,3);await read(10);assert.equal(calls.length,3);controller.configure({...config,rate:1.3},'','');await read(10);assert.equal(calls.length,3);assert.equal(audios.at(-1)!.playbackRate,1.3);await read(50);assert.equal(calls.length,6);assert.equal(calls.at(-1)!.stage,'mature');controller.clearSpeech();await read(50);assert.equal(calls.length,9);assert.deepEqual(errors,[]);}finally{controller.dispose();globalThis.window=savedWindow;globalThis.Audio=savedAudio;}
});
test('a late result from stopped speech is not played or retained for replay',async()=>{
 const savedWindow=globalThis.window,savedAudio=globalThis.Audio;const pending:((r:unknown)=>void)[]=[];let plays=0;
 class FakeAudio{volume=1;playbackRate=1;onended:(()=>void)|null=null;onerror:(()=>void)|null=null;play(){plays++;return Promise.resolve();}pause(){}}
 globalThis.Audio=FakeAudio as unknown as typeof Audio;globalThis.window={wisdomDesktop:{onlineSpeech:()=>new Promise(r=>pending.push(r)),cancel:()=>{}}} as unknown as Window&typeof globalThis;
 const controller=new VoiceController(()=>{});controller.configure({...defaultVoiceConfig(),outputEnabled:true},'','');
 try{const first=controller.speak('晚到的一句。');await tick();controller.stop();pending[0]({bytes:[1],mime:'audio/wav',playbackRate:1});await first;await tick();assert.equal(plays,0);const next=controller.speak('晚到的一句。');await tick();assert.equal(pending.length,2);controller.stop();pending[1]({bytes:[1],mime:'audio/wav',playbackRate:1});await next;assert.equal(plays,0);}finally{controller.dispose();globalThis.window=savedWindow;globalThis.Audio=savedAudio;}
});
