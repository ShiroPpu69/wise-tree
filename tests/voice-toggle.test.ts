import test from 'node:test';import assert from 'node:assert/strict';import {VoiceController,defaultVoiceConfig,validateVoiceConfig,upgradeVoiceConfig} from '../packages/voice-core/index.ts';
const tick=()=>new Promise(r=>setImmediate(r));
test('master output switch accepts older saves and survives config serialization',()=>{
 const old={...defaultVoiceConfig()};delete old.outputEnabled;assert.equal(validateVoiceConfig(old).outputEnabled,false);assert.equal(defaultVoiceConfig().outputEnabled,false);assert.equal(upgradeVoiceConfig({...old,outputEnabled:true}).outputEnabled,true);const off={...defaultVoiceConfig(),outputEnabled:false};assert.equal(upgradeVoiceConfig(JSON.parse(JSON.stringify(off))).outputEnabled,false);assert.throws(()=>validateVoiceConfig({...off,outputEnabled:'no' as unknown as boolean}));
});
test('turning output off stops current playback, cancels lookahead, ignores stale text and can restart',async()=>{
 const savedWindow=globalThis.window,savedAudio=globalThis.Audio,calls:string[]=[],cancelled:string[]=[],audios:FakeAudio[]=[],errors:string[]=[];let release!:(value:unknown)=>void;
 class FakeAudio{volume=1;playbackRate=1;onended:(()=>void)|null=null;onerror:(()=>void)|null=null;paused=false;plays=0;constructor(){audios.push(this);}play(){this.plays++;this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
 globalThis.Audio=FakeAudio as unknown as typeof Audio;globalThis.window={wisdomDesktop:{onlineSpeech:async(id:string,text:string)=>{calls.push(text);if(calls.length===2)return new Promise(r=>{release=r;});return {bytes:[1],mime:'audio/wav',playbackRate:1};},cancel:(id:string)=>cancelled.push(id)}} as unknown as Window&typeof globalThis;
 const voice=new VoiceController(e=>errors.push(e)),on={...defaultVoiceConfig(),outputEnabled:true},off={...on,outputEnabled:false};voice.configure(on,'','');
 try{const session=voice.beginStreaming()!;session.update('第一句。第二句。');await tick();assert.equal(audios.length,1);voice.configure(off,'','');assert.equal(audios[0].paused,true);assert.ok(cancelled.length>=1);release({bytes:[1],mime:'audio/wav'});session.update('第一句。第二句。迟到的第三句。',true);await session.done;await tick();await voice.speak('关闭时的手动朗读。');voice.resume();assert.equal(calls.length,2);assert.equal(audios[0].plays,1);voice.configure(on,'','');const again=voice.speak('新的回答。');await tick();assert.equal(audios.length,2);audios[1].onended!();await again;assert.deepEqual(errors,[]);}finally{voice.dispose();globalThis.window=savedWindow;globalThis.Audio=savedAudio;}
});
test('master off guards system, custom and legacy paths before any voice service call',async()=>{
 const savedWindow=globalThis.window;let requests=0;globalThis.window={wisdomDesktop:{systemSpeech:()=>{requests++;},localSpeech:()=>{requests++;},cancel:()=>{}}} as unknown as Window&typeof globalThis;const voice=new VoiceController(()=>{});
 try{for(const ttsMode of ['system','custom','neural'] as const){voice.configure({...defaultVoiceConfig(),ttsMode,outputEnabled:false,customEnabled:true,ttsModel:'test',ttsVoice:'test'},'','');await voice.speak('不应该发送的文字。');}assert.equal(requests,0);}finally{voice.dispose();globalThis.window=savedWindow;}
});
