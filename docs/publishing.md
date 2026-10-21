# Repository publication / 仓库发布

The repository owner's latest instruction requests MIT for original code and
inclusion of the runtime game resources. This supersedes earlier historical
documents stating that all game media would be private. The change does not
turn third-party assets into MIT material. See `resources/README.md`.

按仓库所有者最新要求，自编代码采用 MIT，运行所用原版资源一并上传。
这取代历史开发文档里「原版资源仅保存在本地」的发布策略；不改变素材自身的权利归属。

## Included

- Application source, research notes, tests and reproducible tooling.
- Audited `resources/goty/main.pak`, community Chinese overlay and tree icon.
- Actual application screenshots and two silent GIFs, with fixture provenance.
- Windows x64 installer in GitHub Releases, not in the Git source history.

## Excluded

`private/`, downloaded research repositories, extracted game files outside the
explicit runtime bundle, game executables, old installers, user profiles,
chat/memory databases, credentials, speech models, caches, node_modules and dist.

## Build and verification

`npm run build` uses repository resources, not the developer's private overlay.
`npm run desktop` can read `resources/` when unpackaged. `npm run dist:win`
packages the checked-in resources and icons using `electron-builder.json`.
The browser can import the repository's PAK through its normal file picker.

Unit tests and fresh-checkout build checks are separate from the local
original-game research evidence. Demo conversations use a local SSE fixture.
No real user profile is used for public captures or smoke tests.

The installer is unsigned. It starts with speech playback off, supports
Simplified Chinese/English, and needs the user's own model credentials for AI.
Offline growth does not require an API connection.
