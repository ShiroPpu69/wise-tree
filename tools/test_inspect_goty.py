"""Synthetic fixtures only: no game resources, no visual fidelity claim."""
import struct
import unittest
import zlib

from inspect_goty import FormatError, inspect_pak, inspect_reanim, unwrap_compiled


def pak(entries, tail=b''):
    data = struct.pack('<II', 0xBAC04AC0, 0)
    body = b''
    for path, content in entries:
        name = path.encode('ascii')
        data += bytes([0, len(name)]) + name + struct.pack('<iQ', len(content), 0)
        body += content
    return bytes(b ^ 0xF7 for b in data + b'\x80' + body + tail)


def string(value):
    data = value.encode()
    return struct.pack('<I', len(data)) + data


def reanim():
    data = bytes(8) + struct.pack('<IfII', 1, 12.0, 0, 12)
    data += bytes(8) + struct.pack('<I', 3)
    data += string('anim_grow_synthetic') + struct.pack('<I', 44)
    for frame in [0.0, -10000.0, -1.0]:
        data += struct.pack('<8f', 2, 4, 10, 20, 1, 1, frame, 1) + bytes(12)
    for i in range(3):
        data += string('SYNTHETIC_IMAGE' if i == 0 else '')
        data += string('SYNTHETIC_FONT' if i == 0 else '')
        data += string('test only' if i == 0 else '')
    return data


class InspectorTests(unittest.TestCase):
    def test_pak_inventory_and_hash(self):
        report = inspect_pak(pak([('images\\sample.txt', b'abc')]))
        self.assertEqual(report['entry_count'], 1)
        self.assertEqual(report['entries'][0]['path'], 'images/sample.txt')
        self.assertEqual(report['entries'][0]['sha256'],
                         'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
        self.assertFalse(report['goty_verified'])

    def test_pak_traversal_absolute_and_ads(self):
        for name in ['../x', 'C:\\x', '\\x', 'images\\..\\x', 'x:stream']:
            with self.subTest(name=name), self.assertRaises(FormatError):
                inspect_pak(pak([(name, b'')]))

    def test_pak_duplicate_casefold(self):
        with self.assertRaises(FormatError):
            inspect_pak(pak([('x', b''), ('X', b'')]))

    def test_pak_truncation(self):
        with self.assertRaises(FormatError):
            inspect_pak(pak([('x', b'abc')])[:-1])

    def test_pak_tail(self):
        with self.assertRaises(FormatError):
            inspect_pak(pak([], b'x'))

    def test_pak_wrong_version(self):
        data = bytearray(pak([]))
        data[4] ^= 1
        with self.assertRaises(FormatError):
            inspect_pak(bytes(data))

    def test_reanim_metadata_preserved(self):
        report = inspect_reanim(reanim())
        track = report['tracks'][0]
        self.assertEqual(track['fonts'], ['SYNTHETIC_FONT'])
        self.assertEqual(track['text_frames'], [0])
        self.assertEqual((track['first_visible'], track['last_visible']), (0, 1))
        self.assertFalse(report['goty_verified'])

    def test_reanim_compressed(self):
        raw = reanim()
        wrapped = struct.pack('<II', 0xDEADFED4, len(raw)) + zlib.compress(raw)
        self.assertEqual(inspect_reanim(wrapped)['tracks'], inspect_reanim(raw)['tracks'])

    def test_reanim_bad_declared_length(self):
        raw = reanim()
        with self.assertRaises(FormatError):
            unwrap_compiled(struct.pack('<II', 0xDEADFED4, 1) + zlib.compress(raw))

    def test_reanim_truncated_and_trailing(self):
        for raw in [reanim()[:-1], reanim() + b'x']:
            with self.assertRaises(FormatError):
                inspect_reanim(raw)


if __name__ == '__main__':
    unittest.main(verbosity=2)
