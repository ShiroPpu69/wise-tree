// Audit only the staged publishing scope. Never walks user profiles or vaults.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const files=execFileSync('git',['diff','--cached','--name-only','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const issues=[];let total=0;
const media=new Set(['resources/goty/main.pak','resources/branding/tree.ico','resources/branding/tree.png']);
const rules=[['GitHub credential',/\bgh[pousr]_[A-Za-z0-9]{30,}\b/],['OpenAI-style credential',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b/],['Private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/]];
for(const file of files){
 if(/(^|\/)(private|node_modules|dist|__pycache__)(\/|$)|^research\/(sources|output)\/|(^|\/)\.env($|\.)|provider-vault|\.(exe|dll|onnx|gguf|safetensors|sqlite|db|zip|pyc)$/i.test(file))issues.push({file,reason:'Excluded local or executable artifact'});
 if(/\.(pak|ico|png|gif|jpg|wav|ogg|reanim|compiled|mo3)$/i.test(file)&&!media.has(file)&&!/^docs\/media\/[^/]+\.(png|gif)$/.test(file))issues.push({file,reason:'Unexpected media outside explicit publication scope'});
 const data=await fs.readFile(file);total+=data.length;if(data.length>=100*1024*1024)issues.push({file,reason:'GitHub file-size limit'});
 if(!/\.(pak|ico|png|gif|jpg|ttf)$/i.test(file)){const text=data.toString('utf8');for(const [reason,pattern]of rules)if(pattern.test(text))issues.push({file,reason});}
}
const manifest=JSON.parse(await fs.readFile('resources/manifest.json','utf8'));
for(const entry of manifest.files){const bytes=await fs.readFile(entry.path);assert.equal(bytes.length,entry.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);}
// Documentation media must exist and stay within a friendly loading budget.
for(const language of ['en','zh']){const info=await fs.stat(`docs/media/demo-${language}.gif`);assert.ok(info.size<5*1024*1024);}
await fs.mkdir('private/reports/publication',{recursive:true});
const report={scope:'Staged file/path/size checks, known credential patterns and resource hashes; not a universal secret detector.',files:files.length,bytes:total,issues};
await fs.writeFile('private/reports/publication/staged-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));assert.deepEqual(issues,[]);
