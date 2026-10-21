# Game resources / 原版资源

The repository owner requested that the resources used by the application be
included. **These files are not MIT-licensed.** Plants vs. Zombies artwork,
animations, fonts, audio, dialogue and trademarks belong to their respective
rights holders (PopCap / Electronic Arts). This repository does not grant
ownership or a redistribution license for those materials and is not an
official or endorsed product.

仓库所有者要求一并上传应用使用的原版资源。**原版游戏素材不属于 MIT 授权范围。**
原版美术、动画、字体、音频、台词与商标归各自权利人所有；本项目并非官方产品。

| File | Origin / 来源 |
|---|---|
| `goty/main.pak` | Owner-provided English Steam PC GOTY package; SHA-256 in manifest. / 用户提供的英文 Steam PC GOTY 原包。 |
| `goty/zh.json` | Local overlay extracted from a community Chinese patch; includes game text/images. Official Chinese GOTY provenance has **not** been independently verified. / 社区汉化覆盖层，不能标为已证实的官方中文 GOTY 资源。 |
| `branding/tree.png`, `branding/tree.ico` | Composited from original TreeOfWisdom animation tracks; transparent tree-only icon. / 原版智慧树轨道组合而成的透明图标。 |

`manifest.json` records byte sizes and SHA-256 digests. No game executable,
player save, API key, chat history or speech model is included here.

The supplemental Chinese font under `assets/fonts/` has its own SIL OFL
license. The compact speech references in `apps/desktop/voice-references.cjs`
are synthetic, not a real person's cloned voice or original GOTY audio.
