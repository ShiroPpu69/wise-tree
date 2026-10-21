import {test} from 'node:test';
import assert from 'node:assert/strict';
import {framePosition,matrix,sample,segment,wisdomKey,TreeLab,type Animation,type Frame} from './core.ts';
const f=(x:number=0,visible:number=0,image:string='A'):Frame=>[x,0,0,0,1,1,visible,1,image,'',''];
test('continuous values interpolate while image/frame stay on prior event',()=>{
  const t={name:'part',frames:[f(0,0,'A'),f(10,-1,'B')]};const s=sample(t,.5);
  assert.equal(s[0],5);assert.equal(s[6],0);assert.equal(s[8],'A');
});
test('named ranges support Cloud labels and holes without anim_ heuristic',()=>{
  const a:Animation={fps:12,tracks:[{name:'Cloud1',frames:[f(0,-1),f(),f(0,-1),f()]}]};
  assert.deepEqual(segment(a,'Cloud1'),{start:1,count:3});
});
test('once-and-hold samples N-1 intervals and clamps endpoints',()=>{
  assert.equal(framePosition({start:335,count:10},.99),343.91);
  assert.equal(framePosition({start:335,count:10},1),344);
  assert.equal(framePosition({start:335,count:10},-1),335);
});
test('affine matrix preserves independent skew axes and negative determinant',()=>{
  const v=f();v[2]=180;v[3]=0;v[4]=2;v[5]=3;
  const m=matrix(v);assert.ok(Math.abs(m[0]+2)<1e-10);assert.equal(m[3],3);assert.ok(m[0]*m[3]-m[1]*m[2]<0);
});
test('milestone text keys and above-1000 text follow measured branches',()=>{
  assert.deepEqual([99,100,101,500,1000,1001].map(wisdomKey),[49,800,49,900,1000,1100]);
});
test('research feed rejects repeated clicks and commits one height increment',()=>{
  const tracks=[];for(let i=1;i<=51;i++)tracks.push({name:`anim_grow${i}`,frames:[f(0,-1),f(),f()]});
  const a={TreeOfWisdom:{fps:12,tracks},TreeFood:{fps:20,tracks:[{name:'bag',frames:Array.from({length:31},()=>f())}]}};
  const lab=new TreeLab(a);lab.load(49);assert.equal(lab.feed(),true);assert.equal(lab.feed(),false);assert.equal(lab.food,4);
  for(let i=0;i<155;i++)lab.tick();assert.equal(lab.height,50);assert.equal(lab.feed(),false);
  for(let i=0;i<120;i++)lab.tick();assert.equal(lab.phase,'idle');assert.equal(lab.food,4);assert.equal(lab.height,50);
});
