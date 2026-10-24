# 最后三位：最终接入图稿与提示词

2026-10-24。使用内置 imagegen（未调用外部生成脚本）。以堂吉诃德憎恶女王为精度参考，约三头身、硬边像素和有限明暗。每位两张18姿势基础图、每人格单独六姿势，共24张最终源图。后续用户将范围限定为只修LCB：基础图改按良秀四头身，小眼侧面；人格换装图保留原样。长武器/背臂相碰的初稿以更宽间距重排，不接入相连人物。仅Pillow切片、透明遮罩、平移对齐、最近邻缩放与检查拼图。

生成图是非官方衍生，参考为造型与动作依据。原图保留在public/characters；最终运行图位于public/runtime/characters。

## faust-lcb

源图：`public/characters/faust/lcb/source-sheet.png`

参考：`public/characters/faust/lcb/source-sheet.png`、`.cache/references/approved-ryoshu-style.png`、`.cache/references/final-three/lcb-sinner-faust-portrait.png`

```text
Use case: stylized-concept. Correct the LCB game sprites in IMAGE1. IMAGE1 and IMAGE3 are the sole CHARACTER IDENTITY, clothing and WEAPON authorities. IMAGE2 RYOSHU is ONLY adult PROPORTION / coarse PIXEL precision reference; NEVER copy her cigarette, face, hairstyle, shirt, katana or coat-specific decorations. Faust: SILVER WHITE BOB, narrow SMALL BLUE eyes, GREY RIBBED HIGHNECK TURTLENECK SWEATER under BLACK fitted WAISTCOAT, draped black LCB coat with red lining, blacktrousers and boots. ONE LONG STRAIGHT SILVER DOUBLE-EDGED GREATSWORD with dark crossguard. CRITICAL: GREY TURTLENECK, NO WHITE BUTTONSHIRT, NO RED TIE, NO CIGARETTE. Do not copy Ryoshu costume. Match image2's FOUR to FOUR-AND-A-QUARTER HEADS TALL adult anatomy: whole hair/head about23-24% standingbodyheight, LONG torso and legs, small understated side-profile eyes. Do not shrink whole sprite; redraw body proportion with smaller head. No big round chibi eye or baby cheeks. Pixel art has coarse HARD PIXEL CLUSTERS with clean dark outlines and ONLY 3 matte shades per material. Hair is broad simple blocks, no tiny strand sparkle, no glossy gradient, no fine embroidery. Target native body about64pixels tall with head about14-15pixels, export integer nearestneighbour style. EXACT THREE COLUMNS x SIX ROWS, total18 FULLBODY poses in reading order: 1 idle, weapon LOW and head highest;2 run leftcontact;3 run passing;4 run airborne stride;5 run rightcontact;6 run extended stride;7 rising jump;8 falling jump;9 hurt;10 guard;11 lying down;12 victory weapon upright;13 weaponwindup;14 overhead weaponwindup;15 horizontalweapon contact RIGHT;16 lowweapon lungingcontact RIGHT;17 upright recovery;18 forwarddash. All face RIGHT in side/threequarter SIDE profile. Reuse each character's OWN weapon in every pose. Entire weapons and limbs fully inside each cell, VERY WIDE transparent gutters, no two figures connected or touching. Equal BODY scale across all18; no clipped weapon. True TRANSPARENT RGBA background, no scenery, floor, shadow, glow, text, labels or baked FX. Source layout may contain extra outfits/poses: ignore them and only draw the LCB initial identity in this exact18-pose sequence.
```

## faust-normals

源图：`public/characters/faust/normals/source-sheet.png`

参考：`.cache/references/faust-normal-portrait-spacing.png`、`.cache/references/faust-single-lcb-style.png`

