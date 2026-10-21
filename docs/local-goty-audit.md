# Phase 0 本地 GOTY 实证补充

日期：2026-10-20。对象：用户提供的 `D:\Steam\steamapps\common\Plants Vs Zombies`。**本报告更新并取代先前公开研究中“无本地文件”的状态；下文是早期静态审计，当前已实现开发验收版，完整现状见[状态表](implementation-status.md)。**

以下为本轮较早的静态研究记录：当时未启动游戏、未接触存档。后续已在备份后的独立研究档完成原版运行，新增结论见[实机与播放器验证](runtime-verification.md)。原安装EXE/PAK未编辑，游戏资源未上传。提取、原台词、图像、转换结果、汇编记录和重建预览全部位于 Git 忽略的 `private/`。公开文档只记录路径、哈希、测量和结论。

## A. 本地版本与已确认事实

| 证据 | 本地结果 |
|---|---|
| EXE 文件版本 / 产品版本 | `1.2.0.1096` / `1.2.0.1096` |
| Steam 安装清单 | appid `3590`，名称 Plants vs. Zombies: Game of the Year，buildid `11226`，language `english` |
| 安装自带 readme | Version 1.2.0.1096；Build Date December 15, 2010。保留的原发行日期不能误当构建日期。 |
| EXE 大小 / SHA-256 | 5,296,312 B；`868f8e2bab0d6a7ef8afc4c5960c608eccef82bd086bd6e0c0e2670199a5ca45` |
| main.pak 大小 / SHA-256 | 45,453,180 B；`5878326408285cb01f83b4fa4edcc66d65e727f6d6ee88563b5b3b287dd259fc` |
| PAK 解析 | 3198 条，目录/边界/数据长度通过；已全部提取、逐文件 SHA-256 校验并复核源文件未变 |
| 包外 properties | default.xml、Layout.xml、partner_logo.jpg、partner.xml、partner.xml.sig；未发现包外 resources.xml 或 LawnStrings.txt |

这是针对该本地 Steam GOTY 构建的可追溯证据，不是对所有 GOTY 地区版本的通用签名认证；没有向 Steam 服务器执行“验证文件完整性”，也没有声称已证明整个安装从未修改。

目录分布：reanim 1963 项、images 572、compiled 251、particles 194、sounds 171、data 42、properties 5。完整清单在 `private/reports/local-pak-inventory.json`。每项提取状态、类型、用途/未知范围、哈希、转换状态和待验标记在 `private/reports/resource-audit.json`，共 3198 项；范围外资源明确标“未逐项分类”，不能因此宣称全部内容已研究。

### 动画实测

| 动画 | 包内 compiled 路径 | 文本路径 | FPS / 轨道 / 每轨帧数 | 文本与二进制比较 |
|---|---|---|---|---|
| 主场景 | compiled/reanim/TreeOfWisdom.reanim.compiled | reanim/treeofWisdom.reanim（实际大小写） | 12 / 109 / 354 | 424446 字段，0 差异 |
| 云 | compiled/reanim/TreeOfWisdomClouds.reanim.compiled | reanim/TreeOfWisdomClouds.reanim | 12 / 6 / 625 | 41250 字段，0 差异 |
| 树肥 | compiled/reanim/TreeFood.reanim.compiled | reanim/TreeFood.reanim | 20 / 2 / 31 | 682 字段，0 差异 |

共比较 **466378** 个稀疏浮点/字符串字段，XML 数字先按 float32 量化，逐轨道索引比较（保留同名轨道），全部一致。此结果证明解析与对应资源内容一致，**不等于播放器或原版画面对照已通过**。

主场景确实包含 `anim_start`、`anim_grow1…anim_grow51`，不是猜测出的高度分段。主树 25、云 6、树肥 10，共 **41 个图片 ID**全部解析到本包文件，尺寸与 alpha 配对检查通过。

## B. 实际提取、转换和原资源映射

