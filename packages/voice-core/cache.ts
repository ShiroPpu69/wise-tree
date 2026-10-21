/** Session-only, bounded LRU. Nothing is persisted or shared across controllers. */
export class SpeechCache {
 private entries=new Map<string,Blob>();private bytes=0;private maxBytes:number;private maxEntries:number;
 constructor(maxBytes=8*1024*1024,maxEntries=24){this.maxBytes=maxBytes;this.maxEntries=maxEntries;}
 get(key:string):Blob|undefined{const blob=this.entries.get(key);if(blob){this.entries.delete(key);this.entries.set(key,blob);}return blob;}
 put(key:string,blob:Blob){const old=this.entries.get(key);if(old){this.bytes-=old.size;this.entries.delete(key);}if(!blob.size||blob.size>this.maxBytes)return;this.entries.set(key,blob);this.bytes+=blob.size;while(this.bytes>this.maxBytes||this.entries.size>this.maxEntries){const oldest=this.entries.keys().next().value;if(oldest===undefined)break;this.bytes-=this.entries.get(oldest)!.size;this.entries.delete(oldest);}}
 clear(){this.entries.clear();this.bytes=0;}
}
