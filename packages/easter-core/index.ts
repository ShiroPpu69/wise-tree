export const commands=['future','mustache','trickedout','sukhbir','daisies','dance','pinata'] as const;
export type EasterCommand=typeof commands[number];
export function requiredHeight(code:EasterCommand){return code==='daisies'?100:code==='dance'?500:code==='pinata'?1000:1;}
export class CheatRecognizer {
 private buffer='';
 input(key:string,editing:boolean):EasterCommand|null{if(editing){this.buffer='';return null;}if(!/^[a-z]$/i.test(key))return null;this.buffer=(this.buffer+key.toLowerCase()).slice(-16);const code=commands.find(c=>this.buffer.endsWith(c));if(code){this.buffer='';return code;}return null;}
}
