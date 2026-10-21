# 默认免费语音：候选验证记录

更新：2026-10-21。本文件前半记录候选研究；用户随后接受 Qwen 两个人声，已进入 0.1.7 集成。当前交付状态以 growth-voice-0.1.7.md 和实际验收记录为准。用户已明确否决 Kokoro 两个试听，不能将它们作为已验收的默认声音。

## 目标和门槛

安装时携带推理程序、所需运行库、模型和许可，不依赖目标机器的系统音色、Python、Node、显卡或用户另行申请语音密钥。普通 Windows 10/11 x64 的 CPU 路径必须验证；“任何电脑”不能被当作无限硬件兼容或任意延迟保证。音质先听测，再决定默认；模型大小、耗时和内存必须实际记录。付费云服务保留独立适配器。

## 已否决：Kokoro v1.1 中文

- 原模型：https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh （Apache-2.0）。
- 量化转换：https://k2-fsa.github.io/sherpa/onnx/tts/pretrained_models/kokoro.html。
- ONNX Runtime CPU 直接推理已生成 zm_010、zm_011 试听；用户反馈“两個都不够自然”。停止默认集成，不以调整语速冒充换模型。
- 私有验证前端只有词典最长匹配，不具备完整中文规范化和多音字处理，不能直接作为生产中文前端。
- sherpa-onnx-node 1.13.8 的预编译 TTS 包含 eSpeak/Piper GPL 依赖；不能仅凭顶层 Apache 标签称整个包可按 Apache 分发。该依赖已卸载。

## 候选：Qwen3-TTS 1.7B CustomVoice

- 官方模型/用法：https://github.com/QwenLM/Qwen3-TTS （Apache-2.0）。
- CPU C++ 实现：https://github.com/Danmoreng/qwen3-tts.cpp （MIT）；检出 16bb5afcd06311031c72a8488f8d59660dc2fb46。
- GGML 子模块：af97976c7810cdabb1863172f31c432dab767de7（MIT）。
- 第三方转换权重：https://huggingface.co/Serveurperso/Qwen3-TTS-GGUF 。以官方模型能力为基准，不直接采信转换卡中颠倒的 Base/CustomVoice 用途表。
- 下载 1.7B CustomVoice Q4_K_M（1182631296 字节，SHA-256 cc328834a631bc08bf9f43e62fa23f8a1383d9b429864ce6690cfb172077fc4a）和 tokenizer Q8_0（291150624 字节，SHA-256 1883beeed99348fc35e23dd225e9082f93f6f8c109330a33d935baa8acdbfd94）。均核对仓库 LFS 内容散列。
- 编译工具：llvm-mingw 20261006 官方发布，SHA-256 317492c456aa27ee607a5919f1d2d38dcdc1112516a24d0bf4b00d078f52d17a，CMake 3.31.10、Ninja 1.13.0。审查构建脚本、CMake 执行项和 CLI 入口后，在私有目录编译，未执行来源不明的语音工具。
- 私有构建改 build.ps1 增加 PortableClang、CMake 去除 march=native；第一版关闭 native/AVX/AVX2/FMA/F16C/SSE4.2/OpenMP，基线 x86-64 CPU、无 CUDA。构建检查发现 CMAKE_SYSTEM_PROCESSOR 为空，实际采用 GGML_CPU_GENERIC；第一次命名 avx2 的构建也未生效，不得把其性能记为 AVX2。随后另建 build-simd 显式指定 AMD64 和 AVX2/FMA/F16C，并从编译命令确认。这些路径不等于已测所有 CPU。
- CLI 直接依赖本目录 libc++.dll、libunwind.dll 和 Windows UCRT/系统 DLL，未发现依赖 Python、SAPI 或 CUDA。分发前仍需完整依赖许可清单与干净 Windows 验证，不能将开发机执行等同全平台安装验收。
- 中文参数经 Windows 宽字符命令行转 UTF-8；试听使用内置 Uncle_Fu / Dylan，不克隆真人。测试文本、风格指令、seed、线程数和完整耗时见 private/reports/neural-voice/qwen-probe.json，日志、WAV 同目录。运行脚本 private/neural-voice/probe-qwen.py。

本机 Ryzen 9 5900HX 实测（4 线程、模型加载后一次整段生成、无 GPU；非其他机器性能承诺）：

| 构建 | 人声 | 音频时长 | 进程总耗时 | 结果 |
| --- | --- | --- | --- | --- |
| GGML_CPU_GENERIC | Uncle_Fu | 7.20 秒 | 74.12 秒 | WAV 非静音、未削波 |
| GGML_CPU_GENERIC | Dylan | 6.88 秒 | 85.39 秒 | WAV 非静音、未削波 |
| AMD64 AVX2/FMA/F16C | Uncle_Fu | 7.20 秒 | 13.38 秒 | 生成 5.58 秒、解码 6.45 秒；WAV 非静音、未削波 |

优化证据 private/reports/neural-voice/qwen-probe-simd.json、qwen-uncle_fu-simd.log 与编译命令。程序打印的 TTFA 是“首帧语音码生成”，不是扬声器开始出声；本次整段 WAV 测试不能据此宣称 0.54 秒首声。第一次误命名 avx2 的记录保留，实际仍是通用构建，约 75 秒，排除在优化结论外。音质是否达到用户要求仍待听测。

## 离线语音输入初测

Whisper tiny q8，onnx-community/whisper-tiny 修订 ff4177021cc41f7db950912b73ea4fdf7d01d8e7，约 45 MB；Transformers.js 4.3.1，禁用远程模型。实际 CPU 加载约 0.89 秒，约 7 秒合成录音识别约 0.96 秒，本进程 RSS 约 542 MB。只测试了程序生成的录音，无真人麦克风准确率结论；“智慧树”等词识别错误，因此不标准确率通过。录音始终先转为可编辑草稿，再由用户发送。模型许可证需保留 OpenAI Whisper 原始 MIT 及转换来源。

## 尚未通过

Qwen 音质用户听测、长文本分句连续播放、首句延迟、暂停/取消、游戏音效抢占、低内存恢复、CPU 性能优化、完整模型/运行库许可打包、独立安装且无系统中文语音环境验证，以及 Web 端不同运行能力。上述项目完成前不将模型设为已交付默认功能。

后续：用户已接受 Qwen 年轻/沉稳试听，并要求按树木大小切换。0.1.7 以50英尺为新增应用语音切换点。此为新增功能，不属于原版 GOTY 机制。另增加 UTF-8 进程 manifest，实测中文可执行文件目录、模型目录、临时音频目录均可运行。
