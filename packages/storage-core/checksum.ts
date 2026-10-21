const table=Uint32Array.from({length:256},(_,value)=>{for(let bit=0;bit<8;bit++)value=value&1?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
// Corruption detection only. This is neither encryption nor an anti-cheat signature.
export function crc32(text:string){let value=0xffffffff;for(const byte of new TextEncoder().encode(text))value=table[(value^byte)&255]^(value>>>8);return ((value^0xffffffff)>>>0).toString(16).padStart(8,'0');}
