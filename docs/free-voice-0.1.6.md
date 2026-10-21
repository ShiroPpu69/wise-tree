# 0.1.6 免费默认语音

用户要求配置无需费用/密钥、默认就能使用的语音。没有注册云账号、没有寻找公共共享Key，也没有向第三方上传录音或借用浏览器在线识别端点。

## 采用方案和本机证据

Windows直接调用系统已安装的System.Speech组件；不分发微软语音模型或复制系统组件。官方接口依据：

- https://learn.microsoft.com/en-us/dotnet/api/system.speech.synthesis.speechsynthesizer.getinstalledvoices?view=netframework-4.8.1
- https://learn.microsoft.com/en-us/dotnet/api/system.speech.recognition.speechrecognitionengine.setinputtowavefile?view=netframework-4.8.1
- https://learn.microsoft.com/en-us/dotnet/api/system.speech.recognition.dictationgrammar?view=netframework-4.8.1

实际powershell.exe合成测试选中Microsoft Huihui Desktop、zh-CN；中文识别器已安装MS-2052-80-DESK，英文MS-1033-80-DESK。System.Speech可用音色与PowerShell版本/安装环境有关，不将本机音色说成所有Windows固定自带。没有额外云语音API费用，没有下载模型费用；聊天LLM仍按用户选定服务商结算。

新默认autoRead=true/systemEnabled=true/ttsMode=system/inputEnabled=true/sttMode=system。旧版未配置模型的默认语音设置在IDB事务内一次迁移；setupVersion=2之后用户主动关闭会保留，不反复打开。已配置自定义语音服务的选择保留。语音页增加识别方式、试听语音，系统模式隐藏无需填写的云参数/密钥框。TTS音色按文本中英文与本机可用音色选择，低音调SSML仅作为偏好；不宣传为离线固定角色音色。

## 录音和边界

只在用户点击“说话”后请求麦克风；点击“结束录音”，MediaRecorder音频本机解码/混为单声道/重采样到16kHz，编码PCM16 WAV。最长60秒，原录音最多20MB；系统识别IPC仅接受固定44字节头的单声道16kHz/16bit PCM、最多1920044字节，校验数值、ID、语言、发送窗口及frame URL；渲染端不能指定文件路径或脚本。

主进程创建固定临时文件路径，以JSON标准输入调用自有windows-stt.ps1；没有拼接用户命令。本地引擎加载自由听写语法。超时90秒，取消/窗口销毁终止本次进程，finally删除临时WAV。返回识别结果仅放入可编辑草稿，绝不自动发送LLM；识别中按钮禁用防止重入。自定义STT继续独立通过受限网络适配器调用。

浏览器版使用可用的本地系统朗读；没有Windows IPC时不把在线浏览器识别冒充离线，免费本地输入按钮禁用并说明需桌面版或配置自定义识别。尚未捆绑Whisper等浏览器模型。

## 验证与实际限制

42项单元测试通过；自定义语音协议/失败降级、施肥对白优先级、中英设置与四尺寸布局回归通过。

private/reports/free-voice/native.json记录真正系统TTS→真正离线识别；测试音频是程序合成、不是用户麦克风录音。private/reports/free-voice/installed.json记录包体程序的真实音频播放链路（测试静音）与合成WAV→Chromium模拟麦克风→MediaRecorder→16kHz PCM→受限IPC→真正本地识别→可编辑草稿。未配置模型/密钥，未发送聊天，用量和金币为0。报告scope区分解包运行与实际安装，不能混称。

系统旧版听写准确率有限：测试中“智慧树”被误识别，但“你好今天天气很好”可识别。这不是精度通过，保留草稿确认是必要行为。没有进行真人麦克风/噪声/口音准确率评测，也没有真人音质听测。不同Windows缺少对应语言组件时提示安装系统语音组件或使用自定义服务，不自动上传云端。免费方案适合先用，后续可增加开源本地模型提升识别。

当前发布：个人安装包145774526字节，SHA-256 64ce227945dc0754868f1d134fd28c193e6094dacf66a75cb28b9b1100a72ded。源码/构建与包体校验通过。用户关闭旧副本后实际NSIS升级成功、exit 0、安装归档与当前包体一致，快捷方式与九档图标核对通过。实际安装EXE在独立测试配置中通过本地试听播放、模拟麦克风到真正离线识别到可编辑草稿、零LLM请求/用量、语言保持、五页设置等回归。证据private/reports/free-voice/installed.json及installed-ui。

另按用户明确要求，通过正常用户配置的语音页启用系统朗读/自动朗读/语音输入，选择本机离线识别并关闭自定义TTS，等待“设置已保存”后退出。没有读取用户密钥、聊天或记忆，没有实际录麦克风，也没有调用付费服务。记录只包含语音开关布尔值，不含私人内容：private/reports/free-voice/user-configuration.json。桌面“智慧树”快捷方式指向此安装版本。
