#!/usr/bin/env python3
"""Detokenises an Applesoft BASIC program straight off a DOS 3.3 disk image.

No detokeniser existed in this repo (Transylvania's TRANS.bas listing was
produced externally); this one is generic enough for any Applesoft `A`-type
file, not just The Quest's.

    python3 the-quest/tools/detokenize.py <image> <FILENAME> [-o out.bas]
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from dos33 import catalog, file_data, read_image  # noqa: E402

TOKENS = {
    0x80: "END", 0x81: "FOR", 0x82: "NEXT", 0x83: "DATA", 0x84: "INPUT",
    0x85: "DEL", 0x86: "DIM", 0x87: "READ", 0x88: "GR", 0x89: "TEXT",
    0x8A: "PR#", 0x8B: "IN#", 0x8C: "CALL", 0x8D: "PLOT", 0x8E: "HLIN",
    0x8F: "VLIN", 0x90: "HGR2", 0x91: "HGR", 0x92: "HCOLOR=", 0x93: "HPLOT",
    0x94: "DRAW", 0x95: "XDRAW", 0x96: "HTAB", 0x97: "HOME", 0x98: "ROT=",
    0x99: "SCALE=", 0x9A: "SHLOAD", 0x9B: "TRACE", 0x9C: "NOTRACE",
    0x9D: "NORMAL", 0x9E: "INVERSE", 0x9F: "FLASH", 0xA0: "COLOR=",
    0xA1: "POP", 0xA2: "VTAB", 0xA3: "HIMEM:", 0xA4: "LOMEM:", 0xA5: "ONERR",
    0xA6: "RESUME", 0xA7: "RECALL", 0xA8: "STORE", 0xA9: "SPEED=",
    0xAA: "LET", 0xAB: "GOTO", 0xAC: "RUN", 0xAD: "IF", 0xAE: "RESTORE",
    0xAF: "&", 0xB0: "GOSUB", 0xB1: "RETURN", 0xB2: "REM", 0xB3: "STOP",
    0xB4: "ON", 0xB5: "WAIT", 0xB6: "LOAD", 0xB7: "SAVE", 0xB8: "DEF FN",
    0xB9: "POKE", 0xBA: "PRINT", 0xBB: "CONT", 0xBC: "LIST", 0xBD: "CLEAR",
    0xBE: "GET", 0xBF: "NEW", 0xC0: "TAB(", 0xC1: "TO", 0xC2: "FN",
    0xC3: "SPC(", 0xC4: "THEN", 0xC5: "AT", 0xC6: "NOT", 0xC7: "STEP",
    0xC8: "+", 0xC9: "-", 0xCA: "*", 0xCB: "/", 0xCC: "^", 0xCD: "AND",
    0xCE: "OR", 0xCF: ">", 0xD0: "=", 0xD1: "<", 0xD2: "SGN", 0xD3: "INT",
    0xD4: "ABS", 0xD5: "USR", 0xD6: "FRE", 0xD7: "SCRN(", 0xD8: "PDL",
    0xD9: "POS", 0xDA: "SQR", 0xDB: "RND", 0xDC: "LOG", 0xDD: "EXP",
    0xDE: "COS", 0xDF: "SIN", 0xE0: "TAN", 0xE1: "ATN", 0xE2: "PEEK",
    0xE3: "LEN", 0xE4: "STR$", 0xE5: "VAL", 0xE6: "ASC", 0xE7: "CHR$",
    0xE8: "LEFT$", 0xE9: "RIGHT$", 0xEA: "MID$",
}


def detokenise(data):
    """Walks Applesoft's on-disk line format: (next-addr, lineno, tokens..., 0)*, 0000."""
    out = []
    i, n = 0, len(data)
    while i + 1 < n:
        next_addr = data[i] | (data[i + 1] << 8)
        i += 2
        if next_addr == 0:
            break
        lineno = data[i] | (data[i + 1] << 8)
        i += 2
        line = []
        while i < n and data[i] != 0:
            byte = data[i]
            if byte >= 0x80:
                line.append(" " + TOKENS.get(byte, f"<{byte:02X}>") + " ")
            else:
                line.append(chr(byte))
            i += 1
        i += 1  # skip the line's null terminator
        out.append(f"{lineno} " + "".join(line).replace("  ", " "))
    return "\n".join(out)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", help="path to a .do disk image")
    parser.add_argument("filename", help="Applesoft program's DOS 3.3 filename")
    parser.add_argument("-o", "--output", help="write to this file instead of stdout")
    args = parser.parse_args()

    image = read_image(args.image)
    entries = {e["name"]: e for e in catalog(image)}
    if args.filename not in entries:
        raise SystemExit(f"{args.image}: no file named {args.filename!r}")

    raw = file_data(image, entries[args.filename]["tslist"])
    length = raw[0] | (raw[1] << 8)
    listing = detokenise(raw[2 : 2 + length])

    if args.output:
        Path(args.output).write_text(listing + "\n")
    else:
        print(listing)


if __name__ == "__main__":
    main()
