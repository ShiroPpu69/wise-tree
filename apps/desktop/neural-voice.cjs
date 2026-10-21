const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn,execFile}=require('node:child_process');
const {tmpdir}=require('node:os');
const {promisify}=require('node:util');
const run=promisify(execFile);
let variant;let queue=Promise.resolve();
const speakers={young:'dylan',mature:'uncle_fu'};
function validate(text,voice,language){
 if(typeof text!=='string'||!text.trim()||text.length>128||!Object.hasOwn(speakers,voice)||!['zh','en'].includes(language))throw Error('本地语音请求无效');
}
async function synthesize(root,text,voice,language,signal){
 validate(text,voice,language);if(signal.aborted)throw Error('语音已取消');
 if(!variant){try{const result=await run(path.join(root,'bin','voice-cpu.exe'),[],{windowsHide:true,timeout:5000,maxBuffer:256});variant=result.stdout.trim()==='avx2'?'simd':'generic';}catch{variant='generic';}}
 const dir=await fs.mkdtemp(path.join(tmpdir(),'wisdom-local-voice-')),output=path.join(dir,'speech.wav');
 const args=['-m',path.join(root,'models'),'--model-name','qwen-talker-1.7b-customvoice-Q4_K_M.gguf','--codec-model',path.join(root,'models','qwen-tokenizer-12hz-Q8_0.gguf'),'-l',language,'--speaker',speakers[voice],'--instruct',language==='zh'?'像朋友聊天一样自然放松，略带调侃。不要播音腔，不要刻意压低嗓音。':'Speak naturally and warmly, like a relaxed conversation with a little dry humor.','-t',text,'--seed','42','--max-tokens',String(Math.min(1024,Math.max(128,text.length*8))),'-j','4','-o',output];
 try{
  if(signal.aborted)throw Error('语音已取消');
  await new Promise((resolve,reject)=>{
   const child=spawn(path.join(root,'bin',variant,'qwen3-tts-cli.exe'),args,{windowsHide:true,stdio:'ignore'});
   const cancel=()=>child.kill();signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
   let timedOut=false;const timer=setTimeout(()=>{timedOut=true;child.kill();},240000);
   child.once('error',()=>{clearTimeout(timer);signal.removeEventListener('abort',cancel);reject(Error('本地语音模型缺失或无法启动，请重新安装'));});
   child.once('close',code=>{clearTimeout(timer);signal.removeEventListener('abort',cancel);if(signal.aborted)reject(Error('语音已取消'));else if(timedOut)reject(Error('本地语音生成超时，文字仍可阅读'));else if(code!==0)reject(Error('本地语音生成失败，文字仍可阅读'));else resolve();});
  });
  if(signal.aborted)throw Error('语音已取消');const stat=await fs.stat(output);if(stat.size<46||stat.size>8e6)throw Error('本地语音输出无效');
  const bytes=await fs.readFile(output);if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw Error('本地语音输出无效');
  return {bytes:Array.from(bytes),voice,backend:variant,local:true};
 }finally{await fs.rm(dir,{recursive:true,force:true});}
}
function localSpeech(root,text,voice,language,signal){
 validate(text,voice,language);const task=queue.catch(()=>{}).then(()=>synthesize(root,text,voice,language,signal));queue=task;return task;
}
module.exports={localSpeech,validate};
