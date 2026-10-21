import test from 'node:test';import assert from 'node:assert/strict';
import {SpeechTextStream,speechSession} from '../packages/voice-core/pipeline.ts';
import {growthVoice} from '../packages/voice-core/growth.ts';
import {defaultVoiceConfig,upgradeVoiceConfig,validateVoiceConfig} from '../packages/voice-core/index.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('online growth has three exact stages and configurable boundaries',()=>{
 for(const [h,want] of [[1,'child'],[9,'child'],[10,'young'],[49,'young'],[50,'mature'],[1001,'mature']] as const)assert.equal(growthVoice(h),want);
 assert.equal(growthVoice(20,'auto',30,100),'child');assert.equal(growthVoice(99,'auto',30,100),'young');assert.equal(growthVoice(100,'auto',30,100),'mature');
 assert.throws(()=>validateVoiceConfig({...defaultVoiceConfig(),youngHeight:50,matureHeight:10}));assert.throws(()=>growthVoice(1,'auto',NaN,50));
 const saved={...defaultVoiceConfig(),setupVersion:3 as const,ttsMode:'neural' as const,autoRead:false};const migrated=upgradeVoiceConfig(saved);assert.equal(migrated.setupVersion,4);assert.equal(migrated.ttsMode,'online');assert.equal(migrated.autoRead,false);
});
test('streamed speech emits once before final output, skips partial fences and links, and flushes final short text',()=>{
 const p=new SpeechTextStream();assert.deepEqual(p.update('你好'),[]);assert.deepEqual(p.update('你好。还有'),['你好。']);assert.deepEqual(p.update('你好。还有一句。'),['还有一句。']);assert.deepEqual(p.update('你好。还有一句。尾句',true),['尾句']);
 const code=new SpeechTextStream();assert.deepEqual(code.update('先说一句。\n```html\nalert("不朗读。");'),['先说一句。']);assert.deepEqual(code.update('先说一句。\n```html\nalert("不朗读。");\n```\n之后一句。'),['之后一句。']);
 const link=new SpeechTextStream();assert.deepEqual(link.update('[这里。'),[]);assert.deepEqual(link.update('[这里。](https://example.com)'),['这里。']);
 const unicode=new SpeechTextStream();const long='😀'.repeat(102);assert.equal(unicode.update(long,true).join(''),long);
});
test('prepare lookahead while first segment plays, preserve order, and never play two segments together',async()=>{
 const prepared:{text:string;resolve:(s:string)=>void}[]=[],playing:{text:string;end:()=>void}[]=[];const errors:unknown[]=[];
 const session=speechSession(text=>new Promise<string>(resolve=>prepared.push({text,resolve})),audio=>new Promise<void>(end=>playing.push({text:audio,end})),e=>errors.push(e));
 session.update('第一句。第二句。第三句。',true);await tick();assert.equal(prepared.length,2);prepared[1].resolve('第二句');await tick();assert.equal(playing.length,0);prepared[0].resolve('第一句');await tick();assert.equal(playing.length,1);assert.equal(prepared.length,2);
 playing[0].end();await tick();assert.equal(playing[1].text,'第二句');assert.equal(prepared.length,3);prepared[2].resolve('第三句');await tick();assert.equal(playing.length,2);playing[1].end();await tick();assert.equal(playing[2].text,'第三句');playing[2].end();await session.done;assert.deepEqual(errors,[]);
});
test('stop before dispatch sends no text; late results after cancellation cannot play',async()=>{
 let sent=0,played=0;const first=speechSession(async()=>{sent++;return 'audio';},async()=>{played++;},()=>{});first.update('不应该发送。',true);first.cancel();await first.done;await tick();assert.equal(sent,0);assert.equal(played,0);
 let complete!:(s:string)=>void;const second=speechSession(()=>new Promise<string>(r=>{complete=r;}),async()=>{played++;},()=>{});second.update('等待取消。',true);await tick();second.cancel();complete('late');await second.done;await tick();assert.equal(played,0);
});
test('provider error ends only speech without an unhandled prefetched rejection',async()=>{
 const errors:unknown[]=[];let played=0;const s=speechSession(async text=>{if(text==='失败。')throw Error('offline');return text;},async()=>{played++;},e=>errors.push(e));s.update('正常。失败。',true);await s.done;assert.equal(played,1);assert.equal(errors.length,1);
});
