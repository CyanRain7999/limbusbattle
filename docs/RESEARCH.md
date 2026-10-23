# 参考项目静态研究

核查日期：2026-10-23。核查内容为 README、GitHub 文件树、许可证及关键源文件；未构建或执行上游项目，也未验证它们自报的测试数量。

## BleachVsNaruto

- 仓库：[5DPLAY-Game-Studio/BleachVsNaruto](https://github.com/5DPLAY-Game-Studio/BleachVsNaruto)
- 核查 master 提交：`891f5776dbdf3cbf40919e27aa8d6e77a5f66c97`。
- [README](https://github.com/5DPLAY-Game-Studio/BleachVsNaruto/blob/master/README.md) 标注 AS3、3.7、Alpha；实际树包含核心、共享接口、组件、桌面/移动外壳及 Flash 子模块，是已有规模的游戏工程。
- [LICENSE](https://github.com/5DPLAY-Game-Studio/BleachVsNaruto/blob/master/LICENSE)：GPL-3.0。未复制源代码或素材。
- 实际查看 `CORE_Shared/.../FighterActionState.as`、`CORE_KernelLogic/.../FighterAttacker.as`、`fighter/models/FighterHitModel.as`。状态分类、逐动画帧攻击区域缓存、攻击参数注册独立于外壳。本文工程采用独立状态、技能数据和渲染层的思路，重新实现固定步长和判定。

## Ikemen GO

- 仓库：[ikemen-engine/Ikemen-GO](https://github.com/ikemen-engine/Ikemen-GO)
- 核查 develop 提交：`ee4791bcd5e2f4bcb16ef9d584e001fb4a7eedfc`。
- [README](https://github.com/ikemen-engine/Ikemen-GO/blob/develop/README.md) 描述支持 MUGEN 资源的 Go 引擎，有稳定版/候选版/nightly。树包括 Go 核心、data、字体、构建和外部依赖。
- [LICENCE.txt](https://github.com/ikemen-engine/Ikemen-GO/blob/develop/LICENCE.txt)：引擎和脚本 MIT；部分字体/图标 CC BY 3.0，发行包还可能含其他许可素材。GitHub 元数据归类 NOASSERTION，故以实际文件为准。未复制代码或资源。
- 实际查看 `src/char.go` 与 `src/state.go`：独立碰撞数据、位置/速度/受击/防御参数，状态可保存恢复。本文工程将角色状态、Hitbox/Hurtbox、速度、硬直独立保存，使用每次攻击的目标去重集合和可复现随机种子；不包含 Ikemen 的兼容层或回滚实现。

## Phaser fighting-game

- 仓库：[rbs250/fighting-game](https://github.com/rbs250/fighting-game)
- 核查 main 提交：`d339109d08039854a9bab1a09c613b7917f6bef1`。
- [README](https://github.com/rbs250/fighting-game/blob/main/README.md) 描述 Phaser + TypeScript + Vite 的 960×540 原型、多角色、回合和生成素材流水线。实际存在 `src/game/FightScene.ts`、触屏、素材脚本和测试目录。
- 文件树未发现根许可证，GitHub license 字段为 null。没有明确复用授权，故仅作设计参考，未复用代码、素材和提示词。
- 实际查看 `src/main.ts` 与 `src/game/FightScene.ts`：Phaser 像素过滤、统一场景生命周期、独立攻击/受击矩形、状态时间、特效和合成音效回退。本文工程保留相近技术栈，但将核心规则移到无 Phaser 依赖模块，菜单和 HUD 使用独立 DOM 层。

## Shoto Fighter Godot

- 仓库：[aminRX/shoto-fighter-godot](https://github.com/aminRX/shoto-fighter-godot)
- 核查 main 提交：`3d44da0a26db269e3b6d7a4939fb657533548d39`。
- [README](https://github.com/aminRX/shoto-fighter-godot/blob/main/README.md) 描述完整本地对战、三局两胜和三档 CPU；测试数量存在 78/98 两种表述，未实跑核实。实际存在 core、fighter/states、input、match、fx 和 test。
- [LICENSE](https://github.com/aminRX/shoto-fighter-godot/blob/main/LICENSE)：代码 MIT；README 另标其 KFM 人物为 CC BY-NC，不能将代码许可证当作素材许可证。本工程未复用任何上游代码或 KFM 素材。
- 实际查看 `core/combat.gd`、`fighter/states/attack.gd`、`fighter/state_machine.gd`。启发：按启动/有效/恢复区分阶段、命中一次锁、同一输入接口、判定与受击分离、命中取消。本文使用原创 TypeScript 实现并为这些边界编写测试。

## 本工程的复用边界

运行依赖 Phaser 3 为 MIT；构建与测试工具各自许可证保留在 npm 包中。背景、像素人物、声音均由本工程生成或绘制；AI 辅助人物提示词与源图一并提供。角色名称和衍生设定不因本工程源码许可而转移权利。
