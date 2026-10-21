import {defineConfig,type Plugin} from 'vite';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
function chineseAssets(personal:boolean):Plugin{return {name:'local-chinese-assets',configureServer(server){server.middlewares.use('/goty/zh.json',(_request,response)=>{try{response.setHeader('Content-Type','application/json');response.end(readFileSync('resources/goty/zh.json'));}catch{response.statusCode=404;response.end();}});},generateBundle(){this.emitFile({type:'asset',fileName:'goty/zh.json',source:readFileSync('resources/goty/zh.json')});}};}
function offlineApp():Plugin{return {name:'wisdom-offline-app',enforce:'post',generateBundle(_options,bundle){
 const notices=readFileSync('THIRD_PARTY_NOTICES.txt','utf8');
 this.emitFile({type:'asset',fileName:'THIRD_PARTY_NOTICES.txt',source:notices});
 const files=[...new Set([...Object.keys(bundle),'THIRD_PARTY_NOTICES.txt'])].filter(path=>!path.endsWith('.map'));
 const fingerprint=createHash('sha256').update(notices);
 for(const name of files){fingerprint.update(name+'\0');const entry=bundle[name];if(entry)fingerprint.update(entry.type==='chunk'?entry.code:entry.source);}
 const version=fingerprint.digest('hex').slice(0,12);
 const source=readFileSync('apps/web/service-worker.js','utf8').replace('__FILES__',JSON.stringify(files)).replace('__VERSION__',version);
 this.emitFile({type:'asset',fileName:'sw.js',source});
}};}
export default defineConfig(({mode})=>({root:'apps/web',base:'./',publicDir:false,plugins:[chineseAssets(mode==='personal'),offlineApp()],build:{outDir:'../../dist/web',emptyOutDir:true},server:{host:'127.0.0.1',port:5180,strictPort:true}}));
