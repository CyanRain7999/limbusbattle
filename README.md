# 边狱交锋 · Limbus Clash

基于《Limbus Company》人物题材的**非官方同人横版像素格斗原型**。Phaser 3 + TypeScript + Vite，固定 60 Hz 战斗逻辑，无后端。角色与场景非官方素材，角色名称、世界观归原权利方所有。

![主菜单](docs/screenshots/menu.png)

手机安装、GitHub Desktop 发布与后续同步见 [手机 PWA 说明](docs/GITHUB-PAGES.md)。GitHub Desktop 仓库位置为 `D:\G\limbusbattle`。

## 启动

需要 Node.js 22.12+ 或 24+。

```sh
npm ci
npm run dev
```

打开终端显示的本地地址，点击「选择罪人 → 确认出勤」。开发服务器默认只监听本机。

```sh
npm run build       # 类型检查 + 生产构建，输出 dist/
npm run preview     # 预览生产包，默认 http://127.0.0.1:4173/
npm test            # 战斗核心测试
npx playwright install chromium  # 首次浏览器测试需准备 Chromium
npm run test:browser
```

已有 Chromium 时可设置环境变量 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指向可执行文件。浏览器测试默认自动启动或复用 5173 端口的开发服务器。手机实机测试可运行 `npm run dev -- --host 0.0.0.0`，然后用同一局域网手机访问电脑 IP；PWA/Service Worker 需要 HTTPS 或 localhost。

## 默认按键

| 行动 | P1 | P2 |
|---|---|---|
| 左 / 右 | A / D | ← / → |
| 跳跃 / 下蹲 | W / S | ↑ / ↓ |
| 轻击 / 重击 / 搓招终结键 | J / K / L | 小键盘 1 / 2 / 3 |
| E.G.O. | U | 小键盘 0 |
| 冲刺 | 左 Shift | 小键盘 5 |
| 防御 | Space | 小键盘 4 |
| 暂停 | Esc | 共用 |
| 调试判定与帧数据 | F3 | 共用 |

在右上角设置中可重绑全部双人按键，冲突绑定会被拒绝。手机自动显示虚拟按键；设置中可强制开启并调整尺寸、水平内缩与底部高度。支持多指同时按住方向和攻击。

**推荐连招：** 靠近对手，J 命中后再按 J，再按 K；重击命中后 W 跳跃取消，J 空中追击。按键需要重新按下，按住 J 不会自动连打。向前方向 + J、冲刺中 J 触发突进攻击。J/K/L 配合方向输入施放技能；单按 L 不会施放特殊技。技能消耗 12–30 罪孽，U 消耗 80；命中与受击积累资源。Tab 打开招式表。

## 已实现

- 主菜单、十二罪人档案槽位、两名可玩罪人、每人七个可配装搓招、十三套独立来源人格动作、选人/技能配装、两处场景、暂停、按键设置、结算与再战。
- 堂吉诃德：W、N、剑契、Cinq 南部五科科长、T、憎恶女王、LCB；希斯克利夫：句点、狂猎、七协、中指、黑云、伞夫、兔子队。每招有独立帧数据、服装和武器，招式结束或被打断后恢复 LCB。
- 236J、214K、623L、22J、236K、214L、623J 七种面对方向指令；斜方向必需、输入窗口、左右镜像、招式优先级、输入缓存。手机和技能栏提供快捷按钮。
- 独立机制：W 三段突进、N 重锤破防、Cinq 快突刺、T 长硬直、剑契踏步拔刀、女王三段远程光束、LCB 升枪；句点单发狙击、狂猎荆棘刃重斩、七协防反、中指霸体拳、黑云二连刀、伞夫反击、兔子三连射。
- 60 Hz 固定逻辑、独立人物状态、单独 Hitbox/Hurtbox/Pushbox、前摇/有效/收招、命中去重、输入缓存、命中取消、三段轻击、空中攻击、跳跃追击、地空冲刺、浮空/倒地/起身无敌、墙角挤出。
- 防御、削血、架势耗尽破防、连击计数与伤害递减、Hitstop、震屏、火花、斩击轨迹、Web Audio 合成音效。
- 可关闭的攻击判定拼点、-45～45 SP、罪孽资源与 E.G.O.、灼烧持续伤害和破裂下次命中附伤。
- CPU 三档难度，使用同一输入与战斗接口，带反应延迟与失误；本地双人；无限时间和资源补充的训练模式。
- 键盘、多点触屏、全屏、安全区、16:9 对战画面、PWA Manifest、图标、生产包离线缓存。
- F3 判定/状态/帧数/速度/硬直调试与资源补充；素材工作台提供网格切片、动画预览和会话内换图。

