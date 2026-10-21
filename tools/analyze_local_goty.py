"""Phase 0 analysis of locally extracted, user-owned GOTY files.

Writes all derived resources and original dialogue under private/. No game runs.
Requires Pillow for texture verification and affine research renders.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import xml.etree.ElementTree as ET

from PIL import Image

from inspect_goty import Reader, inspect_reanim, unwrap_compiled

CHANNELS = ['x', 'y', 'kx', 'ky', 'sx', 'sy', 'f', 'a']
DEFAULTS = [0., 0., 0., 0., 1., 1., 0., 1.]


def decode_reanim(path: Path) -> dict:
    raw = path.read_bytes()
    inspect_reanim(raw)  # Bounds, count, finite-value and complete-consumption validation.
    reader = Reader(unwrap_compiled(raw))
    reader.take(8)
    count, fps = reader.unpack('<If')
    reader.take(8)
    counts = []
    for _ in range(count):
        reader.take(8)
        counts.append(reader.unpack('<I')[0])
    tracks = []
    for n in counts:
        name = reader.string()
        reader.take(4)
        sparse = []
        for _ in range(n):
            vals = reader.unpack('<8f')
            sparse.append([None if x == -10000 else x for x in vals])
            reader.take(12)
        refs = [[reader.string() for _ in range(3)] for _ in range(n)]
        previous, previous_refs = DEFAULTS.copy(), ['', '', '']
        filled = []
        for vals, strings in zip(sparse, refs):
            previous = [p if v is None else v for p, v in zip(previous, vals)]
            previous_refs = [v or p for p, v in zip(previous_refs, strings)]
            filled.append(previous.copy() + previous_refs.copy())
        tracks.append({'name': name, 'sparse': sparse, 'refs': refs, 'filled': filled})
    return {'fps': fps, 'tracks': tracks}


def compare_xml(compiled: dict, xml_path: Path) -> dict:
    root = ET.fromstring('<reanim>' + xml_path.read_text(encoding='utf-8-sig') + '</reanim>')
    xml_tracks = root.findall('track')
    errors, compared = [], 0
    if len(xml_tracks) != len(compiled['tracks']):
        errors.append('track count mismatch')
    if float(root.findtext('fps')) != compiled['fps']:
        errors.append('fps mismatch')
    for index, (binary, text) in enumerate(zip(compiled['tracks'], xml_tracks)):
        if binary['name'] != text.findtext('name'):
            errors.append(f'track {index}: name mismatch')
        frames = text.findall('t')
        if len(frames) != len(binary['sparse']):
            errors.append(f'track {index}: frame count mismatch')
        for frame, node in enumerate(frames):
            for channel, field in enumerate(CHANNELS):
                value = node.findtext(field)
                value = None if value is None else struct.unpack('<f', struct.pack('<f', float(value)))[0]
                if value != binary['sparse'][frame][channel]:
                    errors.append(f'{index}/{frame}/{field}: sparse float mismatch')
                compared += 1
            for channel, field in enumerate(['i', 'font', 'text']):
                if (node.findtext(field) or '') != binary['refs'][frame][channel]:
                    errors.append(f'{index}/{frame}/{field}: reference mismatch')
                compared += 1
    return {'xml_path': xml_path.name, 'scalar_and_string_comparisons': compared,
            'errors': errors[:50], 'error_count': len(errors), 'matches': not errors}


def resource_manifest(base: Path) -> dict:
    result = {}
    for group in ET.parse(base / 'properties/resources.xml').getroot():
        path, prefix = '', ''
        for node in group:
            if node.tag == 'SetDefaults':
                path = node.get('path', path).replace('\\', '/')
                prefix = node.get('idprefix', prefix)
            elif node.get('id'):
                result[prefix + node.get('id')] = {'type': node.tag, 'path': path + '/' + node.get('path', ''),
                                                  'group': group.get('id'), 'attributes': dict(node.attrib)}
    return result


class Textures:
    def __init__(self, base: Path, manifest: dict):
        self.base, self.manifest = base, manifest
        self.files = {p.relative_to(base).as_posix().casefold(): p for p in base.rglob('*') if p.is_file()}
        self.cache, self.records = {}, {}

    def image(self, rid: str) -> Image.Image:
        if rid in self.cache:
            return self.cache[rid]
        stems = []
        if rid in self.manifest:
            stems.append(self.manifest[rid]['path'])
        # Reference engine DefinitionLoadImage fallback order, not a global ID naming assumption.
        for prefix, folder in [('IMAGE_', ''), ('IMAGE_', 'particles/'),
                               ('IMAGE_REANIM_', 'reanim/'), ('IMAGE_REANIM_', 'images/')]:
            if rid.startswith(prefix):
                stems.append(folder + rid[len(prefix):])
        for stem in stems:
            png = self.files.get((stem + '.png').casefold())
            jpg = self.files.get((stem + '.jpg').casefold())
            if png:
                image = Image.open(png).convert('RGBA')
                sources = [png]
            elif jpg:
                image = Image.open(jpg).convert('RGBA')
                sources = [jpg]
                mask = self.files.get((stem + '_.png').casefold())
                if mask:
                    alpha = Image.open(mask).convert('L')
                    if alpha.size != image.size:
                        raise ValueError('Alpha mask dimensions differ')
                    image.putalpha(alpha)
                    sources.append(mask)
            else:
                continue
            self.cache[rid] = image
            self.records[rid] = {'paths': [p.relative_to(self.base).as_posix() for p in sources],
                                 'sha256': [hashlib.sha256(p.read_bytes()).hexdigest() for p in sources],
                                 'size': list(image.size), 'alpha_bbox': image.getbbox(),
                                 'conversion': 'JPG+L mask -> RGBA' if len(sources) > 1 else 'decode -> RGBA'}
            return image
        raise FileNotFoundError(f'Unresolved image reference: {rid}')


def sample(track: dict, frame: float) -> list:
    first = min(int(frame), len(track['filled']) - 1)
    second = min(first + 1, len(track['filled']) - 1)
    blend = frame - int(frame)
    a, b = track['filled'][first], track['filled'][second]
    return [a[i] + (b[i] - a[i]) * blend if i != 6 else a[i] for i in range(8)] + a[8:]


def matrix(values):
    x, y, kx, ky, sx, sy = values[:6]
    kx, ky = math.radians(kx), math.radians(ky)
    return [sx * math.cos(kx), -sy * math.sin(ky), x,
            sx * math.sin(kx), sy * math.cos(ky), y]


def group(name: str):
    if name.startswith('bg'):
        return 0
    if name.startswith('tree'):
        return 2
    if name.startswith('grass'):
        return 3
    return 4


def render(animation: dict, frame: float, textures: Textures) -> tuple[Image.Image, list]:
    # Research reconstruction: no clouds, UI, hover, overlay tint or original rasterizer.
    canvas = Image.new('RGBA', (800, 600))
    state = []
    for index, track in sorted(enumerate(animation['tracks']), key=lambda x: (group(x[1]['name']), x[0])):
        values = sample(track, frame)
        if values[6] < 0 or values[7] <= 0 or not values[8]:
            continue
        source = textures.image(values[8])
        a, b, tx, c, d, ty = matrix(values)
        determinant = a*d-b*c
        if abs(determinant) < 1e-8:
            continue
        inverse = [d/determinant, -b/determinant, (b*ty-d*tx)/determinant,
                   -c/determinant, a/determinant, (c*tx-a*ty)/determinant]
        sprite = source.transform((800, 600), Image.Transform.AFFINE, inverse, resample=Image.Resampling.BICUBIC)
        if values[7] < 1:
            sprite.putalpha(sprite.getchannel('A').point(lambda v: round(v * max(0., min(1., values[7])))))
        canvas.alpha_composite(sprite)
        state.append({'trackIndex': index, 'trackName': track['name'], 'image': values[8],
                      'transform': values[:8], 'matrix': [a,b,tx,c,d,ty],
                      'visibleAlphaBbox': sprite.getbbox()})
    return canvas, state


def ogg_info(path: Path) -> dict:
    data = path.read_bytes()
    pos, packets, packet, last = 0, [], b'', 0
    while pos < len(data):
        if data[pos:pos+4] != b'OggS':
            raise ValueError('Invalid Ogg page')
        granule = struct.unpack_from('<Q', data, pos + 6)[0]
        if granule != 0xffffffffffffffff:
            last = max(last, granule)
        segments = data[pos+26]
        laces = data[pos+27:pos+27+segments]
        body = pos + 27 + segments
        for size in laces:
            packet += data[body:body+size]
            body += size
            if size < 255:
                if len(packets) < 3:
                    packets.append(packet)
                packet = b''
        pos = body
    header = packets[0]
    if header[:7] != b'\x01vorbis':
        raise ValueError('Not Vorbis')
    rate = struct.unpack_from('<I', header, 12)[0]
    return {'path': path.name, 'codec': 'Vorbis', 'channels': header[11], 'sampleRate': rate,
            'lastGranule': last, 'durationFromGranuleSeconds': last / rate}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base', type=Path)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    private = Path(__file__).resolve().parents[1] / 'private'
    if not args.out.resolve().is_relative_to(private.resolve()):
        parser.error('Research results must remain under private/')
    args.out.mkdir(parents=True, exist_ok=True)
    animations, comparisons = {}, {}
    for stem in ['TreeOfWisdom', 'TreeOfWisdomClouds', 'TreeFood']:
        animations[stem] = decode_reanim(args.base / f'compiled/reanim/{stem}.reanim.compiled')
        xml = next(p for p in (args.base / 'reanim').glob('*.reanim') if p.stem.casefold() == stem.casefold())
        comparisons[stem] = compare_xml(animations[stem], xml)
    tree = animations['TreeOfWisdom']
    manifest = resource_manifest(args.base)
    textures = Textures(args.base, manifest)
    refs = sorted({row[0] for anim in animations.values() for track in anim['tracks'] for row in track['refs'] if row[0]})
    for rid in refs:
        textures.image(rid)
    segments = []
    for track in tree['tracks']:
        if not track['name'].startswith('anim_'):
            continue
        frames = [i for i, row in enumerate(track['filled']) if row[6] >= 0]
        segments.append({'name': track['name'], 'first': min(frames), 'last': max(frames), 'frameCount': len(frames)})
    segment_by_name = {s['name']: s for s in segments}
    heights = [1,2,5,6,10,20,30,40,49,50,51,99,100,101,500,1000,1001]
    states = []
    preview_paths = []
    for height in heights:
        for mode, limit in [('init',50),('growth-end',51)]:
            segment = segment_by_name[f'anim_grow{min(height,limit)}']
            # Non-FULL_LAST_FRAME once-and-hold samples N-1 intervals, not N.
            frame = segment['last'] if mode == 'growth-end' else segment['first'] + .99 * (segment['frameCount'] - 1)
            image, state = render(tree, frame, textures)
            name = f'h{height:04d}-{mode}.png'
            image.convert('RGB').save(args.out / name)
            states.append({'height':height,'mode':mode,'segment':segment['name'],'frame':frame,
                           'image':name,'drawnTracks':state,'pixelSha256':hashlib.sha256(image.tobytes()).hexdigest()})
            if height in [1,6,20,40,49,50,51] and mode=='growth-end':
                preview_paths.append(args.out/name)
    sheet = Image.new('RGB',(4*400,2*300),'white')
    for i, path in enumerate(preview_paths):
        sheet.paste(Image.open(path).resize((400,300)),((i%4)*400,(i//4)*300))
    sheet.save(args.out/'contact-sheet.png')
    text=(args.base/'properties/LawnStrings.txt').read_text(encoding='cp1252')
    pairs=re.findall(r'^\[([^\]\r\n]+)\]\r?\n(.*?)(?=^\[[^\]\r\n]+\]\r?\n|\Z)',text,re.M|re.S)
    lines={key:value.strip() for key,value in pairs if key.startswith('TREE_OF_WISDOM_')}
    (args.out/'original-tree-dialogue.json').write_text(json.dumps(lines,ensure_ascii=False,indent=2),encoding='utf-8')
    fonts={}
    for name in ['BrianneTod16','HouseofTerror16']:
        data=(args.base/f'data/{name}.txt').read_bytes().decode('latin1')
        charlist=re.search(r'Define\s+CharList\s*\((.*?)\);',data,re.S).group(1)
        chars=[a or b for a,b in re.findall(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"",charlist)]
        fonts[name]={'listedGlyphs':len(chars),'maxListedByteCode':max(ord(c[0]) for c in chars),
                     'containsCJK':any('\u4e00'<=c[0]<='\u9fff' for c in chars),
                     'layerCount':len(re.findall(r'\bCreateLayer\b',data)),
                     'spaceWidthStatements':re.findall(r"LayerSetCharWidths\s+\w+\s+\(' '\)\s+\(\d+\)",data)}
    report={'scope':'GOTY resource measurements + reference-semantics reconstruction, NOT original runtime/visual acceptance',
            'comparisons':comparisons,'segments':segments,'textures':textures.records,
            'animationCounts':{k:{'fps':v['fps'],'tracks':len(v['tracks']),'frames':len(v['tracks'][0]['filled'])} for k,v in animations.items()},
            'duplicateTreeTrackNames':{k:v for k,v in Counter(t['name'] for t in tree['tracks']).items() if v>1},
            'states':states,'treeDialogueKeys':sorted(lines),'fonts':fonts,
            'audio':[ogg_info(args.base/f'sounds/{name}.ogg') for name in ['fertilizer','plantgrow']]}
    (args.out/'analysis.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps({'comparisons':comparisons,'animationCounts':report['animationCounts'],'resolvedImages':len(refs),
                      'treeDialogueKeys':len(lines),'fonts':fonts,'audio':report['audio'],'renders':len(states)},indent=2))


if __name__=='__main__':
    main()
