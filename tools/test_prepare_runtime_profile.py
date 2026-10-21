import hashlib
import struct
import tempfile
import unittest
from pathlib import Path
from prepare_runtime_profile import prepare


class ProfileGuards(unittest.TestCase):
    def fixture(self, root, name=b'WISDOMLAB', identity=2):
        root.mkdir()
        (root/'users.dat').write_bytes(struct.pack('<IHH',14,1,len(name))+name+struct.pack('<II',3,identity))
        data=bytearray(888);struct.pack_into('<i',data,0,12)
        (root/'user2.dat').write_bytes(data)
        (root/'user1.dat').write_bytes(b'original must remain unchanged')
        return bytes(data),hashlib.sha256(data).hexdigest()

    def test_only_audited_fields_change(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);remote=root/'remote';before,digest=self.fixture(remote)
            summary=(remote/'users.dat').read_bytes()
            prepare(remote,digest,root/'backup',49)
            after=(remote/'user2.dat').read_bytes()
            allowed={p+i for p in [4,8,12,0xd4,0x20c,0x210] for i in range(4)}
            self.assertTrue(all(a==b or i in allowed for i,(a,b) in enumerate(zip(before,after))))
            self.assertEqual((root/'backup/user2.before.dat').read_bytes(),before)
            self.assertEqual((remote/'user1.dat').read_bytes(),b'original must remain unchanged')
            self.assertEqual((remote/'users.dat').read_bytes(),summary)

    def test_wrong_hash_refuses_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);remote=root/'remote';before,_=self.fixture(remote)
            with self.assertRaises(ValueError):prepare(remote,'0'*64,root/'backup',49)
            self.assertEqual((remote/'user2.dat').read_bytes(),before)

    def test_wrong_mapping_refuses_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);remote=root/'remote';before,digest=self.fixture(remote,identity=1)
            with self.assertRaises(ValueError):prepare(remote,digest,root/'backup',49)
            self.assertEqual((remote/'user2.dat').read_bytes(),before)

    def test_bad_height_refuses_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);remote=root/'remote';before,digest=self.fixture(remote)
            with self.assertRaises(ValueError):prepare(remote,digest,root/'backup',0)
            self.assertEqual((remote/'user2.dat').read_bytes(),before)


if __name__=='__main__':unittest.main()
