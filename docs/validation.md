# 实际测试与最终验收记录

## 0.1.6 免费默认语音

42项单元测试通过。实际安装和正常用户语音配置已完成；系统TTS及本地听写端到端证据见[说明](free-voice-0.1.6.md)。录音测试用合成音频注入模拟设备，不等同真人麦克风精度评测；没有调用付费服务。


更新2026-10-21。所有“通过”仅限列出的测试条件。[完整未完成项](implementation-status.md)。原版证据和第三方协议夹具分别记录，不能相互替代。

## 0.1.4 本轮变更

[专项说明](ui-0.1.4.md)。35项核心测试通过；四尺寸全局布局、滚轮气泡、中文施肥/商店及协议、存储、快照回归已通过。最新Windows证据见当前private/reports报告。以下0.1.3段落保留历史验收日期和规则，不代表当前兑换阈值。

## 0.1.3 名称、图标、字体和统一设置

[专项说明](ui-0.1.3.md)。31项核心测试通过；ui-settings-browser在独立Chrome中验证唯一OPTIONS入口、5分页、中英切换/重启保持、每页系统标签无遗漏中文、800×600/1080×840；audit_i18n错误字面量覆盖检查无遗漏。UI中文字符覆盖检查缺字0。ICO含16/20/24/32/40/48/64/128/256九个尺寸。

实际NSIS安装成功，注册表DisplayName为“智慧树 0.1.3”（首次测试曾误按不含版本号匹配，已更正并继续验证）；桌面/开始菜单智慧树.lnk指向安装后的智慧树.exe,0；EXE/安装程序/卸载程序实际PE图标均可提取且四角透明，归档与构建逐字节一致。报告private/reports/installed-ui/installation.json。不是仅检查electron-builder配置。保留安装供用户试用，没有删除用户数据。

实际安装EXE的app.isPackaged=true，用隔离配置验证首次无需资源导入、统一设置、字体、语言和原生窗口标题重启保持；本地SSE夹具验证语言指令允许用户指定另一语言、usage正常结算。报告private/reports/installed-ui/runtime.json，截图options-zh/options-en/chinese-bubble.png。Windows普通GPU模式下通过Computer Use观察到实际窗口新标题/树形图标和原版风格设置；无真实服务商调用。SwiftShader强制测试模式的原生捕获曾空白，CDP正常；未当作原生图像通过。

同轮经济闭环、施肥对白期间语音优先级、语音协议、存储并发/恢复/备份、Web生产断网刷新继续回归。没有收到用户提到的三张截图，因此未完成与其逐图对照；没有新增全场景≤2px验收声明。原版中文字体/中文固定台词包仍缺，补充字体不是原版中文字库。

另重新运行真实0.1.0归档→当前0.1.3个人归档迁移：保留施肥后树高2/树肥4、历史、记忆、Provider设置和加密Key，旧1999 Token加新1 Token只发2500币；旧资源缓存自动从随包PAK补齐新OPTIONS资源。报告private/reports/desktop-upgrade/result.json。这是隔离配置的归档跨版测试，不是所有旧安装环境的NSIS迁移验收。PE资源解析还验证实际安装EXE与安装程序均包含完整九档ICO尺寸。

## 0.1.2 个人包无需导入验收

用户明确将个人安装版改为开箱即用。`npm run dist:personal`完成含已审计本地资源的NSIS构建；代码归档仍排除原版媒体，额外资源goty/main.pak单独核对原包SHA。个人包仅本机使用，不公开发行。`node tools/audit_release.mjs --personal`逐字节比对代码/构建，并核对资源哈希和安装程序摘要，报告private/reports/personal-release-audit/result.json。

`tests/desktop-bundled.mjs`用实际0.1.2个人归档及随包PAK、独立新配置、阻断HTTP网络验证：首次无需任何文件选择即可进入画布，初始1英尺/5袋/0币；手动施肥后2英尺/4袋；重启即使包路径不可用也可加载缓存；删除资源缓存后从随包资源自动重建且存档不变；全新配置缺失随包资源时提示重新安装/重试，不要求导入PAK。0页面错误。报告private/reports/desktop-bundled/result.json。此前一次断言把JSON存档恢复输入误算成PAK资源输入，已改为检查accept=.pak并重跑通过，不是删除功能来满足测试。

同轮30项核心测试、浏览器离线施肥/重启恢复，以及IndexedDB并发/结算幂等/库存回滚/存档与记忆往返回归通过。个人NSIS交互式安装及升级流程未实测；未运行会影响用户已有安装的安装/卸载测试。

## 已执行

