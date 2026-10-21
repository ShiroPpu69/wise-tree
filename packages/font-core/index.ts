const segmenter=new Intl.Segmenter(undefined,{granularity:'grapheme'});
export function graphemes(text:string){return Array.from(segmenter.segment(text),part=>part.segment);}
export function wrapMeasured(text:string,width:number,measure:(text:string)=>number):string[]{
 if(!(width>0))throw Error('文本宽度必须为正');const lines:string[]=[];let line='',spaces='';
 const pieces=text.match(/\n|[^\S\n]+|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|[^\s\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu)??[];
 function flush(){lines.push(line.trimEnd());line='';spaces='';}
 for(const piece of pieces){if(piece==='\n'){flush();continue;}if(/^\s+$/.test(piece)){spaces+=piece;continue;}const candidate=line+(line?spaces:'')+piece;if(measure(candidate)<=width){line=candidate;spaces='';continue;}if(line&&measure(piece)<=width){if(/^[，。！？；：、）】》”’]/u.test(piece)||/[（【《“‘]$/u.test(line)){const previous=graphemes(line),last=previous.pop()!;line=previous.join('');flush();line=last+piece;}else{flush();line=piece;}continue;}spaces='';for(const unit of graphemes(piece)){if(line&&measure(line+unit)>width){const previous=graphemes(line);if(/^[，。！？；：、）】》”’]/u.test(unit)||/[（【《“‘]$/u.test(line)){const last=previous.pop()!;line=previous.join('');flush();line=last;}else flush();}line+=unit;}}
 lines.push(line.trimEnd());return lines;
}
export function paginate(lines:string[],height:number,lineHeight:number){const count=Math.floor(height/lineHeight);if(count<1)throw Error('气泡高度不足一行');const pages:string[][]=[];for(let i=0;i<lines.length;i+=count)pages.push(lines.slice(i,i+count));return pages;}
