"""Slice generated RGBA sheets into aligned frames without repainting the art.
Requires Pillow. Run from project root: python scripts/prepare-sprites.py
The source has long weapons crossing cell bounds, so isolate alpha components
instead of blindly cropping each grid square. Preserve source colour and alpha.
"""
from collections import Counter
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops
import json

ROOT = Path(__file__).resolve().parent.parent
for character in ['don', 'heath']:
    folder = ROOT / 'public' / 'characters' / character / 'lcb'
    source = Image.open(folder / 'source-sheet.png').convert('RGBA')
    width, height = source.size
    alpha = source.getchannel('A').tobytes()
    seen = bytearray(width * height)
    components = []
    for start, value in enumerate(alpha):
        if value < 100 or seen[start]:
            continue
        seen[start] = 1
        queue, pixels = [start], []
        while queue:
            pos = queue.pop()
            x, y = pos % width, pos // width
            pixels.append(pos)
            for other in [pos-1 if x else -1, pos+1 if x<width-1 else -1, pos-width if y else -1, pos+width if y<height-1 else -1]:
                if other >= 0 and not seen[other] and alpha[other] >= 100:
                    seen[other] = 1
                    queue.append(other)
        if len(pixels) > 500:
            components.append(pixels)
    assert len(components) == 36, f'{character}: expected 36 figures, got {len(components)}'
    frames = {}
    anchors = []
    for pixels in components:
        cell = Counter(min(5,int((pos//width)/height*6))*6+min(5,int((pos%width)/width*6)) for pos in pixels).most_common(1)[0][0]
        assert cell not in frames, f'{character}: duplicate cell {cell}'
        xs = sorted(pos % width for pos in pixels)
        ys = [pos // width for pos in pixels]
        # Median mass anchors the body independently of the lance/bat's reach.
        anchor_x, baseline = xs[len(xs)//2], max(ys)+1
        bounds = (max(0,min(xs)-2), max(0,min(ys)-2), min(width,max(xs)+3), min(height,max(ys)+3))
        mask = Image.new('L', source.size)
        mask_bytes = bytearray(width*height)
        for pos in pixels:
            mask_bytes[pos] = 255
        mask.frombytes(bytes(mask_bytes))
        mask = mask.filter(ImageFilter.MaxFilter(5))
        isolated = source.copy()
        isolated.putalpha(ImageChops.multiply(source.getchannel('A'),mask))
        frame = Image.new('RGBA',(448,288))
        frame.alpha_composite(isolated.crop(bounds),(208-anchor_x+bounds[0],264-baseline+bounds[1]))
        frames[cell] = frame
        anchors.append({'frame':cell,'source_bounds':bounds,'source_anchor':[anchor_x,baseline]})
    sheet = Image.new('RGBA',(448*6,288*6))
    for index,frame in frames.items():
        sheet.alpha_composite(frame,((index%6)*448,(index//6)*288))
    sheet.save(folder/'fighter.png',optimize=True)
    first=next(a for a in anchors if a['frame']==0)
    scale=64/(first['source_bounds'][3]-first['source_bounds'][1]-4)
    portrait=frames[0].crop((72,0,344,288))
    portrait.resize((round(272*scale),round(288*scale)),Image.Resampling.NEAREST).save(folder/'portrait.png',optimize=True)
    (folder/'frames.json').write_text(json.dumps({'frameWidth':448,'frameHeight':288,'origin':[208/448,264/288],'scaleTo64':scale,'states':{'idle':[0],'run':[6,7,8,9,10,11],'attack':[12,13,14,15,16,17],'jump':[18],'fall':[19],'hit':[20],'guard':[21],'down':[22],'win':[23],'persona1':[24,25,26,27,28,29],'persona2':[30,31,32,33,34,35]},'anchors':sorted(anchors,key=lambda a:a['frame'])},indent=2),encoding='utf-8')
    print(character, '36 aligned RGBA frames', sheet.size, 'pixel scale',round(scale,3))
