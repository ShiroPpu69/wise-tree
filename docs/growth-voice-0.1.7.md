# 0.1.7 成长语音

用户已接受 Qwen3-TTS 年轻和沉稳两个人声，并指定幼树年轻、长大后沉稳。新增应用规则：1–49 英尺使用 Dylan，50 英尺及以上使用 Uncle_Fu。50 是本应用切换点，不是原版 GOTY 的语音事实；不影响高度、树肥、金币、动画和视角。设置 → 语音 → 智慧树音色可选随成长、固定年轻、固定沉稳。

默认朗读采用本地 Qwen3-TTS 1.7B CustomVoice Q4_K_M + 12Hz tokenizer Q8_0。模型约 1.47 GB，随安装包包含，首次运行不联网下载。无语音账户、Key 或云端语音费用，不要求用户安装 Python、Node、CUDA 或系统中文音色。Electron 自带运行环境；语音合成使用独立 C++ CPU 子进程。系统朗读和自定义服务仍可选。自定义服务、关闭自动朗读/输入等偏好保留；旧系统默认音色一次迁移为新的成长音色。普通聊天模型计费规则不变。

Windows x64 提供通用 CPU 和 AVX2/FMA/F16C 两个程序；基线探测程序检测 CPU/操作系统支持后选择，缺失能力时走较慢的通用路径。嵌入 UTF-8 进程清单处理中文模型/临时路径（依据：https://learn.microsoft.com/en-us/windows/apps/design/globalizing/use-utf8-code-page）。建议 Windows 10 22H2 / Windows 11 x64，8 GB 及以上内存、足够的安装/解压空间；不承诺所有硬件同一速度。本机 Ryzen 9 5900HX、4线程、纯CPU：约5.3–5.6秒语音需要约8–9秒合成；较慢通用实现可能等待较长。未完成干净虚拟机与其他CPU型号验证。Web 端尚不能直接运行此本地 C++ 模型，需要手动选系统/自定义语音，不将 Windows 方案宣传为浏览器已具备相同音色。

## 播放和安全

长回复按句分段，首段更短，上一段结束后才合成/播放下一段，限制单次模型内存和可取消范围；代码块和链接不朗读。当前尚未使用声学流式首声输出，不能将首帧语音码耗时当作实际首声延迟。音色按回复朗读开始时的高度确定，避免同一条回复中突变。

暂停在合成期间与段间保持，继续恢复，停止取消子进程/播放；新回复、施肥、关闭窗口也取消旧任务。合成在游戏渲染进程外运行，失败提示但文字/游戏可继续。语音没有用量奖励，不调用聊天接口。IPC 限制来源窗口、frame、请求号、文本长度、音色枚举与语言，渲染进程不能指定程序、模型路径、输出路径或启动参数；主进程固定模型/程序/随机临时目录，限制输出尺寸和超时，串行处理并清理临时音频。

## 可复现构建和许可

研究下载散列、来源与代码修订见 neural-voice-research.md 和 private/neural-voice/research/qwen-downloads.json。源码固定 Qwen C++ 16bb5afcd06311031c72a8488f8d59660dc2fb46、GGML af97976c7810cdabb1863172f31c432dab767de7；llvm-mingw 20261006 工具链散列已核对发布记录。构建补丁、UTF-8清单和入口位于 tools/voice-runtime/，运行 build.ps1 生成两个CPU程序和探测器，再运行 tools/prepare_neural_voice.mjs 校验模型散列、整理程序/依赖/完整许可证与 manifest.json，最后打包。研究模型/工具均在 private/，不提交模型或游戏资源。

Qwen 模型 Apache-2.0、C++/GGML MIT、libc++/libunwind LLVM Apache-2.0 with LLVM Exceptions。完整文本和来源放在安装目录 resources/neural-voice/licenses/ 与 NOTICE.txt。没有分发此前否决的 Kokoro、eSpeak 或 Piper；研究用 Transformers/ONNX 仅为开发依赖，不进入语音安装运行链路。公开构建可包含此开源语音资源，仍不包含 GOTY 游戏素材；本机个人包继续包含已审计游戏资源，不公开发布。

## 验收记录

46项单元测试通过：包含49/50边界、1000后仍沉稳、手动音色、配置迁移、分句顺序、等待音频结束、暂停跨段保持和取消后不播放；原经济/施肥/AI协议测试保留。

tests/neural-voice-native.mjs：真实两个人声CPU合成、PATH仅保留Windows System32、WAV非静音且未削波、非法输入拒绝、真实合成取消/临时文件清理；中文程序、模型、临时目录合成通过。

tests/growth-voice-desktop.mjs：独立测试存档49英尺→真实树肥点击→50英尺，库存5→4、金币和用量0；实际模型合成和Chromium播放（测试静音），年轻/沉稳选择与手动保存；中英设置和3种窗口尺寸，滚动内容不接触底部石框/按钮。包体和实际安装的报告分开记录在 private/reports/growth-voice/，没有使用真实服务商凭据或读取用户聊天。

安装包及实际安装最终校验见同目录 release.json、installed.json 和 installed-ui/installation.json。只有这些检查完成后才标为安装验收完成，不能以解包运行替代实际安装结果。

2026-10-21 最终结果：Windows个人安装包1578424970字节，SHA-256 bc6023a57b2165c01d05e358ba2e4fc366fcb28e0b7bd112e6c7258dd0753db4。实际NSIS升级、归档一致性、九档图标、安装目录内13个模型/运行库/许可证文件散列核对通过；实际安装EXE的成长音色播放、49→50施肥、保存、中英设置和三档窗口布局通过；实际安装EXE的本地模拟服务多轮协议/用量与气泡回归通过。仅通过正常语音设置UI把用户当前配置设为neural/auto/自动朗读，未读取聊天、记忆或密钥；应用已退出，可从桌面快捷方式打开。无干净虚拟机/其他CPU型号的兼容性结论。
