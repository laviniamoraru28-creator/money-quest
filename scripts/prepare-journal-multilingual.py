#!/usr/bin/env python3
"""Rebuild the verified nine-language journal ZIP in a private directory."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'content/printables/journal-original.json'


def prepare(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if output == ROOT or ROOT in output.parents:
        raise ValueError('Keep the paid journal archive outside the public repository')
    manifest = json.loads(MANIFEST.read_text())
    if manifest.get('schema') != 2 or set(manifest['editions']) != set(manifest['targetLocales']):
        raise ValueError('All nine verified journal editions are required')
    inputs = []
    for locale in manifest['targetLocales']:
        item = manifest['editions'][locale]
        member = PurePosixPath(item['file'])
        if member.is_absolute() or '..' in member.parts or len(member.parts) != 2 or member.parts[0] != locale:
            raise ValueError('Invalid journal archive member')
        nested, flat = source / item['file'], source / member.name
        candidate = nested if nested.exists() else flat
        file = candidate.resolve()
        if source not in file.parents:
            raise ValueError('Journal source must stay inside the selected private directory')
        data = file.read_bytes()
        if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
            raise ValueError('Journal PDF differs from the verified edition: ' + locale)
        inputs.append((item['file'], data))
    readme = (ROOT / 'content/printables/journal-multilingual-readme.txt').read_bytes()
    output.mkdir(parents=True, exist_ok=True, mode=0o700)
    archive = output / manifest['archive']['file']
    with zipfile.ZipFile(archive, 'x', zipfile.ZIP_DEFLATED) as bundle:
        for name, data in inputs + [('READ-ME.txt', readme)]:
            entry = zipfile.ZipInfo(name, (2026, 11, 3, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            bundle.writestr(entry, data)
    actual = archive.read_bytes()
    if len(actual) != manifest['archive']['bytes'] or hashlib.sha256(actual).hexdigest() != manifest['archive']['sha256']:
        archive.unlink()
        raise ValueError('Journal archive does not match the verified release')
    archive.chmod(0o600)
    return archive


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', required=True, type=Path)
    parser.add_argument('--output-dir', required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps({'archive': str(prepare(args.source_dir, args.output_dir)), 'languages': 9, 'pagesPerEdition': 44}))
