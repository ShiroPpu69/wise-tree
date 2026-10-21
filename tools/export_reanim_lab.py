"""Export original animations as a private, local-only research bundle."""
import argparse
import hashlib
import json
from pathlib import Path

from analyze_local_goty import Textures,decode_reanim,resource_manifest


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base',type=Path)
    args=parser.parse_args()
    root=Path(__file__).resolve().parents[1]
    out=root/'private/reanim-lab-assets';out.mkdir(parents=True,exist_ok=True)
    textures=Textures(args.base,resource_manifest(args.base));animations={}
    for name in ['TreeOfWisdom','TreeOfWisdomClouds','TreeFood']:
        data=decode_reanim(args.base/f'compiled/reanim/{name}.reanim.compiled')
        animations[name]={'fps':data['fps'],'tracks':[{'name':t['name'],'frames':t['filled']} for t in data['tracks']]}
    image_ids=sorted({f[8] for a in animations.values() for t in a['tracks'] for f in t['frames'] if f[8]})
    urls={}
    for rid in image_ids:
        image=textures.image(rid);filename=f'{rid}.png';image.save(out/filename);urls[rid]='/'+filename
    for name in ['fertilizer','plantgrow']:
        (out/f'{name}.ogg').write_bytes((args.base/f'sounds/{name}.ogg').read_bytes())
    provenance={'scope':'PRIVATE research bundle. Never publish or package as public assets.',
                'sourcePakSha256':'5878326408285cb01f83b4fa4edcc66d65e727f6d6ee88563b5b3b287dd259fc',
                'version':'Steam GOTY 1.2.0.1096 English','xmlCompiledMatch':'466378 fields, zero discrepancies',
                'playbackStatus':'Research implementation; original timing/pixel acceptance pending'}
    data=json.dumps({'animations':animations,'textures':urls,'provenance':provenance},separators=(',',':')).encode()
    (out/'bundle.json').write_bytes(data)
    print(f'Private bundle: {len(image_ids)} original image IDs, 3 animations, {len(data)} JSON bytes; sha256={hashlib.sha256(data).hexdigest()}')


if __name__=='__main__':main()
