"""Prepare only the explicitly named, game-created WISDOMLAB research profile.

Never edits profile summaries, the original profile, or the game installation.
Run only after closing PvZ. Version/build specific; not a product save importer.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path


def prepare(remote: Path, expected_hash: str, output: Path, height: int):
    summary = (remote / 'users.dat').read_bytes()
    version, count = struct.unpack_from('<IH', summary)
    if version != 14:
        raise ValueError('Unsupported summary version')
    offset, profiles = 6, []
    for _ in range(count):
        size, = struct.unpack_from('<H', summary, offset)
        offset += 2
        name = summary[offset:offset + size].decode('ascii')
        offset += size
        sequence, identity = struct.unpack_from('<II', summary, offset)
        offset += 8
        profiles.append((name, identity))
    if offset != len(summary) or ('WISDOMLAB', 2) not in profiles:
        raise ValueError('Expected game-created WISDOMLAB / user2 mapping')
    target = remote / 'user2.dat'
    before = target.read_bytes()
    digest = hashlib.sha256(before).hexdigest()
    if digest != expected_hash or len(before) != 888 or struct.unpack_from('<i', before)[0] != 12:
        raise ValueError('Research profile baseline mismatch')
    if not 1 <= height <= 1001:
        raise ValueError('Research height outside audited range')
    changes = {4: 4, 8: 10000, 12: 1, 0xd4: height, 0x20c: 1, 0x210: 1005}
    after = bytearray(before)
    for position, value in changes.items():
        struct.pack_into('<i', after, position, value)
    output.mkdir(parents=True, exist_ok=False)
    (output / 'user2.before.dat').write_bytes(before)
    (output / 'user2.prepared.dat').write_bytes(after)
    record = {'scope': 'WISDOMLAB research profile only; game must be closed',
              'target': str(target), 'beforeSha256': digest,
              'afterSha256': hashlib.sha256(after).hexdigest(),
              'changes': {hex(k): {'before': struct.unpack_from('<i', before, k)[0], 'after': v}
                          for k, v in changes.items()}}
    (output / 'preparation.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
    if target.read_bytes() != before:
        raise RuntimeError('Profile changed concurrently; no write performed')
    # Exact-length write preserves all unmodified fields. Backups exist before mutation.
    with target.open('r+b') as handle:
        handle.write(after)
        handle.flush()
        import os
        os.fsync(handle.fileno())
    if target.read_bytes() != after:
        raise RuntimeError('Write verification failed; restore the preserved backup')
    print(json.dumps({'profile': 'WISDOMLAB', 'height': height, 'food': 5,
                      'backup': str(output), 'verified': True}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--remote', required=True, type=Path)
    parser.add_argument('--expected-sha256', required=True)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--height', required=True, type=int)
    args = parser.parse_args()
    prepare(args.remote, args.expected_sha256, args.output, args.height)