```text
Use case: stylized-concept. Clean this PORTRAIT3columns6rows18-pose Faust LCB weapon-normal sheet. IMAGE2 is exact accepted single character identity/body/head style, preserve silverwhite bob, small calm blue eye, GREY ribbed TURTLENECK under blackwaistcoat and blackLCBcoat, blacktrousers boots, slim stylized about3.5-4head body and ONE LONG STRAIGHT DOUBLE-EDGE SILVER GREATSWORD with darkcrossguard. NO redtie, no whitebuttonshirt, no cigarette. Image1 has18pose rough cells with some cut weapon ends/stray fragments from neighboring figures; remove stray fragments and reconstruct COMPLETE greatsword in everypose. EXACT THREE COLUMNS x SIX ROWS portrait1024x1536 with18 FULLBODY isolated poses. First6 standing weaponcontacts (lightstab,mediumhorizontalcut,risingheavy,lightpommelstrike,mediumlowsweep,heavyoverheadcut), next6 crouching, final6 airborne downward contacts. Keep ALL weapons/limbs in eachcell with verywide transparent gutters, shrink fullbody/weapontogether ifneeded, no touching betweenfigures. Pixel precision exactly image2, coarsehardclusters fewmattecolors no finehairnoise. Preserve whole18pose sequence. TrueRGBA transparent,no text/background/shadow/glow/effects.

Additional original three crouching secondary contacts from: 
Use case: stylized-concept. Correct the LCB game sprites in IMAGE1. IMAGE1 and IMAGE3 are the sole CHARACTER IDENTITY, clothing and WEAPON authorities. IMAGE2 RYOSHU is ONLY adult PROPORTION / coarse PIXEL precision reference; NEVER copy her cigarette, face, hairstyle, shirt, katana or coat-specific decorations. Faust: SILVER WHITE BOB, narrow SMALL BLUE eyes, GREY RIBBED HIGHNECK TURTLENECK SWEATER under BLACK fitted WAISTCOAT, draped black LCB coat with red lining, blacktrousers and boots. ONE LONG STRAIGHT SILVER DOUBLE-EDGED GREATSWORD with dark crossguard. CRITICAL: GREY TURTLENECK, NO WHITE BUTTONSHIRT, NO RED TIE, NO CIGARETTE. Do not copy Ryoshu costume. Match image2's FOUR to FOUR-AND-A-QUARTER HEADS TALL adult anatomy: whole hair/head about23-24% standingbodyheight, LONG torso and legs, small understated side-profile eyes. Do not shrink whole sprite; redraw body proportion with smaller head. No big round chibi eye or baby cheeks. Pixel art has coarse HARD PIXEL CLUSTERS with clean dark outlines and ONLY 3 matte shades per material. Hair is broad simple blocks, no tiny strand sparkle, no glossy gradient, no fine embroidery. Target native body about64pixels tall with head about14-15pixels, export integer nearestneighbour style. EXACT THREE COLUMNS x SIX ROWS, total18 FULLBODY poses in reading order: FIRST SIX: STANDING six weapon contacts (light primary, medium primary horizontal, heavy primary rising, light secondary, medium secondary low sweep, heavy secondary overhead). NEXT SIX: CROUCHING same six contacts. LAST SIX: AIRBORNE same six contacts with attacks angled down to facilitate jump-ins. Weapon always visible; this refers to weapon attack families, not literal unarmed punches or kicks. All face RIGHT in side/threequarter SIDE profile. Reuse each character's OWN weapon in every pose. Entire weapons and limbs fully inside each cell, VERY WIDE transparent gutters, no two figures connected or touching. Equal BODY scale across all18; no clipped weapon. True TRANSPARENT RGBA background, no scenery, floor, shadow, glow, text, labels or baked FX. Source layout may contain extra outfits/poses: ignore them and only draw the LCB initial identity in this exact18-pose sequence.

Final18 composed by scripts/compose-lcb-contacts.py: base0..8, extra crouchingsecondary9..11, base9..14. Only alpha masking, whole-pose nearest scaling and alignment. Inputs retained beside source-sheet in inputs/. No head resizing or repainting.
```

## faust-remnant

源图：`public/characters/faust/remnant/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/lobotomy-corp-remnant-faust-portrait.png`、`.cache/references/final-three/lobotomy-corp-remnant-faust-motions.png`

```text
Use case: stylized-concept. Create SIX game sprite poses. IMAGE1 is ONLY user's approved Don PIXEL ART PRECISION / PROPORTION reference: chunky crisp hard pixel clusters, clean dark outline, LIMITED matte few shades, slim CHIBI about THREE HEADS TALL, restrained small facial features. Match its exact detail budget, no realistic illustration, smooth hair rendering or tiny ornate noise. Image2 official Faust appearance; image3 ACTUAL skill motion study. Use ACTING fighter, ignore training dummy, backgrounds and motion effects. FAUST 脑叶公司支部残余. Silver-white bob, blue left eye, BANDAGES covering right eye. Short BLACK jacket with RED hood/lapel/lining over light grey shirt, black trousers belts boots. ONE LONG STRAIGHT RED BLADE sword with dark grip, slender pointed red physical blade, not katana. SIX poses: sword LOW ready head highest; draw blade behind; lift sword overhead windup; fast horizontal RED sword cut right; lunging forward sword cut; low blade recovery. Match red/black jacket panels. EXACT 3 columns x2 rows, six isolated FULLBODY poses in listed reading order, all facing RIGHT side/threequarter side profile, consistent body size and baselines, full limbs/weapons in each cell, wide transparent gutters. True TRANSPARENT RGBA background, no scenery, text, labels, shadows or baked effects. Preserve identity and weapon exactly; do not copy Don clothes/hair.
```

## faust-butler

源图：`public/characters/faust/butler/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/wuthering-heights-butler-faust-portrait.png`、`.cache/references/final-three/wuthering-heights-butler-faust-motions.png`

```text
Use case: stylized-concept. Create SIX game sprite poses. IMAGE1 is ONLY user's approved Don PIXEL ART PRECISION / PROPORTION reference: chunky crisp hard pixel clusters, clean dark outline, LIMITED matte few shades, slim CHIBI about THREE HEADS TALL, restrained small facial features. Match its exact detail budget, no realistic illustration, smooth hair rendering or tiny ornate noise. Image2 official Faust appearance; image3 ACTUAL skill motion study. Use ACTING fighter, ignore training dummy, backgrounds and motion effects. FAUST 呼啸山庄管家. Silver-white bob, small blue eyes, BROWN tailored BUTLER suit jacket and trousers, black waistcoat, pale shirt, GOLD bow ribbon, white gloves, black shoes. WHITE SERVIETTE/TOWEL draped over FOREARM is the signature fighting implement. She uses gloved hands and serviette-assisted arm strikes: NO knife, dagger, sword, gun. SIX poses: formal ready one forearm raised with white towel folded over it; glove fist drawn back towel visible; braced cloth-covered forearm windup; step forward short gloved forearm/palm strike with towel trailing; close hook strike free hand supports towel arm; upright towel over forearm recovery. These gloved strikes are specific to this persona; do not invent a blade. EXACT 3 columns x2 rows, six isolated FULLBODY poses in listed reading order, all facing RIGHT side/threequarter side profile, consistent body size and baselines, full limbs/weapons in each cell, wide transparent gutters. True TRANSPARENT RGBA background, no scenery, text, labels, shadows or baked effects. Preserve identity and weapon exactly; do not copy Don clothes/hair.
```

