import test from 'node:test';import assert from 'node:assert/strict';
import {layoutSpeech,clampScroll} from '../packages/speech-core/index.ts';
const measure=(value:string)=>Array.from(value).length*10;
test('short speech contracts while long speech grows within the scene and scrolls',()=>{
 const small=layoutSpeech('你好。',6,measure),long=layoutSpeech('一段很长的回复。'.repeat(500),6,measure);
 assert.ok(small.bodyHeight<long.bodyHeight);assert.ok(small.width<long.width);assert.equal(small.maxScroll,0);assert.ok(long.maxScroll>0);
 assert.ok(long.x+long.width<=800);assert.ok(long.y+long.totalHeight<535);assert.equal(clampScroll(Infinity,long),long.maxScroll);assert.equal(clampScroll(-20,long),0);
});
test('code in the bubble stays plain text with indentation and no pagination',()=>{
 const l=layoutSpeech('<script>\n    const text = "safe";\n</script>',51,measure);
 assert.ok(l.lines.some(line=>line.startsWith('    const')));assert.ok(l.lines.join('\n').includes('<script>'));assert.equal('pages' in l,false);
});
test('copy control stays inside every AI bubble, below text and clear of the scrollbar',()=>{
 for(const height of [1,6,10,49,50,1001])for(const text of ['好。','短句\n'.repeat(60),'一段很长的回复。'.repeat(100),'```html\n  <button>hello</button>\n```']){
  const l=layoutSpeech(text,height,measure),b=l.copy;assert.ok(b.x>=l.x+16);assert.ok(b.x+b.width<=l.x+l.width-16);assert.ok(b.y>=l.content.y+l.content.height);assert.ok(b.y+b.height<=l.y+l.bodyHeight);assert.ok(b.y+b.height<535);
 }
});
