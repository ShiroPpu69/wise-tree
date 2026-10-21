"""Read-only PE/string xref research. Never launches or alters a game binary.

Supports PE payloads already present in the supplied file; no DRM bypass,
decryption, memory attachment, patching, or executable output.
Requires pefile and reviewed Capstone 5.0.9 in private/research-deps.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import sys

import pefile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    if not args.out.resolve().is_relative_to((root/'private').resolve()):
        parser.error('Output must be under private/')
    sys.path.insert(0, str(root/'private/research-deps'))
    from capstone import Cs, CS_ARCH_X86, CS_MODE_32
    engine = Cs(CS_ARCH_X86, CS_MODE_32)
    original = args.input.read_bytes()
    digest = hashlib.sha256(original).hexdigest()
    candidates, pos = [], 0
    while True:
        offset = original.find(b'MZ', pos)
        if offset < 0:
            break
        pos = offset + 2
        if offset + 64 > len(original):
            continue
        header = struct.unpack_from('<I', original, offset+60)[0]
        if header > len(original)-offset-4 or original[offset+header:offset+header+4] != b'PE\x00\x00':
            continue
        try:
            pe = pefile.PE(data=original[offset:])
        except pefile.PEFormatError:
            continue
        candidates.append((offset, pe))
    args.out.mkdir(parents=True, exist_ok=True)
    reports = []
    for offset, pe in candidates:
        data = original[offset:]
        base = pe.OPTIONAL_HEADER.ImageBase
        report = {'fileOffset':offset,'imageBase':base,'machine':pe.FILE_HEADER.Machine,
                  'sections':[{'name':s.Name.rstrip(b'\0').decode(),'rva':s.VirtualAddress,'rawBytes':s.SizeOfRawData} for s in pe.sections],
                  'stringReferences':{}}
        for text in ['anim_grow%d','[TREE_OF_WISDOM_%d]','[TREE_OF_WISDOM_HIEGHT]','Cloud%d','[CURRENCY_STRING]']:
            location = data.find(text.encode())
            if location < 0:
                continue
            try:
                rva = pe.get_rva_from_offset(location)
                if rva is None:
                    continue  # A string in a nested PE is not mapped by its wrapper.
                va = base + rva
            except pefile.PEFormatError:
                continue
            refs = []
            for section in pe.sections:
                if not section.Characteristics & 0x20000000:
                    continue
                code, start = section.get_data(), 0
                while True:
                    match = code.find(struct.pack('<I', va), start)
                    if match < 0:
                        break
                    start = match+4
                    refva = base+section.VirtualAddress+match
                    refs.append(refva)
                    # INT3 padding heuristic is documented; no automatic function-name claim.
                    boundary = code.rfind(b'\xcc\xcc\xcc', max(0,match-4096),match)
                    begin = boundary+3 if boundary>=0 else max(0,match-128)
                    while begin<match and code[begin]==0xcc:
                        begin+=1
                    end = code.find(b'\xcc\xcc\xcc',match)
                    if end<0 or end-begin>10000:
                        end=min(len(code),match+1024)
                    instructions=[]
                    for instruction in engine.disasm(code[begin:end],base+section.VirtualAddress+begin):
                        instructions.append(f'{instruction.address:08x}: {instruction.bytes.hex():24s} {instruction.mnemonic} {instruction.op_str}')
                    (args.out/f'pe-{offset:x}-xref-{refva:x}.asm.txt').write_text('\n'.join(instructions),encoding='utf-8')
            report['stringReferences'][text]={'virtualAddress':va,'xrefImmediateAddresses':refs}
        # Preserve one region around tree routines for manual control-flow/call examination.
        if 'anim_grow%d' in report['stringReferences']:
            region_start=0x430c50
            region_size=0x1800
            if digest=='868f8e2bab0d6a7ef8afc4c5960c608eccef82bd086bd6e0c0e2670199a5ca45':
                asm=[f'{i.address:08x}: {i.mnemonic} {i.op_str}' for i in engine.disasm(pe.get_data(region_start-base,region_size),region_start)]
                (args.out/'tree-region.asm.txt').write_text('\n'.join(asm),encoding='utf-8')
                report['floatConstants']={hex(va):struct.unpack('<f',pe.get_data(va-base,4))[0]
                                          for va in [0x7062d4,0x7065bc,0x706808,0x7069f8,0x706c04]}
                for label, start, size in [('unlock-thresholds',0x45bb30,0x60),
                                           ('feed-guard',0x431820,0x50),
                                           ('store-food-stock',0x499530,0x70),
                                           ('store-purchase',0x49b7d0,0x140),
                                           ('item-cost',0x49b1a0,0xa2)]:
                    lines=[f'{i.address:08x}: {i.mnemonic} {i.op_str}' for i in engine.disasm(pe.get_data(start-base,size),start)]
                    (args.out/f'{label}.asm.txt').write_text('\n'.join(lines),encoding='utf-8')
                report['treeFoodCostJumpTarget']=hex(struct.unpack('<I',pe.get_data(0x49b244+28*4-base,4))[0])
        reports.append(report)
    result={'sha256':digest,'analysis':'static only; function boundaries heuristic; no runtime validation',
            'peImages':reports,'capstoneVersion':'5.0.9','pefileVersion':pefile.__version__,
            'inputSha256After':hashlib.sha256(args.input.read_bytes()).hexdigest()}
    (args.out/'pe-summary.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps(result,indent=2))


if __name__=='__main__':
    main()