## faust-n

源图：`public/characters/faust/n/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/the-one-who-grips-faust-portrait.png`、`.cache/references/final-three/the-one-who-grips-faust-motions.png`

```text
Use case: stylized-concept. Create SIX game sprite poses. IMAGE1 is ONLY user's approved Don PIXEL ART PRECISION / PROPORTION reference: chunky crisp hard pixel clusters, clean dark outline, LIMITED matte few shades, slim CHIBI about THREE HEADS TALL, restrained small facial features. Match its exact detail budget, no realistic illustration, smooth hair rendering or tiny ornate noise. Image2 official Faust appearance; image3 ACTUAL skill motion study. Use ACTING fighter, ignore training dummy, backgrounds and motion effects. FAUST N公司执钉者. Silver white bob, intense small blue eyes. WHITE/CREAM gold-edged N CORP tabard/armor with silver pauldrons and greaves, small gold seals, BLACK long cape with red lining, steel armored legs. Weapon ONE ELONGATED LARGE IRON NAIL (dark steel long pointed triangular spike) and one BLACK METAL GAUNTLET with blue electric detail. NO handheld hammer, sword or gun. SIX poses: large nail low ready; lift nail with fist back; black gauntlet braced windup; forward NAIL STAB right; heavy gauntlet palm/fist execution strike with nail still visible in other hand; nail low recovery. Omit gore/victims/electrical effects; retain original armored glove shape. EXACT 3 columns x2 rows, six isolated FULLBODY poses in listed reading order, all facing RIGHT side/threequarter side profile, consistent body size and baselines, full limbs/weapons in each cell, wide transparent gutters. True TRANSPARENT RGBA background, no scenery, text, labels, shadows or baked effects. Preserve identity and weapon exactly; do not copy Don clothes/hair.
```

## faust-multicrack

源图：`public/characters/faust/multicrack/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/multicrack-office-rep-faust-portrait.png`、`.cache/references/final-three/multicrack-office-rep-faust-motions.png`

```text
Use case: stylized-concept. Create SIX game sprite poses. IMAGE1 is ONLY user's approved Don PIXEL ART PRECISION / PROPORTION reference: chunky crisp hard pixel clusters, clean dark outline, LIMITED matte few shades, slim CHIBI about THREE HEADS TALL, restrained small facial features. Match its exact detail budget, no realistic illustration, smooth hair rendering or tiny ornate noise. Image2 official Faust appearance; image3 ACTUAL skill motion study. Use ACTING fighter, ignore training dummy, backgrounds and motion effects. FAUST 多裂纹事务所代表. Silver white bob, HALF of face covered by BLACK ROBOT MASK with ROUND RED optical lenses, other half blue eye and white hair visible. Cropped red/brown leather jacket, pale high collar top, black shorts/trousers with straps, metal legs. FOUR ARMS TOTAL: one original human-looking pair at torso plus a pair of PROSTHETIC ARMS from upper back; the prosthetic arms wield/attach to TWO HUGE RECTANGULAR BLACK GREATSWORDS with deep RED long blade panels. Thick black CABLES connect prosthetics. NOT normal twohand dual swords, no extra six arms. SIX poses: two long blades lowered ready HEAD HIGHEST; prosthetic swords swing backward with torso pair guarding; one prosthetic blade raised windup; first huge sword sweeping right; second robotic sword crosscut right while first retracts; both blades lowered recovery. All four arms and BOTH complete physical sword blades readable; no baked arcs/sparks. EXACT 2 columns x3 rows, six isolated FULLBODY poses in listed reading order, all facing RIGHT side/threequarter side profile, consistent body size and baselines, full limbs/weapons in each cell, wide transparent gutters. True TRANSPARENT RGBA background, no scenery, text, labels, shadows or baked effects. Preserve identity and weapon exactly; do not copy Don clothes/hair.
```

## faust-heishou

源图：`public/characters/faust/heishou/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/heishou-pack-mao-branch-adept-faust-portrait.png`、`.cache/references/final-three/heishou-pack-mao-branch-adept-faust-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES, exactly 3 columns x2 rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION AND PROPORTION reference: crisp chunky pixel clusters, strong dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, small restrained facial features. Match that detail budget. NO smooth digital illustration or micro-detail. Image2 official identity appearance; image3 ACTUAL motion study (acting fighter only, ignore dummy/background/effects). Silver-white bob, face wrapped in grey scarf, wide JAGGED BLACK BAMBOO HAT with TWO long YELLOW TALISMANS hanging off brim, black layered robe and segmented armor, yellow sash. TWO LONG BROAD RECTANGULAR DARK SWORDS with GOLDEN/YELLOW blade markings, one per hand. Weapons straight broad slabs, not thin katana. ready swords low; cross both blades windup; one blade overhead; forward crossing diagonal cut; wide crouched double-sword sweeping cut; recover one blade behind shoulder. Preserve hat and paired marked blades. All six FULL BODY poses face RIGHT side/threequarter side, equal body size, isolated in evenly sized cells with broad transparent gutters; weapons complete and visible. True transparent RGBA background. No scenery, labels, lettering, cast shadow or baked VFX. Do not copy Don hair, weapon, or costume.
```

## faust-ring

