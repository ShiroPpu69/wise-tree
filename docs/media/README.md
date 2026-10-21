# Showcase provenance / 演示素材来源

These screenshots and GIFs were captured from the real 0.1.14 desktop app,
using disposable profiles with no user conversations, API credentials or saves.
The growth and chat UI run in the actual renderer. The demo starts at 19 feet,
feeds one bag to reach 20, then displays a streamed response.

**Chat text is an application-authored local SSE fixture**, not original GOTY
dialogue and not proof of a live DeepSeek/Kimi/GLM connection. The temporary
demo balance and height are setup data, not rewards earned through paid calls.
The recording is silent; GIF does not demonstrate TTS quality.

截图与动图来自真实 0.1.14 桌面程序，使用独立演示存档；19→20 英尺施肥、
逐字气泡和按钮交互由程序实际运行。对话内容由本项目编写，并通过本地模拟流式
接口传入，不冒充原版固定台词或真实服务商实测。演示不包含用户聊天、密钥、
私人存档；动图无声，不能作为语音质量证明。

Capture: `WISDOM_SHOWCASE_EXE=<local executable> node tools/capture_showcase.mjs`.
Encode: `python tools/encode_showcase.py` (Pillow required). Both must be run
from the repository root. Intermediate frames remain under ignored `private/`.
PNG screenshots preserve the actual application pixels; GIFs are resized to
720×540 with a shared palette for GitHub loading speed.

Game artwork shown here is excluded from MIT; see [resource rights](../../resources/README.md).
