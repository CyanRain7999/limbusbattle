"""Combine complete generated poses; only alpha masking, alignment and NEAREST scaling.

Usage: python scripts/compose-lcb-contacts.py base15.png extra18.png output.png
The second source's three separate crouching secondary contacts replace missing
cells in the first source. Its two touching primary contacts are never used.
"""
from pathlib import Path
import sys,json
from PIL import Image,ImageFilter,ImageChops
from sprite_anchor import body_column


def components(path):
    im=Image.open(path).convert('RGBA');w,h=im.size;a=im.getchannel('A').tobytes();seen=bytearray(w*h);result=[]
    for start,v in enumerate(a):
        if v<100 or seen[start]:continue
        q=[start];seen[start]=1;ps=[]
        while q:
            p=q.pop();ps.append(p);x,y=p%w,p//w
            for o in [p-1 if x else -1,p+1 if x<w-1 else -1,p-w if y else -1,p+w if y<h-1 else -1]:
                if o>=0 and not seen[o] and a[o]>=100:seen[o]=1;q.append(o)
        if len(ps)>500:
            xs=[p%w for p in ps];ys=[p//w for p in ps]
            result.append(dict(pixels=ps,x=body_column(ps,w),bottom=max(ys)+1,bounds=(min(xs),min(ys),max(xs)+1,max(ys)+1)))
    return im,result


base,bs=components(sys.argv[1]);extra,es=components(sys.argv[2]);assert len(bs)==15
ordered=[]
by_y=sorted(bs,key=lambda c:c['bottom'])
for i in range(0,15,3):ordered+=sorted(by_y[i:i+3],key=lambda c:c['x'])
secondary=[min(es,key=lambda c:abs(c['x']-x)+2*abs(c['bottom']-650)) for x in [900,1160,1410]]
assert len({c['x'] for c in secondary})==3
first_extra=min([c for c in es if c['bottom']<420],key=lambda c:c['x'])
scale_a=300/(ordered[0]['bounds'][3]-ordered[0]['bounds'][1]);scale_b=300/(first_extra['bounds'][3]-first_extra['bounds'][1])
items=[(base,c,scale_a)for c in ordered[:9]]+[(extra,c,scale_b)for c in secondary]+[(base,c,scale_a)for c in ordered[9:]]
out=Image.new('RGBA',(800*3,640*6))
for i,(source,c,scale)in enumerate(items):
    w,h=source.size;mask_bytes=bytearray(w*h)
    for p in c['pixels']:mask_bytes[p]=255
    mask=Image.frombytes('L',(w,h),bytes(mask_bytes)).filter(ImageFilter.MaxFilter(5));cut=source.copy();cut.putalpha(ImageChops.multiply(source.getchannel('A'),mask));x0,y0,x1,y1=c['bounds'];cut=cut.crop(c['bounds']);cut=cut.resize((round(cut.width*scale),round(cut.height*scale)),Image.Resampling.NEAREST)
    frame=Image.new('RGBA',(800,640));frame.alpha_composite(cut,(340-round((c['x']-x0)*scale),610-round((c['bottom']-y0)*scale)));out.alpha_composite(frame,(i%3*800,i//3*640))
dest=Path(sys.argv[3]);out.save(dest,optimize=True)
(dest.parent/'source-grid.json').write_text(json.dumps({'columns':3,'count':18},indent=2)+'\n',encoding='utf8')
(dest.parent/'source-composition.json').write_text(json.dumps({'base':Path(sys.argv[1]).name,'extra':Path(sys.argv[2]).name,'map':'base 0..8, extra crouch secondary 9..11, base 9..14','processing':'alpha mask, translate, uniform whole-figure nearest-neighbour resize; no repainting'},indent=2)+'\n',encoding='utf8')
print('Composed 18 complete contacts; no joined poses used.')
