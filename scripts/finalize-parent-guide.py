#!/usr/bin/env python3
"""Privately finalize the supplied eight-page guide without replacing its artwork."""
import argparse
import hashlib
from pathlib import Path
import fitz

SOURCE_SHA256 = '1d3e2d2b3666562786cbeffdd413bb572d3fd29a0bf372df63f2b34261d93833'
ROOT = Path(__file__).resolve().parents[1]
GREEN = (0.12, 0.35, 0.28)

def finalize(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if output == ROOT or ROOT in output.parents:
        raise ValueError('The complete guide must stay outside the public repository')
    data = source.read_bytes()
    if hashlib.sha256(data).hexdigest() != SOURCE_SHA256:
        raise ValueError('Expected the exact approved illustrated source')
    if output.exists():
        raise ValueError('Refusing to replace an existing private edition')
    doc = fitz.open(stream=data, filetype='pdf')
    assert len(doc) == 8
    # Remove editorial production instructions from the two activity pages.
    for index in (1, 4):
        page = doc[index]
        matches = page.search_for('Illustration slot: one matching scene, no embedded text.')
        assert len(matches) == 2
        for rect in matches:
            page.add_redact_annot(rect + (-1, -1, 1, 1), fill=(1, 1, 1))
        page.apply_redactions(images=0, graphics=0)
    page = doc[7]
    page.add_redact_annot(fitz.Rect(58, 405, 540, 555), fill=(1, 1, 1))
    page.apply_redactions(images=0, graphics=0)
    def paragraph(rect, text, size=10.5, font='helv', color=(0, 0, 0)):
        spare = page.insert_textbox(rect, text, fontsize=size, fontname=font, color=color, lineheight=1.35)
        if spare < 0:
            raise ValueError('Parent guide text does not fit')
    paragraph(fitz.Rect(60, 407, 535, 435), 'About this edition', 15, 'hebo', GREEN)
    paragraph(fitz.Rect(60, 440, 535, 505),
        'English illustrated edition, 4 November 2026. Four practical family activities support '
        'conversations about needs, wants, saving and budgeting. Money examples are learning '
        'exercises. Adapt each activity to your child and your household budget.')
    paragraph(fitz.Rect(60, 515, 535, 560),
        'These educational materials do not replace individual professional advice. '
        'Illustrations are AI-generated discussion starters. Use actual prices and clearly '
        'identified coins for calculation tasks.', 9, color=GREEN)
    paragraph(fitz.Rect(60, 573, 535, 600), 'Further reading for parents', 12, 'hebo', GREEN)
    sources = [
        ('MoneyHelper: Talk Learn Do', 'moneyhelper.org.uk/talk-learn-do',
         'https://www.moneyhelper.org.uk/en/family-and-care/talk-money/talk-learn-do'),
        ('MoneyHelper: Helping teenagers manage money', 'MoneyHelper, Family and care, Talk money',
         'https://www.moneyhelper.org.uk/en/family-and-care/talk-money/talk-learn-do/how-to-help-teenagers-manage-their-money'),
        ('Consumer Financial Protection Bureau: Talking about money choices', 'consumerfinance.gov, Money as You Grow',
         'https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/talking-about-financial-decisions/'),
    ]
    for index, (title, label, url) in enumerate(sources):
        top = 608 + 38 * index
        paragraph(fitz.Rect(60, top, 535, top + 17), title, 9, 'hebo')
        paragraph(fitz.Rect(60, top + 16, 535, top + 32), label, 8.5, color=GREEN)
        page.insert_link({'kind': fitz.LINK_URI, 'from': fitz.Rect(60, top, 535, top + 32), 'uri': url})
    paragraph(fitz.Rect(60, 728, 535, 759),
        'Sources checked 4 November 2026. These sources support the general learning approach; '
        'they do not endorse this guide. moneyquesteducation.com', 8, color=GREEN)
    # Printed numbers follow the actual illustrated PDF, not its old four-page manuscript.
    for index in range(1, 8):
        page = doc[index]
        page.add_redact_annot(fitz.Rect(536, 795, 550, 810), fill=(1, 1, 1))
        page.apply_redactions(images=0, graphics=0)
        page.insert_text((539.8, 805.04), str(index + 1), fontsize=8, color=GREEN)
    doc.set_metadata({**doc.metadata, 'title': 'Little Minds, Smart Money',
                      'author': 'Money Quest Academy', 'subject': 'English Parent Toolkit guide, illustrated edition 2026-11-04'})
    doc.xref_set_key(doc.pdf_catalog(), 'Lang', '(en-GB)')
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    doc.save(output, garbage=4, deflate=True, no_new_id=True)
    output.chmod(0o600)
    result = output.read_bytes()
    return {'file': output.name, 'bytes': len(result), 'sha256': hashlib.sha256(result).hexdigest(), 'pages': len(doc)}

if __name__ == '__main__':
    import json
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(finalize(args.source, args.output)))