源图：`public/characters/faust/ring/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/the-house-of-spiders-the-ring-apprentice-faust-portrait.png`、`.cache/references/final-three/the-house-of-spiders-the-ring-apprentice-faust-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES, exactly 3 columns x2 rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION AND PROPORTION reference: crisp chunky pixel clusters, strong dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, small restrained facial features. Match that detail budget. NO smooth digital illustration or micro-detail. Image2 official identity appearance; image3 ACTUAL motion study (acting fighter only, ignore dummy/background/effects). Faust as House of Spiders Ring Apprentice: white/grey FULL-LENGTH CAGED MEDICAL ARMOR DRESS with overlapping rounded white shell plates and GOLD/YELLOW seams, matching white cage veil/head-dress around the face, narrow YELLOW/GOLD face panel enclosed by white bars, small crownlike metal spikes. Do NOT draw bare silver bob face as ordinary doctor. Huge WHITE AND GOLD SURGICAL CLEAVER broad LONG curved tapered wedge blade, longer than torso, short handle in gloved hands. Follow motion model, NOT the pose of portrait alone. ready enormous cleaver low; draw cleaver backward; overhead lift; full broad cleaver diagonal sweep; long forward lunging cleaver sweep; recovery blade low. Simplify armor detail to chunky pixels. All six FULL BODY poses face RIGHT side/threequarter side, equal body size, isolated in evenly sized cells with broad transparent gutters; weapons complete and visible. True transparent RGBA background. No scenery, labels, lettering, cast shadow or baked VFX. Do not copy Don hair, weapon, or costume.
```

## hong-lcb

源图：`public/characters/hong/lcb/source-sheet.png`

参考：`public/characters/hong/lcb/source-sheet.png`、`.cache/references/approved-ryoshu-style.png`、`.cache/references/final-three/lcb-sinner-hong-lu-portrait.png`

```text
Use case: stylized-concept. Correct the LCB game sprites in IMAGE1. IMAGE1 and IMAGE3 are the sole CHARACTER IDENTITY, clothing and WEAPON authorities. IMAGE2 RYOSHU is ONLY adult PROPORTION / coarse PIXEL precision reference; NEVER copy her cigarette, face, hairstyle, shirt, katana or coat-specific decorations. Hong Lu: LONG BLUE-BLACK HAIR tied in high ponytail with JADE hair ornament, small turquoise eyes; WHITE SHIRT RED TIE black LCB coat, blacktrousers boots. ONE LONG RED-WRAPPED GUANDAO with broad silver crescent blade and RED RIBBON at bladebase. NOT katana, NOT lance, NO cigarette, no bobhair. Match image2's FOUR to FOUR-AND-A-QUARTER HEADS TALL adult anatomy: whole hair/head about23-24% standingbodyheight, LONG torso and legs, small understated side-profile eyes. Do not shrink whole sprite; redraw body proportion with smaller head. No big round chibi eye or baby cheeks. Pixel art has coarse HARD PIXEL CLUSTERS with clean dark outlines and ONLY 3 matte shades per material. Hair is broad simple blocks, no tiny strand sparkle, no glossy gradient, no fine embroidery. Target native body about64pixels tall with head about14-15pixels, export integer nearestneighbour style. EXACT THREE COLUMNS x SIX ROWS, total18 FULLBODY poses in reading order: 1 idle, weapon LOW and head highest;2 run leftcontact;3 run passing;4 run airborne stride;5 run rightcontact;6 run extended stride;7 rising jump;8 falling jump;9 hurt;10 guard;11 lying down;12 victory weapon upright;13 weaponwindup;14 overhead weaponwindup;15 horizontalweapon contact RIGHT;16 lowweapon lungingcontact RIGHT;17 upright recovery;18 forwarddash. All face RIGHT in side/threequarter SIDE profile. Reuse each character's OWN weapon in every pose. Entire weapons and limbs fully inside each cell, VERY WIDE transparent gutters, no two figures connected or touching. Equal BODY scale across all18; no clipped weapon. True TRANSPARENT RGBA background, no scenery, floor, shadow, glow, text, labels or baked FX. Source layout may contain extra outfits/poses: ignore them and only draw the LCB initial identity in this exact18-pose sequence.
```

## hong-normals

源图：`public/characters/hong/normals/source-sheet.png`

参考：`.cache/references/hong-new-lcb-single.png`、`public/characters/hong/normals/source-sheet.png`

```text
Use case: stylized-concept.18 fullbody Hong Lu LCB weapon contact sprites. Image1 is the corrected SMALLER HEAD, slender stylized anime body, sideface, costume and GUANDAO authority. Image2 only supplies18 contact ideas; redraw it with image1's body and smallhead, do not keep image2's large head. EXACT3columns6rows portrait. Row1 three standing primary contacts: light thrust,medium sweep,heavy rising. Row2 three standing secondary contacts: handle jab,low sweep,overhead. Row3 three CROUCHING primary contacts. Row4 three CROUCHING secondary contacts. Row5 three AIRBORNE primary downward contacts. Row6 three AIRBORNE secondary downward contacts. MUST have ALL SIX rows,3figures perrow,18 total, no missing finalrow. Long blueblack ponytail/jade tie, white shirt/redtie/blackLCBcoat/trousers/boots, ONE redwrapped LONG GUANDAO with curved SILVER CRESCENT BLADE and redribbon always visible. Keep wholeweapon in eachcell with huge transparent gutters, figures not touching. Coarsehardpixeldarkoutlines fewmattecolors, no cigarette/no katana/no Fausthair. TransparentRGBA no background,labels,shadow or effects.
```

