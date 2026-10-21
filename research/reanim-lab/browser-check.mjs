import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const out=path.resolve('../../private/reports/reanim-lab-browser');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1100,height:1080},deviceScaleFactor:1});
const errors=[];page.on('pageerror',error=>errors.push(String(error)));
await page.goto('http://127.0.0.1:5178/');
await page.waitForFunction(()=>window.reanimLab?.ready,{timeout:30000});
await page.evaluate(()=>{window.reanimLab.setPaused(true);window.reanimLab.setClouds(false);});
const states=[];
for(const height of [1,2,5,6,10,20,30,40,49,50,51,99,100,101,499,500,999,1000,1001]){
  const state=await page.evaluate(height=>{window.reanimLab.load(height);return window.reanimLab.snapshot();},height);
  assert.equal(state.height,height);assert.equal(state.clouds.length,6);
  let maxError=0;
  for(const m of state.matrices){
    const actual=[m.actual[0],m.actual[1],m.actual[3],m.actual[4],m.actual[6],m.actual[7]];
    for(let k=0;k<6;k++)maxError=Math.max(maxError,Math.abs(actual[k]-m.expected[k]));
  }
  assert.ok(maxError<.0002,`height ${height}: affine error ${maxError}`);
  const dataUrl=await page.evaluate(()=>window.reanimLab.pixels());
  await fs.writeFile(path.join(out,`height-${height}.png`),Buffer.from(dataUrl.split(',')[1],'base64'));
  states.push({height,frame:state.frame,maxMatrixError:maxError});
}
const transitions=[];
for(const height of [1,5,49,50,99,499,999,1000]){
  const result=await page.evaluate(height=>{
    const lab=window.reanimLab;lab.load(height);const first=lab.feed(),duplicate=lab.feed();lab.step(275);
    return {first,duplicate,state:lab.snapshot()};
  },height);
  assert.equal(result.first,true);assert.equal(result.duplicate,false);assert.equal(result.state.height,height+1);assert.equal(result.state.food,4);
  transitions.push({from:height,to:result.state.height,food:result.state.food,events:result.state.events});
}
const namedClouds=await page.evaluate(()=>{window.reanimLab.load(1);return window.reanimLab.snapshot().clouds;});
assert.deepEqual(namedClouds.map(c=>c.name),['Cloud1','Cloud2','Cloud3','Cloud4','Cloud5','Cloud6']);
assert.equal(new Set(namedClouds.map(c=>c.start)).size,6);
const environment=await page.evaluate(()=>({userAgent:navigator.userAgent,gl:(()=>{
  const c=document.querySelector('canvas');const gl=c.getContext('webgl2')||c.getContext('webgl');
  if(!gl)return null;const ext=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:gl.getParameter(gl.VENDOR),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};
})()}));
await page.evaluate(()=>{window.reanimLab.load(49);window.reanimLab.setPaused(false);});
await page.waitForTimeout(2000);
const perf=await page.evaluate(()=>window.reanimLab.snapshot());
const times=perf.renderMilliseconds.slice().sort((a,b)=>a-b);
const result={scope:'Local research browser verification, software WebGL. NOT original screenshot/timing acceptance.',date:new Date().toISOString(),
  browser:await browser.version(),pixi:perf.pixi,environment,states,transitions,namedClouds,pageErrors:errors,
  drawAndDiagnosticsMilliseconds:{samples:times.length,median:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)]}};
await fs.writeFile(path.join(out,'result.json'),JSON.stringify(result,null,2));
await page.screenshot({path:path.join(out,'lab-ui.png'),fullPage:true});
await browser.close();assert.deepEqual(errors,[]);
console.log(JSON.stringify({staticStates:states.length,transitions:transitions.length,namedClouds:6,pageErrors:errors.length,maxMatrixError:Math.max(...states.map(s=>s.maxMatrixError)),environment,drawAndDiagnosticsMilliseconds:result.drawAndDiagnosticsMilliseconds},null,2));