| 检查 | 实际范围/结果 | 报告 |
|---|---|---|
| 原包/动画审计 | 3198项文件哈希、466378字段XML/compiled零差异、41树云肥料图片闭包 | private/reports；local-goty-audit.md |
| 原版实机 | 49→50→51扣袋及51重进；800×600的1→2、2→3扣袋；商店2500标价 | private/original-runtime；runtime-verification.md |
| 英文位图字体对照 | 四行边界0px误差、ink IoU .968… .979；不是全场景≤2px验收 | private/original-runtime/font-comparison.json |
| Phase0安全工具 | 14项合成格式/提取保护+4项独立档准备保护 | Python unittest |
| 根项目核心 | **30/30**：SSE/usage/网络中断、密钥嵌套限制、资源路径、实际Reanim与字体、字素/测量分页、彩蛋/粒子、全部指定高度/经济/恢复/损坏状态 | npm test |
| 原版资源浏览器 | 实际PAK导入、1→2、刷新、施肥中刷新恢复到3/3袋；缺币拒绝；0页面错误 | private/reports/offline-browser/result.json |
| AI协议经济闭环 | 本地SSE夹具1999+1真实协议字段→2500币→购买确认→扣币加袋→手动施肥；长文原样历史；0错误 | private/reports/ai-browser/result.json |
| IndexedDB | 20并发唯一结算+10次重复ID无重复奖、库存上限回滚、跨连接施肥恢复、原子历史删/增、存档/记忆往返、损坏启动备份导入 | private/reports/storage-browser/result.json |
| 七彩蛋 | 输入框保护、低树dance锁定、1000英尺测试档7指令独立场景；0页面错误 | private/reports/easter-browser/result.json |
| Windows Electron | 实际Windows运行、原包导入、DPAPI合成Key密文、renderer无读Key能力、未配置端点拒绝、主进程携凭据流转发；0错误 | private/reports/desktop-smoke/result.json |
| 语音协议 | 本地WAV及STT夹具、模拟麦克风、播放/暂停/继续/停止、录音→识别草稿、503降级；并检测本机系统音色；Electron新增实际Windows本地WAV合成（非云服务） | private/reports/voice-browser/result.json |
| Web生产离线 | 生产JS/CSS/HTML由SW预缓存，PAK派生资源本地IDB；断网刷新后画布恢复 | private/reports/web-offline/result.json |

以上API和语音夹具用量/音频明确为测试数据，只存在独立临时浏览器或开发数据库，不能给正式存档发奖，也不能称DeepSeek/OpenAI真实服务验收。浏览器测试运行本机Chrome，在测试脚本中强制SwiftShader；Electron报告包含实际Electron/Chrome/Node版本。系统音色列表只证明该设备可枚举，不代表实际音质通过。

## 复现

```powershell
npm test
python -m unittest discover -s tools -p 'test_*.py' -v
npm run dev                         # 独立终端，5180
node tests/offline-browser.mjs
node tests/ai-browser.mjs
node tests/storage-browser.mjs
node tests/easter-browser.mjs
node tests/voice-browser.mjs
npm run build
node tests/desktop.mjs
npx vite preview --host 127.0.0.1 --port 5183 --strictPort
node tests/web-offline.mjs
npm run dist:win
```

浏览器脚本当前使用本机Chrome路径和用户GOTY路径，其他机器需改为其合法本地输入，不能下载原包夹具。API夹具端口8766，桌面协议8767，语音8768。测试运行中的dist/web不能同时重建以免引入缓存版本竞争。开发入口用5182和独立数据库，生产构建不包含该入口。

报告中的requestAnimationFrame采样只用于记录当前窗口事件间隔，不代表GPU绘制耗时或任意硬件FPS保证。Phase0研究播放器106次采样中位.60ms/p95 3.80ms只是软件WebGL绘制加诊断调用时间。实际应用指标以web-offline最新报告的环境与口径为准。

## 仍未通过的最终验收

- 原版所有指定高度的无损关键元素≤2逻辑像素、连续关键帧与肥料/生长音效同步；完整商店、气泡和字体。
- 实际DeepSeek+第二兼容服务的多轮/usage账单/长文/错误；30题人格人工评分。
- 系统朗读实际听测、第三方TTS/STT、真实麦克风和权限拒绝、声画分页听测；默认离线音色/本地STT选型。
- NSIS交互式安装与安装程序跨版本升级，不同硬件/多浏览器/全屏窗口切换、配额/数据清理；已有内部schema迁移与归档跨版本迁移测试不代表这些全部通过。
- 完整依赖安全与包内容复核、签名/发布。构建成功或Electron测试启动不等于安装流程通过。