## 结构

```text
src/core/          类型、世界参数、持久设置
src/combat/        Fighter 状态机、Match 规则/判定/资源/回合
src/characters/    Sinner/Identity 注册、人格变体
src/data/          JSON 人格、技能、Hitbox、取消窗口
src/ai/            延迟观察 CPU
src/input/         独立键盘输入、多指触屏、面对方向搓招识别
src/skills/        招式目录、指令与技能配装
src/scenes/        Phaser 场景与固定步长调度、摄像机、战斗渲染
src/assets/        原创背景生成、素材加载、Sprite Sheet/序列/Aseprite 接口
src/audio/         程序化音效
src/effects/       按招式阶段绘制的分层特效、残影、粒子
src/platform/      PWA 安装/更新、全屏/横屏与屏幕常亮
src/ui/            菜单、选人、HUD、设置、素材工作台
public/characters/{sinner}/{persona}/  保留的原图、对齐精灵表、帧映射
public/runtime/    小体积运行资源、图标与预编译像素帧
tests/             核心规则与 Playwright 浏览器测试
docs/              参考研究、素材提示词、验收记录、截图
```

`Match` 和 `Fighter` 不依赖 Phaser、DOM 或真实时钟。渲染只读取状态；CPU 与人类使用相同的 `InputFrame`。每次有效攻击有独立序号和命中过的目标集合。判定按人物朝向镜像，与可见人物矩形分离。

## 新增人格技能

`src/data/command-skills.json` 定义招式。必填 `sinner/slot/id/name/source/appearance`，以及 `startup/active/recovery`（60 Hz 帧）、伤害、硬直、资源、冷却、局部 `box` 和取消窗口。方向槽位取 `qcf/qcb/dp/ddj/qcfk/qcbl/dpj`；同槽的多个技能自动进入配装菜单。默认配置在 `src/skills/catalog.ts`，用户配置按玩家分别存入本机。

`hits` 定义独立命中窗口及伤害系数；`projectile` 定义发射帧/速度/尺寸/寿命；`counter` 是防反帧窗口；`armorUntil` 是霸体截止帧；`teleport` 是首个有效帧的踏步距离。所有机制均由战斗核心处理。

`src/data/persona-art.json` 登记人格贴图。放置对应 `fighter.png/frames.json`，招式 `visualKey` 指向该键。每套六姿势由前摇、有效、收招阶段驱动。渲染只在攻击期间选用该人格，基础人物始终 LCB。加入其他罪人还需注册基础数据及其动作素材。

| 指令（朝向对手） | 堂吉诃德 | 希斯克利夫 |
|---|---|---|
| 236 J | W · 空间撕裂 | 句点 · 集中射击 |
| 214 K | N · 钉锤净化 | 狂猎 · 葬送 |
| 623 L | Cinq · 决斗突刺 | 七协 · 弱点识破 |
| 22 J | T · 时间征收 | 中指 · 清算之拳 |
| 236 K | 剑契 · 拔刀 | 黑云 · 拔刀斩 |
| 214 L | 憎恶女王 · 以爱与憎之名 | 伞夫 · 雨中反击 |
| 623 J | LCB · 正义升枪 | 兔子队 · 快速压制 |

236J 朝右示例：S → 按住 S+D → 松开 S 保持 D → J。623L：D → S → S+D → L。22J：S → 松开 → S → J。整套方向约 0.4 秒内完成，朝左镜像。P2 用方向键及小键盘 1/2/3 代替 J/K/L。

![人格预览](docs/screenshots/personas.png)

## 替换精灵与声音

