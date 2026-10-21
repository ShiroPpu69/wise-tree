# 实际技术架构

更新2026-10-20。采用 TypeScript + React + Vite + PixiJS + Electron。真实 Reanim 采样/具名段、41图片闭包、XML/compiled一致性、Pixi研究播放和原版关键高度已验证，未发现需要更换引擎的具体障碍。Godot仅做过固定版本转换器实验，没有引擎实测或公平性能比较，不能宣称不适用。完整视觉验收仍见[当前状态](implementation-status.md)。

```text
apps/web/                  React输入、设置、历史；Vite入口、离线SW
apps/desktop/              Electron主进程、preload；加载相同Web构建
apps/dev-harness/          单独Vite入口/数据库；不进入产品构建
packages/game-core/        纯状态机、经济/账本、购买、施肥、解锁
packages/reanim-core/      IR/采样、矩阵、段/时间、树云状态机
packages/asset-pipeline/   本地PAK/compiled/XML/图像/字体/音频转换
packages/renderer-pixi/    800×600原版场景/商店、气泡与交互
packages/font-core/        字素、真实宽度断行、分页
packages/ai-core/          Provider配置与兼容Adapter、SSE/usage/上下文
packages/voice-core/       独立TTS/STT/录音/单路播放
packages/easter-core/      七指令识别和门槛
packages/particle-core/    独立彩蛋所需粒子数据子集
packages/storage-core/     IndexedDB事务、存档、历史/记忆
packages/platform-browser/桌面IPC到FetchTransport适配，Web直接fetch
research/、tools/           锁定来源、只读审计、受保护研究档工具
private/                  原版及转换物、截图、报告、安装包；不提交
```

经济与游戏共用一个纯 reducer，记忆管理暂在ChatControls中使用独立存储键，不为目录形式拆出空模块。两平台执行同一规则、相同资源IR和渲染器，不分别写两套游戏。

800×600画布整体等比缩放；逻辑坐标反算。树的原始比例与裁切由实际Reanim数据决定，高度不触发镜头缩放。React仅承担输入法、设置与可访问文本编辑。新增UI使用原包dialog九宫格/按钮/木牌；中文扩展字体不足有明确记录。气泡后台持续接收流，前台用字素逐字显示；按真实测量宽度和行高分页。固定施肥对白优先；不渲染模型HTML。

Web仅访问用户选择的main.pak，转换存入IDB；生产SW只预缓存自身JS/CSS/HTML，不缓存API响应，原版媒体只在本地IDB。CORS不绕过，不连接默认代理。

Electron sandbox/contextIsolation 开启、nodeIntegration关闭，CSP禁止eval；Pixi使用其静态无eval替代代码。只允许本地页面使用configure/start/cancel/chunk及受限本地systemSpeech能力；主进程限定作用域、端点、方法、大小、来源，拒绝重定向与外部导航。API Key由Windows safeStorage/DPAPI加密；没有renderer取Key接口。Web Key仅内存。[Electron安全文档](https://www.electronjs.org/docs/latest/tutorial/security)、[safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage)。

公开发行产物只有dist/web、desktop自研代码和合法依赖；素材、研究源码、开发入口和测试数据不进入公开安装包。用户明确改为安装后无需导入，因此另设本地个人构建：prepare_personal_release.mjs验证本机GOTY包SHA后生成private配置，extraResources仅加入goty/main.pak，extraMetadata标记bundledAssets。主进程只读固定包内路径，通过受限IPC返回资源字节；沿用原有解析和IDB缓存，不另写游戏逻辑，不读取运行时原游戏安装目录。资源缺失/不兼容自动重建，个人包缺失资源提示重新安装；仅无内置资源的公开包/Web保留手动导入。个人包和所有派生物仅在private，不能公开上传。所有性能结论限于记录的环境，见验证文档。

Windows默认朗读通过主进程固定的System.Speech适配脚本生成临时WAV，JSON通过标准输入传递，用户文本只作为转义后的语音内容；不拼接命令，不修改执行策略，不向renderer开放shell。限时、限长、可取消，临时文件最终删除。打包包含自研windows-tts.ps1；不是下载未知工具。
