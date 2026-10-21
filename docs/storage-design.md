# 实际存档、账本与安全边界

更新2026-10-21。实现：packages/game-core、storage-core，apps/desktop/main.cjs。

## 存储域

生产数据库 `ai-tree-of-wisdom-production-v1`，开发入口数据库 `ai-tree-of-wisdom-DEVELOPER-ONLY-v1`。双方使用IndexedDB records对象仓库；桌面位于Electron用户数据目录，Web属于当前站点origin，二者不假定自动共享。

- state：version=1、revision、高度、树肥、金币、observedTokens、rewardedTokens、pendingTokens、兑换比例、ledger、settled请求去重表、pendingFeed。
- messages：id/requestId、role、content、time、complete/cancelled/failed。内存和长期记忆不是同一个存储键。
- memories/memoryEnabled：仅用户明确保存的信息、时间/id、允许召回标记；支持独立改删/关闭。
- provider/voice：非密钥设置。request:ID：请求开始/结束状态、模型、usage和服务商requestID，不存Authorization。
- assets：导入资源的SHA、来源路径映射、动画IR、Blob和本地原版文字；不放进普通存档导出。

Windows主进程独立provider-vault.json中仅存端点和DPAPI密文，API/TTS/STT三个作用域。Web默认只在React内存存Key；刷新后需重新输入。普通配置和导出禁止密钥字段（含嵌套兼容参数）。模型可能回显用户自己发送的敏感内容，聊天导出仍包含用户内容，不能宣称自动去除任意文本中的秘密。

## 事务与恢复

所有state修改在严格持久化readwrite事务中读取最新状态、运行纯reducer、写入结果；IDB同仓库写事务串行，不能用过时React快照覆盖金币。usage按本地逻辑请求UUID去重，不依赖服务商requestID唯一。正常完成的assistant消息、usage结算、request终态同事务提交。无usage/断流/取消不给金币；仅明确拒绝的429/503可有限重试，不重试未知完成状态网络故障。

兑换默认20000 Token→2500金币，购买固定2500/袋、上限10。购买在同一事务扣币加袋。施肥在同一事务扣袋、加1英尺并写pendingFeed；动画只展示已提交结果。重启重播待恢复动画，finishFeed仅清恢复标记；相同请求不重复扣袋或加高。动画提交时机与原游戏有意分离以保证数据安全，但显示保持肥料后成长顺序。

首次缺失state才初始化1ft/5袋/0币/0Token；后续打开不再发放。导入备份属于用户主动恢复该备份状态。兑换比例仅影响未来结算，不重算历史；未满门槛余量持续保存。高度用安全整数边界防溢出，不另设游戏玩法上限。

历史删除使用数据库事务，回答进行中要求先取消/等待，避免删除界面快照覆盖新消息。记忆仍有多窗口编辑冲突限制，见当前状态文档。

## 导出与迁移

普通JSON envelope：format=ai-tree-save、version=1、time、state、messages、memories、settings(provider/voice/memoryEnabled)。只读单事务取得一致快照，导入校验后同事务整体替换。未知版本、非法整数、重复账本号、错误待恢复高度和含密钥配置明确拒绝，不静默重置。入口限定20MB。启动存档损坏时保留原数据并提供备份导入。

公开JSON envelope维持v1；0.1.1内部IndexedDB版本从1升级为2，保留records与所有旧数据，首次读取旧游戏状态后建立校验/快照，不重复赠送。旧窗口占用升级时明确提示关闭并重新加载；旧版本写入者打开版本1会得到VersionError，避免缺少校验写协议的旧代码覆盖新数据。后续仍需为新schema建立对应迁移。导出不包含凭据与媒体，迁移到另一平台需重新导入自有原包及配置Key。

真实IndexedDB测试覆盖20并发结算、10次同ID去重、库存失败回滚、跨连接pendingFeed恢复、并发历史删/增、存档/记忆往返。纯reducer测试与浏览器报告见[验证记录](validation.md)。

凭据异常不会阻断离线游戏：损坏/不可读的vault原样保留并显示启动警告，凭据保存暂时拒绝直到用户备份修复后重启。主进程写入队列串行化临时文件/rename，防止同时保存多个作用域时互相覆盖。

## 0.1.1游戏状态自动恢复

每次游戏状态提交在同一readwrite事务内写state、stateChecksum、stateBackups，最多保留3个不同状态快照。CRC32只检测偶发损坏，不是加密、防篡改或安全签名。读取时校验主记录；无效/丢失时选择事务版本最高且校验通过的快照并原子恢复，提示恢复版本与时间。有效的旧0.1.0记录没有校验字段时只迁移，不重置数值。导入JSON时将新快照历史重建为该导入状态，避免旧高版本快照覆盖用户主动恢复的旧存档。

快照包含去重表、完整账本、Token余量及pendingFeed；恢复后不会再次奖励同请求，也不会再扣一次肥料。写快照失败会回滚整个事务，不能出现主状态已改、快照/校验未改的部分提交。所有快照失效时保留原数据，停止修改并要求用户导入备份，不以损坏状态重新发首次礼物。

快照只包含GameState，绝不复制聊天、长期记忆或Key，删除聊天/记忆后不在这些快照里留副本。它们仍在同一个本地数据库，不能保证恢复整个IndexedDB被删除或磁盘整体损坏；独立JSON导出仍有必要。持久化路径与公众格式不变，Windows/Web共用逻辑。

真实浏览器测试在private/reports/backups-browser/result.json：整数类型仍合法的主记录损坏、主记录缺失、最新快照损坏、较旧pendingFeed恢复、全部快照失效、导入重建快照、注入QuotaExceededError后的多记录回滚、历史/记忆删除不残留、实际数据库v1→v2迁移/阻塞/旧写入者拒绝。不是磁盘物理故障实测。

语音配置setupVersion=2迁移由voiceSettings事务完成：空白旧默认启用免费系统朗读/本地识别，旧自定义识别按已有模型保留，之后用户关闭不会被再次开启。它与游戏存档版本/金币账本独立。
