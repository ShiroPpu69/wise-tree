// Direct public research demo operated by NetEase Youdao. No key or proxy.
// Only synthetic reference voices are bundled; no inference model or human clone.
const references=require('./voice-references.cjs');
const BASE='https://confucius4-tts.youdao.com/gradio';
const voices={zh:{child:'Confucius4-child',young:'Confucius4-young',mature:'Confucius4-mature'},en:{child:'Confucius4-child',young:'Confucius4-young',mature:'Confucius4-mature'}};
const uploaded=new Map();
function validate(text,stage,language,rate){
 if(typeof text!=='string'||!text.trim()||text.length>512||!Object.hasOwn(voices,language)||!Object.hasOwn(voices[language],stage)||!Number.isFinite(rate)||rate<.5||rate>2)throw Error('联网语音请求无效');
}
function safePath(value){if(typeof value!=='string'||!/^\/tmp\/gradio\/[a-f0-9]{64}\/[a-zA-Z0-9_-]{1,100}\.wav$/.test(value))throw Error('语音服务返回无效文件');return value;}
async function bounded(response,max){
 if(!response.ok){await response.body?.cancel();throw Error('语音服务不可用');}
 if(Number(response.headers.get('content-length'))>max){await response.body?.cancel();throw Error('语音响应过大');}
 if(!response.body)throw Error('语音响应为空');const reader=response.body.getReader(),chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw Error('语音响应过大');chunks.push(Buffer.from(value));}return Buffer.concat(chunks);}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
async function completion(response){
 if(!response.ok||!response.body){await response.body?.cancel();throw Error('语音服务不可用');}
 const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)throw Error('语音流意外中断');size+=value.length;if(size>262144)throw Error('语音响应过大');pending+=decoder.decode(value,{stream:true});let match;
  while((match=/\r?\n\r?\n/.exec(pending))){const frame=pending.slice(0,match.index);pending=pending.slice(match.index+match[0].length);const lines=frame.split(/\r?\n/),event=lines.find(l=>l.startsWith('event:'))?.slice(6).trim(),data=lines.filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(event==='error')throw Error('语音服务暂时不可用');if(event==='complete')return JSON.parse(data);}
 }}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
function validateWave(bytes){
 if(bytes.length<44||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE'||bytes.readUInt32LE(4)+8!==bytes.length)throw Error('语音文件无效');
 let fmt=false,data=false;for(let i=12;i+8<=bytes.length;){const kind=bytes.toString('ascii',i,i+4),n=bytes.readUInt32LE(i+4);if(i+8+n>bytes.length)throw Error('语音文件截断');if(kind==='fmt '){if(n<16||![1,3].includes(bytes.readUInt16LE(i+8))||![1,2].includes(bytes.readUInt16LE(i+10))||bytes.readUInt32LE(i+12)<8000||bytes.readUInt32LE(i+12)>48000)throw Error('语音格式不支持');fmt=true;}if(kind==='data'&&n>0)data=true;i+=8+n+(n%2);}if(!fmt||!data)throw Error('语音文件为空');return bytes;
}
function untilAborted(promise,signal){
 if(signal.aborted)return Promise.reject(Error('语音已取消'));
 return new Promise((resolve,reject)=>{const abort=()=>{signal.removeEventListener('abort',abort);reject(Error('语音已取消'));};signal.addEventListener('abort',abort,{once:true});promise.then(value=>{signal.removeEventListener('abort',abort);resolve(value);},error=>{signal.removeEventListener('abort',abort);reject(error);});});
}
async function onlineSpeech(text,stage,language,rate,signal,transport=fetch){
 validate(text,stage,language,rate);if(signal.aborted)throw Error('语音已取消');
 const joined=AbortSignal.any([signal,AbortSignal.timeout(45000)]);
 const request=(url,init={})=>transport(url,{...init,redirect:'error',credentials:'omit',signal:joined});
 let reference;try{
  reference=uploaded.get(stage);
  if(!reference){reference=(async()=>{const form=new FormData();form.append('files',new Blob([Buffer.from(references[stage],'base64')],{type:'audio/wav'}),stage+'.wav');const bytes=await bounded(await request(BASE+'/upload',{method:'POST',body:form}),8192);const paths=JSON.parse(bytes.toString('utf8'));if(!Array.isArray(paths)||paths.length!==1)throw Error('语音样本上传失败');return safePath(paths[0]);})();uploaded.set(stage,reference);reference.catch(()=>{if(uploaded.get(stage)===reference)uploaded.delete(stage);});}
  const file=await untilAborted(reference,joined);if(joined.aborted)throw Error('语音已取消');
  const payload={data:[text,language,{path:file,meta:{_type:'gradio.FileData'}},'']};
  const start=JSON.parse((await bounded(await request(BASE+'/call/_gradio_predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),8192)).toString('utf8'));
  if(typeof start.event_id!=='string'||!/^[-a-f0-9]{32,36}$/.test(start.event_id))throw Error('语音任务无效');
  const result=await completion(await request(BASE+'/call/_gradio_predict/'+start.event_id));
  if(!Array.isArray(result)||!result[0])throw Error('语音服务未生成声音');
  // Gradio 4 returns a wrongly relative URL on /call; use only its validated cache path.
  const output=safePath(result[0].path);const audio=validateWave(await bounded(await request(BASE+'/file='+output),4e6));
  return {bytes:Array.from(audio),mime:'audio/wav',voice:voices[language][stage],remote:true,playbackRate:rate};
 }catch(error){if(!signal.aborted&&uploaded.get(stage)===reference)uploaded.delete(stage);if(signal.aborted)throw Error('语音已取消');throw Error('免费联网语音暂不可用，请稍后重试；文字聊天仍可使用');}
}
module.exports={onlineSpeech,validate,safePath,completion,validateWave,untilAborted,voices};
