"""Align the generated six-pose RGBA sheets; preserve all source art pixels.

Only slicing, transparent masking, and translation happen here. The game samples
these sources into a small nearest-neighbour texture at load time.
"""
from collections import Counter
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops
import json
import sys
from sprite_anchor import body_column

ROOT = Path(__file__).resolve().parent.parent
metadata = json.loads((ROOT/'src/data/persona-art.json').read_text(encoding='utf-8'))
for entry in metadata:
    if len(sys.argv)>1 and entry['key'] not in sys.argv[1:]:
        continue
    cols=entry.get('sourceColumns',3)
    rows=6//cols
    folder = ROOT/'public/characters'/entry['sinner']/entry['persona']
    path = folder/'source-sheet.png'
    if not path.exists():
        continue
    source = Image.open(path).convert('RGBA')
    width, height = source.size
    alpha = source.getchannel('A').tobytes()
    seen = bytearray(width*height)
    groups = {i: [] for i in range(6)}
    for start, value in enumerate(alpha):
        if value < 100 or seen[start]:
            continue
        queue, pixels = [start], []
        seen[start] = 1
        while queue:
            pos = queue.pop()
            x, y = pos % width, pos // width
            pixels.append(pos)
            for other in [pos-1 if x else -1, pos+1 if x<width-1 else -1, pos-width if y else -1, pos+width if y<height-1 else -1]:
                if other >= 0 and not seen[other] and alpha[other] >= 100:
                    seen[other] = 1
                    queue.append(other)
        if len(pixels) > 500:
            cell = Counter(min(rows-1,int((p//width)/height*rows))*cols+min(cols-1,int((p%width)/width*cols)) for p in pixels).most_common(1)[0][0]
            groups[cell].extend(pixels)
    frames, anchors = {}, []
    for cell, pixels in groups.items():
        assert pixels, f'{entry["key"]}: missing pose {cell}'
        xs = sorted(p%width for p in pixels)
        ys = [p//width for p in pixels]
        anchor = body_column(pixels,width) if entry.get('anchorMode')=='body-column-v1' else xs[len(xs)//2]
        baseline = max(ys)+1
        if entry.get('anchorMode')=='body-column-v1':
            radius=(max(ys)-min(ys)+1)*.35
            # A lowered staff tip must not lift the boots away from the floor.
            body_y=[p//width for p in pixels if abs(p%width-anchor)<=radius]
            baseline=max(body_y)+1
        bounds = (max(0,min(xs)-2), max(0,min(ys)-2), min(width,max(xs)+3), min(height,max(ys)+3))
        mask = Image.new('L',source.size)
        mask_bytes = bytearray(width*height)
        for p in pixels:
            mask_bytes[p] = 255
        mask.frombytes(bytes(mask_bytes))
        mask = mask.filter(ImageFilter.MaxFilter(5))
        isolated = source.copy()
        isolated.putalpha(ImageChops.multiply(source.getchannel('A'),mask))
        frames[cell] = isolated.crop(bounds)
        anchors.append({'frame':cell,'source_bounds':bounds,'source_anchor':[anchor,baseline]})
    # Keep the body origin fixed across poses without clipping long weapons.
    # Expanding transparent margins does not shrink or distort the figure.
    anchor_x=max(340,max(a['source_anchor'][0]-a['source_bounds'][0]+4 for a in anchors))
    anchor_y=max(610,max(a['source_anchor'][1]-a['source_bounds'][1]+4 for a in anchors))
    frame_width=max(800,anchor_x+max(a['source_bounds'][2]-a['source_anchor'][0]+4 for a in anchors))
    frame_height=max(640,anchor_y+max(a['source_bounds'][3]-a['source_anchor'][1]+4 for a in anchors))
    sheet = Image.new('RGBA',(frame_width*cols,frame_height*rows))
    for i, frame in frames.items():
        a=anchors[i]
        sheet.alpha_composite(frame,(i%cols*frame_width+anchor_x-a['source_anchor'][0]+a['source_bounds'][0],i//cols*frame_height+anchor_y-a['source_anchor'][1]+a['source_bounds'][1]))
    sheet.save(folder/'fighter.png',optimize=True)
    first = anchors[0]
    target_height=entry.get('targetPixelHeight',86 if entry['key']=='sin-crimson' else 82 if entry['key']=='ryoshu-couture' else 78 if entry['key']=='ish-r' else 64)
    scale = target_height/(275 if entry['key']=='don-t' else first['source_bounds'][3]-first['source_bounds'][1]-4)
    meta={'frameWidth':frame_width,'frameHeight':frame_height,'columns':cols,'count':6,'anchor':[anchor_x,anchor_y],'scaleTo64':scale,'anchors':anchors}
    if 'runtimeFrameWidth' in entry:meta['runtimeFrameWidth']=entry['runtimeFrameWidth']
    (folder/'frames.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
    print(entry['key'], '6 RGBA poses', 'scale',round(scale,3))