| 用途 | 实际资源 | 当前结果 |
|---|---|---|
| 原背景 | reanim/tree_bg.jpg，800×600 | 已提取，离线重建可解码 |
| 草地 | reanim/tree_grass.jpg + tree_grass_.png，800×207 | 已配对合成 RGBA，位移来自轨道，不写死美术替代 |
| 幼苗/树形 | reanim/tree01.png、tree1…tree5.png，tree6…tree9.jpg + 各自 _.png | 已提取、解码；树形切换与变换来自真实时间轴 |
| 高树干 | reanim/tree9.jpg + tree9_.png，525×559 | 图像本身是无树冠树干/根部；不是无限长整树图 |
| 根部覆盖 | reanim/tree_overlay4…9 的 PNG 或 JPG+alpha | 已解析，独立 overlay 轨道 |
| 叶片/叶簇 | reanim/leaf1…4.png、leafbunch1…3.png | 已解析；同名轨道必须以索引区分 |
| 云 | reanim/SelectorScreen_Cloud1/2/4/5/6/7.png | 已解析，与 Cloud1…6 段的对应关系见下文 |
| 施肥袋/颗粒 | reanim/TreeFood.png、TreeFood2/3/4.png；ZenGarden_fertilizer_seed1…6.png | 袋 1 轨、颗粒 1 轨；颗粒可见帧 17…29 |
| 肥料工具图 | images/TreeFood.png | 与 Reanim 用的 reanim/TreeFood.png 是不同资源，不能混用 |
| 智慧树气泡 | images/Store_SpeechBubble2.png，280×183 | 真资源存在；文本区域/定位另需原版运行验收 |
| 商店 | images/Store_Background.jpg、Store_Car.jpg+Store_Car_.png、Store_Sign.png、各按钮状态等 | 已提取；完整商店组合、戴夫动画和反馈尚未重建验收 |
| 正文/数字字体 | data/BrianneTod16.txt、_BrianneTod16.png；HouseofTerror16.txt、_HouseofTerror16.png、HouseofTerror16Outline.png | 已检查字形列表与图集存在性；正文 1 层，数字字体 2 层 |
| 固定文字 | properties/LawnStrings.txt | 已私有提取 81 个 TREE_OF_WISDOM_* 键，其中 80 个数字对白键和 1 个高度模板 |
| 施肥/成长声音 | sounds/fertilizer.ogg、sounds/plantgrow.ogg | 头部识别为单声道 Vorbis，44100 Hz；granule 长度约 1.088889s / 1.139274s。未试听或声画对照。 |

真实语料库：`private/reports/goty-resource-analysis/original-tree-dialogue.json`。不会把它放入默认公开发行包，固定原话也不会交给 LLM 补写。

**中文问题已从“可能缺字”升级为已发现限制**：这两个实际字体的 CharList 各有 160 个单字节条目，另有空格宽度配置，没有中文。英文 GOTY 包不能直接呈现任意中文 AI 回复。后续必须另审有来源的中文 GOTY 字体/语言包，或由用户明确选择兼容字体；不能静默替换并宣传原字体还原。

## C. 生长、树冠离屏与对白的实证

### 原版 EXE 静态分析方法

本 EXE 包含外层 PE，以及文件偏移 `0x1A71A2` 处已经存在的另一份完整 PE。只从磁盘读取，使用 pefile 2024.8.26 和 Capstone 5.0.9 做静态解析；没有运行/解密/补丁/附加进程，也没有输出可执行文件。

外层地址不能直接套公开反编译注释。通过内层 `anim_grow%d`、对白键等字符串交叉引用定位，再手动检查控制流。虚拟地址均针对本哈希对应的**内层映像**；不是文件偏移、用户存档偏移或其他版本地址。

| 机制 | 本构建证据 | 已确认内容 / 尚待确认 |
|---|---|---|
| Init | VA 0x430C50；0x430D51…0x430D62 比较 1/50 | 载入段限制到 1…50；播放率常量 18；正常设置动画时间约 .99。首次特殊分支判断是高度段为 1，而非公开 P 代码的不可达 0。 |
| Grow | VA 0x430F60；0x430F84 增高；0x430FA9 比较 51 | 每次高度加一；选择 1…51 段；播放率常量 8；成长状态计数120。没有发现 >1000 禁止增长的该函数分支。 |
| 施肥 | VA 0x4310F0；0x4311ED 扣库存 | 创建 TreeFood（常量位置340,300），扣一袋，清 cursor；Update 在动画 loop count>0 后调用 Grow。 |
| 防重入 | VA 0x431820 | 成长状态拒绝再次喂；存在工具也拒绝。真实鼠标体验和关闭时序仍需运行对照。 |
| 离开场景 | VA 0x431570 | 存在工具则调用 Grow 后销毁；打开商店前先执行离开处理。不是直接丢弃未完成施肥。 |
| GiveWisdom | VA 0x4312C0 | 高度100→键800；500→900；1000→1000；>1000→1100；其余 clamp(h−1,1,49)。 |
| 空闲对白 | VA 0x431210 | 本构建按0…2分支，再选101…110或201…205/301…305/401…405。实际用了5个条目，不能沿用公开P实现的4个。 |
| 气泡 | 0x430987…0x430A1C | `<7` (400,152)、`<12` (395,60)、其余(390,52)；正文233×144，偏移25,6。高度模板开始于>=50的分支。 |
| 里程碑权限 | 0x45BB30、0x45BB50、0x45BB70 | 同一树高字段分别与1000/500/100做>=判断。还需动态确认七指令的完整场景/声音效果。 |
| 树肥上限 | 0x499577…0x499586 | 实际库存先减1000基值，再与10比较，使用setge。**本GOTY是10袋售罄**，不是P代码的>10。 |
| 单价 | GetItemCost 0x49B1A0；商品28跳表项→0x49B1F5 | 返回250内部单位。货币格式函数0x45B6F0用5倍再2倍（0x45B717、0x45B732），显示值×10，故售价2500。 |

