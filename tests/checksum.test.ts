import {test} from 'node:test';import assert from 'node:assert/strict';import {crc32} from '../packages/storage-core/checksum.ts';
test('CRC32 matches standard check vector and empty input',()=>{assert.equal(crc32('123456789'),'cbf43926');assert.equal(crc32(''),'00000000');});
test('snapshot checksum survives serialization and detects a changed coin value',()=>{const game={coins:2500,height:50};assert.equal(crc32(JSON.stringify(game)),crc32(JSON.stringify(JSON.parse(JSON.stringify(game)))));assert.notEqual(crc32(JSON.stringify(game)),crc32(JSON.stringify({...game,coins:2501})));});
