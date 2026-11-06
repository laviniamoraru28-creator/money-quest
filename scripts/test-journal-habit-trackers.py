"""Regression checks for deterministic localized inserts and private output guards."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
import fitz

spec=importlib.util.spec_from_file_location('habits',Path(__file__).with_name('append-journal-habit-trackers.py'))
habits=importlib.util.module_from_spec(spec);spec.loader.exec_module(habits)

class HabitTrackerTest(unittest.TestCase):
 def test_preserve_pages_and_reject_unapproved_sources(self):
  original_root=habits.ROOT
  try:
   with tempfile.TemporaryDirectory() as folder:
    base=Path(folder);repo=base/'repo';sources=base/'sources';sources.mkdir();(repo/'content/printables').mkdir(parents=True)
    # Use the actual approved fonts and localized tracker, but synthetic source pages.
    (repo/'public/certificates').mkdir(parents=True)
    (repo/'public/certificates/fonts').symlink_to(original_root/'public/certificates/fonts',target_is_directory=True)
    doc=fitz.open()
    for n in range(44):doc.new_page(width=595.2756,height=841.8898).insert_text((50,50),f'Source page {n+1}')
    raw=doc.tobytes();editions={}
    for locale in habits.COPY:
     path=sources/f'{locale}.pdf';path.write_bytes(raw);editions[locale]={'file':path.name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
    (repo/'content/printables/journal-original.json').write_text(json.dumps({'targetLocales':list(habits.COPY),'editions':editions}))
    habits.ROOT=repo
    one=habits.prepare(sources,base/'one');two=habits.prepare(sources,base/'two')
    self.assertEqual(one,two)
    for locale,item in one.items():
     result=fitz.open(base/'one'/item['file']);self.assertEqual(len(result),45)
     for n in range(44):self.assertEqual(doc[n].get_pixmap().samples,result[n if n<43 else 44].get_pixmap().samples)
     page=result[43];self.assertIn(habits.COPY[locale][0],page.get_text());self.assertEqual(page.get_text().splitlines().count('30'),1)
     for block in page.get_text('dict')['blocks']:
      for line in block.get('lines',[]):
       for span in line['spans']:self.assertTrue(page.rect.contains(fitz.Rect(span['bbox'])))
    with self.assertRaises(FileExistsError):habits.prepare(sources,base/'one')
    with self.assertRaises(ValueError):habits.prepare(sources,repo/'public/downloads')
    old=os.environ.get('MONEYQUEST_DOCUMENT_ROOT');os.environ['MONEYQUEST_DOCUMENT_ROOT']=str(base/'web')
    try:
     with self.assertRaises(ValueError):habits.prepare(sources,base/'web/paid')
    finally:
     if old is None:os.environ.pop('MONEYQUEST_DOCUMENT_ROOT',None)
     else:os.environ['MONEYQUEST_DOCUMENT_ROOT']=old
    (sources/'ro.pdf').write_bytes(raw+b'changed')
    with self.assertRaises(ValueError):habits.prepare(sources,base/'bad')
  finally:habits.ROOT=original_root

if __name__=='__main__':unittest.main()
