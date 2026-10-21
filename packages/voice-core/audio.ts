/** PCM16 mono WAV used only by the local Windows recognizer. */
export function pcmWave(samples:Float32Array):Uint8Array{
 if(!samples.length||samples.length>16000*60)throw Error('本地识别每次请录制一秒到六十秒的语音');
 const data=new Uint8Array(44+samples.length*2),v=new DataView(data.buffer),tag=(at:number,s:string)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};
 tag(0,'RIFF');v.setUint32(4,data.length-8,true);tag(8,'WAVE');tag(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,16000,true);v.setUint32(28,32000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);tag(36,'data');v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){const n=Math.max(-1,Math.min(1,Number.isFinite(samples[i])?samples[i]:0));v.setInt16(44+i*2,Math.round(n*(n<0?32768:32767)),true);}return data;
}
export async function recordedWave(blob:Blob){
 if(blob.size>20e6)throw Error('录音超过20MB上限');const context=new AudioContext();
 try{const source=await context.decodeAudioData(await blob.arrayBuffer());if(source.duration>60||source.duration<=0)throw Error('本地识别每次请录制一秒到六十秒的语音');const offline=new OfflineAudioContext(1,Math.ceil(source.duration*16000),16000),node=offline.createBufferSource();node.buffer=source;node.connect(offline.destination);node.start();return pcmWave((await offline.startRendering()).getChannelData(0));}finally{await context.close();}
}