## hong-liu

源图：`public/characters/hong/liu/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/liu-assoc-south-section-5-hong-lu-portrait.png`、`.cache/references/final-three/liu-assoc-south-section-5-hong-lu-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES, exactly 3 columns x2 rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION AND PROPORTION reference: crisp chunky pixel clusters, strong dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, small restrained facial features. Match that detail budget. NO smooth digital illustration or micro-detail. Image2 official identity appearance; image3 ACTUAL motion study (acting fighter only, ignore dummy/background/effects). Hong Lu long blue-black hair high ponytail/jade ornament, dark BROWN/BLACK martial suit and trousers, red-orange waist details, dark gloves and shoes. LIU ASSOCIATION martial artist using OPEN PALMS, FISTS and KICKS, NO invented sword. Guard; pull back burning palm; raised bent knee windup; lunging flame palm; low sweeping forward leg kick; martial recovery. Keep clean bodily silhouette, flame is runtime effect not painted aura. All six FULL BODY poses face RIGHT side/threequarter side, equal body size, isolated in evenly sized cells with broad transparent gutters; weapons complete and visible. True transparent RGBA background. No scenery, labels, lettering, cast shadow or baked VFX. Do not copy Don hair, weapon, or costume.
```

## hong-k

源图：`public/characters/hong/k/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/k-corp-class-3-excision-staff-hong-lu-portrait.png`、`.cache/references/final-three/k-corp-class-3-excision-staff-hong-lu-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES, exactly 3 columns x2 rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION AND PROPORTION reference: crisp chunky pixel clusters, strong dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, small restrained facial features. Match that detail budget. NO smooth digital illustration or micro-detail. Image2 official identity appearance; image3 ACTUAL motion study (acting fighter only, ignore dummy/background/effects). Hong Lu blue-black hair and K CORP DARK armored bodysuit with very bright LIME GREEN medical tubing around shoulders/arms, fluorescent green rectangular panels, black cape. ONE LONG DOUBLE-ENDED BLACK AND GREEN EXCISION STAFF: black shaft, long OPEN RECTANGULAR GREEN-FRAMED blade/capsule at BOTH ENDS. It is a STAFF with hollow neon rectangular ends, not a normal sword or syringe. Guard staff diagonal; draw it back; lift staff; horizontal spinning staff sweep; forward low green staff thrust; recovery. Match actual staff shape and tubing. All six FULL BODY poses face RIGHT side/threequarter side, equal body size, isolated in evenly sized cells with broad transparent gutters; weapons complete and visible. True transparent RGBA background. No scenery, labels, lettering, cast shadow or baked VFX. Do not copy Don hair, weapon, or costume.
```

## hong-fullstop

源图：`public/characters/hong/fullstop/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/full-stop-office-rep-hong-lu-portrait.png`、`.cache/references/final-three/full-stop-office-rep-hong-lu-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES, exactly 3 columns x2 rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION AND PROPORTION reference: crisp chunky pixel clusters, strong dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, small restrained facial features. Match that detail budget. NO smooth digital illustration or micro-detail. Image2 official identity appearance; image3 ACTUAL motion study (acting fighter only, ignore dummy/background/effects). Hong Lu long blue-black ponytail, rectangular dark sunglasses, charcoal long TRENCHCOAT with RED tabs over black tactical suit, gloves and boots. ONE COMPACT BLACK HANDGUN WITH LONG THIN BAYONET projecting under the barrel; combine shooting AND close bayonet slash. Gun aim low ready; draw pistol arm back; brace two hands aim; fully extended horizontal gunshot aiming right; crouched bayonet sweeping stab right with gun; recover aim. Do not turn it into two guns or ordinary sword. No muzzle flash baked. All six FULL BODY poses face RIGHT side/threequarter side, equal body size, isolated in evenly sized cells with broad transparent gutters; weapons complete and visible. True transparent RGBA background. No scenery, labels, lettering, cast shadow or baked VFX. Do not copy Don hair, weapon, or costume.
```

## hong-h

源图：`public/characters/hong/h/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/the-lord-of-hongyuan-hong-lu-portrait.png`、`.cache/references/final-three/the-lord-of-hongyuan-hong-lu-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES, exactly 3 columns x2 rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION AND PROPORTION reference: crisp chunky pixel clusters, strong dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, small restrained facial features. Match that detail budget. NO smooth digital illustration or micro-detail. Image2 official identity appearance; image3 ACTUAL motion study (acting fighter only, ignore dummy/background/effects). Hong Lu as LORD OF HONGYUAN: long dark hair, RED tuft/ribbon and golden hair ornament, long BLACK Chinese ceremonial robe with RED brocade front panels, dark trousers/shoes. VERY LONG RED-BROWN POLEARM with an elaborate SILVER narrow wavy forked/branched spear blade and a HOOKED secondary edge, follow motion study; not fan or ordinary scythe. Ready poleblade low; lift pole behind; high overhead windup; two-handed long horizontal pole sweep; plunging overhead cut; formal recovery. Simplify embroidery. All six FULL BODY poses face RIGHT side/threequarter side, equal body size, isolated in evenly sized cells with broad transparent gutters; weapons complete and visible. True transparent RGBA background. No scenery, labels, lettering, cast shadow or baked VFX. Do not copy Don hair, weapon, or costume.
```

## hong-s

