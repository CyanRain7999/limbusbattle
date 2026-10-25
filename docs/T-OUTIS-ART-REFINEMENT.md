# T 奥提斯头身比例修正

2026-10-25。用户指定以已接入的朱符辛克莱为比例参考。本次范围是 T 公司奥提斯六动作的人体比例与打包尺度；技能效果、玩法与其他人格沿用当前版本。

旧图问题：头脸偏小、肩和四肢过细长，人体更接近长身成人，与朱符辛克莱的紧凑像素比例不一致；全图统一缩到64像素时还把高礼帽计入标准身高，身体再次缩小。

生成方式：内置 image_gen（图像编辑）。参考1朱符辛克莱控制像素精度与人体比例，参考2旧T奥只用于服装、武器和动作辨识，参考3原作立绘用于脸、服装配色与钟表武器细节。没有将原作素材直接作为游戏贴图。

原作参考：[T Corp. Class 3 VDCU Staff Outis](https://www.limbuscompany.tools/identities/t-corp-class-3-vdcu-staff-outis)。

最终源图：`public/characters/outis/t/source-sheet.png`；对齐图：`public/characters/outis/t/fighter.png`；手机运行图：`public/runtime/characters/outis/t/pixel.png`。

打包只使用透明遮罩、平移对齐与全人物等比最近邻采样，不单独拉伸头、躯干或四肢。该人格按身体密集列对齐，礼帽保留额外高度；其余人格不改变尺度。

最终配置：含礼帽参考高度72像素，整体等比缩放0.1841432225；用身体附近的脚底确定基线，避免下垂的杖头把人物脚底抬离地面。六帧均非空、无边缘截断，浏览器逐帧使用outis-t贴图且原点固定，动作结束恢复LCB。运行图哈希与同步仓库对照，仅T奥一张图集发生改变。

源图 SHA256：`c531258cfca8271fef9a472e004d4e8c0f9e2c9d85475d6202639d55505dd272`。

运行图 SHA256：`8a1d45070adb4e44714fda3a87c437db0a8dab96ba25b0afbc2c213f82be18b0`。

对比图：`docs/screenshots/t-outis-body-comparison.png`；去除特效遮挡的同场比例核对：`docs/screenshots/t-outis-body-in-game.png`。

重建：

```powershell
python scripts/prepare-personas.py outis-t
python scripts/build-pixel-atlases.py
npm run build
```

## 使用的完整提示词

```text
Use case: style-transfer. Edit target: Image 2 is the existing T Corp Class 3 VDCU Staff OUTIS six-pose sprite sheet. Completely REDRAW ITS BODY PROPORTIONS to match Image 1, the approved Red Sheet SINCLAIR sprite sheet. Image 1 is the EXACT pixel-art style, silhouette thickness, HEAD-TO-BODY ratio and limb proportions reference, NOT the character/costume. Image 3 is the official Outis face/costume reference only. Current Image 2 has a tiny head, absurdly thin long torso/arms/legs: these are the defect to remove, do NOT preserve these proportions. Output EXACTLY SIX independent FULL-BODY sprites, 3 columns x 2 rows, broad transparent gutters, all facing RIGHT, same scale and feet baselines. Match Sinclair: compact heroic CHIBI approximately THREE HEADS tall from hair crown to boot soles (hat excluded), clearly readable head about one third of crown-to-soles, broad enough shoulders/forearms, shorter solid thighs/shins, chunky boots. NOT a six-head tall miniature adult, NOT long skinny stick limbs. Hat is a modest-height dark brown TOP HAT with gold band and small gold gear insignia, height around half a head; it is an accessory on the head, not the reason to shrink the whole body. OUTIS: mature stern female with short dark-brown layered bob, amber/gold eyes, sharp composed expression; do not copy Sinclair blond hair, talismans or teenage male identity. Keep T Corp dark chocolate-brown tailored tailcoat, ochre/gold collar and necktie, gold waistcoat buttons, small pocket-watch chain, brown trousers, dark boots, gold mechanical gloves. ONE single dark staff/cane with a readable brass clockwork collector mace head, no blade, sword, firearm, extra rods or detached hands. Pose order: 1 compact upright ready, cane lowered diagonally without protruding above hat; 2 clearly brace cane with both hands for windup; 3 cane drawn back with compact torso turn; 4 grounded short two-handed forward cane strike; 5 low leaning forward cane placement/thrust with both knees bent, head/torso still same proportions; 6 relaxed two-handed return guard. Every sprite has exactly two arms, two legs, hands actually gripping same intact staff. Crisp low-resolution pixel clusters, dark pixel outline, 3-4 matte shade steps per material, same low detail budget and facial scale as Image 1. No smooth gradients or realistic anatomy, no microdetails. True transparent RGBA background, no glow, giant clocks, floating gears, particles, labels, grid or scenery. Entire hats, feet and staff tips visible inside each separate cell.
```

