"""Run manually reviewed pvz2godot modules on a generated non-game fixture.

Requires ignored research/sources/pvz2godot downloaded at the documented SHA.
Does not fetch code, execute native tools, or imply GOTY compatibility.
"""
import hashlib
import importlib
import json
from pathlib import Path
import sys
import struct
import zlib

from inspect_goty import inspect_reanim
from test_inspect_goty import reanim


def main():
    root = Path(__file__).resolve().parents[1]
    source = root / 'research/sources/pvz2godot'
    metadata = json.loads((source / 'metadata.json').read_text(encoding='utf-8'))
    expected = 'ba9df9a5aaef7449dd7507d0d7d3993615fec239'
    if metadata['commit'] != expected:
        raise ValueError('Reference revision differs; review before executing')
    reviewed = {
        'reanim_parse.py': 'b3f70cfa810b02cda2867f785a304f9a6167bd0923414265005037db51f1d587',
        'convert.py': '31e91139409011906216cbb1e05570ad40c2822161575ca459e46a4973671e58',
        'verify.py': '15189abc9f4b73c1e40022402f05a7adbc5a60ff4a7b698120a9b91e2d30c086',
    }
    for name, sha in reviewed.items():
        if hashlib.sha256((source / name).read_bytes()).hexdigest() != sha:
            raise ValueError(f'Reference source changed; review {name} before executing')
    out = root / 'research/output/synthetic'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'input-textures').mkdir(exist_ok=True)
    (out / 'output-textures').mkdir(exist_ok=True)
    def chunk(kind, payload):
        return struct.pack('>I', len(payload)) + kind + payload + struct.pack('>I', zlib.crc32(kind + payload))
    # One transparent pixel: generated test bytes, never an application asset.
    pixel = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 6, 0, 0, 0))
    pixel += chunk(b'IDAT', zlib.compress(bytes(5))) + chunk(b'IEND', b'')
    (out / 'input-textures/Synthetic_image.png').write_bytes(pixel)
    fixture = out / 'synthetic.bin'
    fixture.write_bytes(reanim())
    sys.path.insert(0, str(source))
    parse = importlib.import_module('reanim_parse')
    convert = importlib.import_module('convert')
    verify = importlib.import_module('verify')
    fps, tracks = parse.parse_reanim(str(fixture))
    target = out / 'synthetic.tscn'
    convert.convert(str(fixture), [str(out / 'input-textures')], str(target), str(out / 'output-textures'))
    errors = verify.verify(str(fixture), str(target))
    report = {
        'scope': 'SYNTHETIC ONLY; transparent 1px fixture; no Godot renderer or GOTY test',
        'reference_commit': expected,
        'source_hashes': {name: hashlib.sha256((source / name).read_bytes()).hexdigest()
                          for name in ['reanim_parse.py', 'convert.py', 'verify.py']},
        'parse': {'fps': fps, 'tracks': len(tracks)},
        'upstream_verifier_errors': errors,
        'own_metadata': inspect_reanim(fixture.read_bytes()),
        'upstream_track_preserves_font': hasattr(tracks[0], 'fonts'),
        'upstream_track_preserves_text': hasattr(tracks[0], 'texts'),
    }
    (out / 'result.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
