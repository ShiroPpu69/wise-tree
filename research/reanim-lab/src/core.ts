export type Frame = [number, number, number, number, number, number, number, number, string, string, string];
export interface Track { name: string; frames: Frame[] }
export interface Animation { fps: number; tracks: Track[] }
export interface Segment { start: number; count: number }
export interface Bundle { animations: Record<string, Animation>; textures: Record<string,string>; provenance: Record<string,unknown> }

export function segment(animation: Animation, name: string): Segment {
  const track = animation.tracks.find(t => t.name === name);
  if (!track) throw new Error(`Missing named track ${name}`);
  const visible = track.frames.flatMap((f,i) => f[6]>=0 ? [i] : []);
  if (!visible.length) throw new Error(`Named track ${name} has no visible frames`);
  return { start: visible[0], count: visible[visible.length-1]-visible[0]+1 };
}
export function framePosition(range: Segment, time: number, fullLastFrame=false): number {
  return Math.min(range.start+range.count-1, range.start+Math.max(0,Math.min(1,time))*(range.count-(fullLastFrame?0:1)));
}
export function sample(track: Track, position: number): Frame {
  const p=Math.max(0,Math.min(track.frames.length-1,position));
  const i=Math.floor(p), j=Math.min(i+1,track.frames.length-1), t=p-i;
  const a=track.frames[i],b=track.frames[j];
  return a.map((v,k)=>k<8&&k!==6 ? (v as number)+((b[k] as number)-(v as number))*t : v) as Frame;
}
export function matrix(f: Frame): [number,number,number,number,number,number] {
  const x=f[2]*Math.PI/180,y=f[3]*Math.PI/180;
  // Pixi matrix order a,b,c,d,tx,ty; no lossy rotation-only decomposition.
  return [f[4]*Math.cos(x),f[4]*Math.sin(x),-f[5]*Math.sin(y),f[5]*Math.cos(y),f[0],f[1]];
}
export function drawGroup(name: string): number {return name.startsWith('bg')?0:name.startsWith('tree')?2:name.startsWith('grass')?3:4;}
export function wisdomKey(height: number): number {return height===100?800:height===500?900:height===1000?1000:height>1000?1100:Math.max(1,Math.min(49,height-1));}
export class Playback {
  time=0;
  complete=false;
  range:Segment;
  rate:number;
  constructor(range:Segment,rate:number){this.range=range;this.rate=rate;}
  tick(): void {this.time=Math.min(1,this.time+.01*this.rate/this.range.count);this.complete=this.time>=1-1e-10;}
  get frame():number{return framePosition(this.range,this.time);}
}
export class TreeLab {
  height=1;
  food=5;
  phase:'idle'|'fertilizing'|'growing'='idle';
  tree:Playback;
  fertilizer:Playback|null=null;
  counter=0;
  ticks=0;
  events:{tick:number;type:string;height:number}[]=[];
  animations:Record<string,Animation>;
  constructor(animations:Record<string,Animation>){this.animations=animations;this.tree=new Playback(segment(animations.TreeOfWisdom,'anim_grow1'),18);this.load(1);}
  load(height:number):void {
    if(!Number.isSafeInteger(height)||height<1)throw new Error('Invalid research height');
    this.height=height;this.food=5;this.phase='idle';this.fertilizer=null;this.counter=0;this.ticks=0;this.events=[];
    this.tree=new Playback(segment(this.animations.TreeOfWisdom,`anim_grow${Math.min(50,height)}`),18);
    this.tree.time=.99;
  }
  feed():boolean {
    if(this.phase!=='idle'||this.food<1)return false;
    this.food--;this.phase='fertilizing';
    this.fertilizer=new Playback({start:0,count:this.animations.TreeFood.tracks[0].frames.length},this.animations.TreeFood.fps);
    this.events.push({tick:this.ticks,type:'fertilizer',height:this.height});return true;
  }
  tick():void {
    this.ticks++;
    // Candidate order is explicit and still awaits full original runtime timing comparison.
    this.tree.tick();
    if(this.fertilizer){
      this.fertilizer.tick();
      if(this.fertilizer.complete){
        this.fertilizer=null;this.height++;this.phase='growing';this.counter=120;
        this.tree=new Playback(segment(this.animations.TreeOfWisdom,`anim_grow${Math.min(51,this.height)}`),8);
        this.events.push({tick:this.ticks,type:'plantgrow',height:this.height});
      }
    } else if(this.phase==='growing'&&--this.counter===0){
      this.phase='idle';this.events.push({tick:this.ticks,type:`wisdom:${wisdomKey(this.height)}`,height:this.height});
    }
  }
}
export class CloudLab {
  instances:{name:string;playback:Playback;wait:number}[]=[];
  private seed:number;
  constructor(animation:Animation,seed=42){
    this.seed=seed;
    for(let n=1;n<=6;n++){
      const playback=new Playback(segment(animation,`Cloud${n}`),0);
      const wait=this.random(-6000,2000);
      if(wait<0){playback.time=-wait/6000;playback.rate=.2;}
      this.instances.push({name:`Cloud${n}`,playback,wait:Math.max(0,wait)});
    }
  }
  private random(min:number,max:number):number {let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return min+this.seed%(max-min+1);}
  tick():void {
    for(const c of this.instances){
      if(c.wait>0){if(--c.wait===0){c.playback.time=0;c.playback.complete=false;c.playback.rate=.2;}}
      else if(c.playback.complete){c.wait=this.random(2000,4000);}
      c.playback.tick();
    }
  }
}
