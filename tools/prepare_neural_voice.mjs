import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const source=path.resolve('private/neural-voice'),target=path.join(source,'runtime');
const models={
 'qwen-talker-1.7b-customvoice-Q4_K_M.gguf':'cc328834a631bc08bf9f43e62fa23f8a1383d9b429864ce6690cfb172077fc4a',
 'qwen-tokenizer-12hz-Q8_0.gguf':'1883beeed99348fc35e23dd225e9082f93f6f8c109330a33d935baa8acdbfd94'
};
const records=[];
async function copy(from,to,expected){const bytes=await fs.readFile(from),sha256=crypto.createHash('sha256').update(bytes).digest('hex');if(expected&&sha256!==expected)throw Error('Neural voice hash mismatch: '+to);const dest=path.join(target,to);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(from,dest);records.push({path:to,bytes:bytes.length,sha256});}
for(const [name,sha] of Object.entries(models))await copy(path.join(source,'qwen-model',name),'models/'+name,sha);
for(const [variant,dir] of [['generic','build-portable'],['simd','build-simd']])for(const name of ['qwen3-tts-cli.exe','libc++.dll','libunwind.dll'])await copy(path.join(source,'qwen-cpp',dir,name),'bin/'+variant+'/'+name);
await copy(path.join(source,'voice-cpu.exe'),'bin/voice-cpu.exe');
await copy(path.join(source,'qwen-cpp/LICENSE'),'licenses/qwen-cpp-MIT.txt');
await copy(path.join(source,'qwen-cpp/ggml/LICENSE'),'licenses/ggml-MIT.txt');
await copy(path.join(source,'research/qwen-model-LICENSE'),'licenses/Qwen3-TTS-Apache-2.0.txt');
await copy(path.join(source,'toolchain/llvm-mingw-20261006-ucrt-x86_64/LICENSE.TXT'),'licenses/LLVM-runtime.txt');
await fs.writeFile(path.join(target,'NOTICE.txt'),'Tree of Wisdom local speech\nQwen3-TTS by Alibaba Qwen: Apache-2.0\nGGUF conversion: https://huggingface.co/Serveurperso/Qwen3-TTS-GGUF\nQwen C++ runtime: https://github.com/Danmoreng/qwen3-tts.cpp @16bb5afcd06311031c72a8488f8d59660dc2fb46 (MIT)\nGGML @af97976c7810cdabb1863172f31c432dab767de7 (MIT)\nlibc++/libunwind: LLVM Apache-2.0 with LLVM Exceptions; full notices in licenses/.\nRuntime modifications: portable Clang build, explicit AMD64 SIMD flags, no march=native; generic CPU fallback, embedded UTF-8 process manifest for Unicode file paths.\nNo Python, CUDA, system speech voice or online voice endpoint required.\n');
await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify({version:1,defaultSwitchHeight:50,voices:{young:'dylan',mature:'uncle_fu'},records},null,2));
console.log('Prepared offline voice runtime:',records.reduce((n,r)=>n+r.bytes,0),'bytes');
