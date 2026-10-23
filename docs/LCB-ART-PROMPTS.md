# 当前 LCB 基础人物动作

对照 [Limbus Company 官方人物页](https://limbuscompany.com/) 中的 LCB 服装制作衍生像素动作：堂吉诃德黑色长外套、白衬衣红领带、黑裤与跑鞋、钢制长枪；希斯克利夫白衬衣卷袖、红领带与黑色背带、黑裤、缠布球棒。未将官方原图打包到游戏。

基础动作源图各 36 姿势。`scripts/prepare-sprites.py` 按 alpha 连通域切片并对齐，生成 `fighter.png/frames.json` 和低分辨率头像。渲染器以最近邻采样到 64 像素体高，待机固定首帧，位置按像素网格取整。人格技能另有 13 套专属六姿势图，见 [人格生成记录](PERSONA-ART-PROMPTS.md)。

## Don

Draw a NEW transparent RGBA game sprite sheet of Limbus Company Don Quixote, using attached official art ONLY as clothing/hair/weapon reference. No official background. Exact 6 columns × 6 rows, 36 equal cells, square canvas. Each figure faces RIGHT, all same body scale, stable head shape, tiny idle motion. Transparent gutters, full weapons inside cell. No labels, text, numbers, grid, checkerboard, matte or ground shadows.
TRUE LOW-RES pixel game art: body looks 48×64 source pixels enlarged with crisp square blocks, limited 20-color palette, 2-3 flat shades per material, tiny 1-2 pixel eyes, simple deliberate pixel clusters. Four-head-tall compact proportions. NOT highly detailed painted chibi, NOT smooth illustration, NO hair strand microdetails. Clearly lower pixel density.
LCB costume MUST follow reference: neat blonde chin-length bob, amber eyes, black utilitarian long coat with a few small rectangular patches, white business shirt, plain red tie, broad black waist belts, high-waist black trousers, tan/yellow running SHOES. Weapon is the huge plain dark STEEL lance with angular broad head and black pole. NO ornate golden spear, NO gold embroidered fantasy coat, NO riding boots, NO armor.
Row1: six subtle LCB idle frames, steel lance held diagonally.
Row2: six real LCB running cycle frames, alternating strides, modest head bob.
Row3: six sequential LCB horizontal spear thrust frames: ready, windup, thrust, full extension, follow-through, recover.
Row4 left to right: LCB jump, falling, hurt, guard, knocked down lying on ground, victory.
Row5: SAME blonde Don Quixote as W Corp cleanup worker, visibly different outfit: dark NAVY work jacket and trousers with CYAN utility accents, dark cap with tiny cyan mark, simple cyan energy SWORD instead of lance. Six sword-combo attack frames: ready, windup, cut one, cut two, wide cut, recover. No detailed bloom.
Row6: LCB Don Quixote again, six RISING LANCE anti-air attack frames: crouch windup, low spear, rising, vertical lance extension, apex, recover.
All feet at one baseline within each row. Figures isolated, same face and proportions, weapons do not touch neighbors. Actually transparent background.

## Heath

Create a usable TRANSPARENT RGBA PIXEL GAME sprite sheet, exact 6 columns x 6 rows, 36 equal cells, square 1536x1536. Reference image is ONLY the canonical costume and face reference for Heathcliff from Limbus Company; draw NEW sprites, no reference backgrounds.
Art must be TRUE LOW RES 48x64-pixel-body style, enlarged with sharp square pixel blocks. LIMITED 20-color palette, 2-3 shades per surface, tiny simple eyes, clean expressive silhouette. NOT detailed painted chibi, NOT realistic textured hair, NOT ornate fantasy armor. Roughly 4 heads tall. Every figure faces RIGHT and has same size, head shape and baseline. Slight idle animation only. Each cell has transparent gutters and entire weapon fits. No text, grid, numbers, checkerboard, matte, scenery or ground shadows.
LCB Heathcliff: short messy DARK BROWN swept hair, stern brow, rolled-sleeve WHITE SHIRT with open collar, loose plain RED necktie, BLACK SUSPENDERS over shoulders, black belt, black trousers, dark shoes, simple BLACK BASEBALL BAT with white wraps. NO purple vest. NO long coat for LCB. Match the utilitarian outfit in reference.
Row1: LCB, six subtle idle frames, bat on shoulder.
Row2: LCB, six RUN cycle frames with real alternating legs, small head bob.
Row3: LCB, six distinct heavy bat swing frames: ready, windup, swing, full extension, follow-through, recover.
Row4: LCB, six reactions left to right: jump, falling, hurt, guard, lying knocked down, victory.
Row5: same Heathcliff temporarily as R Corp Rabbit: charcoal/olive tactical jacket and armour, black helmet with two short rabbit-like antenna ears, orange visor raised showing his face, wielding a compact BLACK RIFLE. Six sequential SHOOTING attack poses: raise rifle, aim, fire, recoil, fire, recover. Very clearly different outfit and weapon from LCB.
Row6: same Heathcliff as Wild Hunt: long BLACK tattered coat with dark VIOLET lining, white shirt, wild brown hair, wielding a huge dark GREATSWORD. Six sequential sweeping sword attack poses: ready, low windup, high windup, full wide cleave, follow-through, recover. No horse required.
Bodies about 160px tall per 256px cell, feet y225, only large visible square pixel clusters. No tiny detail. Actual transparent background alpha.
