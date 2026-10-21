import {Application,Container,Matrix,Sprite,Texture} from 'pixi.js';
// This polyfill replaces generated Function/eval with static code; CSP stays strict.
import 'pixi.js/unsafe-eval';
import {CloudLab,TreeLab,matrix,sample,segment,wisdomKey,idleWisdomKey,repeatWisdomKey,type Animation,type Track} from '../reanim-core/index.ts';
import type {BitmapFont,ImportedAssets} from '../asset-pipeline/index.ts';
import type {GameState} from '../game-core/index.ts';
import {CheatRecognizer,requiredHeight,type EasterCommand} from '../easter-core/index.ts';
import {ParticleDemo} from '../particle-core/index.ts';
import {graphemes,wrapMeasured} from '../font-core/index.ts';
import {getLanguage,translate} from '../i18n-core/index.ts';
import {layoutSpeech,clampScroll,type SpeechLayout,type SpeechControl} from '../speech-core/index.ts';
export interface SceneActions {feed:()=>void;buy:()=>void;options:()=>void;screen:(screen:'tree'|'shop'|'demo')=>void;finished:(id:string)=>void;error:(message:string)=>void;speechControl?:(control:SpeechControl|null)=>void}
export class WisdomScene {
  private app=new Application();private assets:ImportedAssets;private actions:SceneActions;
  private images=new Map<string,ImageBitmap>();private textures=new Map<string,Texture>();
  private layers=Array.from({length:6},()=>new Container());private drawings:{track:Track;sprite:Sprite;group:string}[]=[];
  private overlay=document.createElement('canvas');private ctx:CanvasRenderingContext2D;private overlayTexture:Texture|null=null;
  private model:TreeLab;private clouds:CloudLab;private state:GameState;private activeFeed:string|null=null;
  private cancelled=false;private frame=0;private last=0;private accumulator=0;private elapsed=0;
  private selected=false;private shop=false;private bubble='';private reveal=0;private fixedBubble='';private fixedUntil=0;
  private colorAtlases=new Map<string,HTMLCanvasElement>();private sound:HTMLAudioElement|null=null;private urls:string[]=[];
  private pointer={x:0,y:0};private daveRange:{start:number;count:number};
  private cheats=new CheatRecognizer();private demo=false;private modes=new Set<EasterCommand>();private demoParticles:ParticleDemo|null=null;private mustacheVariant=1;
  private idleAt=7000+Math.floor(Math.random()*801)*10;private idleKey=0;
  private cachedText='';private cachedWidth=0;private cachedLines:string[]=[];private generating=false;
  private purchasePrompt=false;
  private soundEnabled=true;
  private speech:SpeechLayout|null=null;private speechSource='';private speechHeight=-1;private scrollY=0;
  private copyControlKey='';
  private publishCopy(control:SpeechControl|null){const key=control?`${control.x}:${control.y}:${control.width}:${control.height}`:'';if(key!==this.copyControlKey){this.copyControlKey=key;this.actions.speechControl?.(control);}}
  setSoundEnabled(enabled:boolean){this.soundEnabled=enabled;if(!enabled)this.sound?.pause();}
  constructor(assets:ImportedAssets,state:GameState,actions:SceneActions){this.assets=assets;this.actions=actions;this.state=state;this.model=new TreeLab(assets.animations);this.clouds=new CloudLab(assets.animations.TreeOfWisdomClouds);this.overlay.width=800;this.overlay.height=600;this.ctx=this.overlay.getContext('2d')!;this.model.load(state.pendingFeed?.from??state.height);this.daveRange=segment(assets.animations.CrazyDave,'anim_idle');}
  async mount(parent:HTMLElement){
    await this.app.init({width:800,height:600,resolution:1,antialias:false,autoStart:false,preference:'webgl',backgroundAlpha:1});
    if(this.cancelled){this.app.destroy(true);return;}
    for(const [id,blob] of Object.entries(this.assets.images)){const bitmap=await createImageBitmap(blob);if(this.cancelled){bitmap.close();return;}this.images.set(id,bitmap);this.textures.set(id,Texture.from(bitmap));}
    for(const [id,blob] of Object.entries(this.assets.chinese?.images??{})){const bitmap=await createImageBitmap(blob);if(this.cancelled){bitmap.close();return;}this.images.set('zh:'+id,bitmap);}
    for(const layer of this.layers)this.app.stage.addChild(layer);
    const make=(a:Animation,group:string,choose:(t:Track)=>Container)=>{for(const track of a.tracks){const f=track.frames.find(f=>f[8]);if(!f)continue;const sprite=new Sprite(this.textures.get(f[8]));choose(track).addChild(sprite);this.drawings.push({track,sprite,group});}};
    make(this.assets.animations.TreeOfWisdom,'tree',t=>this.layers[t.name.startsWith('bg')?0:t.name.startsWith('tree')?2:t.name.startsWith('grass')?3:4]);
    make(this.assets.animations.TreeOfWisdomClouds,'cloud',()=>this.layers[1]);make(this.assets.animations.TreeFood,'food',()=>this.layers[5]);
    make(this.assets.animations.CrazyDave,'dave',()=>this.layers[2]);
    this.overlayTexture=Texture.from(this.overlay);this.app.stage.addChild(new Sprite(this.overlayTexture));parent.replaceChildren(this.app.canvas);this.app.canvas.setAttribute('aria-label','智慧树，800×600原版逻辑画布');
    this.app.canvas.addEventListener('pointermove',this.move);this.app.canvas.addEventListener('pointerdown',this.click);
    this.app.canvas.addEventListener('wheel',this.wheel,{passive:false});
    window.addEventListener('keydown',this.keyboard);
    this.sync(this.state);this.last=performance.now();this.frame=requestAnimationFrame(this.tick);
  }
  private coordinates=(event:PointerEvent)=>{const r=this.app.canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*800/r.width,y:(event.clientY-r.top)*600/r.height};};
  private move=(event:PointerEvent)=>{this.pointer=this.coordinates(event);};
  private click=(event:PointerEvent)=>{
    const {x,y}=this.coordinates(event);
    if(this.demo){if(x>=628&&y<46){this.demo=false;this.demoParticles=null;this.actions.screen('tree');}return;}
    if(this.shop){if(this.purchasePrompt){if(y>=345&&y<=391&&x>=240&&x<=560){this.purchasePrompt=false;this.play('buttonclick');if(x<390)this.actions.buy();}return;}if(x>=366&&x<=500&&y>=512){this.play('buttonclick');this.shop=false;this.actions.screen('tree');return;}if(x>=430&&x<=520&&y>=310&&y<=400){if(this.state.food>=10||this.state.coins<2500)this.actions.buy();else this.purchasePrompt=true;return;}return;}
    if(x>=628&&y<36){this.actions.options();return;}
    if(x>=678&&y>=33&&y<75){this.selected=false;this.pauseVoiceForFeed();this.play('buttonclick');this.shop=true;this.actions.screen('shop');return;}
    if(x>=30&&x<=102&&y<=72){if(this.state.food<1)this.actions.error('没有树肥，请到商店购买');else if(!this.state.pendingFeed)this.selected=!this.selected;return;}
    if(this.selected&&!this.state.pendingFeed){this.selected=false;this.actions.feed();return;}
    if(this.displayBubble()&&this.elapsed>=this.fixedUntil){const l=this.speechLayout();if(x>=l.x&&x<=l.x+l.width&&y>=l.y&&y<=l.y+l.bodyHeight){if(x>l.x+l.width-32&&y<l.y+28){this.bubble='';this.scrollY=0;return;}this.reveal=Number.MAX_SAFE_INTEGER;}}
  };
  private keyboard=(event:KeyboardEvent)=>{if(document.querySelector('[aria-modal="true"],.history-panel'))return;if(event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;const element=document.activeElement;const editing=element instanceof HTMLElement&&(element.matches('input,textarea,select')||element.isContentEditable);const code=this.cheats.input(event.key,editing);if(!code)return;if(this.state.height<requiredHeight(code)){this.play('buzzer');this.actions.error(getLanguage()==='zh-CN'?(this.assets.chinese?.dialogue.CANT_USE_CODE??'智慧树高度尚未满足原版指令条件'):(this.assets.dialogue.CANT_USE_CODE??'Tree is not tall enough'));return;}if(!this.assets.animations.Zombie||!this.assets.animations.LawnMower){this.actions.error('该存储资源缺少彩蛋素材，请重新导入原版PAK');return;}this.modes.has(code)?this.modes.delete(code):this.modes.add(code);this.demo=true;this.shop=false;this.selected=false;this.pauseVoiceForFeed();this.actions.screen('demo');if(code==='mustache')this.mustacheVariant=1+Math.floor(Math.random()*3);if(code==='sukhbir')this.play(['sukhbir','sukhbir2','sukhbir3','sukhbir4','sukhbir5','sukhbir6'][Math.floor(Math.random()*6)]);const definition=this.assets.particles?.[code==='daisies'?'Daisy':code==='pinata'?'Pinata':''];if(definition)this.demoParticles=new ParticleDemo(definition);};
  sync(state:GameState){this.state=state;if(state.pendingFeed&&state.pendingFeed.id!==this.activeFeed){this.pauseVoiceForFeed();this.activeFeed=state.pendingFeed.id;this.model.load(state.pendingFeed.from);this.model.feed();this.play('fertilizer');this.fixedBubble='';this.selected=false;}else if(!state.pendingFeed&&this.model.phase==='idle'&&this.model.height!==state.height)this.model.load(state.height);}
  say(text:string,reset=false){if(reset||!text.startsWith(this.bubble)){this.reveal=0;this.scrollY=0;}this.bubble=text;}
  pauseVoiceForFeed:()=>void=()=>{};
  setGenerating(value:boolean){this.generating=value;}
  isBusy(){return this.generating||!!this.state.pendingFeed;}
  replyText(){return this.bubble;}
  copyText(){return this.shop||this.demo?'':this.displayBubble();}
  private speechLayout(){if(!this.speech||this.speechSource!==this.bubble||this.speechHeight!==this.model.height){this.speechSource=this.bubble;this.speechHeight=this.model.height;this.speech=layoutSpeech(this.bubble,this.model.height,value=>this.measure(value),this.font('BrianneTod16').lineHeight);this.scrollY=clampScroll(this.scrollY,this.speech);}return this.speech;}
  private wheel=(event:WheelEvent)=>{if(!this.bubble||this.elapsed<this.fixedUntil||this.shop||this.demo||this.model.phase!=='idle')return;const rect=this.app.canvas.getBoundingClientRect(),x=(event.clientX-rect.left)*800/rect.width,y=(event.clientY-rect.top)*600/rect.height,l=this.speechLayout();if(x<l.x||x>l.x+l.width||y<l.y||y>l.y+l.bodyHeight)return;event.preventDefault();this.reveal=Number.MAX_SAFE_INTEGER;this.scrollY=clampScroll(this.scrollY+event.deltaY*(event.deltaMode===1?l.lineHeight:event.deltaMode===2?l.content.height:600/rect.height),l);};
  private drawSpeech(){
    const l=this.speechLayout(),c=this.ctx,image=this.images.get('IMAGE_STORE_SPEECHBUBBLE2')!;
    this.publishCopy(l.copy);
    const patch=(sx:number,sy:number,sw:number,sh:number,x:number,y:number,w:number,h:number)=>c.drawImage(image,sx,sy,sw,sh,x,y,w,h);
    patch(0,0,16,16,l.x,l.y,16,16);patch(16,0,248,16,l.x+16,l.y,l.width-32,16);patch(264,0,16,16,l.x+l.width-16,l.y,16,16);
    patch(0,16,16,128,l.x,l.y+16,16,l.bodyHeight-32);patch(16,16,248,128,l.x+16,l.y+16,l.width-32,l.bodyHeight-32);patch(264,16,16,128,l.x+l.width-16,l.y+16,16,l.bodyHeight-32);
    patch(0,144,70,16,l.x,l.y+l.bodyHeight-16,70,16);patch(70,144,194,16,l.x+70,l.y+l.bodyHeight-16,l.width-86,16);patch(264,144,16,16,l.x+l.width-16,l.y+l.bodyHeight-16,16,16);patch(28,158,36,25,l.x+28,l.y+l.bodyHeight-2,36,25);
    c.save();c.beginPath();c.rect(l.content.x,l.content.y,l.content.width,l.content.height);c.clip();const first=Math.floor(this.scrollY/l.lineHeight),end=Math.min(l.lines.length,first+Math.ceil(l.content.height/l.lineHeight)+1);for(let i=first;i<end;i++){const shown=graphemes(l.lines[i]).slice(0,Math.max(0,Math.floor(this.reveal)-l.starts[i])).join('');this.text(shown,l.content.x,l.content.y+this.font('BrianneTod16').ascent+i*l.lineHeight-this.scrollY);}c.restore();
    this.text('×',l.x+l.width-18,l.y+22,'BrianneTod16','#555',true);
    if(l.maxScroll>0){const x=l.x+l.width-15;c.save();c.translate(x,l.content.y);c.rotate(Math.PI/2);c.drawImage(this.images.get('IMAGE_OPTIONS_SLIDERSLOT')!,0,-4,l.content.height,8);c.restore();c.save();c.translate(x,l.content.y+10+(l.content.height-20)*this.scrollY/l.maxScroll);c.rotate(Math.PI/2);c.drawImage(this.images.get('IMAGE_OPTIONS_SLIDERKNOB2')!,-7,-9,14,18);c.restore();if(l.width>=240)this.text(getLanguage()==='zh-CN'?'滚轮上下阅读':'Scroll to read',l.content.x,l.y+l.bodyHeight-10,'BrianneTod12','#555');}
  }
  canSpeakAI(){return !this.state.pendingFeed&&this.elapsed>=this.fixedUntil&&!this.shop&&!this.demo;}
  private fixedText(key:string){return getLanguage()==='zh-CN'?(this.assets.chinese?.dialogue[key]??'中文台词资源尚未就绪，请检查安装文件。'):(this.assets.dialogue[key]??'');}
  private displayBubble(){return this.model.phase==='idle'?(this.elapsed<this.fixedUntil?this.fixedText(this.fixedBubble):this.bubble):'';}
  private play(name:string){if(!this.soundEnabled)return;const blob=this.assets.sounds[name];if(!blob)return;this.sound?.pause();const url=URL.createObjectURL(blob);const audio=new Audio(url);this.sound=audio;this.urls.push(url);audio.onended=()=>URL.revokeObjectURL(url);void audio.play().catch(()=>{});}
  private tick=(now:number)=>{
    if(this.cancelled)return;const delta=Math.min(500,Math.max(0,now-this.last));this.last=now;this.elapsed+=delta;this.accumulator+=delta;if(this.model.phase==='idle'&&this.elapsed>=this.fixedUntil)this.reveal+=delta/25;
    while(this.accumulator>=10){const was=this.model.phase;this.model.tick();this.clouds.tick();this.demoParticles?.tick();if(was==='fertilizing'&&this.model.phase==='growing')this.play('plantgrow');if(was==='growing'&&this.model.phase==='idle'&&this.activeFeed){const id=this.activeFeed;this.activeFeed=null;this.fixedBubble='TREE_OF_WISDOM_'+wisdomKey(this.model.height);this.fixedUntil=this.elapsed+10000;this.idleKey=wisdomKey(this.model.height);this.idleAt=this.fixedUntil+7000+Math.floor(Math.random()*301)*10;this.actions.finished(id);}this.accumulator-=10;}
    for(const d of this.drawings){let position=this.model.tree.frame,ox=0,oy=0;d.sprite.visible=!this.shop;
      if(d.group==='cloud'){position=this.clouds.instances.find(c=>c.name===d.track.name)!.playback.frame;}
      if(d.group==='food'){if(!this.model.fertilizer||this.shop){d.sprite.visible=false;continue;}position=this.model.fertilizer.frame;ox=340;oy=300;}
      if(d.group==='dave'){d.sprite.visible=this.shop;position=this.daveRange.start+(this.elapsed/1000*12)%(this.daveRange.count-1);ox=-42;oy=68;}
      if(this.demo&&!(d.group==='cloud'||d.group==='tree'&&d.track.name.startsWith('bg')||d.group==='tree'&&d.track.name.startsWith('grass')))d.sprite.visible=false;
      if(!d.sprite.visible)continue;const f=sample(d.track,position);d.sprite.visible=f[6]>=0&&f[7]>0&&!!f[8];if(!d.sprite.visible)continue;const texture=this.textures.get(f[8]);if(!texture){d.sprite.visible=false;continue;}d.sprite.texture=texture;d.sprite.alpha=f[7];const [a,b,c,dd,x,y]=matrix(f);d.sprite.setFromMatrix(new Matrix(a,b,c,dd,x+ox,y+oy));
    }
    if(!this.generating&&!this.shop&&!this.demo&&!this.bubble&&this.model.phase==='idle'&&this.elapsed>=this.fixedUntil&&this.elapsed>=this.idleAt){const rand=(n:number)=>Math.floor(Math.random()*n);const repeat=this.idleKey===500;this.idleKey=repeat?repeatWisdomKey(this.model.height,rand):idleWisdomKey(this.model.height,rand);this.fixedBubble='TREE_OF_WISDOM_'+this.idleKey;this.fixedUntil=this.elapsed+(repeat?6000:4000);this.idleAt=this.idleKey===500?this.fixedUntil:this.fixedUntil+7000+rand(301)*10;}
    this.drawUI();this.overlayTexture?.source.update();this.app.render();this.frame=requestAnimationFrame(this.tick);
  };
  private image(id:string,x:number,y:number,w?:number,h?:number){const image=(getLanguage()==='zh-CN'?this.images.get('zh:'+id):null)??this.images.get(id);if(!image)throw Error('缺少已审计图片 '+id);if(w===undefined)this.ctx.drawImage(image,x,y);else this.ctx.drawImage(image,x,y,w,h??image.height);}
  private font(name:string){const f=this.assets.fonts[name];if(!f)throw Error('缺少原版字体 '+name);return f;}
  measure(text:string,name='BrianneTod16'){const f=this.font(name);this.ctx.font='16px "Wisdom CJK"';return graphemes(text).reduce((sum,c)=>sum+(f.glyphs[c]?.advance??this.ctx.measureText(c).width),0);}
  private atlas(layer:BitmapFont['layers'][number],color:string){const key=layer.image+color;if(this.colorAtlases.has(key))return this.colorAtlases.get(key)!;const image=this.images.get('font:'+layer.image)!;const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d')!;c.drawImage(image,0,0);if(layer.name!=='Outline'){c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,canvas.width,canvas.height);}this.colorAtlases.set(key,canvas);return canvas;}
  private text(text:string,x:number,baseline:number,name='BrianneTod16',color='#000',center=false){const f=this.font(name);if(center)x=Math.trunc(x-this.measure(text,name)/2);for(const layer of f.layers){let at=x;const atlas=this.atlas(layer,color);for(const char of graphemes(text)){const g=f.glyphs[char];if(g){const [rx,ry,w,h]=g.rect;this.ctx.drawImage(atlas,rx,ry,w,h,at+g.offset[0],baseline-layer.ascent+g.offset[1],w,h);at+=g.advance;}else{this.ctx.font='16px "Wisdom CJK"';this.ctx.fillStyle=color;this.ctx.lineWidth=1.8;this.ctx.lineJoin='round';this.ctx.strokeStyle=color==='#000'?'#fff9dc':'#24321a';if(layer.name==='Outline')this.ctx.strokeText(char,at,baseline);else this.ctx.fillText(char,at,baseline);at+=this.ctx.measureText(char).width;}}}}
  private lines(text:string,width:number){if(text!==this.cachedText||width!==this.cachedWidth){this.cachedText=text;this.cachedWidth=width;this.cachedLines=wrapMeasured(text,width,value=>this.measure(value));}return this.cachedLines;}
  private button(label:string,x:number,y:number,w:number){label=translate(label);const left=this.images.get('IMAGE_BUTTON_LEFT')!,right=this.images.get('IMAGE_BUTTON_RIGHT')!;this.image('IMAGE_BUTTON_LEFT',x,y);this.image('IMAGE_BUTTON_MIDDLE',x+left.width,y,w-left.width-right.width);this.image('IMAGE_BUTTON_RIGHT',x+w-right.width,y);this.text(label,x+w/2,y+27,'HouseofTerror16','#00aa00',true);}
  private confirmation(){const x=160,y=170,w=480,h=260,tl=this.images.get('IMAGE_DIALOG_TOPLEFT')!,tr=this.images.get('IMAGE_DIALOG_TOPRIGHT')!,bl=this.images.get('IMAGE_DIALOG_BOTTOMLEFT')!,br=this.images.get('IMAGE_DIALOG_BOTTOMRIGHT')!;this.image('IMAGE_DIALOG_TOPLEFT',x,y);this.image('IMAGE_DIALOG_TOPMIDDLE',x+tl.width,y,w-tl.width-tr.width,tl.height);this.image('IMAGE_DIALOG_TOPRIGHT',x+w-tr.width,y);this.image('IMAGE_DIALOG_CENTERLEFT',x,y+tl.height,tl.width,h-tl.height-bl.height);this.image('IMAGE_DIALOG_CENTERMIDDLE',x+tl.width,y+tl.height,w-tl.width-tr.width,h-tl.height-bl.height);this.image('IMAGE_DIALOG_CENTERRIGHT',x+w-tr.width,y+tr.height,tr.width,h-tr.height-br.height);this.image('IMAGE_DIALOG_BOTTOMLEFT',x,y+h-bl.height);this.image('IMAGE_DIALOG_BOTTOMMIDDLE',x+bl.width,y+h-bl.height,w-bl.width-br.width,bl.height);this.image('IMAGE_DIALOG_BOTTOMRIGHT',x+w-br.width,y+h-br.height);this.text(translate(this.assets.dialogue.BUY_ITEM_HEADER??'Buy this item?'),400,230,'DwarvenTodcraft18','#f4d56a',true);const lines=wrapMeasured(translate(this.assets.dialogue.BUY_ITEM??'Are you sure you want to buy this item?'),360,s=>this.measure(s));lines.forEach((line,i)=>this.text(line,400,278+i*23,'BrianneTod16','#fff',true));this.button(this.assets.dialogue.DIALOG_BUTTON_YES??'YES',240,345,150);this.button(this.assets.dialogue.DIALOG_BUTTON_NO??'NO',410,345,150);}
  private drawDemo(){this.text(translate('EASTER EGG DEMO'),400,80,'HouseofTerror20','#fff',true);this.text(translate('Original assets - independent scene, no combat rules'),400,110,'BrianneTod12','#222',true);this.button('BACK',628,0,163);
    const animation=this.assets.animations.Zombie,range=segment(animation,this.modes.has('dance')?'anim_dance':'anim_walk'),position=range.start+(this.elapsed/1000*12)%(range.count-1);
    const hidden=['anim_cone','anim_bucket','anim_screendoor','Zombie_flaghand','Zombie_duckytube','anim_tongue','Zombie_outerarm_screendoor','Zombie_innerarm_screendoor','Zombie_whitewater'];
    for(const track of animation.tracks){if(hidden.some(prefix=>track.name.startsWith(prefix))||track.name==='Zombie_mustache'&&!this.modes.has('mustache'))continue;const frame=sample(track,position);if(frame[6]<0||!frame[8])continue;let id=frame[8];if(track.name==='anim_head1'&&this.modes.has('future'))id='IMAGE_REANIM_ZOMBIE_HEAD_SUNGLASSES1';if(track.name==='Zombie_mustache'&&this.mustacheVariant>1)id='IMAGE_REANIM_ZOMBIE_MUSTACHE'+this.mustacheVariant;const image=this.images.get(id);if(!image)continue;const [a,b,c,d,x,y]=matrix(frame);this.ctx.save();this.ctx.globalAlpha=frame[7];this.ctx.setTransform(a,b,c,d,x+350,y+274);this.ctx.drawImage(image,0,0);this.ctx.restore();}
    const mower=this.assets.animations.LawnMower,mowerRange=segment(mower,this.modes.has('trickedout')?'anim_tricked':'anim_normal');for(const track of mower.tracks){const f=sample(track,mowerRange.start+(this.elapsed/1000*20)%(mowerRange.count-1));const image=this.images.get(f[8]);if(f[6]<0||!image)continue;const [a,b,c,d,x,y]=matrix(f);this.ctx.save();this.ctx.setTransform(a,b,c,d,x+550,y+420);this.ctx.drawImage(image,0,0);this.ctx.restore();}
    const effect=this.demoParticles;if(effect){const image=this.images.get(effect.definition.image)!;const w=image.width/effect.definition.imageFrames,h=image.height;for(const p of effect.particles){const time=p.age/Math.max(1,p.life-1),scale=effect.value('ParticleScale',time,p.random.ParticleScale,1),alpha=effect.value('ParticleAlpha',time,p.random.ParticleAlpha,1)*effect.value('SystemAlpha',Math.min(1,effect.ticks/effect.value('SystemDuration',0,.5,p.life)),.5,1);this.ctx.save();this.ctx.globalAlpha=Math.max(0,Math.min(1,alpha));this.ctx.translate(400+p.x,350+p.y);this.ctx.rotate(p.angle);this.ctx.scale(scale,scale);this.ctx.drawImage(image,p.frame*w,0,w,h,-w/2,-h/2,w,h);this.ctx.restore();}}
    this.text([...this.modes].join('  '),400,535,'BrianneTod12','#222',true);
  }
  private drawUI(){const c=this.ctx;c.clearRect(0,0,800,600);
    if(this.demo){this.publishCopy(null);this.drawDemo();return;}
    if(this.shop){
      this.publishCopy(null);
      // Original scene coordinates; only the tree-food product is interactive here.
      // Backdrop must sit behind Dave, whose reanim is on the Pixi stage.
      this.image('IMAGE_STORE_BACKGROUND',0,0);this.image('IMAGE_STORE_CAR',196,138);this.image('IMAGE_STORE_HATCHBACKOPEN',299,0);this.image('IMAGE_STORE_SIGN',285,0);
      // Overlay canvas otherwise covers Dave. Draw him using the same verified affine IR.
      for(const track of this.assets.animations.CrazyDave.tracks){const f=sample(track,this.daveRange.start+(this.elapsed/1000*12)%(this.daveRange.count-1));if(f[6]<0||!f[8])continue;const image=this.images.get(f[8]);if(!image)continue;const [a,b,cc,d,x,y]=matrix(f);c.save();c.globalAlpha=f[7];c.setTransform(a,b,cc,d,x-42,y+68);c.drawImage(image,0,0);c.restore();}
      this.image('IMAGE_TREEFOOD',444,322);this.image('IMAGE_STORE_PRICETAG',449,394);this.text('$2,500',475,409,'BrianneTod12','#000',true);
      this.image('IMAGE_STORE_MAINMENUBUTTON',366,512);this.text(translate('GO BACK'),428,568,'HouseofTerror20','#6299eb',true);
      this.image('IMAGE_COINBANK',650,563);this.text('$'+this.state.coins.toLocaleString('en-US'),755-this.measure('$'+this.state.coins.toLocaleString('en-US'),'ContinuumBold14'),587,'ContinuumBold14','#b4ff5a');
      if(this.purchasePrompt)this.confirmation();return;
    }
    this.image('IMAGE_SHOVELBANK',30,0);if(!this.selected)this.image('IMAGE_TREEFOOD',24,-7);this.text('x'+this.state.food,75,65,'HouseofTerror16','#fff');
    this.image('IMAGE_ZENSHOPBUTTON',678,33);this.button('OPTIONS',628,-10,163);
    if(this.model.height>=50)this.text(getLanguage()==='zh-CN'?`${this.model.height}英尺高`:(this.assets.dialogue.TREE_OF_WISDOM_HIEGHT?.replace('{HEIGHT}',String(this.model.height))??`${this.model.height} Feet Tall`),400,31,'HouseofTerror16','#fff',true);
    const bubble=this.displayBubble();if(bubble&&this.elapsed>=this.fixedUntil){this.drawSpeech();}else if(bubble){const height=this.model.height;const x=height<7?400:height<12?395:390,y=height<7?152:height<12?60:52;this.publishCopy({x:x+202,y:y+162,width:60,height:22});this.image('IMAGE_STORE_SPEECHBUBBLE2',x,y);const visible=this.lines(bubble,233).slice(0,6),f=this.font('BrianneTod16');let baseline=y+6+Math.trunc((144-visible.length*f.lineHeight)/2)+f.ascent;for(const line of visible){this.text(line,x+25+(233-this.measure(line))/2,baseline);baseline+=f.lineHeight;}}else this.publishCopy(null);
    this.text(translate('Tree of Wisdom'),791-this.measure(translate('Tree of Wisdom'),'HouseofTerror16'),594,'HouseofTerror16','#e0bb62');
    if(this.selected)this.image('IMAGE_TREEFOOD',this.pointer.x-20,this.pointer.y-30);
  }
  destroy(){this.cancelled=true;cancelAnimationFrame(this.frame);window.removeEventListener('keydown',this.keyboard);this.sound?.pause();for(const url of this.urls)URL.revokeObjectURL(url);for(const image of this.images.values())image.close();if(this.app.renderer)this.app.destroy(true,{children:true,texture:true,textureSource:true});}
}


