#!/usr/bin/env python3
"""Extract Spy's Demise PRGs + docs from the C64 D64.

    python3 spys-demise/extract/extract_sd.py \
        --image spys-demise/Spys-Demise_C64_EN/SPYSDEMI.D64 \
        --out spys-demise/extract/data

Writes: manifest.json, game_v1.prg, game_v2.prg, dox.prg, trainer.prg,
docs.txt (LOADSTAR briefing), basic.txt (BASIC stubs).
"""

import argparse
import json
from pathlib import Path

from d64 import directory, read_chain

TOKENS = {
    0x80: 'END', 0x81: 'FOR', 0x82: 'NEXT', 0x83: 'DATA', 0x84: 'INPUT#',
    0x85: 'INPUT', 0x86: 'DIM', 0x87: 'READ', 0x88: 'LET', 0x89: 'GOTO',
    0x8A: 'RUN', 0x8B: 'IF', 0x8C: 'RESTORE', 0x8D: 'GOSUB', 0x8E: 'RETURN',
    0x8F: 'REM', 0x90: 'STOP', 0x91: 'ON', 0x92: 'WAIT', 0x93: 'LOAD',
    0x94: 'SAVE', 0x95: 'VERIFY', 0x96: 'DEF', 0x97: 'POKE', 0x98: 'PRINT#',
    0x99: 'PRINT', 0x9A: 'CONT', 0x9B: 'LIST', 0x9C: 'CLR', 0x9D: 'CMD',
    0x9E: 'SYS', 0x9F: 'OPEN', 0xA0: 'CLOSE', 0xA1: 'GET', 0xA2: 'NEW',
    0xA3: 'TAB(', 0xA4: 'TO', 0xA5: 'FN', 0xA6: 'SPC(', 0xA7: 'THEN',
    0xA8: 'NOT', 0xA9: 'STEP',
}


def detokenize_first_line(prg):
    """Only the first BASIC line is a real stub (SYS nnnn); the rest of v1's
    'program' is ML overlapping the BASIC area, so don't walk the line chain."""
    if prg[0] != 0x01 or prg[1] != 0x08:
        return "<not $0801 BASIC>"
    nxt = prg[2] + prg[3] * 256
    lno = prg[4] + prg[5] * 256
    out = []
    p = 6
    inquote = False
    while prg[p] != 0:
        b = prg[p]
        p += 1
        if b == 0x22:
            out.append('"')
            inquote = not inquote
        elif not inquote and b >= 0x80:
            out.append(" " + TOKENS.get(b, "<$%02X>" % b) + " ")
        else:
            out.append(chr(b))
    return "%d %s (next ptr $%04X)" % (lno, "".join(out).strip(), nxt)


def petscii_text(data):
    def cv(b):
        if b == 0x0D:
            return "\n"
        if b in (0x00, 0xFF):
            return ""
        if 0x20 <= b <= 0x7E:
            return chr(b)
        if b == 0xA0:
            return " "
        if 0xC1 <= b <= 0xDA:
            return chr(ord("A") + b - 0xC1)
        if b >= 0x80:
            return cv(b & 0x7F)
        return " "
    return "".join(cv(b) for b in data)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    image = Path(args.image).read_bytes()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    entries = directory(image)
    manifest = []
    blobs = {}
    seen = {}
    for e in entries:
        raw = read_chain(image, e.track, e.sector)
        blobs[e.name] = raw
        # file_0 has trailing '+' with shifted spaces; normalise for filenames.
        # Two files normalise to the same stem, so disambiguate with T/S.
        safe = "".join(c if c.isalnum() else "_" for c in e.name).strip("_")
        safe = "%s_T%d_S%d" % (safe, e.track, e.sector)
        if safe in seen:  # chain start repeats only if image is odd; be safe
            safe = "%s_%d" % (safe, len(seen))
        seen[safe] = True
        path = out / (safe + ".prg")
        path.write_bytes(raw)
        manifest.append({
            "name": e.name, "file": path.name, "type": hex(e.ftype),
            "start_track": e.track, "start_sector": e.sector,
            "blocks": e.blocks, "bytes": len(raw),
            "load": hex(raw[0] + raw[1] * 256),
            "basic_stub": detokenize_first_line(raw) if raw[0] == 0x01 else "",
        })

    # LOADSTAR briefing lives in the $8000 trainer/docs PRG.
    trainer = next((b for n, b in blobs.items() if n.startswith("T.SPY")), None)
    if trainer is not None:
        (out / "docs.txt").write_text(petscii_text(trainer[2:]).strip() + "\n")

    (out / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
    basics = "\n".join(m["name"] + " load " + m["load"] + " : " + m["basic_stub"]
                        for m in manifest)
    (out / "basic.txt").write_text(basics + "\n")
    print("wrote %s: %d files" % (out, len(manifest)))
    for m in manifest:
        print("  %(name)r %(file)s %(bytes)dB load %(load)s [%(basic_stub)s]" % m)


if __name__ == "__main__":
    main()
