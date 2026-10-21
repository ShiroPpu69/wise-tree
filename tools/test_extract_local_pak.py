"""Safety/atomic preflight tests for the research extractor, synthetic files only."""
from pathlib import Path
import tempfile
import unittest

from extract_local_pak import extract
from inspect_goty import FormatError
from test_inspect_goty import pak


class ExtractTests(unittest.TestCase):
    def test_extract_hashes_and_source_unchanged(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            source=root/'input.pak'
            data=pak([('images/sample.txt',b'abc')])
            source.write_bytes(data)
            report=extract(source,root/'private/output',root/'private')
            self.assertEqual((root/'private/output/images/sample.txt').read_bytes(),b'abc')
            self.assertEqual(source.read_bytes(),data)
            self.assertTrue(report['extraction']['all_written_hashes_match'])

    def test_refuses_existing_destination(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            source=root/'input.pak';source.write_bytes(pak([]))
            destination=root/'private/output';destination.mkdir(parents=True)
            marker=destination/'keep.txt';marker.write_text('keep')
            with self.assertRaises(ValueError):
                extract(source,destination,root/'private')
            self.assertEqual(marker.read_text(),'keep')

    def test_refuses_destination_outside_private(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            source=root/'input.pak';source.write_bytes(pak([]))
            with self.assertRaises(ValueError):
                extract(source,root/'public',root/'private')
            self.assertFalse((root/'public').exists())

    def test_preflight_reserved_and_bad_data_writes_nothing(self):
        for data in [pak([('images/CON.txt',b'a')]),pak([('x',b'abc')])[:-1]]:
            with self.subTest(data=data),tempfile.TemporaryDirectory() as folder:
                root=Path(folder);source=root/'input.pak';source.write_bytes(data)
                destination=root/'private/output'
                with self.assertRaises(FormatError):
                    extract(source,destination,root/'private')
                self.assertFalse(destination.exists())


if __name__=='__main__':
    unittest.main(verbosity=2)
