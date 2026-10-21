import type {ImportedAssets} from './index.ts';
export const CHINESE_OVERLAY_SHA='2592b8fc84524f805b934391580823285aa19491a1f88f96a113ff3be2a67875';
export interface ChineseAssets {hash:string;dialogue:Record<string,string>;images:Record<string,Blob>;source:{page:string;author:string;classification:string}}
export async function addChineseAssets(assets:ImportedAssets,raw:Uint8Array):Promise<ImportedAssets>{
 if(raw.byteLength>2e6)throw Error('中文资源包过大');const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw.slice().buffer)),n=>n.toString(16).padStart(2,'0')).join('');if(hash!==CHINESE_OVERLAY_SHA)throw Error('中文资源校验失败');
 const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));if(value.version!==1||Object.keys(value.dialogue??{}).filter(key=>key.startsWith('TREE_OF_WISDOM_')).length!==81)throw Error('中文台词资源不完整');
 const images:Record<string,Blob>={};for(const [id,base64] of Object.entries(value.images??{})){if(!/^IMAGE_(STORE_|ZEN|OPTIONS_)/.test(id)||typeof base64!=='string')throw Error('中文贴图无效');images[id]=new Blob([Uint8Array.from(atob(base64),char=>char.charCodeAt(0))],{type:'image/png'});}
 return {...assets,chinese:{hash,images,dialogue:value.dialogue,source:value.source}};
}
