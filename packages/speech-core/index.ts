import {wrapMeasured,graphemes} from '../font-core/index.ts';
export interface SpeechControl {x:number;y:number;width:number;height:number}
export interface SpeechLayout {x:number;y:number;width:number;bodyHeight:number;totalHeight:number;lines:string[];lineHeight:number;content:{x:number;y:number;width:number;height:number};maxScroll:number;starts:number[];copy:SpeechControl}
export function layoutSpeech(text:string,height:number,measure:(text:string)=>number,lineHeight=23):SpeechLayout{
 const natural=text.split('\n').reduce((max,line)=>Math.max(max,measure(line.slice(0,1000))),0);
 const width=Math.max(144,Math.min(364,natural+58)),contentWidth=width-58;
 // Preserve code indentation and line breaks; never interpret model output as markup.
 const lines=text.split('\n').flatMap(line=>{
  const rawIndent=line.match(/^[ \t]+/)?.[0]??'',indent=rawIndent.replaceAll('\t','    ');
  const padding=indent.slice(0,12),available=Math.max(40,contentWidth-measure(padding));
  return wrapMeasured(line.slice(rawIndent.length),available,measure).map(part=>padding+part);
 });
 const bodyHeight=Math.max(76,Math.min(390,lines.length*lineHeight+52));
 const x=height<7?400:height<12?395:390,y=bodyHeight>175?86:(height<7?146:82);
 const content={x:x+22,y:y+25,width:contentWidth,height:bodyHeight-52};
 let count=0;const starts=lines.map(line=>{const start=count;count+=graphemes(line).length;return start;});
 const copy={x:x+width-78,y:y+bodyHeight-25,width:60,height:22};
 return {x,y,width,bodyHeight,totalHeight:bodyHeight+23,lines,lineHeight,content,maxScroll:Math.max(0,lines.length*lineHeight-content.height),starts,copy};
}
export function clampScroll(value:number,layout:SpeechLayout){return Math.max(0,Math.min(layout.maxScroll,value));}
