import {copyText} from '../../../packages/platform-browser/clipboard.ts';
import type {SpeechControl} from '../../../packages/speech-core/index.ts';
import React,{useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {LocalStore} from '../../../packages/storage-core/index.ts';
import {AUDITED_PAK,importGoty,prepareChatArtwork,type ImportedAssets} from '../../../packages/asset-pipeline/index.ts';
import {WisdomScene} from '../../../packages/renderer-pixi/index.ts';
import type {GameState} from '../../../packages/game-core/index.ts';
import './style.css';
import {localize} from './Localized.tsx';
import {getLanguage,setLanguage,subscribeLanguage,type Language} from '../../../packages/i18n-core/index.ts';
import {ChatControls} from './ChatControls.tsx';
import {addChineseAssets,CHINESE_OVERLAY_SHA} from '../../../packages/asset-pipeline/chinese.ts';
async function localizeAssets(a:ImportedAssets,store:LocalStore){
 if(!a.images.IMAGE_WISDOM_CHAT_FRAME){const raw=window.wisdomDesktop?await window.wisdomDesktop.readBundledAssets():undefined;const next=await prepareChatArtwork(a,raw??undefined);if(next.images.IMAGE_WISDOM_CHAT_FRAME){a=next;await store.saveAssets(a);}}
 if(a.chinese?.hash===CHINESE_OVERLAY_SHA)return a;
 let raw:Uint8Array|null=null;
 if(window.wisdomDesktop)raw=await window.wisdomDesktop.readChineseAssets();
 else{try{const response=await fetch(new URL('goty/zh.json',document.baseURI));if(response.ok&&response.headers.get('content-type')?.includes('application/json'))raw=new Uint8Array(await response.arrayBuffer());}catch{/* Public builds may omit copyrighted localization data. */}}
 if(!raw)return a;const next=await addChineseAssets(a,raw);await store.saveAssets(next);return next;
}

export function App({databaseName}:{databaseName?:string}={}){
  const language=useSyncExternalStore(subscribeLanguage,getLanguage);
  useEffect(()=>{document.documentElement.lang=language;document.title=language==='en'?'Tree of Wisdom':'智慧树';void window.wisdomDesktop?.setLanguage(language).catch(()=>{});},[language]);
  const [store,setStore]=useState<LocalStore|null>(null),[assets,setAssets]=useState<ImportedAssets|null>(null),[state,setState]=useState<GameState|null>(null);
  const [status,setStatus]=useState('正在读取本地存档…'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[options,setOptions]=useState(false);
  const [saveEpoch,setSaveEpoch]=useState(0);
  const [bootEpoch,setBootEpoch]=useState(0),[resourceMode,setResourceMode]=useState<'loading'|'external'|'ready'|'failed'>(window.wisdomDesktop?'loading':'external');
  const [speechControl,setSpeechControl]=useState<SpeechControl|null>(null);
  const [screen,setScreen]=useState<'tree'|'shop'|'demo'>('tree');
  useEffect(()=>{void window.wisdomDesktop?.startupWarning().then(message=>{if(message)setError(message);}).catch(()=>{});},[]);
  const canvas=useRef<HTMLDivElement>(null),scene=useRef<WisdomScene|null>(null),stateRef=useRef(state);stateRef.current=state;
  useEffect(()=>{let alive=true;void LocalStore.open(databaseName).then(async s=>{
    if(!alive)return;setStore(s);const preferences=await s.read<{language:Language;soundEnabled:boolean}>('preferences');if(!alive)return;setLanguage(preferences?.language==='en'?'en':'zh-CN');await window.wisdomDesktop?.setLanguage(getLanguage());await document.fonts.load('16px "Wisdom CJK"');const cached=await s.assets();
    const invalid=cached&&(!cached.images||!cached.fonts||!cached.dialogue||!cached.sounds||!cached.particles||cached.hash!==AUDITED_PAK||!['IMAGE_OPTIONS_CHECKBOX0','IMAGE_OPTIONS_CHECKBOX1','IMAGE_OPTIONS_SLIDERKNOB2','IMAGE_OPTIONS_SLIDERSLOT'].every(id=>cached.images[id])||!['TreeOfWisdom','TreeOfWisdomClouds','TreeFood','CrazyDave','Zombie','LawnMower'].every(name=>cached.animations?.[name]?.tracks?.length));
    let a=invalid?undefined:cached;
    if(!a&&window.wisdomDesktop){
      if(alive)setResourceMode('loading');const bytes=await window.wisdomDesktop.readBundledAssets();
      if(!alive)return;
      if(bytes){a=await importGoty(bytes,message=>{if(alive)setStatus(message);});if(!alive)return;await s.saveAssets(a);}
    }
    if(a)a=await localizeAssets(a,s);if(!alive)return;setAssets(a??null);setResourceMode(a?'ready':'external');
    if(!a&&invalid)setError('资源缓存不完整或版本不兼容，请重新导入main.pak；游戏存档将保留。');
    const g=await s.state();if(alive){setState(g);setStatus(s.consumeRecoveryNotice());}
  }).catch(e=>{if(alive){setResourceMode('failed');setStatus('启动未完成；请重试，存档损坏时可导入备份恢复。');setError(String(e));}});return()=>{alive=false;};},[databaseName,bootEpoch]);
  useEffect(()=>{if(!assets||!store||!stateRef.current||!canvas.current)return;let live=true;const instance=new WisdomScene(assets,stateRef.current,{
    feed:()=>{void store.act({type:'feed',id:crypto.randomUUID()}).then(setState).catch(e=>setError(String(e)));},
    buy:()=>{void store.act({type:'buy',id:crypto.randomUUID()}).then(s=>{setState(s);setStatus('购买成功：树肥 +1，金币 −2500');}).catch(e=>setError(String(e)));},
    speechControl:setSpeechControl,options:()=>setOptions(true),screen:setScreen,finished:id=>{void store.act({type:'finishFeed',id}).then(s=>{if(live)setState(s);}).catch(e=>setError(String(e)));},error:setError,
  });scene.current=instance;void store.read<{soundEnabled:boolean}>('preferences').then(p=>instance.setSoundEnabled(p?.soundEnabled??true));void instance.mount(canvas.current).catch(e=>{if(live)setError(String(e));});return()=>{live=false;instance.destroy();scene.current=null;setSpeechControl(null);};},[assets,store,saveEpoch,state===null]);
  useEffect(()=>{if(state)scene.current?.sync(state);},[state]);
  useEffect(()=>{if(!assets)return;const urls=Object.entries(assets.images).filter(([id])=>id.startsWith('IMAGE_DIALOG_')||id.startsWith('IMAGE_BUTTON_')||id.startsWith('IMAGE_OPTIONS_')||id==='IMAGE_STORE_MAINMENUBUTTON'||id==='IMAGE_SHOVELBANK'||id.startsWith('IMAGE_WISDOM_CHAT_')).map(([id,blob])=>[id,URL.createObjectURL(blob)] as const);for(const [id,url] of urls)document.documentElement.style.setProperty('--'+id.toLowerCase().replaceAll('_','-'),`url("${url}")`);return()=>{for(const [,url] of urls)URL.revokeObjectURL(url);};},[assets]);
  useEffect(()=>{if(!store)return;const refresh=()=>void store.state().then(value=>{setState(value);const notice=store.consumeRecoveryNotice();if(notice)setStatus(notice);}).catch(e=>setError(String(e)));window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[store]);
  async function loadResource(file:File|undefined){if(!file||!store)return;setBusy(true);setError('');try{const a=await localizeAssets(await importGoty(new Uint8Array(await file.arrayBuffer()),setStatus),store);await store.saveAssets(a);setAssets(a);setStatus('原版资源已保存到本地，后续启动可直接加载。');}catch(e){setError(String(e));}finally{setBusy(false);}}
  async function exportSave(){if(!store)return;const data=await store.exportSave(),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ai-tree-save.json';a.click();URL.revokeObjectURL(url);}
  async function importSave(file:File|undefined){if(!store||!file)return;setBusy(true);try{if(scene.current?.isBusy())throw Error('请先等待施肥结束，或取消当前回答后再导入存档');if(file.size>20e6)throw Error('存档文件过大');await store.importSave(JSON.parse(await file.text()));const preferences=await store.read<{language:Language}>('preferences');setLanguage(preferences?.language==='en'?'en':'zh-CN');setState(await store.state());setSaveEpoch(n=>n+1);setStatus('存档已恢复');}catch(e){setError(String(e));}finally{setBusy(false);}}
  return localize(<main>{!assets?(resourceMode==='external'?<section className="utility"><h1>智慧树 · 原版资源导入</h1><p>选择你拥有的英文 Steam GOTY 1.2.0.1096 的 main.pak。程序仅在本机提取和转换，不上传资源。</p><p>当前启动工具尚未载入游戏美术。其他发行版需要先进行兼容性审计。</p><label>选择 main.pak<input type="file" accept=".pak" disabled={busy||!store} onChange={e=>void loadResource(e.target.files?.[0])}/></label></section>:<section className="utility"><h1>智慧树</h1><p>{resourceMode==='failed'?'启动未完成，请检查下方错误提示。':'正在准备原版智慧树…首次启动可能需要几秒。'}</p>{resourceMode==='failed'&&<button onClick={()=>{setError('');setResourceMode('loading');setBootEpoch(n=>n+1);}}>重试启动</button>}</section>):<div className="game-shell"><div ref={canvas} className="game"/>{speechControl&&screen==='tree'&&!options&&<button className="speech-copy" aria-label="复制气泡全文" style={{left:`${speechControl.x/8}%`,top:`${speechControl.y/6}%`,width:`${speechControl.width/8}%`,height:`${speechControl.height/6}%`}} onClick={()=>{void copyText(scene.current?.copyText()??'').then(()=>setStatus('已复制对话全文')).catch(e=>setError(String(e)));}}>复制</button>}{store&&state&&<ChatControls settingsOpen={options} onCloseSettings={()=>setOptions(false)} gameSettings={<><label>更新原版界面资源（main.pak）<input type="file" accept=".pak" disabled={busy} onChange={e=>void loadResource(e.target.files?.[0])}/></label><p>离线原版功能：选择左上角树肥，再点击树木施肥；右上角 SHOP 购买树肥。</p><p>高度 {state?.height} 英尺 · 树肥 {state?.food}/10 · 金币 {state?.coins}</p><button onClick={()=>void exportSave()}>导出存档（不含密钥或资源）</button><label>导入存档<input type="file" accept=".json" disabled={busy} onChange={e=>void importSave(e.target.files?.[0])}/></label></>} key={saveEpoch} dialogue={language==='zh-CN'?(assets.chinese?.dialogue??assets.dialogue):assets.dialogue} visible={screen==='tree'} store={store} scene={scene} state={state} setState={setState} notify={setStatus} fail={setError}/>}</div>}
    {store&&!state&&<section className="utility"><label>从备份恢复存档<input type="file" accept=".json" disabled={busy} onChange={e=>void importSave(e.target.files?.[0])}/></label></section>}{status&&<p className="notice" role="status">{status}</p>}{error&&<div className="error" role="alert">{error}<button onClick={()=>setError('')}>关闭</button></div>}
  </main>);
}