源图：`public/characters/hong/s/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/s-corp-ch-unokkun-hong-lu-portrait.png`、`.cache/references/final-three/s-corp-ch-unokkun-hong-lu-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES, exactly 3 columns x2 rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION AND PROPORTION reference: crisp chunky pixel clusters, strong dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, small restrained facial features. Match that detail budget. NO smooth digital illustration or micro-detail. Image2 official identity appearance; image3 ACTUAL motion study (acting fighter only, ignore dummy/background/effects). Hong Lu S Corp CH'UNOKKUN: long straight BLACK hair partly covering eyes, pale cold face, black ragged layered cloak/robe, red-orange ROPE winding waist/forearms, ONE WIDE SLIGHTLY CURVED DARK SWORD with worn silver edge plus a separate long braided ORANGE-RED OHRA BOND ROPE. Left hand throws rope, right wields broad sword. ready sword low rope coiled; extend rope arm; high sword lift; throw rope loop forward without sword disappearing; step in broad sword cut while rope trails; recover with sword and rope. No katana sheath. All six FULL BODY poses face RIGHT side/threequarter side, equal body size, isolated in evenly sized cells with broad transparent gutters; weapons complete and visible. True transparent RGBA background. No scenery, labels, lettering, cast shadow or baked VFX. Do not copy Don hair, weapon, or costume.
```

## hong-cinq

源图：`public/characters/hong/cinq/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/cinq-assoc-east-section-3-hong-lu-portrait.png`、`.cache/references/final-three/cinq-assoc-east-section-3-hong-lu-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES, exactly 3 columns x2 rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION AND PROPORTION reference: crisp chunky pixel clusters, strong dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, small restrained facial features. Match that detail budget. NO smooth digital illustration or micro-detail. Image2 official identity appearance; image3 ACTUAL motion study (acting fighter only, ignore dummy/background/effects). Hong Lu CINQ EAST SECTION 3 (EAST, NOT SOUTH): black FEDORA with blue band, black short layered coat with bright turquoise scarf/arm accents, white rolled cuffs, black trousers and contrasting white diagonal lower-leg wraps/shoes, jade/dark hair ponytail. This is EASTERN MARTIAL PALM combat; NO rapier, NO blade, NO musketeer feather. ready low open palms; draw open palm to waist; turned coiled stance; extended palm thrust right; turning two-palm forward strike; recover fedora silhouette. Follow actual jade energy PALM motions, no effects baked. All six FULL BODY poses face RIGHT side/threequarter side, equal body size, isolated in evenly sized cells with broad transparent gutters; weapons complete and visible. True transparent RGBA background. No scenery, labels, lettering, cast shadow or baked VFX. Do not copy Don hair, weapon, or costume.
```

## sin-lcb

源图：`public/characters/sin/lcb/source-sheet.png`

参考：`public/characters/sin/lcb/source-sheet.png`、`.cache/references/approved-ryoshu-style.png`、`.cache/references/final-three/lcb-sinner-sinclair-portrait.png`

```text
Use case: stylized-concept. Correct the LCB game sprites in IMAGE1. IMAGE1 and IMAGE3 are the sole CHARACTER IDENTITY, clothing and WEAPON authorities. IMAGE2 RYOSHU is ONLY adult PROPORTION / coarse PIXEL precision reference; NEVER copy her cigarette, face, hairstyle, shirt, katana or coat-specific decorations. Sinclair: SHORT WAVY BLOND HAIR, small hazel/green eyes, slim YOUNG ADULT with adult four-head proportions; white shirt RED TIE, BLACK LCB coat, blacktrousers boots. ONE LONG BLACK HALBERD: broad curved silver-edged AXEHEAD with top/front SPEAR TIP, darkshaft and pointed butt. Keep both axeblade and spearpoint. No katana, no cigarette. Match image2's FOUR to FOUR-AND-A-QUARTER HEADS TALL adult anatomy: whole hair/head about23-24% standingbodyheight, LONG torso and legs, small understated side-profile eyes. Do not shrink whole sprite; redraw body proportion with smaller head. No big round chibi eye or baby cheeks. Pixel art has coarse HARD PIXEL CLUSTERS with clean dark outlines and ONLY 3 matte shades per material. Hair is broad simple blocks, no tiny strand sparkle, no glossy gradient, no fine embroidery. Target native body about64pixels tall with head about14-15pixels, export integer nearestneighbour style. EXACT THREE COLUMNS x SIX ROWS, total18 FULLBODY poses in reading order: 1 idle, weapon LOW and head highest;2 run leftcontact;3 run passing;4 run airborne stride;5 run rightcontact;6 run extended stride;7 rising jump;8 falling jump;9 hurt;10 guard;11 lying down;12 victory weapon upright;13 weaponwindup;14 overhead weaponwindup;15 horizontalweapon contact RIGHT;16 lowweapon lungingcontact RIGHT;17 upright recovery;18 forwarddash. All face RIGHT in side/threequarter SIDE profile. Reuse each character's OWN weapon in every pose. Entire weapons and limbs fully inside each cell, VERY WIDE transparent gutters, no two figures connected or touching. Equal BODY scale across all18; no clipped weapon. True TRANSPARENT RGBA background, no scenery, floor, shadow, glow, text, labels or baked FX. Source layout may contain extra outfits/poses: ignore them and only draw the LCB initial identity in this exact18-pose sequence.
```

## sin-normals

源图：`public/characters/sin/normals/source-sheet.png`

参考：`public/characters/sin/normals/source-sheet.png`、`.cache/references/approved-ryoshu-style.png`、`.cache/references/final-three/lcb-sinner-sinclair-portrait.png`