发现并修复过的真实问题：Pixi默认动态代码与严格CSP冲突（改为其静态无eval实现，未放宽script CSP）；商店返回按钮被输入工具条遮挡（进入商店隐藏输入）；保存后连接测试使用旧配置；SW缓存遇到Vary: Origin失配；资源与存档分步启动导致渲染器未挂载。旧失败文件可能保留作诊断历史，以result.json及其时间为准。

安装包审计：`node tools/audit_release.mjs`检查ASAR没有原版媒体/研究/测试入口，并逐字节比对当前构建和桌面源码，输出private/reports/release-audit/result.json和安装包SHA-256。它不是完整任意秘密扫描，也不等于NSIS实际安装通过。

## 最新安装实测

`tools/test_installer.ps1`在预先确认没有同名已装应用的条件下，在新的private/installer-acceptance目录静默安装、同版本重装、卸载，三次退出码均0；安装ASAR与发行包哈希一致，卸载后程序文件移除。未传删除用户数据参数。报告private/reports/installer/result.json。不是跨版本迁移或交互式页面验收。归档ASAR经独立Electron入口启动，仍通过原包导入、DPAPI、流式桥与Windows实际语音合成；不是仅运行未打包源码。

最新ASAR清单、安装包大小与SHA-256，以private/reports/release-audit/result.json为准。原版媒体与测试数据未进入包。构建还收集15项运行时依赖的完整许可证文本到THIRD_PARTY_NOTICES.txt，随Web与Windows发布；Electron/Chromium自带通知保留。@pixi/colord npm包缺失许可证文件，已按其公布的gitHead从pixijs/colord固定提交补齐，不将MIT字段当作完整通知。

新增故障注入：tests/desktop-vault-recovery.mjs在独立Electron配置目录放入无效凭据文件，验证警告可见、原文件保持、拒绝覆盖而离线资源入口仍可用；storage-browser额外验证损坏资源缓存不会丢失游戏存档，仍可重新导入。API非流式8MB上限和无效JSON不回显响应文本已纳入核心测试。Web离线测试还验证旧的同作用域缓存清理及其他作用域缓存保留。

0.1.1更新复核：tests/desktop-upgrade.mjs在隔离配置、同一归档路径先运行实际0.1.0，再替换为0.1.1，验证IndexedDB 1→2、原包派生资源/施肥后状态/历史/明确保存记忆/Provider设置保留，DPAPI凭据无需重填可复用，原1999 Token加新1 Token恰好发放2500币且不重复赠送树肥。HTTP服务、Key和用量为本地夹具。报告private/reports/desktop-upgrade/result.json。另重新通过0.1.1实际归档的桌面导入/DPAPI/流式桥/本地WAV合成，以及浏览器离线施肥恢复、协议经济闭环和生产构建断网刷新。未触及用户已安装应用或真实服务。

并发语音优先级：tests/voice-priority-browser.mjs实际触发“模型仍在后台流式时施肥”，截获浏览器speak调用验证完成回复不会朗读、固定对白期间手动重读也被阻止、结束后当前页可朗读；协议和语音输出均为夹具/拦截，不等于真实语音服务听测。

0.1.1新增tests/backups-browser.mjs，实际IndexedDB故障注入及v1→v2升级/旧写入者拒绝通过。tests/desktop-single-instance.mjs用两个实际Electron进程共用独立测试配置，验证第二个退出、首窗口仍可用。0.1.0安装程序已做安装/同版本重装/卸载；用户开始试用后不再自动运行会触及安装注册项的测试，0.1.1安装包构建/归档测试与0.1.0安装流程验证分别记录。

0.1.7 成长语音安装验收已完成，46项单元测试、真实离线双人声/中文路径、包体与实际安装播放和施肥边界回归记录见 [成长语音说明](growth-voice-0.1.7.md)。这不代表所有产品需求或所有硬件已完成最终验收。

0.1.8 改为默认免费联网朗读，51项单元测试通过，实际 NSIS 升级后确认无 neural-voice 模型目录。真实微软中文三音色和已安装 EXE 测试通过；最终复测首次播放1695ms、句间30ms（本机本次网络观测）。LLM 为本地模拟流，精确20000用量只发一次2500币；三个阶段、阈值持久化、暂停停止、语音失败不影响画布/用量、三种窗口尺寸及中英文设置均通过。正常用户配置已通过应用 UI 保存为 online/auto、10/50英尺及自动朗读，未读取密钥或聊天。详细证据在 private/reports/online-voice，范围及服务可用性限制见[联网语音说明](free-online-voice-0.1.8.md)。

