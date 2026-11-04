#!/usr/bin/env python3
"""Recover exact paid source pages and optional unreviewed OCR into private storage.

This is source recovery, not a worksheet generator or a translation readiness check.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import csv
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import fitz

ROOT = Path(__file__).resolve().parents[1]

def sha(data):
    return hashlib.sha256(data).hexdigest()

def recover(source, output, ocr=False):
    source, output = Path(source).resolve(), Path(output).resolve()
    if output == ROOT or ROOT in output.parents:
        raise ValueError('Keep full worksheet pages and manuscripts outside the public repository')
    if output.exists():
        raise ValueError('Use a new private recovery directory; never overwrite reviewed work')
    manifest = json.loads((ROOT / 'content/printables/academy-originals.json').read_text())
    # Check every source before writing any recovered page.
    sources = []
    for item in manifest['worksheets']:
        file = (source / item['file']).resolve()
        if source not in file.parents:
            raise ValueError('Source symlink escapes selected source directory')
        data = file.read_bytes()
        if len(data) != item['bytes'] or sha(data) != item['sha256']:
            raise ValueError('Source PDF differs from approved original: ' + item['level'])
        doc = fitz.open(stream=data, filetype='pdf')
        if len(doc) != item['pages'] or len(doc) != 20:
            raise ValueError('Expected 20 worksheets per source PDF')
        sources.append((item, doc))
    output.mkdir(parents=True, mode=0o700)
    entries = []
    tasks = []
    for item, doc in sources:
        directory = output / item['level']
        directory.mkdir(mode=0o700)
        for index, page in enumerate(doc):
            images = page.get_images(full=True)
            if len(images) != 1:
                raise ValueError('Expected one flattened source image per worksheet')
            image = doc.extract_image(images[0][0])
            name = f"{index+1:02}.{image['ext']}"
            path = directory / name
            path.write_bytes(image['image'])
            path.chmod(0o600)
            entry = {'level': item['level'], 'page': index+1, 'sourcePdfSha256': item['sha256'],
                     'image': f"{item['level']}/{name}", 'imageSha256': sha(image['image']),
                     'width': image['width'], 'height': image['height'],
                     'sourcePagePoints': list(page.rect), 'selectableText': bool(page.get_text().strip()),
                     'reviewStatus': 'needs-manual-transcription-and-educational-review',
                     'translatedLocales': []}
            entries.append(entry)
            if ocr:
                tasks.append((path, entry))
    def recognize(task):
        path, entry = task
        env = {**os.environ, 'OMP_THREAD_LIMIT': '1'}
        result = subprocess.run(['tesseract', str(path), 'stdout', '--psm', '11', 'tsv'],
                                check=True, capture_output=True, text=True, env=env)
        words = []
        for row in csv.DictReader(io.StringIO(result.stdout), delimiter='\t', quoting=csv.QUOTE_NONE):
            if not row['text'].strip():
                continue
            words.append({'text': row['text'], 'confidence': float(row['conf']),
                          'rectPixels': [int(row['left']), int(row['top']), int(row['width']), int(row['height'])],
                          'block': int(row['block_num']), 'paragraph': int(row['par_num']), 'line': int(row['line_num'])})
        dest = path.with_name(path.stem + '-ocr-UNREVIEWED.json')
        dest.write_text(json.dumps({'status': 'UNREVIEWED', 'notTranslationSource': True, 'words': words}, ensure_ascii=False, indent=2) + '\n')
        dest.chmod(0o600)
        entry['unreviewedOcr'] = str(dest.relative_to(output))
    if tasks:
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(recognize, tasks))
    inventory = {'schema': 1, 'sourceRecovered': True, 'originalPdfsUnchanged': True,
                 'pages': len(entries), 'releaseReady': False, 'verifiedTranslatedPages': 0,
                 'warning': 'OCR is an unreviewed aid. Verify every text region, diagram and answer before translating or publishing.',
                 'worksheets': entries}
    path = output / 'recovery-inventory.json'
    path.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n')
    path.chmod(0o600)
    return inventory

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', required=True, type=Path)
    parser.add_argument('--output-dir', required=True, type=Path)
    parser.add_argument('--ocr', action='store_true')
    args = parser.parse_args()
    result = recover(args.source_dir, args.output_dir, args.ocr)
    print(json.dumps({key: value for key, value in result.items() if key != 'worksheets'}))
