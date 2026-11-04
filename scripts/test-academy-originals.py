import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('academy_pack', Path(__file__).with_name('prepare-academy-originals.py'))
pack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)


class AcademyArchiveTest(unittest.TestCase):
    def test_originals_only_reproducible_and_tamper_refusal(self):
        old_root, old_manifest = pack.ROOT, pack.MANIFEST
        try:
            with tempfile.TemporaryDirectory() as folder:
                base = Path(folder)
                root, source = base/'repo', base/'source'
                source.mkdir()
                (root/'content/printables').mkdir(parents=True)
                readme = b'Synthetic fixture, no customer content.\n'
                (root/'content/printables/academy-originals-readme.txt').write_bytes(readme)
                worksheets = []
                for level in ['explorer', 'builder', 'strategist']:
                    # Bytes are intentionally synthetic: this tests unchanged-file packaging, not PDF rendering.
                    data = b'%PDF-synthetic-fixture-' + level.encode()
                    filename = level.upper()+'.pdf'
                    (source/filename).write_bytes(data)
                    worksheets.append({'level': level, 'file': filename, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
                expected = base/'expected.zip'
                with zipfile.ZipFile(expected, 'w', zipfile.ZIP_DEFLATED) as bundle:
                    for name, data in [(w['file'], (source/w['file']).read_bytes()) for w in worksheets] + [('READ-ME.txt', readme)]:
                        item = zipfile.ZipInfo(name, (2026, 11, 3, 0, 0, 0)); item.compress_type = zipfile.ZIP_DEFLATED
                        bundle.writestr(item, data)
                manifest = {'worksheets': worksheets, 'archive': {'file': 'academy-en.zip', 'bytes': expected.stat().st_size, 'sha256': hashlib.sha256(expected.read_bytes()).hexdigest()}}
                manifest_path = root/'content/printables/academy-originals.json'
                manifest_path.write_text(json.dumps(manifest))
                pack.ROOT, pack.MANIFEST = root, manifest_path
                first = pack.prepare(source, base/'private-one')
                second = pack.prepare(source, base/'private-two')
                self.assertEqual(first.read_bytes(), expected.read_bytes())
                self.assertEqual(first.read_bytes(), second.read_bytes())
                with self.assertRaises(FileExistsError): pack.prepare(source, base/'private-one')
                with self.assertRaises(ValueError): pack.prepare(source, root/'public')
                (source/'EXPLORER.pdf').write_bytes(b'changed')
                with self.assertRaises(ValueError): pack.prepare(source, base/'tampered')
                self.assertFalse((base/'tampered').exists())
        finally:
            pack.ROOT, pack.MANIFEST = old_root, old_manifest


if __name__ == '__main__':
    unittest.main()
