# 原版素材映射与导入审计

**更新：已从用户Steam GOTY 1.2.0.1096提取3198项并复核哈希。** 已解析树/云/肥料的41个图片引用，取得字体/商店/对白和声音原文件；实际路径、转换效果与限制见[本地实证报告](local-goty-audit.md)。完整逐资源状态在private/reports/resource-audit.json，公开摘要在research/local-goty-summary.json。视觉与声画验收仍未完成。

下表保留首轮公开研究的候选定位方式，不把尚未完成的商店/彩蛋依赖闭包称为已验收。research/asset-candidates.json同样保留为初始候选记录；以本地审计结果为最新状态。

| 名称/ID | 候选原路径或定位方式 | 类型/用途 | 转换目标 | 后续验证 |
|---|---|---|---|---|
| main.pak | 安装根目录/main.pak | 容器 | 只读目录、私有提取、哈希 manifest | EXE/发行来源共同确认版本 |
| ResourceManifest | properties/resources.xml；外置覆盖也审计 | XML，资源 ID→路径、字体等 | 类型化资源索引 | Defaults、前缀、子目录、alpha、行列参数 |
| TreeOfWisdom | reanim/TreeOfWisdom.reanim；候选 compiled/reanim/TreeOfWisdom.reanim.compiled | 主场景动画，含前缀分组 | 无损 Reanim IR | 段 1…51、每帧全部变换和引用 |
| TreeOfWisdomClouds | 同名 reanim/compiled 候选 | 云动画 | IR、纹理闭包 | Cloud1…6、速度/随机等待 |
| TreeFood | reanim/TreeFood.reanim；候选 compiled/reanim/TreeFood.reanim.compiled | 独立施肥动画 | IR | 结束事件、默认速率、图像依赖 |
| bg/tree/grass/overlay/leaf/bunch 引用 | 由主动画 image 字段递归查资源 | 背景、树干、树冠、草地等部件 | 原图/无损 RGBA | 不猜贴图名，不从截图拆取 |
| IMAGE_TREEFOOD | resources.xml 中查 ID | 肥料工具/商品图 | 原图及 alpha | 与 TreeFood 动画不同用途 |
| IMAGE_STORE_SPEECHBUBBLE2 | resources.xml 中查 ID | 智慧树白气泡 | 原图/布局边界 | 边框、真实宽高、文字区域 |
| IMAGE_STORE_BACKGROUND / BACKGROUNDNIGHT | 资源 ID→实际文件 | 商店背景 | 原图 | 日夜条件是否属于目标 GOTY |
| IMAGE_STORE_CAR / CARCLOSED 及夜间项 | 同上 | 车及商店构图 | 原图 | 遮挡顺序、原场景位置 |
| IMAGE_STORE_SIGN、TREEOFWISDOMICON | 同上 | 售价牌、商品图 | 原图 | 树肥商品定位与价格显示 |
| IMAGE_STORE_MAINMENUBUTTON*、NEXTBUTTON*、PREVBUTTON* | 同上 | 按钮各状态 | 原图与 hit rect | 禁用、高亮、按下/点击音 |
| Crazy Dave 及购买确认依赖 | StoreScreen 引用再闭包 | 动画、图像、字符串、音效 | IR/原图/文本 | 不能仅有背景就称商店复刻 |
| FONT_BRIANNETOD16 | manifest→data 字体描述与字图 | 智慧树正文 | 字形/多层/kerning IR，可评估 BMFont | 原语言编码、中文覆盖、逐字测量 |
| FONT_HOUSEOFTERROR16 | 同上 | 高度、数量等 | 同上 | 描边、ascent、对齐、数字宽度 |
| TREE_OF_WISDOM_*、TREE_OF_WISDOM_HIEGHT | 候选 properties/LawnStrings.txt，按实际加载规则确认 | 固定对白、插值模板 | 私有键值库及来源/编码 | 全文、漏键、里程碑/空闲索引 |
| STORE_*、CANT_USE_CODE 等 | 同一实际字符串库 | 商店/隐藏指令反馈 | 私有键值库 | 多语言，不让 LLM 编写 |
| SOUND_FERTILIZER / SOUND_PLANTGROW | resources.xml 定位实际 sounds 文件 | 施肥/成长音效 | 原格式或本地 PCM/OGG | 时长、增益、音高、触发 tick |
| 商店购买/拒绝、SUKHBIR 等 | 代码→Foley→manifest | 音效 | 同上 | 不能凭文件名挑相似声音 |
| Zen Garden 音乐 | 实际 MUSIC_TUNE_ZEN_GARDEN 播放路径 | 可能 MO3 模块及外部依赖 | 审计后本地转换 | 循环、节拍段、依赖许可 |
| compiled/particles/*、particles/* | 从实际调用与引用筛选 | 施肥/彩蛋相关粒子、trail | 无损参数 IR+专用播放 | 不把所有粒子盲转近似场景 |
| future/mustache/trickedout/dance/daisies/pinata | Board、Zombie、LawnMower 等代码与资源闭包 | 独立演示场景依赖 | 原 Reanim、贴图、音效、粒子 | 分别审计，不下载别人整包素材 |

## 每项实际导入后必须填写

```text
resourceId, originalContainerSha256, originalPath, origin(pak/loose), byteSize,
sourceSha256, type, purpose, versionEvidenceId, language, extracted,
conversionRequired, converterVersion, converterOptions, convertedPath,
convertedSha256, conversionWarnings, observedResult, gotyMatch,
needsFurtherVerification, evidenceIds, redistributionPolicy
```

`extracted=false` 与 `gotyMatch=unverified` 不能被“脚本退出 0”自动提升。转换元数据带原路径及哈希，可回溯全部正式素材；禁止混入来源不明贴图。没有资源时明确缺失 ID、依赖和阻止的功能；不生成替代美术。

本轮不写固定“必须 3198 个文件”或“必须 143 个 reanim”规则，不把本地化偏移目录名自动套到所有 GOTY。不同发行版清单需逐一建立可信签名/证据。

0.1.11新增输入栏是原版图像的派生组合，映射与处理记录见[木质输入栏](wood-input-0.1.11.md)，不能当作原版整张 UI 贴图。
