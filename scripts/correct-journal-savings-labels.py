#!/usr/bin/env python3
"""Correct only the 24 savings-marker numbers in the supplied private journal."""
import argparse
import hashlib
import json
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]


def correct(source, destination):
    source, destination = Path(source).resolve(), Path(destination).resolve()
    manifest = json.loads((ROOT / 'content/printables/journal-original.json').read_text())
    if hashlib.sha256(source.read_bytes()).hexdigest() != manifest['source']['originalSha256']:
        raise ValueError('Expected the exact uncorrected owner-supplied original')
    if destination.exists():
        raise FileExistsError(destination)
    if destination == ROOT or ROOT in destination.parents:
        raise ValueError('Keep the complete paid PDF outside the public repository')
    doc = fitz.open(source)
    if len(doc) != 44:
        raise ValueError('Expected 44 journal pages')
    page = doc[7]
    original = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    centres = [183, 300, 419, 536, 655, 773, 890, 1008]
    for row, (top, bottom, baseline) in enumerate([(527, 535, 533.5), (599, 607, 605.5), (670, 678, 676.5)]):
        for column, cx in enumerate(centres):
            x = cx / 2
            fill = tuple(v / 255 for v in original.pixel(cx, int(top * 2 - 2)))
            page.draw_rect(fitz.Rect(x - 6, top, x + 6, bottom), color=None, fill=fill)
            text = str(row * 8 + column + 1)
            width = fitz.get_text_length(text, fontname='hebo', fontsize=8)
            page.insert_text((x - width / 2, baseline), text, fontname='hebo', fontsize=8, color=(.06, .19, .32))
    destination.parent.mkdir(parents=True, exist_ok=True)
    doc.save(destination, garbage=4, deflate=True, no_new_id=True)
    return destination


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    print(correct(args.source, args.output))