汇编与字符串引用记录在 `private/reports/exe-static/`。函数名是按资源引用/控制流归类的研究标签；不将启发式边界或整个反编译库作为自动匹配结果。

### 关键高度段（全局帧从0计，首尾包含）

| 段 | 帧范围 | 帧数 |
|---|---|---|
| start | 0…10 | 11 |
| grow1 / grow2 | 11…18 / 19…29 | 8 / 11 |
| grow5 / grow6 | 44…50 / 51…56 | 7 / 6 |
| grow10 / grow20 | 81…87 / 153…159 | 7 / 7 |
| grow30 / grow40 | 224…230 / 287…290 | 7 / 4 |
| grow49 | 332…334 | 3 |
| grow50 | 335…344 | 10 |
| grow51 | 345…353 | 9 |

这并不代表“每英尺一张图”。真实资源同时使用贴图更替、位移、纵向拉伸、叶片/覆盖层显隐与变换；必须播放逐帧数据。

**49→50 的确切资源变化**：帧332…334是 tree8，位置约(-3.7,-52)、scale=(1,1)；grow50的335…339继续拉伸/上移tree8；340切换到 tree9，位置约(158.7,-89.9)、sy=1.063，然后在344回落到(158.7,-53.4)、sy=1。tree9本身不包含树冠，所以不能再用一张带冠整树缩放来解释这一状态。

**51及之后**：grow51使用同一tree9/overlay9，sy从1涨到1.063再回1；是9帧的树干拉伸回落动作。数值高度仍加一，而Grow段号夹到51；不需要无限增加贴图高度或给相机加zoom。草地在51段另有约(+0.7,-0.3)的资源位移。Init仍夹到50，不能把载入与成长末态强行合一。

正常Init的`.99`也不能直接替换成最终帧：采用参考引擎once-and-hold的N−1间隔采样时，grow50载入是343.91帧，tree9 y约−54.219，最终帧是−53.4。该采样语义尚需对本EXE帧采样函数及运行画面复验，离线重建没有声称达到2px验收。

### 固定对白

100/500/1000英尺的原文键已取得，与daisies/dance/pinata一一对应；>1000的1100键明确仍可继续喂养。原文保存在私有库，未由AI编造。80个数字键含普通技巧、空闲对白与里程碑，不是“80个不同高度的成长提示”。

## D. 转换结果与技术选型更新

`pvz2godot`固定提交的真实素材实验完成：

| 输入 | 生成结果 | 上游数值自校验 |
|---|---|---|
| TreeOfWisdom | 57部件、52动画、25贴图 | errors=[] |
| TreeOfWisdomClouds | 6部件、1动画、6贴图 | errors=[] |
| TreeFood | 2部件、1动画、10贴图 | errors=[] |

仍有两项实测问题：

1. 云原版使用具名 `Cloud1…Cloud6` 各自播放，并非anim_前缀。原资源范围为Cloud6:0…137、Cloud5:138…235、Cloud4:236…348、Cloud3:349…435、Cloud2:436…541、Cloud1:542…624。转换器只生成一个idle段，不能直接满足原版六个实例独立调度。自校验同样返回通过。
2. `font2fnt.parse_font_txt` 固定按GBK且replace处理。对本英文包两字体都返回160项，但各产生68个U+FFFD，只剩93个不同字符。**没有抛错也可能破坏字形映射**；不能直接用该字体转换输出。HouseofTerror16的两层也需要独立保留。

