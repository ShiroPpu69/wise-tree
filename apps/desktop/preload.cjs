const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('wisdomDesktop',{
 readBundledAssets:()=>ipcRenderer.invoke('wisdom:bundled-assets'),
 readChineseAssets:()=>ipcRenderer.invoke('wisdom:chinese-assets'),
 setLanguage:language=>ipcRenderer.invoke('wisdom:language',language),
 toggleFullscreen:()=>ipcRenderer.invoke('wisdom:fullscreen'),
 copyText:text=>ipcRenderer.invoke('wisdom:copy-text',text),
 startupWarning:()=>ipcRenderer.invoke('wisdom:startup-warning'),
 onlineSpeech:(id,text,stage,language,rate)=>ipcRenderer.invoke('wisdom:online-speech',id,text,stage,language,rate),
 systemSpeech:(id,text,rate,language)=>ipcRenderer.invoke('wisdom:system-speech',id,text,rate,language),
 systemTranscribe:(id,bytes,language)=>ipcRenderer.invoke('wisdom:system-transcribe',id,Array.from(bytes),language),
 configure:(scope,url,key)=>ipcRenderer.invoke('wisdom:configure',scope,url,key),
 start:(id,scope,url,payload)=>ipcRenderer.invoke('wisdom:start',id,scope,url,payload),
 cancel:id=>ipcRenderer.send('wisdom:cancel',id),
 onChunk:callback=>{const listener=(_event,chunk)=>callback(chunk);ipcRenderer.on('wisdom:chunk',listener);return()=>ipcRenderer.removeListener('wisdom:chunk',listener);},
});
