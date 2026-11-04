#!/usr/bin/env python3
"""Package the verified English journal outside the public repository."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def prepare(source, output):
    manifest = json.loads((ROOT / 'content/printables/journal-original.json').read_text())
    source, output = Path(source).resolve(), Path(output).resolve()
    if output == ROOT or ROOT in output.parents:
        raise ValueError('Write the paid journal outside the public source repository')
    data = source.read_bytes()
    item = manifest['source']
    if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
        raise ValueError('Journal differs from the supplied verified original')
    readme = (ROOT / 'content/printables/journal-original-readme.txt').read_bytes()
    output.mkdir(parents=True, exist_ok=True, mode=0o700)
    archive_spec = manifest.get('previousEnglishArchive', manifest['archive'])
    archive = output / archive_spec['file']
    with zipfile.ZipFile(archive, 'x', zipfile.ZIP_DEFLATED) as bundle:
        for name, content in [(item['file'], data), ('READ-ME.txt', readme)]:
            entry = zipfile.ZipInfo(name, (2026, 11, 3, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            bundle.writestr(entry, content)
    result = archive.read_bytes()
    if len(result) != archive_spec['bytes'] or hashlib.sha256(result).hexdigest() != archive_spec['sha256']:
        archive.unlink()
        raise ValueError('Journal archive differs from the verified manifest')
    archive.chmod(0o600)
    return archive


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--output-dir', required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps({'archive': str(prepare(args.source, args.output_dir)), 'language': 'en', 'ready': False}))
