#!/usr/bin/env python3
"""Unpack game_v2 in the repo's 6502 emulator, dump RAM + entry disassembly.

    python3 spys-demise/extract/unpack.py \
        --prg spys-demise/extract/data/SPY_S_DEMISE.prg \
        --out spys-demise/extract/data

Reproduces: stage-1 copy ($080D->$0840), depacker at $0116, stops at the
first KERNAL call ($FF81 CINT from $7F00). Writes unpacked.bin (64K RAM)
and entry.asm ($7F00 init + $8000 VIC setup).
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools"))
from cpu6502 import CPU  # noqa: E402

sys.path.insert(0, str(Path(__file__).parent))
from dis6502 import disassemble  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prg", required=True, help="extracted game_v2 .prg")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    raw = Path(args.prg).read_bytes()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    mem = bytearray(0x10000)
    load = raw[0] + raw[1] * 256
    mem[load:load + len(raw) - 2] = raw[2:]
    cpu = CPU(mem)
    s1 = cpu.run(0x080D, 0x0840, limit=500000)
    cpu.pc = 0x0116
    steps = s1
    while not 0xFF00 <= cpu.pc <= 0xFFFF:
        cpu.step()
        steps += 1
        if steps > 5000000:
            raise SystemExit("depacker did not reach KERNAL")
    (out / "unpacked.bin").write_bytes(bytes(mem))

    lines, _ = disassemble(mem, 0, 0x7F00, 60)
    lines.append("")
    lines.append("; --- main VIC/sprite setup at $8000 ---")
    more, _ = disassemble(mem, 0, 0x8000, 60)
    lines.extend(more)
    (out / "entry.asm").write_text("\n".join(lines) + "\n")
    nz = lambda a, b: sum(1 for i in range(a, b) if mem[i])
    print("unpacked after %d steps, KERNAL call at $%04X" % (steps, cpu.pc))
    print("nonzero: 0800-1000 %d  8000-C000 %d" % (nz(0x0800, 0x1000), nz(0x8000, 0xC000)))
    print("wrote unpacked.bin + entry.asm")


if __name__ == "__main__":
    main()
