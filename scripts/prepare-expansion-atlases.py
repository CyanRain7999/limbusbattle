"""Pack four sinners' two 18-pose sheets; source pixels are never repainted.

The LCB half becomes the existing 36-frame runtime layout. The second half
stays eighteen stand/crouch/air weapon contact poses. Alpha-component masks
preserve long weapons that cross nominal cell boundaries.
"""
from collections import Counter
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops
import json

ROOT = Path(__file__).resolve().parent.parent
FW, FH, AX, AY = 800, 640, 340, 610


def slice_sheet(path):
    source = Image.open(path).convert('RGBA')
    width, height = source.size
    cols = 3 if height > width else 6
    rows = 18 // cols
    alpha = source.getchannel('A').tobytes()
    seen = bytearray(width * height)
    groups = {i: [] for i in range(18)}
    for start, value in enumerate(alpha):
        if value < 100 or seen[start]:
            continue
        queue, pixels = [start], []
        seen[start] = 1
        while queue:
            pos = queue.pop()
            x, y = pos % width, pos // width
            pixels.append(pos)
            for other in [pos-1 if x else -1, pos+1 if x < width-1 else -1,
                          pos-width if y else -1, pos+width if y < height-1 else -1]:
                if other >= 0 and not seen[other] and alpha[other] >= 100:
                    seen[other] = 1
                    queue.append(other)
        if len(pixels) > 500:
            cell = Counter(min(rows-1, int((p//width)/height*rows))*cols
                           + min(cols-1, int((p%width)/width*cols)) for p in pixels).most_common(1)[0][0]
            groups[cell].extend(pixels)
    frames, anchors = [], []
    for cell, pixels in groups.items():
        assert pixels, f'{path}: missing pose {cell}'
        xs = sorted(p % width for p in pixels)
        ys = [p // width for p in pixels]
        anchor, baseline = xs[len(xs)//2], max(ys)+1
        bounds = (max(0, min(xs)-2), max(0, min(ys)-2),
                  min(width, max(xs)+3), min(height, max(ys)+3))
        mask_bytes = bytearray(width*height)
        for p in pixels:
            mask_bytes[p] = 255
        mask = Image.frombytes('L', source.size, bytes(mask_bytes)).filter(ImageFilter.MaxFilter(5))
        isolated = source.copy()
        isolated.putalpha(ImageChops.multiply(source.getchannel('A'), mask))
        frame = Image.new('RGBA', (FW, FH))
        frame.alpha_composite(isolated.crop(bounds), (AX-anchor+bounds[0], AY-baseline+bounds[1]))
        frames.append(frame)
        anchors.append({'frame': cell, 'source_bounds': bounds, 'source_anchor': [anchor, baseline]})
    scale = 64 / (anchors[0]['source_bounds'][3]-anchors[0]['source_bounds'][1]-4)
    return frames, anchors, scale


for sinner in ['ryoshu', 'meur', 'ish', 'rod']:
    for kind in ['lcb', 'normals']:
        folder = ROOT/'public/characters'/sinner/kind
        if not (folder/'source-sheet.png').exists():
            continue
        frames, anchors, scale = slice_sheet(folder/'source-sheet.png')
        order = list(range(18)) if kind == 'normals' else (
            [0]*6 + [1, 2, 3, 4, 5, 1] + [12, 13, 14, 15, 16, 16]
            + [6, 7, 8, 9, 10, 11] + [12, 13, 14, 15, 16, 16]*2)
        sheet = Image.new('RGBA', (FW*6, FH*((len(order)+5)//6)))
        for i, index in enumerate(order):
            sheet.alpha_composite(frames[index], (i%6*FW, i//6*FH))
        sheet.save(folder/'fighter.png', optimize=True)
        meta = {'frameWidth': FW, 'frameHeight': FH, 'columns': 6, 'count': len(order),
                'anchor': [AX, AY], 'scaleTo64': scale, 'sourceFrameMap': order, 'anchors': anchors}
        (folder/'frames.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
        if kind == 'lcb':
            height = max(245, anchors[0]['source_bounds'][3]-anchors[0]['source_bounds'][1]+10)
            portrait = frames[0].crop((AX-160, AY-height, AX+160, AY))
            portrait.resize((round(320*scale), round(height*scale)), Image.Resampling.NEAREST).save(folder/'portrait.png')
        print(sinner, kind, '18 source poses', len(order), 'packed frames', 'scale', round(scale, 3))
