import test from 'node:test';import assert from 'node:assert/strict';
import {defaultPersonality,legacyDefaultPersonality,upgradePersonality,buildTreeSystem,roleHistory} from '../packages/ai-core/personality.ts';
test('old default upgrades exactly; custom and deliberately empty personalities are preserved',()=>{
 assert.equal(upgradePersonality(legacyDefaultPersonality),defaultPersonality);assert.equal(upgradePersonality(undefined),defaultPersonality);
 assert.equal(upgradePersonality(defaultPersonality),defaultPersonality);assert.equal(upgradePersonality('只谈园艺。'),'只谈园艺。');assert.equal(upgradePersonality(''),'');
});
test('identity stays in the fictional garden; explicit real technical questions remain truthful',()=>{
 const system=buildTreeSystem(defaultPersonality,'zh-CN',{},'你是什么');
 assert.ok(system.startsWith('你就是这片庭院里的智慧树'));assert.ok(system.includes('普通的“你是谁”“你是什么”'));
 assert.ok(system.includes('若用户明确追问现实中的模型'));assert.ok(system.includes('不谎称自己是真实生物'));
 assert.ok(system.includes('是本应用新增示例，不是原版台词'));assert.ok(system.includes('不从语气样例推断规则'));
});
test('source examples are read from the selected resource and omitted for a custom persona',()=>{
 const source={TREE_OF_WISDOM_2:'资源夹具：已选择中文',TREE_OF_WISDOM_800:'里程碑夹具'};
 const basic=buildTreeSystem(defaultPersonality,'zh-CN',source,'你好');assert.ok(basic.includes(source.TREE_OF_WISDOM_2));assert.ok(!basic.includes(source.TREE_OF_WISDOM_800));
 assert.ok(buildTreeSystem(defaultPersonality,'en',source,'原版原话').includes(source.TREE_OF_WISDOM_800));
 const custom=buildTreeSystem('自定义人格','en',source,'你好');assert.ok(!custom.includes('原版语气样例'));assert.ok(custom.includes('Default reply language: English'));assert.ok(custom.includes('unless the user explicitly requests another language'));
});
test('default request omits old self-disclaimers without deleting history or hiding user questions',()=>{
 const history=[{role:'user' as const,content:'你是什么'},{role:'assistant' as const,content:'我是你的AI对话伙伴，套了个「智慧树」的壳。'},{role:'assistant' as const,content:'这段代码使用了人工智能接口。'},{role:'user' as const,content:'解释人工智能接口'}];
 const result=roleHistory(history,defaultPersonality);assert.equal(result.length,3);assert.equal(history.length,4);assert.ok(result.includes(history[0]));assert.ok(result.includes(history[2]));assert.ok(result.includes(history[3]));
 assert.equal(roleHistory(history,'自定义人格'),history);
});