```text
Use case: stylized-concept. Correct the LCB game sprites in IMAGE1. IMAGE1 and IMAGE3 are the sole CHARACTER IDENTITY, clothing and WEAPON authorities. IMAGE2 RYOSHU is ONLY adult PROPORTION / coarse PIXEL precision reference; NEVER copy her cigarette, face, hairstyle, shirt, katana or coat-specific decorations. Sinclair: SHORT WAVY BLOND HAIR, small hazel/green eyes, slim YOUNG ADULT with adult four-head proportions; white shirt RED TIE, BLACK LCB coat, blacktrousers boots. ONE LONG BLACK HALBERD: broad curved silver-edged AXEHEAD with top/front SPEAR TIP, darkshaft and pointed butt. Keep both axeblade and spearpoint. No katana, no cigarette. Match image2's FOUR to FOUR-AND-A-QUARTER HEADS TALL adult anatomy: whole hair/head about23-24% standingbodyheight, LONG torso and legs, small understated side-profile eyes. Do not shrink whole sprite; redraw body proportion with smaller head. No big round chibi eye or baby cheeks. Pixel art has coarse HARD PIXEL CLUSTERS with clean dark outlines and ONLY 3 matte shades per material. Hair is broad simple blocks, no tiny strand sparkle, no glossy gradient, no fine embroidery. Target native body about64pixels tall with head about14-15pixels, export integer nearestneighbour style. EXACT THREE COLUMNS x SIX ROWS, total18 FULLBODY poses in reading order: FIRST SIX: STANDING six weapon contacts (light primary, medium primary horizontal, heavy primary rising, light secondary, medium secondary low sweep, heavy secondary overhead). NEXT SIX: CROUCHING same six contacts. LAST SIX: AIRBORNE same six contacts with attacks angled down to facilitate jump-ins. Weapon always visible; this refers to weapon attack families, not literal unarmed punches or kicks. All face RIGHT in side/threequarter SIDE profile. Reuse each character's OWN weapon in every pose. Entire weapons and limbs fully inside each cell, VERY WIDE transparent gutters, no two figures connected or touching. Equal BODY scale across all18; no clipped weapon. True TRANSPARENT RGBA background, no scenery, floor, shadow, glow, text, labels or baked FX. Source layout may contain extra outfits/poses: ignore them and only draw the LCB initial identity in this exact18-pose sequence.
```

## sin-mariachi

源图：`public/characters/sin/mariachi/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/los-mariachis-jefe-sinclair-portrait.png`、`.cache/references/final-three/los-mariachis-jefe-sinclair-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES exactly 3columns x2rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION/PROPORTION reference: chunky crisp hard pixel clusters, clear dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, restrained small face. Match detail budget, NO smooth illustration or tiny ornament noise. Image2 official appearance; Image3 ACTUAL motion study (acting fighter only ignore dummy and effects). Sinclair short BLOND hair shaded by large TAN/GOLD SOMBRERO with black band; WHITE SHIRT, embroidered black short waistcoat, pale yellow tie/bow, GREEN trousers with dark decorative sidebuttons, darkshoes. TWO ROUND RED MARACAS with small handles, one in each hand. Not guitar, trumpet, knives or bare fists. Ready two maracas low; draw one maraca back dancer stance; raise both maracas crosswindup; stepping forward maraca strike; turning two-maraca sweeping dance strike; recovery dancer guard. Preserve maracas in all poses. All FULLBODY six poses face RIGHT side/threequarter-side, equal body size and baseline, complete weapons and limbs in EACH cell with broad transparent gutters. True TRANSPARENT RGBA background, no scenery, labels, shadows or baked special effects. Do not copy Don clothes/weapon/hair.
```

## sin-redsheet

源图：`public/characters/sin/redsheet/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/lobotomy-ego-red-sheet-sinclair-portrait.png`、`.cache/references/final-three/lobotomy-ego-red-sheet-sinclair-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES exactly 3columns x2rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION/PROPORTION reference: chunky crisp hard pixel clusters, clear dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, restrained small face. Match detail budget, NO smooth illustration or tiny ornament noise. Image2 official appearance; Image3 ACTUAL motion study (acting fighter only ignore dummy and effects). Sinclair blond fringe, weary small eyes, dark BROWN/BLACK short traditional coat and trousers, orange YELLOW PAPER TALISMANS with dark script wrapping arms/boots and weapon. ONE LONG STRAIGHT DARK STAFF almost bodylength-and-half with YELLOW TALISMANS taped along it; no axehead, no firearm, no conventional metal sword. Read actual motion study: twohanded staff swings. Ready tall staff diagonal; draw staff back; overhead staff windup; horizontal twohanded staff sweep; low longstaff thrust; staffguard recovery. Small paper strips hanging but no baked aura. All FULLBODY six poses face RIGHT side/threequarter-side, equal body size and baseline, complete weapons and limbs in EACH cell with broad transparent gutters. True TRANSPARENT RGBA background, no scenery, labels, shadows or baked special effects. Do not copy Don clothes/weapon/hair.
```

## sin-cinq

