export type Language='zh-CN'|'en';
let language:Language='zh-CN';const listeners=new Set<()=>void>();
export const getLanguage=()=>language;
export function setLanguage(next:Language){language=next;for(const listener of listeners)listener();}
export const subscribeLanguage=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
const entries=`
更新原版界面资源（main.pak）|Update original UI resources (main.pak)
界面资源不属于已审计的GOTY版本|UI assets do not match the audited GOTY version
缺少原版输入栏素材|Missing original input-bar assets
语音朗读开关|Voice playback toggle
语音朗读总开关|Enable voice playback
开启回复朗读|Turn reply speech on
关闭回复朗读|Turn reply speech off
语音开|Voice on
语音关|Voice off
已开启语音朗读|Voice playback enabled
已关闭语音朗读|Voice playback disabled
资源截断|Truncated resource
无效动画变换|Invalid animation transform
资源字符串过长|Resource string is too long
不安全资源路径|Unsafe resource path
资源包超出128MiB限制|Resource package exceeds 128 MiB
不支持的PAK版本|Unsupported PAK version
无效PAK目录|Invalid PAK directory
PAK重复路径或异常长度|Duplicate PAK path or invalid length
PAK含未识别尾部|Unexpected PAK trailing data
动画解压上限|Animation decompression limit exceeded
动画解压长度不符|Animation decompression size mismatch
不支持的PC Reanim|Unsupported PC Reanim format
动画轨道过多|Too many animation tracks
动画步长不符|Animation record size mismatch
动画含未解释数据|Unrecognized animation data
缺少字体列表|Missing font list
字体映射不完整|Incomplete font mapping
字体缺少字图|Missing font atlas
缺少原版资源|Missing original asset
资源XML损坏|Damaged resource XML
透明遮罩尺寸不符|Alpha mask size mismatch
无法解析原版图片|Cannot decode original image
彩蛋粒子定义损坏|Damaged easter egg particle definition
彩蛋粒子图片缺失|Missing easter egg particle image
文本宽度必须为正|Text width must be positive
气泡高度不足一行|Bubble cannot fit one line
无效整数|Invalid integer
存档数值越界|Save value out of range
施肥恢复记录损坏|Damaged feeding recovery record
账本交易号无效或重复|Invalid or duplicate ledger transaction
账本字段损坏|Damaged ledger field
已结算请求损坏|Damaged settled request
交易号无效|Invalid transaction ID
用量来源无效|Invalid usage source
不支持的粒子曲线|Unsupported particle curve
粒子参数无效|Invalid particle parameter
粒子参数未解释|Unrecognized particle parameter
缺少已审计图片|Missing audited image
缺少原版字体|Missing original font
正在录音|Recording in progress
录音超过20MB上限|Recording exceeds the 20 MB limit
输入用量|Input usage
输出用量|Output usage
总用量|Total usage
兑换Token|Exchanged tokens
兑换金币|Exchange coins
已结算总量|Settled total
已结算输入|Settled input
已结算输出|Settled output
账本Token|Ledger tokens
已从本地自动快照恢复存档（事务版本|Restored save from a local snapshot (revision
）。聊天记录未被回滚。|). Conversation history was not rolled back.
智慧树|Tree of Wisdom
高度|Height
英尺 · 树肥|ft · Food
/10 · 金币|/10 · Coins
智慧树设置|Options
常规|General
AI 模型|AI Model
对话与记忆|Conversation & Memory
游戏|Game
语言 / Language|Language / 语言
简体中文|Simplified Chinese
英文|English
显示|Display
全屏 / 窗口|Full screen / Window
游戏音效|Game sound effects
关闭设置|Close options
原版音效|Original sound effects
服务商|Provider
API Key（不要发送到聊天中）|API Key (keep it private)
模型|Model
测试连接|Test connection
获取模型列表（可选）|Fetch models (optional)
专业配置|Advanced
请求路径|Request path
Temperature（留空不发送）|Temperature (blank to omit)
Top P（留空不发送）|Top P (blank to omit)
最大输出Token（留空不发送）|Maximum output tokens (blank to omit)
最大Token字段|Output token field
超时（毫秒）|Timeout (milliseconds)
明确拒绝请求重试次数|Retries after an explicit rejection
携带最近消息数|Recent messages in context
流式回复|Stream replies
请求流式usage|Request streaming usage
兼容参数（JSON）|Compatibility parameters (JSON)
人格系统提示词|Personality system prompt
恢复智慧树人格|Restore default personality
金币、用量与兑换比例|Coins, usage & exchange rate
已记录|Recorded
；已兑换|; exchanged
；待兑换|; pending
。仅可靠服务商usage参与结算。|. Only reliable provider usage earns coins.
兑换所需Token|Tokens per exchange
每次获得金币|Coins per exchange
应用未来兑换比例|Apply future exchange rate
本地长期记忆|Local long-term memory
允许召回（相关记忆将发送到选定模型）|Recall related memories (sent to your selected model)
仅保存你在这里明确填写的信息，不自动记录敏感内容。|Only information you explicitly save is remembered.
想让智慧树记住什么？|What should the tree remember?
明确保存记忆|Save this memory
保存编辑|Save edits
清空长期记忆|Clear memories
语音|Voice
启用系统朗读|Enable system speech
启用自定义TTS|Enable custom TTS
自动朗读|Read aloud automatically
朗读方式|Speech source
系统可用音色（设备不同）|System voice (varies by device)
自定义兼容TTS|Custom compatible TTS
语音输入|Voice input
音量|Volume
语速|Speaking rate
暂停朗读|Pause speech
继续朗读|Resume speech
停止朗读|Stop speech
重新朗读|Read reply again
保存设置|Save settings
返回|Back
发送|Send
记录|History
取消|Cancel
说话|Speak
识别|Transcribe
收起|Close history
聊天记录|Conversation history
你|You
复制|Copy
复制气泡全文|Copy full bubble
已复制对话全文|Full dialogue copied
复制失败，请在聊天记录中选择文字后重试。|Copy failed. Select the text in chat history and try again.
当前没有可以复制的对话|No dialogue to copy
复制文本无效或过长|Copy text is invalid or too long
复制失败，请允许浏览器访问剪贴板，或在聊天记录中选择文字复制。|Copy failed. Allow clipboard access in the browser, or select text in chat history.
气泡查看|Read in bubble
明确记住|Remember this
删除|Delete
清空聊天记录|Clear history
对智慧树说…|Talk to the tree…
对智慧树说|Talk to the tree
留空使用此地址已保存的密钥|Leave blank to use the saved key for this address
仅本次页面内存；刷新后重新填写|Kept in memory only; enter again after reloading
设置已保存；密钥由Windows保护存储。|Settings saved. Windows protects your stored key.
设置已保存；API Key只保留在本次页面内存中。|Settings saved. Your key remains in page memory only.
兼容参数需要JSON对象|Compatibility parameters must be a JSON object
请在专用Key框中填写密钥，不要放入兼容参数|Enter credentials in the dedicated key field
请先在API设置中填写模型|Enter a model in Options first
请求超时|Request timed out
服务商未返回可靠usage：回答已保存，本次未发放金币。|No reliable usage returned: reply saved, no coins awarded.
连接测试成功；该次真实用量按相同规则记录。|Connection successful. Usage follows the same settlement rules.
回答已取消；未结算金币|Reply cancelled; no coins awarded
网络请求失败或服务商不允许浏览器CORS。请使用桌面版或您自己的兼容端点。|Network or browser CORS error. Use the desktop app or your own compatible endpoint.
识别结果已放入输入框，请编辑或确认后发送。|Transcription is in your draft. Review or edit it before sending.
已按你的操作保存这条长期记忆，可在设置中修改或删除。|Memory saved at your request. Edit or delete it in Options.
请先取消或等待回答结束，再删除聊天记录|Wait for the reply or cancel it before deleting messages
请先取消或等待回答结束，再清空聊天记录|Wait for the reply or cancel it before clearing history
未来兑换比例已修改，已发放金币不重新计算。|Future exchange rate updated. Previously awarded coins are unchanged.
请等待原版施肥对白结束后再朗读。|Wait for the original feeding dialogue before reading aloud.
请等待原版施肥对白结束后再朗读|Wait for the original feeding dialogue before reading aloud
请先在聊天记录中选择气泡查看，再朗读这条回复|Choose a message in history before reading that reply
正在读取本地存档…|Loading local save…
正在准备原版智慧树…首次启动可能需要几秒。|Preparing the original tree… First launch may take a few seconds.
启动未完成，请检查下方错误提示。|Startup failed. See the error below.
启动未完成；请重试，存档损坏时可导入备份恢复。|Startup incomplete. Retry, or restore a backup if the save is damaged.
重试启动|Retry startup
资源缓存不完整或版本不兼容，请重新导入main.pak；游戏存档将保留。|Asset cache is incomplete or incompatible. Reimport main.pak; your save is preserved.
购买成功：树肥 +1，金币 −2500|Purchased: +1 tree food, −2500 coins
原版资源已保存到本地，后续启动可直接加载。|Original assets saved locally for future launches.
请先等待施肥结束，或取消当前回答后再导入存档|Wait for feeding or cancel the reply before importing a save
存档文件过大|Save file is too large
存档已恢复|Save restored
原版资源导入|Original asset import
选择你拥有的英文 Steam GOTY 1.2.0.1096 的 main.pak。程序仅在本机提取和转换，不上传资源。|Select your English Steam GOTY 1.2.0.1096 main.pak. Extraction stays on your device.
当前启动工具尚未载入游戏美术。其他发行版需要先进行兼容性审计。|Game artwork is not loaded. Other editions require a compatibility audit.
选择 main.pak|Select main.pak
离线原版功能：选择左上角树肥，再点击树木施肥；右上角 SHOP 购买树肥。|Select tree food at the upper left, then feed the tree. Buy more in SHOP.
下方输入区提供AI对话与独立设置；本版本仍在开发验收中。|Use the input below to chat. This is a development trial.
导出存档（不含密钥或资源）|Export save (no keys or assets)
导入存档|Import save
回到智慧树|Back to the tree
从备份恢复存档|Restore save backup
关闭|Close
智谱|Zhipu
通义千问（北京地域）|Qwen (Beijing)
其他 OpenAI 兼容接口|Other OpenAI-compatible API
API Key 无效或无权访问|Invalid API key or access denied
服务商余额不足|Insufficient provider balance
服务商拒绝访问|Provider denied access
模型或请求路径不存在|Model or request path not found
请求过于频繁或配额不足|Rate limit or quota exceeded
API请求失败（HTTP|API request failed (HTTP
API没有返回响应内容|API returned an empty response
API响应超过8MB上限|API response exceeds the 8 MB limit
API返回无效JSON|API returned invalid JSON
API返回错误；请检查模型、权限和兼容参数|API error: check model, permissions and parameters
响应流中断；本次不结算金币|Response stream interrupted; no coins awarded
回答过长，已中止|Reply too long; stopped
模型未返回文本内容|Model returned no text
模型流返回无效JSON|Model stream returned invalid JSON
模型流返回错误|Model stream returned an error
浏览器未提供流式响应|Browser cannot provide a streaming response
服务商不支持模型列表或权限不足，可手动填写模型|Model listing unavailable; enter a model manually
API地址无效|Invalid API address
远程API地址需要HTTPS|Remote API addresses require HTTPS
请求路径必须位于当前API地址下|Request path must stay under the configured API base
密钥只能填写到专用Key框|Only enter credentials in dedicated key fields
配置嵌套过深|Configuration is nested too deeply
兼容参数格式无效|Invalid compatibility parameters
API设置格式无效|Invalid API configuration
API设置字段无效|Invalid API field
API超时、重试或上下文数值无效|Invalid timeout, retry or context value
API采样或输出参数无效|Invalid sampling or output parameter
请填写模型名称|Enter a model name
流事件过大|Stream event is too large
没有树肥，请到商店购买|No tree food. Buy some in the shop.
树肥库存已满（10袋）|Tree food inventory is full (10 bags)
金币不足：每袋树肥需要2500金币|Not enough coins: tree food costs 2500 coins
请等待本次成长结束|Wait for the tree to finish growing
兑换比例必须为正整数|Exchange values must be positive integers
高度已超出安全整数范围|Height exceeds the safe integer range
本地存储升级被旧窗口占用，请关闭其他智慧树窗口后重新加载。|Close other tree windows, then reload to upgrade local storage.
存档损坏，且没有有效的本地自动快照；原数据已保留，请导入备份恢复|Save damaged with no valid local snapshot. Original data preserved; import a backup.
不支持或损坏的存档|Unsupported or damaged save
存档校验不符|Save checksum mismatch
不支持的存档版本|Unsupported save version
存档格式无效|Invalid save format
聊天或记忆数据无效|Invalid conversation or memory data
存储事务已中止|Storage transaction aborted
语音设置无效或包含密钥|Invalid voice settings or embedded credentials
麦克风权限被拒绝，可在系统或浏览器设置中允许；文字聊天仍可使用|Microphone permission denied. Enable it in system or browser settings; text chat still works.
浏览器不支持录音，请使用HTTPS或桌面版|Recording unavailable. Use HTTPS or the desktop app.
语音输入未开启|Voice input is disabled
请先配置STT模型；当前未内置本地识别模型|Configure an STT model first; no local recognizer is bundled
没有正在进行的录音|No recording in progress
录音失败|Recording failed
语音识别服务不可用（HTTP|Speech recognition unavailable (HTTP
STT服务没有返回识别文字|STT returned no transcript
系统朗读已关闭|System speech is disabled
自定义TTS已关闭|Custom TTS is disabled
当前环境不支持系统朗读，文字聊天仍可使用|System speech unavailable; text chat still works
设备没有可用本地系统音色，请配置自定义TTS|No local system voice available; configure custom TTS
系统朗读失败，文字仍可使用|System speech failed; text remains available
语音文件无法播放，文字仍可使用|Audio playback failed; text remains available
TTS服务不可用（HTTP|TTS unavailable (HTTP
TTS兼容参数需要JSON对象|TTS parameters must be a JSON object
语音服务地址或路径无效|Invalid voice service address or path
语音开关、音量或语速无效|Invalid voice switch, volume or rate
请填写自定义TTS模型和音色|Enter a custom TTS model and voice
内置原版资源不完整，请重新安装此个人版本|Bundled original assets are incomplete. Reinstall this personal edition.
内置原版资源无法读取，请重新安装此个人版本|Cannot read bundled original assets. Reinstall this personal edition.
安全凭据文件损坏或无法读取，原文件已保留，凭据保存暂时停用；离线智慧树仍可使用。请备份并修复该凭据文件后重启。|Credential file unreadable or damaged. Original preserved; credential saving disabled. Offline play still works. Back up and repair the credential file, then restart.
服务地址需要HTTPS或本机HTTP|Service address requires HTTPS or localhost HTTP
未知服务能力|Unknown service scope
未授权IPC来源|Unauthorized IPC source
本地系统语音仅适用于Windows|Local system speech requires Windows
系统语音请求无效|Invalid system speech request
Windows语音合成超时|Windows speech synthesis timed out
Windows语音合成失败，请检查已安装音色|Windows speech failed. Check installed voices.
无法启动Windows本地语音组件|Cannot start Windows speech components
Windows语音组件返回无效数据|Windows speech returned invalid data
系统语音文件过大|System speech file is too large
语音已取消|Speech cancelled
密钥格式无效|Invalid key format
更换服务地址后请重新填写Key，原Key不会转发到新地址|Enter a new key after changing the service address
Windows安全加密不可用，未保存密钥|Windows encryption unavailable; key was not saved
请先保存该服务的地址与密钥|Save this service address and key first
请求不在已配置的服务范围内|Request is outside the configured service scope
请求号或并发数量无效|Invalid request ID or concurrency limit
请求方法无效|Invalid request method
请求过大|Request is too large
响应过大|Response is too large
语音表单无效|Invalid voice form
不支持的语音字段|Unsupported voice field
录音过大|Recording is too large
网络流中断|Network stream interrupted
请求已取消|Request cancelled
连接失败，请检查服务地址、网络或超时设置|Connection failed. Check address, network and timeout.
退出|Quit
识别GOTY资源…|Reading GOTY assets…
解析原版动画|Parsing original animation
资源提取完成，正在保存…|Assets extracted. Saving…
当前浏览器缺少资源导入能力，请使用支持Web Crypto、DecompressionStream和ImageBitmap的浏览器，并通过HTTPS或localhost访问。|This browser lacks required asset APIs. Use a modern browser over HTTPS or localhost.
此PAK不属于已审计的Steam英文GOTY 1.2.0.1096；保留原文件，需先补版本审计。|This is not the audited English Steam GOTY 1.2.0.1096 package. Keep the original; a compatibility audit is required.
智慧树高度尚未满足原版指令条件|The tree is not tall enough to unlock this code
该存储资源缺少彩蛋素材，请重新导入原版PAK|Easter egg assets are missing. Restore the original assets.
智慧树，800×600原版逻辑画布|Tree of Wisdom, original 800×600 canvas
中文补充字库：站酷快乐体；英文保留原版位图字体。|Chinese supplement: ZCOOL KuaiLe. Original bitmap fonts retained for English.
按F11切换窗口与全屏；游戏画面保持800×600逻辑比例。|Press F11 to switch fullscreen. The game keeps its 800×600 logical layout.
语言选择立即保存；其他API和语音配置请点击保存设置。|Language is saved immediately. Use Save settings for API and voice configuration.
ttsBaseUrl|TTS Base URL
ttsPath|TTS request path
ttsModel|TTS model
ttsVoice|TTS voice
ttsParameters|TTS parameters (JSON)
sttBaseUrl|STT Base URL
sttPath|STT request path
sttModel|STT model
sttLanguage|STT language
中文资源包过大|Chinese resource overlay is too large
中文资源校验失败|Chinese resource integrity check failed
中文台词资源不完整|Chinese dialogue resources are incomplete
中文贴图无效|Invalid Chinese image resource
中文资源无法读取，请重新安装|Chinese resources cannot be read. Reinstall the application.
识别方式|Recognition mode
本机免费离线（桌面版）|Free local offline (desktop)
自定义识别服务|Custom recognition service
试听语音|Test voice
结束录音|Finish recording
本地识别需要Windows桌面版|Local recognition requires the Windows desktop app
免费默认方案：系统朗读不需要密钥；桌面版语音输入在本机离线识别。不会自动录音，识别后请确认再发送。|Free defaults: system speech needs no key; desktop recognition runs locally offline. Recording starts only when you click. Review the transcript before sending.
本地识别每次请录制一秒到六十秒的语音|Record up to sixty seconds for local recognition
当前环境不支持本地识别，请使用Windows桌面版或配置自定义识别服务|Local recognition is unavailable here. Use the Windows desktop app or configure a custom recognition service.
没有识别到清晰语音，请靠近麦克风再试一次|No clear speech was recognized. Try speaking closer to the microphone.
本地系统识别仅适用于Windows|Local system recognition is available only on Windows
本地识别请求无效|Invalid local recognition request
本地识别录音格式无效|Invalid local recognition audio format
本地语音识别超时|Local speech recognition timed out
本地识别不可用，请在Windows安装对应语言的语音组件，或切换自定义服务|Local recognition is unavailable. Install the corresponding Windows speech language or choose a custom service.
本地识别组件返回无效数据|Local recognition returned invalid data
识别中…|Recognizing…
启用本地或系统朗读|Enable local or system speech
内置自然人声（免费离线）|Built-in natural voice (free, offline)
智慧树音色|Tree voice
随成长变化（50英尺切换）|Grow with the tree (switch at 50 ft)
年轻男声|Young male voice
沉稳男声|Mature male voice
内置人声免费离线，无需密钥或系统音色；幼树用年轻男声，50英尺起用沉稳男声。首次生成需要等待，文字可继续阅读。|Built-in speech is free and offline, with no key or installed system voice needed. Young trees use a young voice; a mature voice starts at 50 ft. Generation takes time; you can keep reading.
本地朗读已关闭|Local speech is disabled
此本地音色需要Windows安装版，网页版可选择系统朗读或自定义服务|This local voice requires the Windows installed app. In a browser, choose system speech or a custom service.
正在朗读…|Reading aloud…
正在准备本地语音，文字可继续阅读…|Preparing local speech; you can keep reading…
本地语音请求无效|Invalid local speech request
本地语音模型缺失或无法启动，请重新安装|Local voice model is missing or cannot start. Please reinstall.
本地语音生成超时，文字仍可阅读|Local speech generation timed out. You can still read the text.
本地语音生成失败，文字仍可阅读|Local speech generation failed. You can still read the text.
本地语音输出无效|Invalid local speech output
语音高度无效|Invalid voice growth height
启用默认朗读|Enable default speech
免费联网人声（网易有道）|Free online voices (NetEase Youdao)
儿童 → 年轻 → 老年|Child → Young → Older
儿童声|Child voice
老年阶段男声|Older-stage male voice
进入年轻阶段（英尺）|Young stage starts at (ft)
进入老年阶段（英尺）|Older stage starts at (ft)
无需语音密钥，待朗读文字和随包合成音色样本直接发送给网易有道。公开体验服务可能排队或暂停，生成音频会在服务端缓存，请勿朗读敏感内容。不会上传整份聊天记录。|No voice key is needed. Text for reading and bundled synthetic voice samples go directly to NetEase Youdao. This public demo may queue or stop. Generated audio is cached on the server; avoid sensitive text. Full chat history is not uploaded.
语音阶段高度无效|Invalid voice stage heights
联网人声需要桌面版；网页版可选择系统朗读或自定义服务|Online voices require the desktop app; browsers can use system speech or a custom service.
正在准备联网语音…|Preparing online speech…
联网语音请求无效|Invalid online speech request
免费联网语音暂不可用，请稍后重试；文字聊天仍可使用|Free online speech is temporarily unavailable. Try later; text chat still works.
联网语音响应过大|Online speech response is too large
联网语音未返回声音|Online speech returned no audio
complete|Complete
cancelled|Cancelled
failed|Failed
`;
export const catalog:Record<string,string>=Object.fromEntries(entries.trim().split('\n').map(line=>line.split('|')));
const reverse:Record<string,string>={'GO BACK':'返回','BACK':'返回','EASTER EGG DEMO':'彩蛋演示','Original assets - independent scene, no combat rules':'原版素材独立演示，不含战斗规则','Buy this item?':'购买这件商品？','Are you sure you want to buy this item?':'确定购买这件商品吗？','YES':'是','NO':'否','Tree of Wisdom':'智慧树','complete':'已完成','cancelled':'已取消','failed':'失败','ttsBaseUrl':'TTS 服务地址','ttsPath':'TTS 请求路径','ttsModel':'TTS 模型','ttsVoice':'TTS 音色','ttsParameters':'TTS 兼容参数（JSON）','sttBaseUrl':'STT 服务地址','sttPath':'STT 请求路径','sttModel':'STT 模型','sttLanguage':'STT 识别语言'};
const ordered=Object.keys(catalog).sort((a,b)=>b.length-a.length);
export function translate(text:string):string{
 if(language==='zh-CN'){
  if(text==='AI 模型')return '对话模型';
  let value=({'OPTIONS':'选项','语言 / Language':'语言','English':'英语','Base URL':'接口地址','TTS Key':'朗读密钥','STT Key':'识别密钥','max_tokens':'通用输出上限','max_completion_tokens':'兼容输出上限','DeepSeek':'深度求索','OpenAI':'开放智能','Kimi':'月之暗面'} as Record<string,string>)[text]??reverse[text]??text;
  for(const [from,to] of [['Error:','错误：'],['SHOP','商店'],['OPTIONS','选项'],['API Key','接口密钥'],['Base URL','接口地址'],['Temperature','随机程度'],['Top P','采样范围'],['Token','用量'],['usage','用量'],['TTS','语音朗读'],['STT','语音识别'],['API','接口'],['JSON','高级参数'],['Windows','窗口系统'],['CORS','跨域访问'],['HTTP','状态码'],['OpenAI','开放智能'],['DeepSeek','深度求索'],['Kimi','月之暗面'],['AI','对话模型']])value=value.replaceAll(from,to);
  return value;
 }
 if(catalog[text])return catalog[text];
 const trimmed=text.trim();if(catalog[trimmed])return text.replace(trimmed,catalog[trimmed]);
 let result=text.replace(/输入 (\d+) \+ 输出 (\d+) Token（服务商统计）；兑换进度 (\d+)\/(\d+)/g,'Input $1 + output $2 tokens (provider usage); exchange progress $3/$4').replace(/高度 (\d+) 英尺 · 树肥 (\d+)\/10 · 金币 (\d+)/g,'Height $1 ft · Food $2/10 · Coins $3');
 for(const key of ordered)if(/[\u3400-\u9fff]/.test(key))result=result.replaceAll(key,catalog[key]);return result;
}
