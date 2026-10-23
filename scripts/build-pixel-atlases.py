"""Compile aligned art into tiny, nearest-neighbour runtime sprite atlases.

This is deterministic asset packing, not repainting. Source art stays intact.
Commit public/runtime so npm builds (including GitHub Pages) need only Node.
"""
from pathlib import Path
from PIL import Image
import json
import shutil

ROOT=Path(__file__).resolve().parent.parent
runtime=ROOT/'public/runtime'
runtime.mkdir(parents=True,exist_ok=True)
for icon in ['icon-192.png','icon-512.png']:
    shutil.copyfile(ROOT/'public'/icon,runtime/icon)
Image.open(ROOT/'public/icon-512.png').resize((180,180),Image.Resampling.LANCZOS).save(runtime/'apple-touch-icon.png')
(runtime/'.nojekyll').write_text('')
for meta_path in (ROOT/'public/characters').rglob('frames.json'):
    folder=meta_path.parent
    meta=json.loads(meta_path.read_text(encoding='utf-8'))
    base=folder.name=='lcb'
    cols=6 if base else meta['columns']
    count=36 if base else meta['count']
    fw,fh=meta['frameWidth'],meta['frameHeight']
    anchor=[208,264] if base else meta['anchor']
    scale=meta['scaleTo64']
    source=Image.open(folder/'fighter.png').convert('RGBA')
    atlas=Image.new('RGBA',(224*6,128*((count+5)//6)))
    for i in range(count):
        pose=source.crop((i%cols*fw,i//cols*fh,(i%cols+1)*fw,(i//cols+1)*fh))
        pose=pose.resize((round(fw*scale),round(fh*scale)),Image.Resampling.NEAREST)
        frame=Image.new('RGBA',(224,128))
        frame.alpha_composite(pose,(112-round(anchor[0]*scale),116-round(anchor[1]*scale)))
        atlas.alpha_composite(frame,(i%6*224,i//6*128))
    dest=runtime/folder.relative_to(ROOT/'public')
    dest.mkdir(parents=True,exist_ok=True)
    atlas.save(dest/'pixel.png',optimize=True)
    if base:shutil.copyfile(folder/'portrait.png',dest/'portrait.png')
    print(str(dest.relative_to(runtime)),(dest/'pixel.png').stat().st_size,'bytes')
