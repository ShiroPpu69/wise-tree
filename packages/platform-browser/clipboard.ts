export async function copyText(text:string){
 if(!text)throw Error('当前没有可以复制的对话');
 if(window.wisdomDesktop?.copyText){try{await window.wisdomDesktop.copyText(text);return;}catch{throw Error('复制失败，请在聊天记录中选择文字后重试。');}}
 try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(text);}catch{throw Error('复制失败，请允许浏览器访问剪贴板，或在聊天记录中选择文字复制。');}
}
