"""Read-only Phase 0 inspector. Format recognition does NOT authenticate GOTY.

Uses Python standard library; never executes or extracts game content.
Output contains paths, hashes, animation metadata, not original dialogue/media.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path, PureWindowsPath
import struct
import zlib

LIMIT = 128 * 1024 * 1024


class FormatError(ValueError):
    pass


class Reader:
    def __init__(self, data: bytes):
        self.data, self.pos = data, 0

    def take(self, count: int) -> bytes:
        if count < 0 or self.pos + count > len(self.data):
            raise FormatError(f"Truncated input at {self.pos}, need {count}")
        result = self.data[self.pos:self.pos + count]
        self.pos += count
        return result

    def unpack(self, fmt: str):
        return struct.unpack(fmt, self.take(struct.calcsize(fmt)))

    def string(self) -> str:
        length, = self.unpack('<I')
        if length > 1024 * 1024:
            raise FormatError('String exceeds research limit')
        return self.take(length).decode('utf-8', errors='strict')


def safe_path(name: str) -> str:
    path = PureWindowsPath(name)
    if not name or '\x00' in name or ':' in name or path.is_absolute() or path.drive or path.root or '..' in path.parts:
        raise FormatError(f'Unsafe resource path: {name!r}')
    return path.as_posix()


def inspect_pak(raw: bytes) -> dict:
    data = bytes(b ^ 0xF7 for b in raw)
    reader = Reader(data)
    if reader.unpack('<II') != (0xBAC04AC0, 0):
        raise FormatError('Unsupported PAK header/version')
    entries, seen = [], set()
    while True:
        flag, = reader.unpack('<B')
        if flag == 0x80:
            break
        if flag != 0:
            raise FormatError(f'Unknown entry flag {flag}')
        length, = reader.unpack('<B')
        name = safe_path(reader.take(length).decode('ascii'))
        if name.casefold() in seen:
            raise FormatError('Duplicate normalized path')
        seen.add(name.casefold())
        size, stamp = reader.unpack('<iQ')
        if size < 0:
            raise FormatError('Negative resource size')
        entries.append({'path': name, 'size': size, 'filetime': stamp})
        if len(entries) > 100000:
            raise FormatError('Entry limit exceeded')
    start = reader.pos
    for entry in entries:
        entry['offset_decoded'] = reader.pos
        entry['sha256'] = hashlib.sha256(reader.take(entry['size'])).hexdigest()
    if reader.pos != len(data):
        raise FormatError('Unaccounted trailing PAK data')
    return {'format': 'PopCap PC PAK candidate', 'goty_verified': False,
            'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw),
            'data_start': start, 'entry_count': len(entries), 'entries': entries}


def unwrap_compiled(raw: bytes) -> bytes:
    if raw[:4] != b'\xd4\xfe\xad\xde':
        return raw
    reader = Reader(raw)
    _, declared = reader.unpack('<II')
    if declared > LIMIT:
        raise FormatError('Decompressed size exceeds research limit')
    stream = zlib.decompressobj()
    data = stream.decompress(raw[8:], declared + 1)
    if len(data) != declared or not stream.eof or stream.unused_data or stream.unconsumed_tail:
        raise FormatError('Invalid compressed stream or declared length')
    return data


def inspect_reanim(raw: bytes) -> dict:
    reader = Reader(unwrap_compiled(raw))
    prefix = reader.take(8).hex()  # Preserve opaque serialized prefix; not a GOTY signature.
    count, fps = reader.unpack('<If')
    reader.take(4)
    stride, = reader.unpack('<I')
    if count > 4096 or stride != 12 or not math.isfinite(fps) or fps < 0:
        raise FormatError('Unsupported PC reanim layout')
    counts = []
    for _ in range(count):
        reader.take(8)
        frames, = reader.unpack('<I')
        if frames > 100000 or sum(counts) + frames > 1000000:
            raise FormatError('Frame limit exceeded')
        counts.append(frames)
    tracks = []
    for frames in counts:
        name = reader.string()
        width, = reader.unpack('<I')
        if width != 44:
            raise FormatError('Unsupported transform stride')
        transforms = []
        for _ in range(frames):
            vals = reader.unpack('<8f')
            if not all(math.isfinite(v) for v in vals):
                raise FormatError('Non-finite transform')
            transforms.append([None if v == -10000 else v for v in vals])
            reader.take(12)
        images, fonts, text_frames = set(), set(), []
        for frame in range(frames):
            image, font, text = reader.string(), reader.string(), reader.string()
            if image:
                images.add(image)
            if font:
                fonts.add(font)
            if text:
                text_frames.append(frame)  # Do not export original text into public report.
        previous, visible = 0.0, []
        for i, transform in enumerate(transforms):
            if transform[6] is not None:
                previous = transform[6]
            if previous >= 0:
                visible.append(i)
        tracks.append({'name': name, 'frame_count': frames, 'images': sorted(images),
                       'fonts': sorted(fonts), 'text_frames': text_frames,
                       'first_visible': visible[0] if visible else None,
                       'last_visible': visible[-1] if visible else None})
    if reader.pos != len(reader.data):
        raise FormatError('Unaccounted reanim bytes')
    return {'format': 'PC compiled Reanim candidate', 'goty_verified': False,
            'sha256': hashlib.sha256(raw).hexdigest(), 'prefix_hex': prefix,
            'fps': fps, 'track_count': count, 'tracks': tracks}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('kind', choices=['pak', 'reanim'])
    parser.add_argument('input', type=Path)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    if args.input.resolve() == args.out.resolve():
        parser.error('Output must differ from input')
    if args.out.exists():
        parser.error('Output exists; select a new report path')
    if args.input.stat().st_size > LIMIT:
        parser.error('Input exceeds 128 MiB research limit; review before increasing')
    result = {'pak': inspect_pak, 'reanim': inspect_reanim}[args.kind](args.input.read_bytes())
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open('x', encoding='utf-8') as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
    print(f"Inspected {args.kind}; GOTY identity remains unverified. Report: {args.out}")


if __name__ == '__main__':
    main()