0.1.9 更换为网易有道公开体验源，56项单元测试通过，三阶段中文及年轻音色英文实际联网合成通过。已打包程序真实播放首次2414ms、句间29ms；停止/暂停、三阶段施肥边界、阈值保存、中英文设置与三种窗口布局、故障注入后画布/用量正常、精确用量只结算一次均通过。LLM 仍为模拟，测试 profile 与用户数据隔离。报告 private/reports/youdao-voice/packaged.json，来源、隐私及限制见[0.1.9说明](online-voice-0.1.9.md)。安装后的复测是否完成须以 installed.json 和对应安装记录为准。

0.1.9 后续已完成实际 NSIS 升级、归档哈希/图标/快捷方式检查及上述安装版回归，首次播放1369ms、句间19ms；独立 installed-ui 回归也通过。正常用户配置仅检查版本和语音来源，确认 online/网易有道，不改偏好、不读取聊天/密钥；证据 private/reports/youdao-voice/user-source.json。没有将公开体验服务的当前测试成功推断为长期稳定保证。

0.1.10：61项单元测试通过。气泡复制在真实 Windows 剪贴板与 Chrome Web 生产构建验证，涵盖短句、长代码/空行/缩进、原版施肥台词、英文、Enter激活、三种窗口尺寸及历史遮挡；浏览器剪贴板拒绝显示错误且游戏保持。实际有道语音回归额外验证完整重播不增加服务请求次数；单元测试覆盖缓存上限、清空、迟到结果及共享音色上传的取消竞态。LLM 均为本地模拟，应用 profile 独立。证据 private/reports/bubble-copy 与 private/reports/youdao-voice；后续复制错误提示本地化的最终安装复测以 bubble-copy/installed.json 为准。说明见[0.1.10更新](bubble-copy-0.1.10.md)。

0.1.10最终安装复测已通过：NSIS退出0，安装归档与构建一致，复制全文/原版台词/英文/键盘/多窗口尺寸通过，并在原生剪贴板故障注入后确认本地化错误可见、无页面异常。语音回归在最后仅调整复制错误提示前通过，语音实现未再改动。冻结安装包与报告在 private/releases/personal/v0.1.10，安装包145959861字节，SHA-256 45f419799d862c8b59b0d82b56d574baeb10f550c4050d8b910e633d4cb59803。

0.1.11木质输入栏：61项单元测试、TypeScript/构建、包内与实际安装程序的多尺寸布局/发送取消/记录/中英文/旧资源缓存模拟升级均通过，升级前后游戏记录一致。Chrome生产Web导入/复制/拒绝权限回归通过。NSIS安装退出0，归档哈希及图标/快捷方式正确；正常用户配置下确认新贴图就绪并仅截图空草稿的输入栏，未检查用户聊天或凭据。报告 private/reports/wood-input，冻结安装包 private/releases/personal/v0.1.11。材质来自原版素材组合，不能把不同纹理误报为与用户参考图逐像素一致；具体映射见[0.1.11说明](wood-input-0.1.11.md)。本次未改变语音服务适配器，未重复宣称新的真实模型验收。

0.1.12为CSS按钮贴图拼接修正：构建及多窗口尺寸运行回归通过，放大实际截图确认“记”字位置背景色竖缝消失。NSIS安装退出0，安装归档与构建相同；正常用户配置已运行确认0.1.12并截图底栏。未新增或重复运行无关逻辑单元测试。证据与安装包冻结于 private/releases/personal/v0.1.12。
`n0.1.13：回复语音总开关已完成包内及实际安装版回归，64项单元测试通过。隔离配置使用本地流式模型和随包合成参考WAV，实际HTML音频关闭立即暂停、迟到结果不播放、关闭不请求语音、重新开启后后续回复朗读、刷新持久化、手动试听拦截、中英文/键盘、录音设置保持均通过；未调用外部服务或读取用户聊天/凭据。四按钮多窗口布局、发送取消、记录和旧资源缓存升级通过。NSIS退出0、安装归档一致、快捷方式和透明图标检查通过；正常用户配置确认0.1.13及四按钮显示。证据 private/reports/voice-toggle、private/reports/wood-input，详见 [语音开关说明](voice-toggle-0.1.13.md)。

0.1.14：全新配置默认关闭语音，缺少开关字段的旧配置默认关闭，明确保存的开关值保持。64项单元测试及TypeScript/个人版构建通过；包内和NSIS安装后的独立配置实测确认首次默认关闭、不发语音请求、开启后朗读、播放中关闭立即停止、刷新保持和中英文切换，测试音频及模型均为本地夹具。安装退出0、归档一致、图标及快捷方式正确。证据冻结于 private/releases/personal/v0.1.14。
