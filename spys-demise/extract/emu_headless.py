#!/usr/bin/env python3
"""Headless run of the unpacked game to dump video RAM.

Starts at $7F2E (zero-page setup, skips the title key-wait), runs the full
$8000 init with stubbed IO, stops back at the main loop ($8121), and writes:
  screen.bin (1K @ $4400), color.bin (1K color RAM), charset.bin (2K @ $6000),
  sprites.bin ($5800-$5BFF), vic.bin (VIC regs), sid.bin (SID regs).

IO stubs: $C5=$29 selects keyboard control at $9270; $DC01=$FF (no move);
$D41B returns a counter (voice-3 noise the RNG spins on); $D01E/$D01F read 0
(no collision); $D018=$15/$DD00=$C7/$D011=$1B/$01=$37 = post-CINT defaults
(the real $7F00 CINT is skipped).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools"))
from cpu6502 import CPU  # noqa: E402

UNPACKED = Path(__file__).parent / "data" / "unpacked.bin"


def main():
    mem = bytearray(open(UNPACKED, "rb").read())
    assert len(mem) == 0x10000
    mem[0xD018] = 0x15
    mem[0xDD00] = 0xC7
    mem[0xD011] = 0x1B
    mem[0x01] = 0x37
    mem[0xC5] = 0x29
    mem[0xDC01] = 0xFF
    mem[0xDC00] = 0xFF
    mem[0x028D] = 0x00
    cpu = CPU(mem)
    rnd = [0]
    orig_rd = CPU.rd

    def rd(self, addr):
        if addr == 0xD41B:
            rnd[0] = (rnd[0] + 1) & 0xFF
            return rnd[0]
        return orig_rd(self, addr)

    cpu.rd = rd.__get__(cpu, CPU)
    cpu.pc = 0x7F2E
    steps = 0
    # run until we return to the main loop with substantial work done
    while True:
        cpu.step()
        steps += 1
        if steps > 30_000_000:
            raise SystemExit("timeout, PC=$%04X" % cpu.pc)
        if cpu.pc == 0x8121 and steps > 200_000:
            break
    out = Path(__file__).parent / "data"
    blobs = {
        "screen.bin": mem[0x4400:0x4800],
        "color.bin": mem[0xD800:0xDC00],
        "charset.bin": mem[0x6000:0x6800],
        "sprites.bin": mem[0x5800:0x5C00],
        "vic.bin": mem[0xD000:0xD030],
        "sid.bin": mem[0xD400:0xD420],
    }
    for name, blob in blobs.items():
        (out / name).write_bytes(bytes(blob))
        nz = sum(1 for b in blob if b)
        print("%s: %d/%d nonzero" % (name, nz, len(blob)))
    print("stopped at $8121 after %d steps; $39(mode)=$%02X $36(floors)=$%02X" % (
        steps, mem[0x39], mem[0x36]))
    print("VIC: D011=%02X D016=%02X D018=%02X DD00=%02X D015=%02X" % (
        mem[0xD011], mem[0xD016], mem[0xD018], mem[0xDD00], mem[0xD015]))


if __name__ == "__main__":
    main()
