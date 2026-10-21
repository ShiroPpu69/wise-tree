/** Stable spoken prefix: do not read fenced code, unfinished inline code, or URLs. */
export class SpeechTextStream {
 private prefix='';
 update(raw:string,final=false):string[]{
  const text=raw.replace(/```[\s\S]*?(?:```|$)/g,' ').replace(/`[^`]*(?:`|$)/g,' ').replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\[[\s\S]*$/g,'').replace(/https?:\/\/\S+/g,' ').replace(/[*#>]/g,'').replace(/[ \t]+/g,' ').trimStart();
  if(!text.startsWith(this.prefix))return [];
  const points=Array.from(text.slice(this.prefix.length));let part='';const result:string[]=[];
  for(let i=0;i<points.length;i++){
   const c=points[i];part+=c;const fullStop=c==='.'&&(i+1<points.length?/\s/.test(points[i+1]):final);
   if(/[。！？!?\n]/.test(c)||fullStop||part.length>=200){this.prefix+=part;if(part.trim())result.push(part.trim());part='';}
  }
  if(final&&part){this.prefix+=part;if(part.trim())result.push(part.trim());}
  return result;
 }
}
export interface SpeechSession {update:(text:string,final?:boolean)=>void;cancel:()=>void;done:Promise<void>}
/** At most one playing/preparing segment plus one lookahead. Playback never overlaps. */
export function speechSession<T>(prepare:(text:string)=>Promise<T>,play:(audio:T)=>Promise<void>,fail:(error:unknown)=>void):SpeechSession{
 const parser=new SpeechTextStream(),pending:string[]=[],jobs:Promise<{audio:T}|{error:unknown}>[]=[];let active=true,ended=false,draining=false;
 let resolve!:()=>void;const done=new Promise<void>(r=>{resolve=r;});
 const cancel=()=>{active=false;pending.length=0;resolve();};
 function fill(){while(active&&pending.length&&jobs.length<2){const text=pending.shift()!;jobs.push(Promise.resolve().then(()=>{if(!active)throw Error('语音已取消');return prepare(text);}).then(audio=>({audio}),error=>({error})));}}
 async function drain(){draining=true;try{while(active&&jobs.length){const result=await jobs[0];if(!active)return;if('error'in result){fail(result.error);cancel();return;}await play(result.audio);if(!active)return;jobs.shift();fill();}}catch(error){if(active)fail(error);cancel();}finally{draining=false;if(active&&ended&&!jobs.length&&!pending.length)cancel();}}
 return {done,cancel,update:(text,final=false)=>{if(!active||ended)return;pending.push(...parser.update(text,final));ended=final;fill();if(!draining)void drain();}};
}
