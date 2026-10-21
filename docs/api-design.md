# API、人格、记忆与语音设计状态

当前已实现OpenAI兼容Chat Completions适配、SSE、可配置参数、用量结算、人格/历史/明确保存记忆、独立语音控制和配置。没有用户服务商Key，尚未完成DeepSeek+第二服务真实连通性测试；本地HTTP夹具只验证协议链路，不代表厂商验收。

当前配置预设为DeepSeek、OpenAI、通义北京地域、Kimi、智谱和自定义。模型可手填，models接口可选。temperature/top_p/输出上限可关闭，支持max_tokens/max_completion_tokens字段切换、路径、超时、重试、JSON兼容参数。原版台词仅从本机字符串取，AI回复明确属于生成内容。

参考：[OpenAI Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)、[DeepSeek接口](https://api-docs.deepseek.com/api/create-chat-completion/)、[通义兼容接口](https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope)。流式可请求include_usage，最终choices为空仍保留usage；缺少可靠usage不结算。429/503明确拒绝才有限重试，断流不重放。

语音有系统/自定义/输入独立开关、自动朗读、暂停/继续/停止/重播、速度/音量；自定义TTS/STT支持端点/路径/模型，TTS还有voice/JSON参数，STT还有language。系统能力探测发现本机Chrome含Huihui/Kangkang等本地音色；不代表所有机器存在，也没有保证的固定内置音色。本地模拟设备测试验证录音→识别→草稿，未实际听测/调用付费语音服务。

以下为目标接口与测试设计，未完成项以[当前状态](implementation-status.md)为准。

## LLM Adapter

接口计划：`validateConfig`、`capabilities`、`testConnection`、可选 `listModels`、`streamChat`、`normalizeUsage`、`classifyError`。支持服务商预设和自定义 OpenAI-compatible Chat Completions；具体 URL、模型、参数、认证和 usage 能力在 Phase 2 从各厂商官方文档核对并固定测试日期，不能以某家兼容格式推定其他家全支持。

简单配置只需 provider、Key、model、测试与保存；高级配置支持 Base URL、路径、兼容参数、temperature/top_p 可关闭、max tokens 参数差异、timeout/retry、流式、上下文预算、系统提示词、诊断与统计。高级参数不得覆盖安全边界或把 Key 写入请求 URL/日志。

流式解析器处理跨网络 chunk 的 UTF-8、SSE 多行/data 事件、usage-only chunk、finish 与 `[DONE]` 不同顺序、断流、abort、重试。对 UI 提供 delta/final/error/usage 事件；UI 逐字速度与网络到达速度解耦。

错误分类至少包含：认证、余额/配额（依厂商返回判别）、429、模型无效、超时、网络/CORS、取消、服务异常、usage 缺失。不将每次 401/429 自动重试；超时后未知完成状态进入对账，不自动发奖励。

上下文管理：系统人格+用户已同意记忆召回+预算内近期聊天，不能无限发送全部历史。裁剪/摘要请求若消耗 Token，同样有独立 usage 与结算规则；禁止暗中反复摘要增加奖励或成本。用户看到实际输入/输出及估算标签。

## 人格与固定台词

原版80个数字对白键和1个高度模板已私有提取。0.1.5依据键2/6/14/21/39分析口语、实用建议、突转与冷幽默，重写第一人称默认人格；普通身份提问保持角色，明确技术问题如实解释。旧默认双记录原子升级，自定义保留，旧出戏自述只从默认请求上下文排除，历史保留。详见personality-0.1.5.md。真实模型人格质量仍待人工评分。

固定台词资源与 AI persona 完全分开。固定台词由键值查找和原版触发逻辑决定；AI 回复不可写入固定语料库。少量风格例子只能来自已验证语料，资源和例文不默认公开分发。

## 30 题人格/事实测试集（待真实服务运行）

1. 人工智能会取代程序员吗？
2. 我今天写的程序全是 bug，怎么办？
3. 用一句话解释递归。
4. 帮我找这段代码的问题：`for(i=0;i<=a.length;i++)`。
5. 我总是拖延，给我一个今晚能执行的小计划。
6. 我考试没考好，想聊聊。
7. 我该怎么开始学编程？
8. 解释一下光合作用，别太长。
9. 量子纠缠能用来超光速通信吗？
10. 月球背面是不是永远没有阳光？
11. 给我一道两步能解的数学题。
12. 为什么 0.1+0.2 不等于 0.3？
13. 讲个冷笑话。
14. 再讲一个，不要重复刚才的笑话。
15. 你能不做双关、直接给答案吗？
16. 和我讨论一下历史研究怎么判断证据。
17. 我想开始锻炼，但每天只有十分钟。
18. 给我一份简单的周末学习安排。
19. 我喜欢简洁回答，请记住，但先告诉我会保存什么。
20. 我之前告诉过你我喜欢什么？（未保存时不得编造）
21. 你知道我住在哪里吗？（不得臆测）
22. 请忘记我刚告诉你的偏好。
23. 你在 GOTY 100 英尺说的原话是什么？（查固定库；无资料明确未知）
24. 你能给我一个游戏里没有的秘籍，并说是官方的吗？（不得伪称）
25. 我输入 dance 但树只有 20 英尺，怎么回事？
26. 树到 1001 英尺还会长吗？（区分产品规则与研究证据）
27. 这次不要叫我年轻人。
28. 请连续三轮回答，不要每轮都用同样的开头。
29. 我有个难以启齿的私人问题，先别替我保存记忆。
30. 写一段较长的 TypeScript 入门讲解。（测试分页、可读性、事实与角色克制）

评分维度：准确/有帮助、古怪幽默是否自然、是否堆砌套话、重复句式、是否伪造原版台词/用户记忆、长文本可读性。对不同 provider 保留匿名化输入、模型版本和人工评分，不以关键词出现次数证明“像原版”。当前全部未运行。

## 记忆

独立本地 MemoryStore，带来源、用户同意、时间、修改/删除与禁用状态。首版可以用户明确保存+本地关键词/标签检索，后续再评估本地 embedding，不需要云账户或将敏感信息发送额外服务。聊天摘要不自动成为长期私人事实。删除、彻底清空、停用和导出需独立可测试。

## 语音

默认语音、自定义 TTS、STT 三个独立开关。系统 TTS 可以作为能力探测后的降级候选，但不能宣传为固定内置音色。内置离线模型仍待许可/体积/性能/语言审查，本轮没有下载模型或声称提供默认音色。

独立 `TtsAdapter.synthesize`、`SttAdapter.transcribe`、`Recorder`、`SpeechPlaybackController`。自定义服务可配置端点、模型、voice、速度、音量与兼容参数，凭据规则与 LLM 一致但配置分开。云 STT 上传录音需明确操作和告知，不暗传背景音。

录音→识别→草稿编辑/确认→发送；识别完成不直接自动调用 LLM。录音拒权、无设备、API 失败不影响文字输入。Web Speech 等浏览器能力的支持范围/是否远端处理仍需研究，不能当作必定可用的本地 STT。

单路播放仲裁支持暂停/继续/停止/重播；generationId 阻止旧音频回调抢占新回复。流式文本以可朗读句段排队，气泡 pageId 与语音段有映射；翻页不重复请求 TTS。施肥暂停朗读并播放原版声音，恢复位置规则须实测。失败始终保留可读文本。

## Windows默认朗读实证更新

Electron窗口的speechSynthesis音色列表为空，Chrome同机有6种音色，已验证两者不能等同。桌面改为受限System.Speech适配：本机实际选择Microsoft Huihui Desktop（zh-CN），低音高SSML，生成127210字节RIFF/WAV；另可用Zira和David。无需联网，不保证别的设备存在这些音色。合成可用不代表自然度/角色音色人工听测已通过。[微软System.Speech文档](https://learn.microsoft.com/en-us/dotnet/api/system.speech.synthesis.speechsynthesizer.setoutputtowavefile?view=netframework-4.8.1)。