本轮生成34张800×600离线研究重建图（17高度×Init/成长末态）和一张缩略对照图。仅使用真实包内贴图/alpha与时间轴；没有AI绘图、截图抠图或手绘替代。重建未含原版云随机状态、按钮/气泡/数字、悬停混合和完整原渲染器，**不是完整复刻截图或正式界面**。

私有预览：`private/reports/goty-resource-analysis/contact-sheet.png`。上排从左至右1、6、20、40；下排49、50、51（均成长末态）。所有原尺寸图及轨道状态见同目录。

选型建议保持TS/Pixi首选、Godot备选：真实数据证明基础仿射/离散通道可表达，主场景只有25个图片ID；但不能据此承诺帧率。Reanim核心应直接支持任意具名段、同名轨道索引、多层字体和运行时分组，而非依赖现成转换器全部输出。**未安装/运行Pixi或Godot引擎测试，也未据此正式放行渲染选型。**

## E. 测试、开发门槛与复现

新增提取安全测试4项，加原检查器10项，**14/14通过**。另外，3198个提取文件逐一复核、三个XML/compiled一致性比较通过，EXE和PAK结束哈希与开始一致。以上是资源/静态分析验收，不是成长玩法、商店、AI或最终平台验收。

复现命令（Python工具在工作区，输入只读；已存在的提取目录会拒绝覆盖）：

```powershell
python -m unittest discover -s tools -p 'test_*.py' -v
python tools/extract_local_pak.py 'D:\Steam\steamapps\common\Plants Vs Zombies\main.pak' private/extracted/steam-goty-1.2.0.1096
python tools/analyze_local_goty.py private/extracted/steam-goty-1.2.0.1096 --out private/reports/goty-resource-analysis
python tools/inspect_local_exe.py 'D:\Steam\steamapps\common\Plants Vs Zombies\PlantsVsZombies.exe' --out private/reports/exe-static
python tools/probe_local_reference.py private/extracted/steam-goty-1.2.0.1096 --out private/reports/pvz2godot-real-probe
python tools/write_local_audit_summary.py
```

其中资源分析需Pillow12.2.0；PE分析需pefile2024.8.26和私有研究依赖Capstone5.0.9。Capstone来自其公开Python发行包，仅作静态分析；许可证文本留在私有研究依赖目录。转换脚本哈希按锁定清单校验后才导入。没有运行未知发行EXE、ffmpeg或游戏DLL。

门槛更新：版本/包解析/树木原始资源/具名成长段/固定台词的静态研究已有实证。**剩余门槛：原版运行对照、动态声画/关闭与重入行为、完整UI/商店、目标渲染器真实播放和中文方案。**此为早期门槛记录；之后已完成关键原版运行、真实Pixi播放和英文位图字体对照，已支撑共享应用开发。完整声画与视觉验收仍待完成，见当前状态表。

## F. 剩余问题

- 后续已取得49→50→51和重进的原版JPEG截图；仍无连续声画证据，不能宣称所有关键点≤2px、动画时间序列或声音同步通过。详见新增实机验证文档。
- EXE仅核查了表中控制流；七指令的完整调用/声音、购买反馈与戴夫调度、所有粒子未逐项还原。
- 31帧/20fps等是资源元数据；播放实际耗时还取决于引擎更新、loop及暂停，不能直接把它当录像测得时长。
- 英文原字体不能覆盖中文；缺字方案是明确待决项。
- 六朵云需专用具名段调度。字体转换需正确单字节编码映射与层保真。
- 后续已确认原玩家未拥有智慧树，已备份并通过游戏新增独立WISDOMLAB研究档。仅研究档准备了高度/树肥/研究金币；原玩家核心字段未变，游戏已关闭；先前曾恢复原玩家选择，最近研究后未再次确认当前选择。完整存档文件不能声称逐字节未变。

## G. 下一步及最少配合

无需再提供main.pak或EXE，已经成功读取。下一项是按[动画实验方案](animation-research.md)取得同一构建的原版运行证据，首先覆盖1英尺、49→50、50→51及高树重新进入，并记录客户端800×600尺寸、原版音频和操作时间。若只能由用户录制，先提供这几段即可，不必一次准备1000英尺全套材料。

高树状态测试应使用备份副本，不修改唯一正式存档。当前LLM兼容接入已有实现，真实服务验收尚需用户在本机填Key；不要求把Key发到聊天。研究证据仍与应用最终验收分开记录。
