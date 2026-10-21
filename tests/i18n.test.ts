import test from 'node:test';import assert from 'node:assert/strict';
import {translate,setLanguage,getLanguage} from '../packages/i18n-core/index.ts';
test('locale defaults to Chinese, translates settings and dynamic exact usage, and switches back',()=>{
 assert.equal(getLanguage(),'zh-CN');assert.equal(translate('智慧树'),'智慧树');setLanguage('en');assert.equal(translate('智慧树设置'),'Options');
 assert.equal(translate('输入 1999 + 输出 1 Token（服务商统计）；兑换进度 0/2000'),'Input 1999 + output 1 tokens (provider usage); exchange progress 0/2000');
 assert.equal(translate('Error: 缺少已审计图片 IMAGE_TEST'),'Error: Missing audited image IMAGE_TEST');setLanguage('zh-CN');assert.equal(translate('Tree of Wisdom'),'智慧树');
});