内置角色为参考原作立绘重新制作的 AI 辅助衍生动作，基础图各 36 姿势、13 套人格各 6 姿势。构建素材时统一采样到约 64 像素体高，最近邻显示；待机固定首帧，位置按像素网格显示。低分辨率头像与实战人物保持一致。实际发布的帧位于 `public/runtime/characters`，原图不随网页加载。素材记录见 [LCB-ART-PROMPTS.md](docs/LCB-ART-PROMPTS.md) 和 [PERSONA-ART-PROMPTS.md](docs/PERSONA-ART-PROMPTS.md)。对齐脚本需要 Python + Pillow，仅用于重新制作素材，日常运行不需要 Python。

在「关于本作 → 素材预览与导入」或设置中打开素材工作台，可先选择人格预览其专属六姿势，再选择基础目标人物，加载 PNG，设置帧宽高，预览后应用。等宽网格逐行切片；可附加 Aseprite JSON，使用与 `idle/run/jump/fall/attack/hit/guard/down/win` 等状态同名的 `frameTags`。上传素材仅本次会话有效，刷新会恢复内置素材。

需要发布的资源放在 `public/runtime`。长期接入在场景 `preload` 中调用 `AssetManager.queue()`，加载后 `defineAnimations()` 并 `bindIdentity()`。支持：

```ts
AssetManager.queue(scene, {
  key: 'my-don', type: 'sheet', url: './characters/don/my-id/idle.png',
  frameWidth: 96, frameHeight: 96,
  animations: { idle: {frames:[0,1,2,3],fps:10,loop:true} }
});
// Loader 完成之后：
AssetManager.defineAnimations(scene, definition);
AssetManager.bindIdentity(identity, 'my-don', 2, 0.94);
```

`type: 'sequence'` 使用 `urls` 数组；`aseprite` 使用 PNG `url` 和 JSON `json`；`audio` 使用 WAV/OGG/MP3 的 URL 数组；`effect` 使用与 sheet 一样的帧尺寸。声音加载接口已预留，当前实战使用合成音效；自定义声音需自行接入 `Synth` 或音频播放器。

## 离线与交付

`dist/` 是完整静态 PWA 包，离线预缓存约 2.5 MiB。内置安装入口、Android 安装提示、iOS 添加主屏幕说明、横屏启动、离线就绪状态和安全更新。支持时请求全屏/方向锁定/屏幕常亮，不支持时使用手动旋屏提示。开发版不注册 Service Worker。

GitHub Pages 工作流已配置，支持 `main/master` 及仓库子路径。首次发布需在 GitHub 设置 Pages Source 为 GitHub Actions，具体见 [手机 PWA 说明](docs/GITHUB-PAGES.md)。项目没有自动提交或推送；后续完成改动后运行 `npm run sync:repo` 同步到用户仓库。

特效独立于战斗判定：前摇蓄力、人格纹章、分层斩击、空间裂缝、齿轮时钟、荆棘、星心光束、命中碎片、地面冲击和冲刺残影。瞬时特效有数量上限和生命周期，受击短闪约 65 ms，避免整段硬直都变成白色剪影。

参考项目的许可证与静态核查见 [RESEARCH.md](docs/RESEARCH.md)，测试证据见 [VALIDATION.md](docs/VALIDATION.md)。本工程未复制参考仓库的源代码或角色/音频素材。

## 当前限制

- 属于可玩原型。没有联网对战、回滚同步、剧情、十二人完整阵容或正式游戏资源。
- 基础人物奔跑/攻击各 6 姿势，反应动作多为单姿势；13 套来源人格各有专属六姿势。人格动作是生成图经对齐采样后播放，尚无逐帧手工修形、完整转身或商业级动画连续性；基础轻重击与 E.G.O. 部分共用基础挥击。
- 招式是原作人格的格斗化改编，帧数据、伤害、资源和机制服务本作平衡。没有完整复刻原作硬币、被动、弹药、充能、沉沦等系统。
- 手机已用 Chromium 触屏模拟验证；没有实体 iPhone/Android、多浏览器及低端机性能实测。PWA 安装入口与音频限制因浏览器而异。
- 素材工作台更换只保留当前会话；帧编辑/Hitbox 可视化编辑器、完整音效映射、自由拖拽按钮暂未实现。
- 场景为原创程序化像素背景，人物为 AI 辅助原创衍生图；未使用官方精灵。对战体验与美术仍可继续打磨。
