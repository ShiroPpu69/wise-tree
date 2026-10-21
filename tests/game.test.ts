import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyAction,initialState,unlocked,validateState,migrateEconomy} from '../packages/game-core/index.ts';
const usage=(id:string,n:number)=>({type:'usage' as const,id,prompt:n,completion:0,basis:'exact' as const,allowEstimate:false});
test('legacy default becomes 20000 once, preserving coins, remainder and feeding history',()=>{
 const legacy=initialState();delete legacy.economyVersion;legacy.rate.tokens=2000;
 const earned=applyAction(legacy,usage('old',2501)),fed=applyAction(earned,{type:'feed',id:'old-feed'}),next=migrateEconomy(fed);
 assert.equal(next.rate.tokens,20000);assert.equal(next.coins,fed.coins);assert.equal(next.pendingTokens,501);assert.equal(next.rewardedTokens,2000);assert.equal(next.height,2);assert.equal(next.food,4);assert.deepEqual(next.settled,fed.settled);assert.equal(migrateEconomy(next),next);
});
test('custom exchange rates and future explicit choices are not reset by migration',()=>{
 const legacy=initialState();delete legacy.economyVersion;legacy.rate={tokens:777,coins:9};assert.deepEqual(migrateEconomy(legacy).rate,legacy.rate);
 const next=applyAction(initialState(),{type:'rate',id:'custom',tokens:2000,coins:2500});assert.equal(migrateEconomy(next).rate.tokens,2000);
});
test('19999 + 1 tokens awards exactly 2500; remainder survives serialized restart',()=>{const a=applyAction(initialState(),usage('a',19999));assert.equal(a.coins,0);const b=applyAction(JSON.parse(JSON.stringify(a)),usage('b',1));assert.equal(b.coins,2500);assert.equal(b.pendingTokens,0);assert.equal(b.rewardedTokens,20000);});
test('40000 tokens awards 5000, duplicate result never settles twice',()=>{const a=applyAction(initialState(),usage('a',40000));assert.equal(a.coins,5000);assert.deepEqual(applyAction(a,usage('a',40000)),a);});
test('purchase deducts 2500 and adds one bag atomically',()=>{const a=applyAction(initialState(),usage('a',20000));const b=applyAction(a,{type:'buy',id:'buy'});assert.equal(b.coins,0);assert.equal(b.food,6);assert.deepEqual(applyAction(b,{type:'buy',id:'buy'}),b);});
test('insufficient coins and inventory >= 10 reject without changing original',()=>{const a=initialState();assert.throws(()=>applyAction(a,{type:'buy',id:'buy'}));assert.equal(a.food,5);a.coins=10000;a.food=10;assert.throws(()=>applyAction(a,{type:'buy',id:'buy'}));assert.equal(a.coins,10000);});
test('feeding and restart recovery never double deduct or grow',()=>{const s=applyAction(initialState(),{type:'feed',id:'feed'});assert.equal(s.height,2);assert.equal(s.food,4);assert.throws(()=>applyAction(s,{type:'feed',id:'other'}));const reload=JSON.parse(JSON.stringify(s));assert.deepEqual(applyAction(reload,{type:'feed',id:'feed'}),s);const end=applyAction(s,{type:'finishFeed',id:'feed'});assert.equal(end.pendingFeed,null);assert.equal(end.height,2);assert.equal(end.food,4);});
test('changing future rate does not revalue awarded history',()=>{let a=applyAction(initialState(),usage('a',20500));a=applyAction(a,{type:'rate',id:'rate',tokens:1000,coins:100});assert.equal(a.coins,2500);assert.equal(a.pendingTokens,500);a=applyAction(a,usage('b',500));assert.equal(a.coins,2600);});
test('unapproved estimation is recorded but awards no coins',()=>{const a=applyAction(initialState(),{...usage('a',4000),basis:'estimated'});assert.equal(a.coins,0);assert.equal(a.pendingTokens,0);assert.equal(a.observedTokens,4000);});
test('all required height transitions cost exactly one bag',()=>{for(const height of [1,5,49,50,99,499,999,1000]){const a=initialState();a.height=height;const b=applyAction(a,{type:'feed',id:'feed'});assert.equal(b.height,height+1);assert.equal(b.food,4);}});
test('unlock thresholds are exact; high tree has no arbitrary cap',()=>{assert.equal(unlocked(99).daisies,false);assert.equal(unlocked(100).daisies,true);assert.equal(unlocked(500).dance,true);assert.equal(unlocked(1000).pinata,true);const a=initialState();a.height=1000000;assert.equal(applyAction(a,{type:'feed',id:'feed'}).height,1000001);});

test('corrupt settled usage or ledger values are rejected before recovery',()=>{const s=initialState();s.settled.bad={prompt:-1,completion:1,basis:'exact'};assert.throws(()=>validateState(s));const v=applyAction(initialState(),usage('valid',1));v.ledger[0].coins=NaN;assert.throws(()=>validateState(v));});

