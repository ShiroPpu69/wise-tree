import type {Animation,Frame} from '../reanim-core/index.ts';
import type {ChineseAssets} from './chinese.ts';
import {floatTrack,type ParticleDefinition} from '../particle-core/index.ts';
export const AUDITED_PAK='5878326408285cb01f83b4fa4edcc66d65e727f6d6ee88563b5b3b287dd259fc';
const LIMIT=128*1024*1024;
export class Reader {
  pos=0; data:Uint8Array; view:DataView;
  constructor(data:Uint8Array){this.data=data;this.view=new DataView(data.buffer,data.byteOffset,data.byteLength);}
  take(n:number){if(n<0||this.pos+n>this.data.length)throw Error('资源截断');const b=this.data.subarray(this.pos,this.pos+n);this.pos+=n;return b;}
  u8(){return this.take(1)[0];} u32(){const p=this.pos;this.take(4);return this.view.getUint32(p,true);}
  float(){const p=this.pos;this.take(4);const v=this.view.getFloat32(p,true);if(!Number.isFinite(v))throw Error('无效动画变换');return v;}
  str(){const n=this.u32();if(n>1e6)throw Error('资源字符串过长');return new TextDecoder('utf-8',{fatal:true}).decode(this.take(n));}
}
export function safePath(name:string){const p=name.replaceAll('\\','/');if(!p||p.startsWith('/')||/[\x00:]/.test(p)||p.split('/').some(x=>x==='..'||x===''))throw Error('不安全资源路径');return p.toLowerCase();}
export function unpackPak(raw:Uint8Array):Map<string,Uint8Array>{
  if(raw.length>LIMIT)throw Error('资源包超出128MiB限制');
  const bytes=raw.map(v=>v^0xf7),r=new Reader(bytes);if(r.u32()!==0xbac04ac0||r.u32()!==0)throw Error('不支持的PAK版本');
  const entries:{name:string;size:number}[]=[],names=new Set<string>();
  for(;;){const flag=r.u8();if(flag===128)break;if(flag!==0||entries.length>100000)throw Error('无效PAK目录');const name=safePath(new TextDecoder('ascii').decode(r.take(r.u8()))),size=r.u32();r.take(8);if(names.has(name)||size>LIMIT)throw Error('PAK重复路径或异常长度');names.add(name);entries.push({name,size});}
  const files=new Map(entries.map(e=>[e.name,r.take(e.size)]));if(r.pos!==bytes.length)throw Error('PAK含未识别尾部');return files;
}
async function inflate(raw:Uint8Array){if(new DataView(raw.buffer,raw.byteOffset,raw.byteLength).getUint32(0,true)!==0xdeadfed4)return raw;
  const size=new DataView(raw.buffer,raw.byteOffset).getUint32(4,true);if(size>LIMIT)throw Error('动画解压上限');
  const reader=new Blob([raw.slice(8)]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();const parts:Uint8Array[]=[];let n=0;
  for(;;){const p=await reader.read();if(p.done)break;n+=p.value.length;if(n>size){await reader.cancel();throw Error('动画解压长度不符');}parts.push(p.value);}
  if(n!==size)throw Error('动画解压长度不符');const out=new Uint8Array(n);let off=0;for(const part of parts){out.set(part,off);off+=part.length;}return out;
}
export async function decodeReanim(raw:Uint8Array):Promise<Animation>{
  const r=new Reader(await inflate(raw));r.take(8);const count=r.u32(),fps=r.float();r.take(4);if(count>4096||r.u32()!==12||fps<=0)throw Error('不支持的PC Reanim');
  const counts:number[]=[];let total=0;for(let i=0;i<count;i++){r.take(8);const n=r.u32();total+=n;if(total>1e6)throw Error('动画轨道过多');counts.push(n);}
  const tracks=[];
  for(const n of counts){const name=r.str();if(r.u32()!==44)throw Error('动画步长不符');const sparse:number[][]=[];for(let i=0;i<n;i++){sparse.push(Array.from({length:8},()=>r.float()));r.take(12);}
    let previous:Frame=[0,0,0,0,1,1,0,1,'','',''];const frames:Frame[]=[];
    for(let i=0;i<n;i++){const refs=[r.str(),r.str(),r.str()];previous=[...sparse[i].map((v,k)=>v===-10000?previous[k]:v),...refs.map((v,k)=>v||previous[k+8])] as Frame;frames.push(previous);}
    tracks.push({name,frames});
  }
  if(r.pos!==r.data.length)throw Error('动画含未解释数据');return {fps,tracks};
}
export interface Glyph {advance:number;rect:number[];offset:number[]}
export interface BitmapFont {glyphs:Record<string,Glyph>;layers:{name:string;image:string;ascent:number;padding:number;spacingOffset:number}[];height:number;ascent:number;lineHeight:number}
export function decodeFont(raw:Uint8Array):BitmapFont {
  // Latin-1 byte values, not TextDecoder('latin1') which aliases Windows-1252.
  const s=Array.from(raw,b=>String.fromCharCode(b)).join('');
  function block(name:string){const m=s.match(new RegExp('Define\\s+'+name+'\\s+(\\([\\s\\S]*?\\))\\s*;\\s*(?=Define|CreateLayer)'));if(!m)throw Error('缺少字体列表 '+name);return m[1];}
  const chars=Array.from(block('CharList').matchAll(/'([^']*)'|"([^"]*)"/g),m=>m[1]??m[2]);
  const nums=(name:string)=>Array.from(block(name).matchAll(/-?\d+/g),m=>Number(m[0]));const widths=nums('WidthList'),rects=nums('RectList'),offsets=nums('OffsetList');
  if(new Set(chars).size!==chars.length||chars.some(c=>c.length!==1)||widths.length!==chars.length||rects.length!==chars.length*4||offsets.length!==chars.length*2)throw Error('字体映射不完整');
  const glyphs:Record<string,Glyph>={};chars.forEach((c,i)=>glyphs[c]={advance:widths[i],rect:rects.slice(i*4,i*4+4),offset:offsets.slice(i*2,i*2+2)});glyphs[' ']={advance:5,rect:[0,0,0,0],offset:[0,0]};
  const layers=Array.from(s.matchAll(/CreateLayer\s+(\w+)\s*;([\s\S]*?)(?=CreateLayer|SetDefaultPointSize|$)/g),m=>{const number=(field:string)=>Number(m[2].match(new RegExp('LayerSet'+field+'\\s+\\w+\\s+(-?\\d+)'))?.[1]??0);const image=m[2].match(/LayerSetImage\s+\w+\s+'([^']+)'/)?.[1];if(!image)throw Error('字体缺少字图');return {name:m[1],image,ascent:number('Ascent'),padding:number('AscentPadding'),spacingOffset:number('LineSpacingOffset')};});
  const height=Math.max(...Object.values(glyphs).map(g=>g.rect[3]+g.offset[1]));return {glyphs,layers,height,ascent:Math.max(...layers.map(l=>l.ascent)),lineHeight:height+Math.max(...layers.map(l=>l.spacingOffset))};
}
export interface ImportedAssets {chinese?:ChineseAssets;hash:string;version:string;animations:Record<string,Animation>;images:Record<string,Blob>;fonts:Record<string,BitmapFont>;dialogue:Record<string,string>;sounds:Record<string,Blob>;sources:Record<string,string[]>;particles:Record<string,ParticleDefinition>}
export async function importGoty(raw:Uint8Array,onProgress:(message:string)=>void=()=>{}):Promise<ImportedAssets>{
  if(!globalThis.crypto?.subtle||typeof DecompressionStream==='undefined'||typeof createImageBitmap==='undefined')throw Error('当前浏览器缺少资源导入能力，请使用支持Web Crypto、DecompressionStream和ImageBitmap的浏览器，并通过HTTPS或localhost访问。');
  onProgress('识别GOTY资源…');const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw.slice())),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==AUDITED_PAK)throw Error('此PAK不属于已审计的Steam英文GOTY 1.2.0.1096；保留原文件，需先补版本审计。');
  const files=unpackPak(raw),get=(path:string)=>{const b=files.get(path.toLowerCase());if(!b)throw Error('缺少原版资源 '+path);return b;};
  const result:ImportedAssets={hash,version:'Steam GOTY 1.2.0.1096 English',animations:{},images:{},fonts:{},dialogue:{},sounds:{},sources:{},particles:{}};
  const xml=new DOMParser().parseFromString(new TextDecoder().decode(get('properties/resources.xml')),'text/xml');if(xml.querySelector('parsererror'))throw Error('资源XML损坏');const manifest=new Map<string,string>();
  for(const group of Array.from(xml.documentElement.children)){let path='',prefix='';for(const node of Array.from(group.children)){if(node.tagName==='SetDefaults'){path=(node.getAttribute('path')??path).replaceAll('\\','/');prefix=node.getAttribute('idprefix')??prefix;}else if(node.getAttribute('id'))manifest.set(prefix+node.getAttribute('id'),(path+'/'+(node.getAttribute('path')??'')).replace(/^\//,''));}}
  async function image(id:string,stems:string[]){if(result.images[id])return;
    for(const stem of stems){const png=files.get((stem+'.png').toLowerCase()),jpg=files.get((stem+'.jpg').toLowerCase());if(!png&&!jpg)continue;
      const source=png??jpg!;let blob=new Blob([source.slice()],{type:png?'image/png':'image/jpeg'});const mask=!png?files.get((stem+'_.png').toLowerCase()):undefined;
      if(mask){const [color,alpha]=await Promise.all([createImageBitmap(blob),createImageBitmap(new Blob([mask.slice()],{type:'image/png'}))]);if(color.width!==alpha.width||color.height!==alpha.height)throw Error('透明遮罩尺寸不符');const c=new OffscreenCanvas(color.width,color.height),cx=c.getContext('2d')!;cx.drawImage(color,0,0);const pixels=cx.getImageData(0,0,c.width,c.height);cx.clearRect(0,0,c.width,c.height);cx.drawImage(alpha,0,0);const a=cx.getImageData(0,0,c.width,c.height);for(let n=0;n<pixels.data.length;n+=4)pixels.data[n+3]=a.data[n];cx.putImageData(pixels,0,0);blob=await c.convertToBlob({type:'image/png'});color.close();alpha.close();}
      result.images[id]=blob;result.sources[id]=[stem+(png?'.png':'.jpg'),...(mask?[stem+'_.png']:[])];return;
    }throw Error('无法解析原版图片 '+id);
  }
  for(const name of ['TreeOfWisdom','TreeOfWisdomClouds','TreeFood','CrazyDave','Zombie','LawnMower']){onProgress('解析原版动画 '+name);const animation=await decodeReanim(get('compiled/reanim/'+name+'.reanim.compiled'));result.animations[name]=animation;
    for(const id of new Set(animation.tracks.flatMap(t=>t.frames.map(f=>f[8])).filter(Boolean))){const stems=[manifest.get(id),id.startsWith('IMAGE_REANIM_')?'reanim/'+id.slice(13):undefined,id.startsWith('IMAGE_')?id.slice(6):undefined].filter((x):x is string=>!!x);await image(id,stems);}}
  for(const [id,path] of manifest)if(id.startsWith('IMAGE_STORE_')||id.startsWith('IMAGE_ZEN')||id.startsWith('IMAGE_DIALOG_')||id.startsWith('IMAGE_BUTTON_')||id.startsWith('IMAGE_OPTIONS_')||['IMAGE_TREEFOOD','IMAGE_COINBANK','IMAGE_SHOVELBANK','IMAGE_REANIM_STINKY_TURN3','IMAGE_SEEDBANK','IMAGE_SEEDCHOOSER_BUTTON2'].includes(id))await image(id,[path]);
  for(const [id,path] of manifest)if(/HEAD_SUNGLASSES|ZOMBIE_MUSTACHE[23]/.test(id))await image(id,[path]);
  for(const name of ['Daisy','Pinata']){const doc=new DOMParser().parseFromString(new TextDecoder().decode(get('particles/'+name+'.xml')),'text/xml');const emitter=doc.querySelector('Emitter');if(!emitter)throw Error('彩蛋粒子定义损坏');const tracks:ParticleDefinition['tracks']={};for(const node of Array.from(emitter.children))if(!['Name','Image','ImageFrames','Field','EmitterType','DieIfOverloaded','RandomLaunchSpin'].includes(node.tagName))tracks[node.tagName]=floatTrack(node.textContent??'');const id=emitter.querySelector('Image')?.textContent?.trim();if(!id)throw Error('彩蛋粒子图片缺失');await image(id,[manifest.get(id)??'particles/'+name]);result.particles[name]={image:id,imageFrames:Number(emitter.querySelector('ImageFrames')?.textContent??1),emitterType:emitter.querySelector('EmitterType')?.textContent?.trim()??'Box',tracks,fields:Array.from(emitter.querySelectorAll('Field')).map(field=>({type:field.querySelector('FieldType')?.textContent?.trim()??'',x:floatTrack(field.querySelector('X')?.textContent??'0'),y:floatTrack(field.querySelector('Y')?.textContent??'0')}))};}
  for(const name of ['BrianneTod12','BrianneTod16','HouseofTerror16','HouseofTerror20','ContinuumBold14','DwarvenTodcraft18']){
    const font=decodeFont(get('data/'+name+'.txt'));result.fonts[name]=font;
    for(const layer of font.layers){const path='data/'+layer.image,png=files.get((path+'.png').toLowerCase());if(png){result.images['font:'+layer.image]=new Blob([png.slice()],{type:'image/png'});continue;}
      const mask=files.get(('data/_'+layer.image+'.png').toLowerCase())??get('data/_'+layer.image+'.gif');
      const b=await createImageBitmap(new Blob([mask.slice()]));const c=new OffscreenCanvas(b.width,b.height),cx=c.getContext('2d')!;cx.drawImage(b,0,0);const p=cx.getImageData(0,0,c.width,c.height);for(let i=0;i<p.data.length;i+=4){p.data[i+3]=p.data[i];p.data[i]=p.data[i+1]=p.data[i+2]=255;}cx.putImageData(p,0,0);result.images['font:'+layer.image]=await c.convertToBlob();b.close();
    }
  }
  const strings=new TextDecoder('windows-1252').decode(get('properties/LawnStrings.txt'));
  for(const m of strings.matchAll(/^\[([^\]\r\n]+)\]\s*\r?\n([\s\S]*?)(?=^\[|$(?![\s\S]))/gm))result.dialogue[m[1]]=m[2].trim();
  for(const name of ['fertilizer','plantgrow','buttonclick','cashregister','buzzer','sukhbir','sukhbir2','sukhbir3','sukhbir4','sukhbir5','sukhbir6']){const data=files.get('sounds/'+name+'.ogg');if(data)result.sounds[name]=new Blob([data.slice()],{type:'audio/ogg'});}
  onProgress('资源提取完成，正在保存…');return prepareChatArtwork(result);
}

/** New UI composition from audited original images, never a screenshot or generated imitation. */
export async function prepareChatArtwork(assets:ImportedAssets,raw?:Uint8Array):Promise<ImportedAssets>{
 if(assets.images.IMAGE_WISDOM_CHAT_FRAME&&assets.images.IMAGE_WISDOM_CHAT_PAPER)return assets;
 const result={...assets,images:{...assets.images},sources:{...assets.sources}};
 if((!result.images.IMAGE_SEEDBANK||!result.images.IMAGE_SEEDCHOOSER_BUTTON2)&&raw){
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw.slice())),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==AUDITED_PAK)throw Error('界面资源不属于已审计的GOTY版本');
  const files=unpackPak(raw);
  for(const [id,stem]of [['IMAGE_SEEDBANK','images/SeedBank'],['IMAGE_SEEDCHOOSER_BUTTON2','images/SeedChooser_Button2']]){
   const png=files.get((stem+'.png').toLowerCase()),jpg=files.get((stem+'.jpg').toLowerCase());if(!png&&!jpg)throw Error('缺少原版输入栏素材');let blob=new Blob([(png??jpg)!.slice()],{type:png?'image/png':'image/jpeg'});const mask=jpg?files.get((stem+'_.png').toLowerCase()):undefined;
   if(mask){const color=await createImageBitmap(blob),alpha=await createImageBitmap(new Blob([mask.slice()]));const canvas=new OffscreenCanvas(color.width,color.height),ctx=canvas.getContext('2d')!;ctx.drawImage(color,0,0);const p=ctx.getImageData(0,0,color.width,color.height);ctx.clearRect(0,0,color.width,color.height);ctx.drawImage(alpha,0,0);const a=ctx.getImageData(0,0,color.width,color.height);for(let i=0;i<p.data.length;i+=4)p.data[i+3]=a.data[i];ctx.putImageData(p,0,0);blob=await canvas.convertToBlob();color.close();alpha.close();}
   result.images[id]=blob;result.sources[id]=[stem+(png?'.png':'.jpg'),...(mask?[stem+'_.png']:[])];
  }
 }
 // Existing browser caches can retain the earlier bar until the owner updates the PAK.
 if(!result.images.IMAGE_SEEDBANK||!result.images.IMAGE_SEEDCHOOSER_BUTTON2)return result;
 const [wood,paper,metal]=await Promise.all(['IMAGE_SEEDBANK','IMAGE_SEEDCHOOSER_BUTTON2','IMAGE_STORE_MAINMENUBUTTON'].map(id=>createImageBitmap(result.images[id])));
 try{
  const frame=new OffscreenCanvas(704,76),c=frame.getContext('2d')!;
  c.drawImage(wood,90,14,340,59,14,14,676,48);c.drawImage(wood,100,0,200,14,14,0,676,14);c.drawImage(wood,100,73,200,14,14,62,676,14);
  c.drawImage(wood,432,14,14,59,690,14,14,48);c.drawImage(wood,432,0,14,14,690,0,14,14);c.drawImage(wood,432,73,14,14,690,62,14,14);
  c.save();c.translate(704,0);c.scale(-1,1);c.drawImage(wood,432,14,14,59,690,14,14,48);c.drawImage(wood,432,0,14,14,690,0,14,14);c.drawImage(wood,432,73,14,14,690,62,14,14);c.restore();
  const rivet=new OffscreenCanvas(8,8),rc=rivet.getContext('2d')!;rc.drawImage(metal,4,7,8,8,0,0,8,8);const rp=rc.getImageData(0,0,8,8);for(let i=0;i<rp.data.length;i+=4)if(rp.data[i]>170&&rp.data[i]>rp.data[i+1]*1.1)rp.data[i+3]=0;rc.putImageData(rp,0,0);
  for(const x of [9,687])for(const y of [7,34,61])c.drawImage(rivet,x,y);c.drawImage(rivet,434,4);
  const parchment=new OffscreenCanvas(404,44),p=parchment.getContext('2d')!,xs=[0,12,paper.width-12,paper.width],ys=[0,8,paper.height-8,paper.height],dx=[0,14,390,404],dy=[0,9,35,44];
  for(let y=0;y<3;y++)for(let x=0;x<3;x++)p.drawImage(paper,xs[x],ys[y],xs[x+1]-xs[x],ys[y+1]-ys[y],dx[x],dy[y],dx[x+1]-dx[x],dy[y+1]-dy[y]);
  result.images.IMAGE_WISDOM_CHAT_FRAME=await frame.convertToBlob();result.images.IMAGE_WISDOM_CHAT_PAPER=await parchment.convertToBlob();result.sources.IMAGE_WISDOM_CHAT_FRAME=[...result.sources.IMAGE_SEEDBANK,...result.sources.IMAGE_STORE_MAINMENUBUTTON,'derived: nine-slice wood and extracted original rivets'];result.sources.IMAGE_WISDOM_CHAT_PAPER=[...result.sources.IMAGE_SEEDCHOOSER_BUTTON2,'derived: nine-slice original blank light control'];return result;
 }finally{wood.close();paper.close();metal.close();}
}

