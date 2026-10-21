"""Decode audited English GOTY bitmap fonts and UI references into private IR.

No copyrighted data is embedded in this source. Latin-1 decoding is intentional:
the original CharList contains individual bytes, not UTF-8 or GBK characters.
"""
import ast
import hashlib
import json
import re
from pathlib import Path
from PIL import Image
from analyze_local_goty import Textures,resource_manifest,decode_reanim


def font_ir(path):
    text=path.read_bytes().decode('latin-1')
    definitions={name:ast.literal_eval(value.strip()) for name,value in
                 re.findall(r'Define\s+(\w+)\s+(\(.*?\))\s*;\s*(?=Define|CreateLayer)',text,re.S)}
    chars=definitions['CharList']
    if len(chars)!=len(set(chars)) or not all(len(c)==1 for c in chars):
        raise ValueError('Ambiguous original character mapping')
    widths,rects,offsets=[definitions[k] for k in ['WidthList','RectList','OffsetList']]
    if not len(chars)==len(widths)==len(rects)==len(offsets):
        raise ValueError('Font list lengths differ')
    glyphs={c:{'advance':w,'rect':r,'offset':o} for c,w,r,o in zip(chars,widths,rects,offsets)}
    glyphs[' ']={'advance':5,'rect':[0,0,0,0],'offset':[0,0]}
    layers=[]
    for name,body in re.findall(r'CreateLayer\s+(\w+)\s*;(.*?)(?=CreateLayer|SetDefaultPointSize|$)',text,re.S):
        image=re.search(r"LayerSetImage\s+\w+\s+'([^']+)'",body).group(1)
        def number(field,default=0):
            match=re.search(r'LayerSet'+field+r'\s+\w+\s+(-?\d+)',body)
            return int(match.group(1)) if match else default
        layers.append({'name':name,'image':image,'ascent':number('Ascent'),
                       'padding':number('AscentPadding'),'spacingOffset':number('LineSpacingOffset')})
    height=max(r[3]+o[1] for r,o in zip(rects,offsets))
    return {'glyphs':glyphs,'layers':layers,'height':height,
            'ascent':max(l['ascent'] for l in layers),
            'lineHeight':height+max(l['spacingOffset'] for l in layers),
            'encoding':'ISO-8859-1 byte mapping; this audited file has no CJK',
            'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest()}


def export(base,out):
    out.mkdir(parents=True,exist_ok=True)
    manifest=resource_manifest(base);textures=Textures(base,manifest)
    fonts={}
    for name in ['BrianneTod16','HouseofTerror16','DwarvenTodcraft18']:
        path=base/f'data/{name}.txt'
        if not path.exists():continue
        data=font_ir(path)
        for layer in data['layers']:
            source=base/f'data/{layer["image"]}.png'
            if source.exists():
                image=Image.open(source).convert('RGBA')
            else:
                source=base/f'data/_{layer["image"]}.png'
                mask=Image.open(source).convert('L')
                image=Image.new('RGBA',mask.size,'white');image.putalpha(mask)
            filename=f'font-{layer["image"]}.png';image.save(out/filename)
            layer['url']='/'+filename
        fonts[name]=data
    ids=[key for key,value in manifest.items() if value['type']=='Image' and
         (key.startswith('IMAGE_STORE_') or key.startswith('IMAGE_ZEN') or key in
          ['IMAGE_TREEFOOD','IMAGE_TREEOFWISDOMICON','IMAGE_DIALOG_TOPLEFT','IMAGE_DIALOG_TOPMIDDLE','IMAGE_DIALOG_TOPRIGHT','IMAGE_DIALOG_CENTERLEFT','IMAGE_DIALOG_CENTERMIDDLE','IMAGE_DIALOG_CENTERRIGHT','IMAGE_DIALOG_BOTTOMLEFT','IMAGE_DIALOG_BOTTOMMIDDLE','IMAGE_DIALOG_BOTTOMRIGHT','IMAGE_BUTTON_LEFT','IMAGE_BUTTON_MIDDLE','IMAGE_BUTTON_RIGHT'])]
    images={};missing=[]
    for rid in ids:
        try:
            image=textures.image(rid);image.save(out/f'{rid}.png')
            images[rid]={'url':'/'+rid+'.png','width':image.width,'height':image.height,
                         'attributes':manifest[rid]['attributes'],**textures.records[rid]}
        except FileNotFoundError as error:missing.append({'id':rid,'error':str(error)})
    (out/'ui.json').write_text(json.dumps({'fonts':fonts,'images':images,'missing':missing},ensure_ascii=True),encoding='utf-8')
    print(json.dumps({'fonts':{name:{'glyphs':len(f['glyphs']),'layers':len(f['layers']),'lineHeight':f['lineHeight']} for name,f in fonts.items()},'uiImages':len(images),'missing':missing},indent=2))


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base',type=Path);parser.add_argument('out',type=Path)
    args=parser.parse_args();export(args.base,args.out)