源图：`public/characters/sin/cinq/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/cinq-assoc-south-section-4-director-sinclair-portrait.png`、`.cache/references/final-three/cinq-assoc-south-section-4-director-sinclair-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES exactly 3columns x2rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION/PROPORTION reference: chunky crisp hard pixel clusters, clear dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, restrained small face. Match detail budget, NO smooth illustration or tiny ornament noise. Image2 official appearance; Image3 ACTUAL motion study (acting fighter only ignore dummy and effects). Sinclair blond fringe, blue broad-brimmed MUSKETEER HAT with WHITE FEATHER, long tailored BLUE-and-black coat with pale trim, black fitted trousers/gloves/boots. ONE slender STRAIGHT SILVER RAPIER, round handguard; other hand empty for fencing balance. Ready low rapier; coiled fencing windup; high rapier windup; long low forward fencing LUNGE blade perfectly horizontal; extended second piercing thrust; recover fencing stance. Distinct slender rapier, no saber/katana. All FULLBODY six poses face RIGHT side/threequarter-side, equal body size and baseline, complete weapons and limbs in EACH cell with broad transparent gutters. True TRANSPARENT RGBA background, no scenery, labels, shadows or baked special effects. Do not copy Don clothes/weapon/hair.
```

## sin-devyat

源图：`public/characters/sin/devyat/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/devyat-assoc-north-section-3-sinclair-portrait.png`、`.cache/references/final-three/devyat-assoc-north-section-3-sinclair-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES exactly 3columns x2rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION/PROPORTION reference: chunky crisp hard pixel clusters, clear dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, restrained small face. Match detail budget, NO smooth illustration or tiny ornament noise. Image2 official appearance; Image3 ACTUAL motion study (acting fighter only ignore dummy and effects). Sinclair blond hair with glowing turquoise squared GOGGLES on forehead; oversized TEAL winter courier PUFFER COAT with black belts/straps, dark trousers/boots. Holds a HUGE RECTANGULAR INDUSTRIAL COURIER TRUNK with dark scratched metal surface and TEAL illuminated seams, fold-out box/gadget panels. Weapon IS the cargo trunk transformed into blunt hammer/ram. Ready rectangular trunk by side; swing box back; lift box with handle; horizontal trunk-ram forward with angular opened hammer module; overhead box hammer slam; recover carrying trunk. No invented sword or longhandle hammer; keep mechanical BOX clear. All FULLBODY six poses face RIGHT side/threequarter-side, equal body size and baseline, complete weapons and limbs in EACH cell with broad transparent gutters. True TRANSPARENT RGBA background, no scenery, labels, shadows or baked special effects. Do not copy Don clothes/weapon/hair.
```

## sin-pinky

源图：`public/characters/sin/pinky/source-sheet.png`

参考：`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/the-house-of-spiders-the-pinky-apprentice-sinclair-portrait.png`、`.cache/references/final-three/the-house-of-spiders-the-pinky-apprentice-sinclair-motions.png`

```text
Use case: stylized-concept. SIX game SPRITES exactly 3columns x2rows reading order. Image1 ONLY user's approved Don PIXEL ART PRECISION/PROPORTION reference: chunky crisp hard pixel clusters, clear dark outline, limited matte shades, slim CHIBI about THREE HEADS TALL, restrained small face. Match detail budget, NO smooth illustration or tiny ornament noise. Image2 official appearance; Image3 ACTUAL motion study (acting fighter only ignore dummy and effects). Sinclair blond sideparted hair, small grey-green eyes, severe black/dark-blue long martial ROBE with high collar, pale blue-grey cuff/hip accents and belt, dark trousers/boots. LONG CURVED SILVER SINGLE-EDGED SWORD with pale patterned blade and BLACK SHEATH worn at hip, actual katana-like shape. Ready hand on sword/sheath; draw blade back; raised sword windup; long horizontal draw-cut right; low advancing curved sword sweep; resheathing recovery. Keep blade physically solid and long, no magic replacing it. All FULLBODY six poses face RIGHT side/threequarter-side, equal body size and baseline, complete weapons and limbs in EACH cell with broad transparent gutters. True TRANSPARENT RGBA background, no scenery, labels, shadows or baked special effects. Do not copy Don clothes/weapon/hair.
```

## sin-crimson

源图：`public/characters/sin/crimson/source-sheet.png`

参考：`public/characters/sin/crimson/source-sheet.png`、`public/characters/don/queen/source-sheet.png`、`.cache/references/final-three/crimson-god-sinclair-motions.png`

```text
Use case: stylized-concept. Edit IMAGE1 Sinclair CRIMSON GOD sixpose game sheet to avoid all touching and overlap. Preserve the blond boy, RED/IVORY RIB armor, RED BLACK CAPE held by four additional skeletal back arms, very LONG segmented VERTEBRAL BONE SWORD and ONE enormous FIVE-FINGERED WHITE CLAW. Image2 ONLY approved chunky Don PIXEL PRECISION/proportion reference, slim three-head chibi, few matte shades, crisp hard pixel blocks and dark outline. Image3 original in-game motion to preserve correct transformed weapon. Output SIX ISOLATED FULLBODY right-facing poses in EXACT TWO COLUMNS x THREE ROWS portrait layout, wide gutters at least 15% cellwidth around ALL weapons and ALL cape fingers. Shrink characters to fit ENTIRE long sword and giant claw, do not overlap neighboring figures. Reading order: 1 low bonesword ready (head highest, sword low, four backarms hold cape);2 bonesword drawn back;3 giant main claw drawn back, sword visible;4 long segmented bonesword sweep right;5 huge fivefinger main claw thrust right, bonesword trails;6 low bonesword recovery cape spread. Only six figures. No shadows, effects, floor, background, words or labels. True transparent RGBA. Do not add painted red glow or loose bone fragments outside poses.
```

