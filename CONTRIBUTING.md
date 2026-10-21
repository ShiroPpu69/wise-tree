# Contributing / 贡献

Use Node.js 24. Run `npm ci`, `npm test`, and `npm run build` before submitting.
Some original-resource comparison tests require locally extracted fixtures and
skip without them. Never describe skipped or simulated checks as live acceptance.

Please keep game state separate from rendering and provider/voice adapters.
Preserve the manual coins → shop → food → growth loop, idempotent settlement,
the high-tree trunk view, and original-resource provenance. Do not replace
missing original art with generated images or unlabeled approximations.

使用 Node.js 24，提交前运行单元测试和构建。不要将模拟接口、跳过的测试写成真实验收。
重大渲染或存档变更请先开 Issue；请保留原版资源溯源、手动施肥流程、事务去重和高树干视角。

Bug reports should include the app version, platform, reproduction steps and
expected/actual behavior. Attach a redacted screenshot when useful. Never
include API keys, provider vaults, personal chats, memories or player saves.

Source contributions are under MIT, except separately identified third-party
material. Do not add a new game dump, executable, model weight or font without
recording its origin and applicable rights. Resource exceptions in `.gitignore`
are deliberate, limited publishing decisions, not an invitation to commit
everything under `private/`.
