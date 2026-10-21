import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {safePath,unpackPak,decodeFont,decodeReanim} from '../packages/asset-pipeline/index.ts';
const base='private/extracted/steam-goty-1.2.0.1096/';
test('reject archive traversal, drive, ADS, null and empty names',()=>{for(const p of ['../x','/x','C:/x','a:b','a\0b',''])assert.throws(()=>safePath(p));assert.equal(safePath('Images\\Tree.PNG'),'images/tree.png');});
test('truncated or foreign PAK fails closed',()=>{assert.throws(()=>unpackPak(new Uint8Array(3)));assert.throws(()=>unpackPak(new Uint8Array(20)));});
test('local bitmap font IR retains every single-byte glyph and both outline layers',{skip:!fs.existsSync(base)},()=>{for(const name of ['BrianneTod12','BrianneTod16','HouseofTerror16','HouseofTerror20','ContinuumBold14']){const f=decodeFont(fs.readFileSync(base+'data/'+name+'.txt'));assert.ok(Object.keys(f.glyphs).length>=90);assert.equal(f.glyphs[' '].advance,5);assert.ok(f.lineHeight>0);if(name.startsWith('House'))assert.equal(f.layers.length,2);else assert.equal(f.layers.length,1);}const f=decodeFont(fs.readFileSync(base+'data/BrianneTod16.txt'));assert.equal(Object.keys(f.glyphs).length,161);assert.equal(f.glyphs['é'].advance,8);});
test('actual compressed Reanim parses expected audited dimensions',{skip:!fs.existsSync(base)},async()=>{for(const [name,tracks,frames] of [['TreeOfWisdom',109,354],['TreeOfWisdomClouds',6,625],['TreeFood',2,31]] as const){const a=await decodeReanim(fs.readFileSync(base+'compiled/reanim/'+name+'.reanim.compiled'));assert.equal(a.tracks.length,tracks);assert.equal(a.tracks[0].frames.length,frames);}});
