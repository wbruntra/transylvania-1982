#!/usr/bin/env python3
"""Renders The Quest's original artwork, reusing Transylvania's PICDRAW2
interpreter machinery almost unchanged.

The Quest's PICDRAWF binary loads at $0800 with length $0A00 -- byte-for-byte
the same load address and size as Transylvania's PICDRAW2 -- and QB/MQ drive
it with the identical convention:

    POKE 2560,<addr low>  POKE 2561,<addr high>  CALL 2608   (room)
    POKE 2560,<addr low>  POKE 2561,<addr high>  CALL 2613   (object)

The only difference worth noting: Transylvania loads rooms and objects at two
different fixed addresses ($1200 / $19E8). The Quest loads *everything* -- both
P<n> room pictures and the one O<n> object picture found so far -- at a single
address, $1201 (constant `P=4609` in QB.bas line 1), reusing the same spot each
time since only one picture is ever on screen mid-draw.

Picture files are named P<n> (rooms) instead of R<n>, and O<n> (objects, of
which only O1 has been found across both disks so far -- this game appears to
lean much less on individual object art than Transylvania did).

    python3 the-quest/tools/picdraw_quest.py --disk1 "<disk 1 image>" \
        --disk2 "<disk 2 image>" --out the-quest/quest_port_kit/art_samples
"""
import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "tools"))

import picdraw  # noqa: E402 -- the Transylvania renderer, reused wholesale
import dos33  # noqa: E402

PICTURE_ADDR = 0x1201  # QB.bas line 1: P = 4609


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--disk1", required=True)
    parser.add_argument("--disk2", required=True)
    parser.add_argument("--out", default="the-quest/quest_port_kit/art_samples")
    parser.add_argument("--scale", type=int, default=2)
    parser.add_argument("--only", help="render just this file, e.g. P9 or O1")
    parser.add_argument("--rom", help="Apple II $D000-$FFFF ROM image; see "
                                      "picdraw.load_rom")
    args = parser.parse_args()

    rom = picdraw.load_rom(args.rom)
    if rom is None:
        print(f"warning: no ROM (--rom or ${picdraw.ROM_ENV}); imitating "
              "Applesoft, which leaves some fills misplaced\n")

    picdraw.ROOM_ADDR = PICTURE_ADDR
    picdraw.OBJECT_ADDR = PICTURE_ADDR

    cat1, img1 = picdraw.load_disk(args.disk1)
    cat2, img2 = picdraw.load_disk(args.disk2)
    picdrawf = picdraw.binary(img1, cat1["PICDRAWF"])

    jobs = []  # (name, image, catalog, is_object)
    for cat, img in ((cat1, img1), (cat2, img2)):
        for name in cat:
            if name[0] in "PO" and name[1:].isdigit():
                jobs.append((name, img, cat, name.startswith("O")))
    jobs.sort(key=lambda j: (j[0][0], int(j[0][1:]), id(j[1])))

    if args.only:
        jobs = [j for j in jobs if j[0] == args.only]

    os.makedirs(args.out, exist_ok=True)
    failures = []
    seen = set()
    for name, img, cat, is_object in jobs:
        out_name = name.lower() if name not in seen else f"{name.lower()}_alt"
        seen.add(name)
        data = picdraw.binary(img, cat[name])
        try:
            picture = picdraw.render(picdrawf, data, is_object=is_object, rom=rom)
        except Exception as exc:  # noqa: BLE001
            failures.append((name, f"{type(exc).__name__}: {exc}"))
            continue
        picdraw.rasterise(picture, args.scale).save(os.path.join(args.out, f"{out_name}.png"))
        print(f"  {name:6} {len(picture.lines):5d} lines  {picture.moves:4d} moves")

    if failures:
        print(f"\n{len(failures)} failed:")
        for name, why in failures:
            print(f"  {name:6} {why}")
    print(f"\n{len(jobs) - len(failures)}/{len(jobs)} rendered into {args.out}/")


if __name__ == "__main__":
    main()
