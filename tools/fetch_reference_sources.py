"""Reproduce ignored, pinned public source snapshots; downloads text, never runs it.

Review research/source-lock.json before use. No release binaries or game media.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repository', help='Optional owner/name from source-lock.json')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    lock = json.loads((root / 'research/source-lock.json').read_text(encoding='utf-8'))
    selected = [r for r in lock['repositories'] if args.repository in (None, r['repository'])]
    if not selected:
        parser.error('Repository is not in the reviewed lock file')
    for repo in selected:
        base = root / 'research/sources' / repo['repository'].split('/')[1]
        prefix = f"https://raw.githubusercontent.com/{repo['repository']}/{repo['commit']}/"
        for item in repo['files']:
            path = PurePosixPath(item['path'])
            if path.is_absolute() or '..' in path.parts or ':' in item['path'] or '\\' in item['path']:
                raise ValueError('Unsafe path in source lock')
            if item['url'] != prefix + path.as_posix():
                raise ValueError('Unexpected source URL in lock')
            target = base.joinpath(*path.parts)
            if target.exists():
                if hashlib.sha256(target.read_bytes()).hexdigest() != item['sha256']:
                    raise ValueError(f'Existing source differs; refusing overwrite: {target}')
                continue
            with urllib.request.urlopen(item['url'], timeout=30) as response:
                data = response.read(4 * 1024 * 1024 + 1)
            if len(data) > 4 * 1024 * 1024 or hashlib.sha256(data).hexdigest() != item['sha256']:
                raise ValueError(f'Source size/hash mismatch: {item["url"]}')
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('xb') as output:
                output.write(data)
        # Minimal provenance for probe_reference; don't overwrite original API inventory.
        metadata = base / 'metadata.json'
        if not metadata.exists():
            metadata.write_text(json.dumps({k: repo[k] for k in ['repository', 'commit', 'license']}, indent=2), encoding='utf-8')
        print(f"Verified local source snapshot: {repo['repository']} @ {repo['commit']}")


if __name__ == '__main__':
    main()
