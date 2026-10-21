"""Run reviewed, pinned pvz2godot against private user-owned animation files.

Conversion and internal numerical verification only, NOT a Godot render test.
"""
import argparse
import hashlib
import importlib
import json
from pathlib import Path
import sys


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base',type=Path)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    root=Path(__file__).resolve().parents[1]
    if not args.out.resolve().is_relative_to((root/'private').resolve()):
        parser.error('Results must remain private')
    lock=json.loads((root/'research/source-lock.json').read_text(encoding='utf-8'))
    repo=next(r for r in lock['repositories'] if r['repository']=='ec50n9/pvz2godot')
    sources=root/'research/sources/pvz2godot'
    for name in ['reanim_parse.py','convert.py','verify.py','font2fnt.py']:
        expected=next(f['sha256'] for f in repo['files'] if f['path']==name)
        if hashlib.sha256((sources/name).read_bytes()).hexdigest()!=expected:
            raise ValueError('Reference module differs from reviewed lock')
    sys.path.insert(0,str(sources))
    convert=importlib.import_module('convert')
    verify=importlib.import_module('verify')
    args.out.mkdir(parents=True,exist_ok=True)
    results=[]
    for name in ['TreeOfWisdom','TreeOfWisdomClouds','TreeFood']:
        source=args.base/f'compiled/reanim/{name}.reanim.compiled'
        output=args.out/f'{name}.tscn'
        textures=(args.out/'textures').resolve().as_posix()
        result={'animation':name,'scope':'Conversion + upstream numerical self-verifier; NOT engine/runtime/visual acceptance'}
        try:
            convert.convert(str(source),[str(args.base/'reanim'),str(args.base/'images')],str(output),textures)
            errors=verify.verify(str(source),str(output))
            result.update({'converted':True,'verifierErrors':errors,'errorCount':len(errors),
                           'outputSha256':hashlib.sha256(output.read_bytes()).hexdigest()})
        except Exception as error:
            result.update({'converted':output.exists(),'exception':f'{type(error).__name__}: {error}'})
        results.append(result)
    (args.out/'result.json').write_text(json.dumps({'referenceCommit':repo['commit'],'results':results},indent=2),encoding='utf-8')
    font_parser=importlib.import_module('font2fnt')
    font_results=[]
    for name in ['BrianneTod16','HouseofTerror16']:
        parsed=font_parser.parse_font_txt(str(args.base/f'data/{name}.txt'))
        chars=parsed['chars']
        font_results.append({'font':name,'parsed':True,'characters':len(chars),
                             'replacementCodepoints':sum('\ufffd' in value for value in chars),
                             'uniqueCharacters':len(set(chars))})
    (args.out/'font-parser-result.json').write_text(json.dumps({'scope':'Parser only; no ffmpeg executed','results':font_results},indent=2),encoding='utf-8')
    print(json.dumps(results,ensure_ascii=False,indent=2))
    print(json.dumps(font_results,indent=2))


if __name__=='__main__':
    main()
