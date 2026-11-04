import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('journal', Path(__file__).with_name('prepare-journal-multilingual.py'))
pack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)


class JournalArchiveTest(unittest.TestCase):
    def test_rebuild_and_source_guards(self):
        root, manifest_path = pack.ROOT, pack.MANIFEST
        try:
            with tempfile.TemporaryDirectory() as folder:
                base = Path(folder)
                repo, source = base/'repo', base/'source'
                (repo/'content/printables').mkdir(parents=True)
                source.mkdir()
                readme = b'Synthetic fixture, not a customer resource.\n'
                (repo/'content/printables/journal-multilingual-readme.txt').write_bytes(readme)
                locales = ['en','ro','es','fr','de','it','pt','nl','pl']
                editions = {}
                for locale in locales:
                    data = b'%PDF-synthetic-fixture-' + locale.encode()
                    filename = f'journal-{locale}.pdf'
                    (source/filename).write_bytes(data)
                    editions[locale] = {'file':f'{locale}/{filename}', 'bytes':len(data), 'sha256':hashlib.sha256(data).hexdigest()}
                expected = base/'expected.zip'
                with zipfile.ZipFile(expected, 'w', zipfile.ZIP_DEFLATED) as bundle:
                    for name, data in [(item['file'], (source/Path(item['file']).name).read_bytes()) for item in editions.values()] + [('READ-ME.txt',readme)]:
                        entry = zipfile.ZipInfo(name,(2026,11,3,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED;bundle.writestr(entry,data)
                manifest = {'schema':2,'targetLocales':locales,'editions':editions,'archive':{'file':'journal.zip','sha256':hashlib.sha256(expected.read_bytes()).hexdigest(),'bytes':expected.stat().st_size}}
                current = repo/'content/printables/journal-original.json'
                current.write_text(json.dumps(manifest));pack.ROOT,pack.MANIFEST=repo,current
                first=pack.prepare(source,base/'one');second=pack.prepare(source,base/'two')
                self.assertEqual(first.read_bytes(),expected.read_bytes());self.assertEqual(first.read_bytes(),second.read_bytes())
                with self.assertRaises(FileExistsError):pack.prepare(source,base/'one')
                with self.assertRaises(ValueError):pack.prepare(source,repo/'public')
                good=(source/'journal-ro.pdf').read_bytes();(source/'journal-ro.pdf').write_bytes(good+b'changed')
                with self.assertRaises(ValueError):pack.prepare(source,base/'tampered')
                (source/'journal-ro.pdf').write_bytes(good)
                outside=base/'outside.pdf';outside.write_bytes(good);(source/'journal-ro.pdf').unlink();(source/'journal-ro.pdf').symlink_to(outside)
                with self.assertRaises(ValueError):pack.prepare(source,base/'symlink')
        finally:pack.ROOT,pack.MANIFEST=root,manifest_path


if __name__=='__main__':unittest.main()
