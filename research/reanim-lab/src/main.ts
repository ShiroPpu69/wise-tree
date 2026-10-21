import {Application,Assets,Container,Matrix,Sprite,Texture,VERSION} from 'pixi.js';
import {CloudLab,TreeLab,drawGroup,matrix,sample,type Animation,type Bundle,type Track} from './core.ts';
import './style.css';

const bundle=await fetch('/bundle.json').then(r=>{if(!r.ok)throw new Error('Run export_reanim_lab.py first');return r.json() as Promise<Bundle>});
const app=new Application();
await app.init({width:800,height:600,resolution:1,autoDensity:false,preference:'webgl',antialias:false,autoStart:false,backgroundAlpha:1,preserveDrawingBuffer:true});
document.querySelector('#canvas')!.append(app.canvas);
app.canvas.setAttribute('aria-label','原版 Reanim 研究画布 800×600');
const textures=new Map<string,Texture>();
for(const [id,url] of Object.entries(bundle.textures)){const t=await Assets.load<Texture>(url);t.source.scaleMode='linear';textures.set(id,t);}
const layers=[new Container(),new Container(),new Container(),new Container(),new Container(),new Container()];
for(const layer of layers)app.stage.addChild(layer);
interface Drawable {track:Track;sprite:Sprite;index:number}
function create(animation:Animation,layerFor:(track:Track)=>Container):Drawable[]{
  return animation.tracks.flatMap((track,index)=>{
    const first=track.frames.find(f=>f[8]);if(!first)return [];
    const sprite=new Sprite(textures.get(first[8]));sprite.anchor.set(0,0);layerFor(track).addChild(sprite);
    return [{track,sprite,index}];
  });
}
function apply(d:Drawable,position:number,offsetX=0,offsetY=0):void {
  const value=sample(d.track,position),sprite=d.sprite;
  sprite.visible=value[6]>=0&&value[7]>0&&!!value[8];if(!sprite.visible)return;
  const texture=textures.get(value[8]);if(!texture)throw new Error(`Missing texture ${value[8]}`);
  sprite.texture=texture;sprite.alpha=value[7];
  const [a,b,c,dd,x,y]=matrix(value);sprite.setFromMatrix(new Matrix(a,b,c,dd,x+offsetX,y+offsetY));
}
const tree=create(bundle.animations.TreeOfWisdom,t=>layers[drawGroup(t.name)]);
const cloudDraws=create(bundle.animations.TreeOfWisdomClouds,()=>layers[1]);
const food=create(bundle.animations.TreeFood,()=>layers[5]);
const model=new TreeLab(bundle.animations);
let clouds=new CloudLab(bundle.animations.TreeOfWisdomClouds);
let paused=false,showClouds=true,showSound=false,manualFrame:number|null=null;
let last=performance.now(),accumulator=0,lastEvent=0;
const frameSamples:number[]=[];
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const heights=[1,2,5,6,10,20,30,40,49,50,51,99,100,101,499,500,999,1000,1001];
for(const h of heights)$<HTMLSelectElement>('height').add(new Option(String(h),String(h)));
const sounds={fertilizer:new Audio('/fertilizer.ogg'),plantgrow:new Audio('/plantgrow.ogg')};
function audioEvents(){
  const events=model.events.slice(lastEvent);lastEvent=model.events.length;
  for(const event of events){if(!showSound)continue;if(event.type==='fertilizer'||event.type==='plantgrow'){
    for(const audio of Object.values(sounds)){audio.pause();audio.currentTime=0;}
    void sounds[event.type].play().catch(error=>console.warn('Audio unavailable; text/render stays usable',String(error)));
  }}
}
function draw(){
  const position=manualFrame??model.tree.frame;
  for(const d of tree)apply(d,position);
  for(const d of cloudDraws){const c=clouds.instances.find(c=>c.name===d.track.name)!;apply(d,c.playback.frame);d.sprite.visible&&=showClouds;}
  for(const d of food){if(model.fertilizer)apply(d,model.fertilizer.frame,340,300);else d.sprite.visible=false;}
  app.render();
  $('status').textContent=JSON.stringify({scope:'研究数据；不读写正式存档。时序尚待原版逐帧对照。',pixi:VERSION,renderer:app.renderer.name,
    height:model.height,food:model.food,phase:model.phase,tick:model.ticks,frame:position,
    treeSegment:model.tree.range,clouds:clouds.instances.map(c=>({name:c.name,frame:c.playback.frame,wait:c.wait})),events:model.events.slice(-4)},null,2);
  $<HTMLInputElement>('frame').value=String(position);
  $<HTMLButtonElement>('feed').disabled=model.phase!=='idle';
}
function load(height:number){model.load(height);clouds=new CloudLab(bundle.animations.TreeOfWisdomClouds);manualFrame=null;lastEvent=0;draw();}
$('load').onclick=()=>load(Number($<HTMLSelectElement>('height').value));
$('feed').onclick=()=>{manualFrame=null;model.feed();audioEvents();draw();};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'继续':'暂停';};
$('step').onclick=()=>{paused=true;$('pause').textContent='继续';manualFrame=null;model.tick();clouds.tick();audioEvents();draw();};
$<HTMLInputElement>('frame').oninput=()=>{paused=true;manualFrame=Number($<HTMLInputElement>('frame').value);draw();};
$<HTMLInputElement>('clouds').onchange=()=>{showClouds=$<HTMLInputElement>('clouds').checked;draw();};
$<HTMLInputElement>('voice').onchange=()=>{showSound=$<HTMLInputElement>('voice').checked;if(!showSound)for(const a of Object.values(sounds))a.pause();};
$<HTMLSelectElement>('sampling').onchange=()=>{for(const t of textures.values())t.source.scaleMode=$<HTMLSelectElement>('sampling').value as 'linear'|'nearest';draw();};
function animate(now:number){
  const delta=Math.max(0,Math.min(500,now-last));last=now;
  if(!paused){accumulator+=delta;while(accumulator>=10){model.tick();clouds.tick();accumulator-=10;}audioEvents();}
  const begin=performance.now();draw();frameSamples.push(performance.now()-begin);if(frameSamples.length>600)frameSamples.shift();
  requestAnimationFrame(animate);
}
function snapshot(){return {height:model.height,food:model.food,phase:model.phase,tick:model.ticks,frame:manualFrame??model.tree.frame,
  clouds:clouds.instances.map(c=>({name:c.name,...c.playback.range,frame:c.playback.frame})),events:[...model.events],
  renderer:app.renderer.name,pixi:VERSION,renderMilliseconds:[...frameSamples],
  matrices:tree.filter(d=>d.sprite.visible).map(d=>({index:d.index,name:d.track.name,expected:matrix(sample(d.track,manualFrame??model.tree.frame)),actual:d.sprite.localTransform.toArray(true)}))};}
// Research-only diagnostics. This lab is never imported by a production application.
Object.assign(window,{reanimLab:{load,setPaused:(v:boolean)=>{paused=v;},setClouds:(v:boolean)=>{showClouds=v;draw();},
  step:(ticks:number)=>{for(let i=0;i<ticks;i++){model.tick();clouds.tick();}audioEvents();draw();},
  feed:()=>{manualFrame=null;const accepted=model.feed();audioEvents();draw();return accepted;},
  seek:(frame:number)=>{paused=true;manualFrame=frame;draw();},snapshot,
  pixels:()=>app.canvas.toDataURL('image/png'),provenance:bundle.provenance,ready:true}});
load(1);requestAnimationFrame(animate);
