"""Extract a user-owned PAK into a NEW private workspace directory.

No executable content is run. Validates entire input before writing anything.
The original installation is opened read-only. This is a Phase 0 research tool.
"""
import argparse
import hashlib
import json
from pathlib import Path

from inspect_goty import LIMIT, FormatError, inspect_pak


def extract(source: Path, destination: Path, private_root: Path) -> dict:
    source, destination, private_root = source.resolve(), destination.resolve(), private_root.resolve()
    if not destination.is_relative_to(private_root) or destination == private_root:
        raise ValueError('Extraction destination must be inside workspace private/')
    if destination.exists():
        raise ValueError('Destination already exists; refusing to overwrite')
    if source.stat().st_size > LIMIT:
        raise FormatError('Research input limit exceeded')
    raw = source.read_bytes()
    report = inspect_pak(raw)
    decoded = bytes(b ^ 0xF7 for b in raw)
    reserved = {'CON', 'PRN', 'AUX', 'NUL', *(f'COM{i}' for i in range(1, 10)), *(f'LPT{i}' for i in range(1, 10))}
    for entry in report['entries']:
        target = destination / entry['path']
        if not target.resolve().is_relative_to(destination):
            raise FormatError('Resource escapes destination')
        for part in Path(entry['path']).parts:
            if part.rstrip(' .') != part or part.split('.')[0].upper() in reserved:
                raise FormatError('Unsafe Windows filename')
    destination.mkdir(parents=True)
    for entry in report['entries']:
        target = destination / entry['path']
        target.parent.mkdir(parents=True, exist_ok=True)
        start = entry['offset_decoded']
        content = decoded[start:start + entry['size']]
        with target.open('xb') as output:
            output.write(content)
        if hashlib.sha256(target.read_bytes()).hexdigest() != entry['sha256']:
            raise OSError('Written resource hash mismatch')
    report['extraction'] = {'destination': str(destination), 'count': len(report['entries']),
                            'all_written_hashes_match': True, 'input_modified': False,
                            'input_sha256_after': hashlib.sha256(source.read_bytes()).hexdigest()}
    if report['extraction']['input_sha256_after'] != report['sha256']:
        raise OSError('Source changed during extraction')
    (destination / '.extraction-manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    private = Path(__file__).resolve().parents[1] / 'private'
    report = extract(args.source, args.destination, private)
    print(f"Extracted and hash-verified {report['entry_count']} resources to {args.destination}; source unchanged")


if __name__ == '__main__':
    main()
