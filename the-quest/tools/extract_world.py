#!/usr/bin/env python3
"""Extracts The Quest's room/exit/item world data from the saved `ARRAY.*`
memory snapshots on disk 1 into a `game.json`, playing the same role as
Transylvania's `tools/extract.py` -> `trans_port_kit/game.json`.

Unlike Transylvania, this game keeps its world state in raw Applesoft integer
array memory (`F%`, `I%`, `D%`), `BSAVE`d as `ARRAY.F%` / `ARRAY.I%` /
`ARRAY.D%` and reloaded byte-for-byte at boot (`QB.bas` lines 10/20). Decoding
them required figuring out two things Applesoft doesn't document plainly:

1. **Byte order.** Applesoft integer arrays store each element MSB-first (the
   opposite of the 6502's native little-endian words). Confirmed against
   `D%(2)`: raw bytes `00 26` only make sense as `38`, which is exactly the
   value implied elsewhere (`ARRAY.I%` is 156 bytes = 2 rows x 39 cols x 2
   bytes, so `D%(2)` must be 38).

2. **Dimension order.** For `DIM F%(4,255)`, Applesoft lays out elements with
   the *first* subscript fastest (column-major, i.e. the opposite of C's row-
   major) -- so `F%(row, col)` sits at `(col*5 + row) * 2`, not `(row*256 +
   col) * 2`. Confirmed by checking `F%(4, room)` against every `GOSUB`/event
   line number actually visited in `MQ.bas` (rooms 2, 4, 21, 26, 37, 39
   decode to lines 2000, 8000, 2200, 2300, 3800, 3900 -- all real lines) and
   only lines up under this ordering.

With both settled, `F%(row, room)` resolves cleanly against `MQ.bas`'s own
code (each row is one 16-bit cell split into a high and low byte, read via
the AMP-patched `USR(...)H` / `USR(...)L` suffix convention):

    F%(0, room)  hi = room description message number (T, into T1..T7)
                 lo = picture number (the P<n> file PICDRAWF loads)
    F%(1, room)  hi = north exit room id (0 = none)     [MQ.bas:180,200,210]
                 lo = south exit room id
    F%(2, room)  hi = east exit room id
                 lo = west exit room id
    F%(3, room)  hi = up exit room id
                 lo = down exit room id                 (column 0 is scratch:
                                                           F%(3,0) at :205)
    F%(4, room)  per-room event dispatch line number, GOSUB'd on arrival
                 (:30). Column 0 is reused as a global turn counter (:205),
                 not room data.

`I%(0..1, item)` is the item table -- `I%(0,item)` looks like item location
(room id, or a negative/special sentinel for "carried" -- e.g. `I%(Z,8)=-2`
at MQ.bas:2000), `I%(1,item)` looks like item price (`MQ.bas:2005` prints it
under a "SOVEREIGNS" header). **Item names are not resolved by this script**
-- `MQ.bas:2005`'s `& STR$ I,N$` looks up a name for item id `I` through the
`AMP 2.8` extension itself (not the stock `STR$`), and that table hasn't been
located yet. See RESEARCH.md.

    python3 the-quest/tools/extract_world.py --disk1 "<disk 1 image>" \
        -o the-quest/quest_port_kit/game.json
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from dos33 import catalog, file_data, read_image  # noqa: E402

DIRECTIONS = ["north", "south", "east", "west", "up", "down"]


def load_array_body(image, entries, name):
    """Strips the 4-byte BLOAD header (load address, length) off a binary file."""
    raw = file_data(image, entries[name]["tslist"])
    length = raw[2] | (raw[3] << 8)
    return raw[4 : 4 + length]


def elements(body, dims):
    """Reads a column-major Applesoft integer array: DIM A(d0,d1,...) stores
    the *first* subscript fastest. Returns a dict keyed by the subscript
    tuple, each value the raw (hi, lo) byte pair -- callers decide how to
    combine them (paired directions, or a single 16-bit signed value)."""
    sizes = [d + 1 for d in dims]
    strides = [1] * len(sizes)
    for i in range(1, len(sizes)):
        strides[i] = strides[i - 1] * sizes[i - 1]

    result = {}
    for flat in range(len(body) // 2):
        idx = []
        remaining = flat
        for size, stride in zip(sizes, strides):
            idx.append((remaining // stride) % size)
        hi, lo = body[flat * 2], body[flat * 2 + 1]
        result[tuple(idx)] = (hi, lo)
    return result


def signed16(hi, lo):
    value = (hi << 8) | lo
    return value - 65536 if value >= 32768 else value


def extract(disk1_path):
    image = read_image(disk1_path)
    entries = {e["name"]: e for e in catalog(image)}

    d_body = load_array_body(image, entries, "ARRAY.D%")
    d_vals = [signed16(d_body[i], d_body[i + 1]) for i in range(0, len(d_body), 2)]
    max_item = d_vals[2]  # D%(2): confirmed against ARRAY.I%'s size

    f_body = load_array_body(image, entries, "ARRAY.F%")
    f_elems = elements(f_body, dims=[4, 255])  # F%(0..4, 0..255)

    rooms = []
    for room in range(1, 256):
        pic_hi, pic_lo = f_elems[(0, room)]
        ns_hi, ns_lo = f_elems[(1, room)]
        ew_hi, ew_lo = f_elems[(2, room)]
        ud_hi, ud_lo = f_elems[(3, room)]
        event_hi, event_lo = f_elems[(4, room)]

        exits = {
            "north": ns_hi, "south": ns_lo,
            "east": ew_hi, "west": ew_lo,
            "up": ud_hi, "down": ud_lo,
        }
        event_line = (event_hi << 8) | event_lo
        has_signal = pic_lo or any(exits.values()) or event_line
        if not has_signal:
            continue

        rooms.append({
            "id": room,
            "desc_message": pic_hi,   # index into the T1..T7 message tables
            "picture": pic_lo,        # P<n> file for PICDRAWF
            "exits": {k: v for k, v in exits.items() if v},
            "event_line": event_line or None,
        })

    i_body = load_array_body(image, entries, "ARRAY.I%")
    i_elems = elements(i_body, dims=[1, max_item])  # I%(0..1, 0..max_item)

    # Load item names and synonyms from AMP 2.8
    amp_raw = file_data(image, entries["AMP 2.8"]["tslist"])
    amp_base = amp_raw[0] | (amp_raw[1] << 8)
    amp_body = amp_raw[4 : 4 + (amp_raw[2] | (amp_raw[3] << 8))]
    from extract_vocab import scan_words, scan_item_mapping, NOUN_RANGE, ITEM_MAP_RANGE
    nouns = scan_words(amp_body, *NOUN_RANGE)
    _, item_info_list = scan_item_mapping(amp_body, *ITEM_MAP_RANGE, nouns)
    item_lookup = {item_info["id"]: item_info for item_info in item_info_list}

    items = []
    for item in range(1, max_item + 1):
        loc_hi, loc_lo = i_elems[(0, item)]
        price_hi, price_lo = i_elems[(1, item)]
        info = item_lookup.get(item, {"name": f"ITEM {item}", "synonyms": []})
        items.append({
            "id": item,
            "name": info["name"],
            "synonyms": info["synonyms"],
            "location": signed16(loc_hi, loc_lo),
            "price": signed16(price_hi, price_lo),
        })

    return {
        "rooms": rooms,
        "items": items,
        "d_percent_raw": d_vals,
        "counts": {"rooms": len(rooms), "items": len(items)},
    }



def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--disk1", required=True, help="path to disk 1's .do image")
    parser.add_argument("-o", "--output", required=True)
    args = parser.parse_args()

    data = extract(args.disk1)
    Path(args.output).write_text(json.dumps(data, indent=1) + "\n")
    print(
        f'wrote {args.output}: {data["counts"]["rooms"]} rooms, '
        f'{data["counts"]["items"]} items'
    )


if __name__ == "__main__":
    main()
