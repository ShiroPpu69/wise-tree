export type TreeVoice='auto'|'child'|'young'|'mature';
// Application feature, not a claim about the original GOTY sound system.
export const MATURE_VOICE_HEIGHT=50;
export function growthVoice(height:number,mode:TreeVoice='auto',youngHeight=10,matureHeight=MATURE_VOICE_HEIGHT):'child'|'young'|'mature'{
 if(!Number.isSafeInteger(height)||height<1)throw Error('语音高度无效');
 if(!Number.isSafeInteger(youngHeight)||!Number.isSafeInteger(matureHeight)||youngHeight<2||matureHeight<=youngHeight)throw Error('语音阶段高度无效');
 return mode==='auto'?(height<youngHeight?'child':height<matureHeight?'young':'mature'):mode;
}
/** Keep the first utterance short; sentences stay bounded for cancellation and CPU memory. */
export function speechSegments(text:string):string[]{
 const plain=text.replace(/```[\s\S]*?```/g,' ').replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/https?:\/\/\S+/g,' ').replace(/[*#`_>]/g,'').trim();
 const result:string[]=[];let part='';
 for(const char of Array.from(plain)){
  part+=char;const limit=result.length?64:28;
  if(/[。！？!?\n]/.test(char)||part.length>=limit){if(part.trim())result.push(part.trim());part='';}
 }
 if(part.trim())result.push(part.trim());return result;
}
