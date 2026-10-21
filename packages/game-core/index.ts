export interface LedgerEntry {id:string;kind:'usage'|'purchase'|'feed'|'rate';time:string;coins:number;food:number;tokens:number;basis?:'exact'|'estimated';requestId?:string}
export interface GameState {
  economyVersion?:2;
  version:1;revision:number;height:number;food:number;coins:number;rewardedTokens:number;pendingTokens:number;observedTokens:number;
  rate:{tokens:number;coins:number};ledger:LedgerEntry[];settled:Record<string,{prompt:number;completion:number;basis:'exact'|'estimated'}>;
  pendingFeed:null|{id:string;from:number;to:number};
}
export function initialState():GameState{return {economyVersion:2,version:1,revision:0,height:1,food:5,coins:0,rewardedTokens:0,pendingTokens:0,observedTokens:0,rate:{tokens:20000,coins:2500},ledger:[],settled:{},pendingFeed:null};}
export function migrateEconomy(before:GameState):GameState{
  validateState(before);if(before.economyVersion===2)return before;
  const state=before.rate.tokens===2000&&before.rate.coins===2500?applyAction(before,{type:'rate',id:'system:default-rate-20000-v2',tokens:20000,coins:2500}):structuredClone(before);
  if(state===before)return before;state.economyVersion=2;if(state.revision===before.revision)state.revision++;return state;
}
export function assertInteger(n:unknown,label:string):asserts n is number {if(typeof n!=='number'||!Number.isSafeInteger(n)||n<0)throw Error('无效整数 '+label);}
export function validateState(s:GameState):void {
  if(!s||s.version!==1||!Array.isArray(s.ledger)||!s.settled||typeof s.settled!=='object'||Array.isArray(s.settled))throw Error('不支持或损坏的存档');
  for(const k of ['revision','height','food','coins','rewardedTokens','pendingTokens','observedTokens'] as const)assertInteger(s[k],k);
  assertInteger(s.rate?.tokens,'兑换Token');assertInteger(s.rate?.coins,'兑换金币');if(s.height<1||s.food>10||s.rate.tokens<1||s.rate.coins<1)throw Error('存档数值越界');
  if(s.pendingFeed){if(typeof s.pendingFeed.id!=='string'||!s.pendingFeed.id||s.pendingFeed.from<1||s.pendingFeed.to!==s.height||s.pendingFeed.from!==s.height-1)throw Error('施肥恢复记录损坏');}
  const ids=new Set<string>();for(const entry of s.ledger){if(!entry||typeof entry.id!=='string'||!entry.id||ids.has(entry.id))throw Error('账本交易号无效或重复');if(!['usage','purchase','feed','rate'].includes(entry.kind)||typeof entry.time!=='string'||!Number.isFinite(Date.parse(entry.time))||!Number.isSafeInteger(entry.coins)||!Number.isSafeInteger(entry.food))throw Error('账本字段损坏');assertInteger(entry.tokens,'账本Token');ids.add(entry.id);}
  for(const [id,usage] of Object.entries(s.settled)){if(!id||['__proto__','constructor','prototype'].includes(id)||!usage||!['exact','estimated'].includes(usage.basis))throw Error('已结算请求损坏');assertInteger(usage.prompt,'已结算输入');assertInteger(usage.completion,'已结算输出');assertInteger(usage.prompt+usage.completion,'已结算总量');}
}
export type Action={type:'usage';id:string;prompt:number;completion:number;basis:'exact'|'estimated';allowEstimate:boolean}|{type:'buy';id:string}|{type:'feed';id:string}|{type:'finishFeed';id:string}|{type:'rate';id:string;tokens:number;coins:number};
export function applyAction(before:GameState,action:Action,now=new Date().toISOString()):GameState {
  if(typeof action.id!=='string'||!action.id||action.id.length>128||['__proto__','constructor','prototype'].includes(action.id))throw Error('交易号无效');
  validateState(before);const s=structuredClone(before);
  if(action.type==='finishFeed'){if(s.pendingFeed?.id!==action.id)return s;s.pendingFeed=null;s.revision++;return s;}
  if(s.ledger.some(e=>e.id===action.id))return s;
  const entry:LedgerEntry={id:action.id,kind:action.type==='buy'?'purchase':action.type,time:now,coins:0,food:0,tokens:0};
  if(action.type==='usage'){
    if(Object.hasOwn(s.settled,action.id))return s;assertInteger(action.prompt,'输入用量');assertInteger(action.completion,'输出用量');const total=action.prompt+action.completion;assertInteger(total,'总用量');
    if(!['exact','estimated'].includes(action.basis))throw Error('用量来源无效');s.settled[action.id]={prompt:action.prompt,completion:action.completion,basis:action.basis};s.observedTokens+=total;entry.basis=action.basis;entry.requestId=action.id;
    if(action.basis==='exact'||action.allowEstimate){s.pendingTokens+=total;entry.tokens=total;const batches=Math.floor(s.pendingTokens/s.rate.tokens);const spent=batches*s.rate.tokens,coins=batches*s.rate.coins;s.pendingTokens-=spent;s.rewardedTokens+=spent;s.coins+=coins;entry.coins=coins;}
  }else if(action.type==='buy'){
    if(s.food>=10)throw Error('树肥库存已满（10袋）');if(s.coins<2500)throw Error('金币不足：每袋树肥需要2500金币');s.coins-=2500;s.food++;entry.coins=-2500;entry.food=1;
  }else if(action.type==='feed'){
    if(s.pendingFeed)throw Error('请等待本次成长结束');if(s.food<1)throw Error('没有树肥，请到商店购买');if(s.height===Number.MAX_SAFE_INTEGER)throw Error('高度已超出安全整数范围');s.food--;s.height++;s.pendingFeed={id:action.id,from:s.height-1,to:s.height};entry.food=-1;
  }else {
    assertInteger(action.tokens,'兑换Token');assertInteger(action.coins,'兑换金币');if(action.tokens<1||action.coins<1)throw Error('兑换比例必须为正整数');s.rate={tokens:action.tokens,coins:action.coins};
  }
  s.ledger.push(entry);s.revision++;validateState(s);return s;
}
export function unlocked(height:number){return {daisies:height>=100,dance:height>=500,pinata:height>=1000};}
