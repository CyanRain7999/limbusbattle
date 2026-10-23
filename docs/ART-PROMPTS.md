# 历史素材记录（已替换）

以下提示词对应已弃用的第一版精细人物。当前使用更低分辨率、对照 LCB 立绘的版本，见 [LCB-ART-PROMPTS.md](LCB-ART-PROMPTS.md) 与 [PERSONA-ART-PROMPTS.md](PERSONA-ART-PROMPTS.md)。未使用《坎公骑冠剑》的实际素材。

旧版为 24 姿势，现有 `public/characters/{don,heath}/lcb/source-sheet.png` 已替换为 36 姿势新版。不需要运行素材处理脚本即可启动游戏。

旧版人格共用动作及调色的方案已替换为独立服装、武器的专属动作。

## Prompts
### heath

Use case: stylized-concept. Asset type: usable production transparent sprite animation sheet for a side-view fighting game. Draw a detailed chibi pixel-art Heathcliff from Limbus Company: wild tousled dark brown hair, expressive stern face, purple waistcoat with shirt sleeves rolled to elbows, loosened dark tie, open black/brown long coat, leather belt, dark trousers and heavy brown boots, wielding a metal-bound heavy wooden baseball bat. Three-head-tall heroic chibi proportions, detailed hands and eyes, well-built clothing folds, deliberate sharp pixel clusters with 5-7 shades per material and dark cool outlines. Premium modern pixel RPG craftsmanship comparable to Guardian Tales, NOT stick figures or geometric placeholders. Body without weapon about 100 source pixels tall, rendered with sharp visible square pixels. All face RIGHT in consistent side / slight three-quarter fighting view.
Exact landscape canvas 1536×1024 with a precise 6 columns × 4 rows grid of 24 equal 256px square cells. NO visible grid, labels, text, cell borders or numbers. Each cell ONE full figure and entire bat. Body centered horizontally and feet baseline y225 within each cell. Body height roughly160px. Consistent size and identity in all cells, generous clear gutters, never overlap between cells.
Row1: six sequential idle/breathing frames, bat resting over right shoulder, coat swaying slightly.
Row2: six sequential rightward running frames with real alternating stride, distinct grounded and airborne poses.
Row3: six sequential bat attack frames: ready, overhead windup, swing startup, powerful full horizontal swing to right, follow-through, recover.
Row4 left to right: jump pose, falling pose, hurt/recoil pose, guard with bat held in front, knocked down lying sideways, confident victory pose.
CRITICAL background: fully transparent alpha across the complete empty canvas and ALL spaces between figures. No brown matte, NO gradient, NO scenery, NO ground shadows, NO colored backdrop, NO checkerboard. Output isolated figures on actual transparent background.

### don

Use case: stylized-concept. Asset type: production sprite animation sheet for a side-view 2D pixel fighting game. Primary request: Draw Don Quixote from Limbus Company as a richly detailed chibi pixel-art fighter, with the craftsmanship, readable face, expressive poses, confident pixel clusters and intricate costume shading of premium modern pixel RPGs such as Guardian Tales. This is NEW game art, not a UI mockup.
Subject: energetic young woman, golden blonde chin-length bob with side fringe, bright amber eyes, black and deep-red long military coat, crisp white shirt, red tie, small gold details, black trousers and oversized brown riding boots, an elegant long golden lance. Cute three-head-tall proportions, large expressive face, clear hands, well-built clothing folds, 5-7 carefully chosen shades per material. All figures face RIGHT in a consistent side / slight three-quarter fighting view. Warm gold/red palette, cool dark outlines. The sprite body (excluding lance) is about 100 real pixels tall, drawn with deliberate sharp square pixel clusters, NOT vector art and NOT smooth high-resolution illustration.
Layout MUST be an exact evenly spaced 6 columns × 4 rows rectangular animation sheet, landscape 1536 by 1024 pixels; 24 equal square 256px cells. No grid lines, labels, text, UI, cell borders or shadows on floor. Fully transparent background alpha. Each cell contains exactly ONE complete figure and weapon, centered horizontally in the cell, feet at the same baseline 225px from the cell top. Character body about 160px tall in each cell. All limbs and the entire lance must remain within its own cell, generous transparent gutters. Consistent character design, size and camera across all 24 cells.
Row 1: 6 sequential IDLE frames, breathing, slight hair and coat motion, lance held diagonally.
Row 2: 6 sequential RUN cycle frames toward the right, distinct planted and airborne stride poses.
Row 3: 6 sequential ATTACK animation frames: ready, windup, thrust, full extended lance thrust to right, follow-through, recover. Strong distinct readable action poses.
Row 4 columns 1 to 6: jump pose, falling pose, struck/hurt recoil pose, guarded defensive pose holding lance, knocked down lying on side, triumphant victory pose.
Avoid: rough stick figures, simplistic rectangles, random inconsistent costumes, blurry pixels, anti-aliased edges, cropped weapons, overlap between cells, background scenery, checkerboard pattern. Truly transparent background.

