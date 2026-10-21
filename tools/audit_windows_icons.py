"""Read PE icon resources without executing the inspected program."""
import struct,json
from pathlib import Path
def icons(path):
 data=Path(path).read_bytes()
 u16=lambda n:struct.unpack_from('<H',data,n)[0]
 u32=lambda n:struct.unpack_from('<I',data,n)[0]
 pe=u32(60);assert data[pe:pe+4]==b'PE\0\0'
 optional=pe+24;directory=optional+(112 if u16(optional)==0x20b else 96)
 rva=u32(directory+16);section_start=optional+u16(pe+20)
 sections=[struct.unpack_from('<IIII',data,section_start+40*i+8) for i in range(u16(pe+6))]
 def offset(rva):
  for virtual_size,address,raw_size,raw in sections:
   if address<=rva<address+max(virtual_size,raw_size):return raw+rva-address
  raise ValueError('RVA outside section')
 root=offset(rva)
 def entries(relative):
  pos=root+relative;count=u16(pos+12)+u16(pos+14)
  return [struct.unpack_from('<II',data,pos+16+8*i) for i in range(count)]
 def leaves(relative):
  result=[]
  for name,target in entries(relative):
   if target&0x80000000:result.extend(leaves(target&0x7fffffff))
   else:
    address,size=struct.unpack_from('<II',data,root+target);result.append(data[offset(address):offset(address)+size])
  return result
 groups=[]
 for kind,target in entries(0):
  if kind==14:
   for blob in leaves(target&0x7fffffff):
    count=struct.unpack_from('<H',blob,4)[0]
    groups.append(sorted({(blob[6+14*i] or 256,blob[7+14*i] or 256) for i in range(count)}))
 return groups
if __name__=='__main__':
 root=Path(__file__).resolve().parents[1];out=root/'private/reports/installed-ui'
 install=json.loads((out/'installation.json').read_text(encoding='utf-8-sig'))
 wanted={(n,n) for n in [16,20,24,32,40,48,64,128,256]}
 result={}
 for name,path in [('installed',install['exe']),('installer',root/('private/releases/personal/智慧树 安装程序 '+json.loads((root/'package.json').read_text(encoding='utf-8'))['version']+'.exe'))]:
  groups=icons(path);assert any(wanted<=set(group) for group in groups),(name,groups)
  result[name]=groups
 (out/'pe-icons.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
