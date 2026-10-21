"""Compose only original GOTY tree tracks. No screenshot segmentation or generated artwork."""
import json,math,hashlib
from pathlib import Path
from PIL import Image
from analyze_local_goty import Textures,resource_manifest,decode_reanim
root=Path(__file__).resolve().parents[1]
base=root/'private/extracted/steam-goty-1.2.0.1096'
textures=Textures(base,resource_manifest(base))
animation=decode_reanim(base/'compiled/reanim/TreeOfWisdom.reanim.compiled')
marker=next(t for t in animation['tracks'] if t['name']=='anim_grow20')
frame=max(i for i,f in enumerate(marker['filled']) if f[6]>=0)
canvas=Image.new('RGBA',(1600,1600))
tracks=[]
for track in animation['tracks']:
    f=track['filled'][frame]
    if track['name'].startswith(('bg','grass','anim_')) or f[6]<0 or f[7]<=0 or not f[8]:continue
    source=textures.image(f[8]).convert('RGBA')
    x,y=f[0]+400,f[1]+600
    a,b=f[4]*math.cos(math.radians(f[2])),f[4]*math.sin(math.radians(f[2]))
    c,d=-f[5]*math.sin(math.radians(f[3])),f[5]*math.cos(math.radians(f[3]))
    det=a*d-b*c
    if abs(det)<1e-9:continue
    transformed=source.transform(canvas.size,Image.Transform.AFFINE,(d/det,-c/det,(c*y-d*x)/det,-b/det,a/det,(b*x-a*y)/det),Image.Resampling.BICUBIC)
    if f[7]<1:transformed.putalpha(transformed.getchannel('A').point(lambda n:round(n*f[7])))
    canvas.alpha_composite(transformed);tracks.append({'track':track['name'],'image':f[8]})
bounds=canvas.getchannel('A').getbbox()
assert bounds,'Original tree is empty'
tree=canvas.crop(bounds)
out=root/'private/branding';out.mkdir(parents=True,exist_ok=True)
square=Image.new('RGBA',(256,256));tree.thumbnail((244,244),Image.Resampling.LANCZOS);square.alpha_composite(tree,((256-tree.width)//2,(256-tree.height)//2))
square.save(out/'tree.png')
square.save(out/'tree.ico',sizes=[(n,n) for n in [16,20,24,32,40,48,64,128,256]])
assert square.getpixel((0,0))[3]==0
(out/'provenance.json').write_text(json.dumps({'source':'compiled/reanim/TreeOfWisdom.reanim.compiled','segment':'anim_grow20','frame':frame,'tracks':tracks,'treeOnly':True,'transparent':True,'sizes':[16,20,24,32,40,48,64,128,256],'sha256':hashlib.sha256((out/'tree.ico').read_bytes()).hexdigest()},indent=2),encoding='utf-8')
print('Original tree-only transparent Windows icon built:',out/'tree.ico')
