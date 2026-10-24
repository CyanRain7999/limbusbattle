"""Align the generated six-pose RGBA sheets; preserve all source art pixels.

Only slicing, transparent masking, and translation happen here. The game samples
these sources into a small nearest-neighbour texture at load time.
"""
from collections import Counter
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops
import json
import sys

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
        anchor, baseline = xs[len(xs)//2], max(ys)+1
        bounds = (max(0,min(xs)-2), max(0,min(ys)-2), min(width,max(xs)+3), min(height,max(ys)+3))
        mask = Image.new('L',source.size)
        mask_bytes = bytearray(width*height)
        for p in pixels:
            mask_bytes[p] = 255
        mask.frombytes(bytes(mask_bytes))
        mask = mask.filter(ImageFilter.MaxFilter(5))
        isolated = source.copy()
        isolated.putalpha(ImageChops.multiply(source.getchannel('A'),mask))
        frame = Image.new('RGBA',(800,640))
        frame.alpha_composite(isolated.crop(bounds),(340-anchor+bounds[0],610-baseline+bounds[1]))
        frames[cell] = frame
        anchors.append({'frame':cell,'source_bounds':bounds,'source_anchor':[anchor,baseline]})
    sheet = Image.new('RGBA',(800*cols,640*rows))
    for i, frame in frames.items():
        sheet.alpha_composite(frame,(i%cols*800,i//cols*640))
    sheet.save(folder/'fighter.png',optimize=True)
    first = anchors[0]
    scale = (86 if entry['key']=='sin-crimson' else 82 if entry['key']=='ryoshu-couture' else 78 if entry['key']=='ish-r' else 64)/(275 if entry['key']=='don-t' else first['source_bounds'][3]-first['source_bounds'][1]-4)
    (folder/'frames.json').write_text(json.dumps({'frameWidth':800,'frameHeight':640,'columns':cols,'count':6,'anchor':[340,610],'scaleTo64':scale,'anchors':anchors},indent=2),encoding='utf-8')
    print(entry['key'], '6 RGBA poses', 'scale',round(scale,3))

