"""Contact sheets and room+object composites from the originals.

`picdraw.py` writes one PNG per picture; this arranges them for looking at.
Objects are worth composing over their room rather than viewing alone: several
are drawn in black, which is invisible against the blank page an object renders
onto but perfectly visible over the room art it was meant to sit on.
"""

import argparse
import json
import os
import re
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import dos33
import picdraw

TILE_W, TILE_H, LABEL_H = 240, 165, 26


def labels(game_json):
    data = json.load(open(game_json))
    rooms = {r["id"]: (r.get("desc") or "").replace("  ", " ") for r in data["rooms"]}
    objects = {o["id"]: o["name"] for o in data["objects"]}
    return rooms, objects


def sheet(art_dir, kind, columns, out, game_json):
    rooms, objects = labels(game_json)
    names = sorted(
        (f for f in os.listdir(art_dir) if re.fullmatch(rf"{kind}\d+\.png", f)),
        key=lambda f: int(f[1:-4]),
    )
    rows = (len(names) + columns - 1) // columns
    canvas = Image.new("RGB", (columns * TILE_W, rows * (TILE_H + LABEL_H)), (24, 24, 28))
    draw = ImageDraw.Draw(canvas)
    for index, filename in enumerate(names):
        number = int(filename[1:-4])
        tile = Image.open(os.path.join(art_dir, filename)).resize(
            (TILE_W - 4, TILE_H - 4), Image.LANCZOS
        )
        x, y = (index % columns) * TILE_W, (index // columns) * (TILE_H + LABEL_H)
        canvas.paste(tile, (x + 2, y + 2))
        text = (f"R{number}  " + rooms.get(number, "")[:34]) if kind == "r" \
            else (f"O{number}  " + objects.get(number, "")[:32])
        draw.text((x + 4, y + TILE_H), text, fill=(210, 210, 220))
    canvas.save(out)
    return len(names), canvas.size


def compose(picdraw_bin, image, catalog, room, object_ids, rom=None):
    """Room first, then each object over it -- TRANS.bas:8000 then 8030/8070."""
    page = picdraw.render(
        picdraw_bin, picdraw.binary(image, catalog[f"R{room}"]),
        is_object=False, rom=rom,
    ).page
    for object_id in object_ids:
        page = picdraw.render(
            picdraw_bin, picdraw.binary(image, catalog[f"O{object_id}"]),
            is_object=True, page=page, rom=rom,
            addr=picdraw.ROOM_ADDR if object_id in picdraw.BIG_OBJECTS else None,
        ).page
    return page


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--art", default="transylvania/public/art/original")
    parser.add_argument("--game", default="transylvania/public/game.json")
    parser.add_argument("--disk", default="Transylvania (1982)(Penguin Software)"
                        "(Disk 1 of 2).DO/Transylvania (1982)(Penguin Software)(Disk 1 of 2).do")
    parser.add_argument("--out", default="transylvania/public/art/original")
    parser.add_argument("--compose", help="e.g. 5:6,12 to put objects 6 and 12 in room 5")
    parser.add_argument("--rom", help="Apple II $D000-$FFFF ROM image; see picdraw.load_rom")
    args = parser.parse_args()

    if args.compose:
        room, _, ids = args.compose.partition(":")
        object_ids = [int(i) for i in ids.split(",") if i]
        catalog, image = picdraw.load_disk(args.disk)
        picdraw_bin = picdraw.binary(image, catalog["PICDRAW2"])
        page = compose(picdraw_bin, image, catalog, int(room), object_ids,
                       rom=picdraw.load_rom(args.rom))
        path = os.path.join(args.out, f"compose-r{room}.png")
        picdraw.image_from_page(page, 3).save(path)
        print(path)
        return

    for kind, columns, name in [("r", 6, "rooms-sheet.png"), ("o", 7, "objects-sheet.png")]:
        count, size = sheet(args.art, kind, columns, os.path.join(args.out, name), args.game)
        print(f"  {name}  {count} tiles  {size[0]}x{size[1]}")


if __name__ == "__main__":
    main()
