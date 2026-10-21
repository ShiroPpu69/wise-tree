# 动画还原研究与原版验证实验

更新：原版资源解析与重点EXE静态核查已完成，后续已新增原版49→50→51及51重进观察、Pixi研究播放器浏览器检查；完整时序与像素门槛仍待完成，见[实机验证](runtime-verification.md)。最新确证、实际帧号和纠正以[本地实证报告](local-goty-audit.md)为准。下文保留P/S公开代码比较和可复现实验方法；参考实现不能自动当GOTY事实。

## 可追溯的代码入口

P = [Patoke 固定提交 Challenge.cpp](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Challenge.cpp)。S = [stabledecompile 固定提交 Challenge.cpp](https://github.com/InLiothixi/stabledecompile/blob/6d24a221ad641dd9ae8ee8ddd635acd445eadd6f/Lawn/Challenge.cpp)。

| 主题 | P 代码位置 | 观察 |
|---|---|---|
| GetSize | 5328 | 读取当前 challenge record，非根据画面尺寸反算。 |
| Draw | 5334 | 背景→6 个云→tree→grass→overlay/leaf/bunch；鼠标悬停改变 overlay。 |
| 气泡 | 5371–5394 | 高度 `<7` 为 `(400,152)`，`<12` 为 `(395,60)`，否则 `(390,52)`。气泡资源 `IMAGE_STORE_SPEECHBUBBLE2`；正文 rect 相对偏移 `(25,6)`，`233×144`，`FONT_BRIANNETOD16`，居中排版。 |
| 高度标签 | 5397–5414 | 高度至少 50 才画，键名实际写为 `TREE_OF_WISDOM_HIEGHT`（保留原拼写线索），`FONT_HOUSEOFTERROR16`。增长期间数字切换及 bounce 有单独状态。 |
| Init | 5419 | 根位置 `(0.5,0.5)`；组前缀；`SetTruncateDisappearingFrames(nullptr,false)`；`anim_grow clamp(h,1,50)`；静态 `mAnimTime=.99`。 |
| Grow | 5471 | 高度加一；段号 clamp 到 51；once-and-hold，播放率 8；成长状态计数 120。源码旁有 GOTY `0x42FF00` 注释，但注释本身不是二进制匹配证据。 |
| Fertilize | 5493 | 创建工具/TreeFood reanim，坐标 `(340,300)`，扣一袋、FOLEY_FERTILIZER、清 cursor。 |
| GiveWisdom | 5540 | 新高度 100→800、500→900、1000→1000、>1000→1100，否则 clamp(h−1,1,49)。 |
| ToolUpdate | 5592 | 肥料动画 loop count >0 后 Grow，工具销毁。 |
| Update | 5603 | 成长计数结束进入 GiveWisdom；另有空闲 babble/repeat。 |
| Leave | 5662 | 遍历残留工具执行 Grow；OpenStore/NextGarden 先调用 Leave。 |
| HitTest / CanFeed | 5706 / 5730 | 依高度切换 hit rect；刚长高或已有施肥工具时不可再喂。 |

必须以完整文件和函数为解释依据，不能只读某个常量。本轮未证明计数一定对应 100Hz；120 是参考逻辑 tick 数，**不是实测 1.2 秒**。播放率 8 也不是承诺“每次 8 帧”或“8 秒”。

## 特别需要消解的差异

S:5863 的 Init 使用 51 上限、最小高度修正、不同 bg render group、`mIgnoreClipRect=true`，并把 P 中不可达的 `aTreeSize==0` 改成 1。S:5920 加了 INT_MAX 防溢出。派生实现显然做过修改。**不能把 S 的修复解释成 GOTY 的设计，也不能把 P 的可疑分支解释成原版缺陷已证实。**

P 的商店 [StoreScreen.cpp:197](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Widget/StoreScreen.cpp#L197) 用 `>10` 判售罄；S:202 改成 `>=10` 并注释 11 Tree Food Bug。产品遵守用户 10 袋规则，这一选择需记录为明确的安全/产品差异。

## Reanim 播放器必须验证的语义

[Reanimator.cpp](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Sexy.TodLib/Reanimator.cpp) 中：

- `ReanimationLoadDefinition` 一类加载路径填充缺省数据，缺省不是每帧归零。
- `GetFramesForLayer`（972）：具名轨道首个至末个 `f>=0` 的范围。不要依赖“所有 anim_ 轨道一定是段标签”的猜测。
- `GetTransformAtTime`：连续通道插值、图像/帧离散事件、消失帧处理；智慧树显式关闭 truncate，必须测试临界帧。
- `MatrixFromTransform`（577）：两个角度形成一般二维仿射矩阵。候选列向量为 `(sx cos kx, sx sin kx)` 与 `(-sy sin ky, sy cos ky)`，角度转弧度。需同时核查基点、图集 offset 与渲染后续矩阵组合。
- `DrawRenderGroup`、alpha/overlay、前缀分组决定场景排序。帧内轨道次序与跨组次序不可混淆。
- loop、once-and-hold、mAnimTime=.99 与精确最终帧不必然相同，必须取样验证。

`pvz2godot` 可以导出 Node2D/Sprite2D/AnimationPlayer，但其 parser 丢弃 font/text、split_labels 采用启发式、verify 与 converter 共享解析器。verify 通过只证明有限的内部一致性。其离散通道分支主要检查段首键，不能充当完整纹理/显隐真值。

## 49→51 英尺与高树干

初次研究时缺少原资源；现已确认grow50的340帧从tree8切至无冠tree9，grow51复用tree9拉伸回落，详见本地报告。下列计划中的资源帧分析已完成，原版运行对照仍需继续：

1. 列出所有轨道、图片引用、每个 `anim_grow1…51` 首末帧。
2. 不凭启发式删轨道；对 Grow 指定的每个名字直接求范围，检查缺失标签。
3. 导出 49、50、51 每帧的世界矩阵、可见性、图片子帧与包围盒。记录树冠顶端/树干底部的像素轨迹和场景 clip rect。
4. 对比高度 51/100/1001 的“施肥后状态”与“重新进入状态”，专门检验 Init 50/51 差异。
5. 分离静态背景/云随机状态的差异，不能用随机云像素差误判树木变换。

产品保持固定 800×600 逻辑画布，仅整体 letterbox 适配窗口；树冠离开后保留树干，不为聊天改变树的相机或比例。

## 台词、彩蛋与声音

P `GiveWisdom` 提供索引；实际字符串还未提取。`Babble` 与 `SayRepeat` 有按高度/随机数选台词的独立逻辑，需用固定 RNG seed 做可复现测试。固定台词与 AI 消息保留不同类型，AI 不得替代缺失原文。

[LawnApp.cpp:3449](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/LawnApp.cpp#L3449) 为 pinata/dance/daisies 按高度 1000/500/100 判断；[Board.cpp:7864](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Board.cpp#L7864) 的键盘检测对 future/mustache/trickedout/sukhbir 无这三个高度门槛，并有失败提示/声音路径。还观察到 moustache、tricked out 别名。其他场景限制仍需测，不擅自宣称“任何界面可用”。

S [TodFoley.cpp](https://github.com/InLiothixi/stabledecompile/blob/6d24a221ad641dd9ae8ee8ddd635acd445eadd6f/Sexy.TodLib/TodFoley.cpp#L73) 把 FOLEY_PLANTGROW 映射 SOUND_PLANTGROW，FOLEY_FERTILIZER 映射 SOUND_FERTILIZER。真实文件和音高/随机选择仍须追资源 manifest 与音效系统；仅知道符号不等于恢复声音。

## 可复现原版取证流程

1. 备份用户存档到单独实验目录；记录 GOTY 来源、EXE 版本/哈希、PAK 哈希、语言、Windows 版本、硬件加速选项和客户端尺寸。禁止直接改唯一存档。
2. 若需造高树存档，先验证该构建结构/校验；只在离线副本上生成，并记录所有修改。不能复用不同版本的固定偏移或运行陌生修改器。
3. 测试状态：`1,2,5,6,10,20,30,40,49,50,51,99,100,101,500,1000,1001`。过渡额外加入 499、999。每状态录进入后的稳定画面与空闲对白。
4. 每次录制施肥前、选肥料、点击命中、肥料动画结束、长高开始/结束、固定对白出现，记录可重复的帧号与音频时间。录屏建议客户端 800×600、无损 60fps 或更高、系统音频、鼠标可见；录像采样率不等于游戏逻辑 tick 率。
5. 专录 1→2、5→6、49→50、50→51、99→100、499→500、999→1000、1000→1001，核对袋数、数字、对白键和解锁。原版录像与播放器使用相同资源/高度/阶段。
6. 连点施肥、选中后点空地、施肥中打开商店/离开/关闭窗口，检查重入与结算顺序。不得根据当前进度擅自假定崩溃恢复行为。
7. 商店测试：2499/2500 金币、库存 9/10/11 副本、买入反馈、购买音效、缺币/满库存对白。11 是研究副本，只为厘清原版边界；产品上限仍 10。
8. 按高度测七个隐藏指令，记录失败/成功、声音、输入途径。独立演示范围另标，不声称还原了未实现的战斗系统。
9. 视觉记录输出关键点坐标表、透明/混合差异、关键帧对齐和声画偏差；将静态 ≤2 逻辑像素作为目标，未实测填“未测试”。不只用肉眼印象或单一 SSIM 验收。
