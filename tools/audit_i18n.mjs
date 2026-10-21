import fs from 'node:fs/promises';import {setLanguage,translate} from '../packages/i18n-core/index.ts';
const folders=['packages','apps/desktop'];const files=[];
async function walk(folder){for(const entry of await fs.readdir(folder,{withFileTypes:true})){const p=folder+'/'+entry.name;if(entry.isDirectory())await walk(p);else if(/\.(ts|cjs)$/.test(p))files.push(p);}}
for(const folder of folders)await walk(folder);setLanguage('en');const missing=[];
for(const file of files){if(file.includes('i18n-core'))continue;const source=await fs.readFile(file,'utf8');for(const m of source.matchAll(/(?:throw (?:new )?Error|reject\(Error)\(\s*(['"])(.*?)\1/g)){if(/[\u3400-\u9fff]/.test(translate(m[2])))missing.push({file,text:m[2]});}}
await fs.writeFile('private/i18n-unmapped-errors.json',JSON.stringify(missing,null,2));console.log(JSON.stringify(missing));if(missing.length)process.exitCode=1;
