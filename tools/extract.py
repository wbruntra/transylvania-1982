#!/usr/bin/env python3
"""Extracts Transylvania's game data from an Apple II DOS 3.3 disk image.

    python3 tools/extract.py "<image>.do" -o trans_port_kit/game.json

Three files on the disk hold everything the engine needs:

  DATA   Sequential text. TRANS.bas:20 reads it as
             NZ, N%(1..NZ),
             M,  then M x (name, location, takeable),
             LZ, then LZ x (room type, then 6 exits N/S/W/E/U/D)
  ROOMS  RANDOM-access text, 69-byte records indexed by room number
         (TRANS.bas:8000 -- `OPENROOMS,L69` / `READROOMS,R<P>`). The BASIC
         prints "YOU ARE " in front of whatever it reads back.
  TPAR   The parser binary at $9400, called via CALL 37901 ($940D). Its tail is
         the word table: 89 verbs then 171 nouns, five bytes each, '.'-padded.
         The verb order matches the ON..GOTO dispatch at TRANS.bas:1165/1167
         and the noun order matches the N%() indices the room scripts test.
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from dos33 import catalog, file_data, read_image  # noqa: E402

ROOMS_RECORD_LENGTH = 69  # TRANS.bas:8000, "OPENROOMS,L69"
WORD_LENGTH = 5           # TPAR's word table is fixed five-byte entries
VERB_TABLE_OFFSET = 393   # into TPAR's body, i.e. $9599 - 4
VERB_COUNT = 89           # matches the 44 + 45 ON..GOTO targets at 1165/1167
NOUN_TABLE_OFFSET = 838   # runs to exactly the end of TPAR

DIRECTIONS = ["N", "S", "W", "E", "U", "D"]  # D%(room, 0..5) order


def to_ascii(data):
    """Apple II text is ASCII with the high bit set."""
    return "".join(chr(byte & 0x7F) for byte in data)


def read_data_file(raw):
    """Splits the sequential DATA file into its CR-separated fields."""
    end = raw.find(b"\x00")
    text = to_ascii(raw[:end] if end != -1 else raw)
    return [field for field in text.split("\r")]


def parse_data(fields):
    """Walks DATA in the order TRANS.bas:20 INPUTs it."""
    cursor = 0

    def take():
        nonlocal cursor
        value = fields[cursor]
        cursor += 1
        return value

    noun_count = int(take())
    noun_map = [int(take()) for _ in range(noun_count)]

    object_count = int(take())
    objects = []
    for object_id in range(1, object_count + 1):
        name, location, takeable = take(), int(take()), int(take())
        objects.append(
            {"id": object_id, "name": name, "loc": location, "takeable": takeable}
        )

    room_count = int(take())
    rooms = []
    for room_id in range(1, room_count + 1):
        room_type = int(take())
        exits = {direction: int(take()) for direction in DIRECTIONS}
        rooms.append({"id": room_id, "type": room_type, "exits": exits})

    return noun_map, objects, rooms


def parse_rooms(raw, room_count):
    """Reads the fixed-length ROOMS records, one per room, indexed by room id.

    Records are NOT newline-delimited: splitting on CR is what shifted every
    description from room 5 onwards by one in the first extraction.
    """
    descriptions = {}
    for room_id in range(1, room_count + 1):
        start = room_id * ROOMS_RECORD_LENGTH
        record = raw[start : start + ROOMS_RECORD_LENGTH]
        text = to_ascii(record).split("\r")[0].replace("\x00", "").rstrip()
        descriptions[room_id] = text
    return descriptions


def parse_words(body, offset, count):
    """Reads `count` fixed-width words out of TPAR's table."""
    words = []
    for index in range(count):
        start = offset + index * WORD_LENGTH
        words.append(to_ascii(body[start : start + WORD_LENGTH]).rstrip("."))
    return words


def parse_tpar(raw):
    """TPAR is a DOS 3.3 binary: two-byte load address, two-byte length, body."""
    length = raw[2] | (raw[3] << 8)
    body = raw[4 : 4 + length]
    verbs = parse_words(body, VERB_TABLE_OFFSET, VERB_COUNT)
    noun_count = (len(body) - NOUN_TABLE_OFFSET) // WORD_LENGTH
    nouns = parse_words(body, NOUN_TABLE_OFFSET, noun_count)
    return verbs, nouns


def parse_verb_targets(basic_path):
    """Pulls the ON..GOTO dispatch targets out of the detokenised listing.

    TRANS.bas:1165 covers verbs 1-44 and 1167 covers 45-89 (`ON I-44 GOTO`).
    They are the BASIC line each verb jumps to -- the port's checklist of what
    still needs writing, and the way to spot verbs that share a routine.
    """
    targets = []
    for line in Path(basic_path).read_text().splitlines():
        number, _, rest = line.partition(" ")
        if number in ("1165", "1167") and "GOTO" in rest:
            targets += [t.strip() for t in rest.split("GOTO", 1)[1].split(",")]
    if len(targets) != VERB_COUNT:
        raise SystemExit(f"{basic_path}: found {len(targets)} verb targets, expected {VERB_COUNT}")
    return targets


def extract(image_path, basic_path=None):
    image = read_image(image_path)
    entries = {entry["name"]: entry for entry in catalog(image)}
    for required in ("DATA", "ROOMS", "TPAR"):
        if required not in entries:
            raise SystemExit(f"{image_path}: no {required} file on this disk")

    noun_map, objects, rooms = parse_data(
        read_data_file(file_data(image, entries["DATA"]["tslist"]))
    )
    descriptions = parse_rooms(file_data(image, entries["ROOMS"]["tslist"]), len(rooms))
    verbs, nouns = parse_tpar(file_data(image, entries["TPAR"]["tslist"]))

    if len(nouns) != len(noun_map):
        raise SystemExit(
            f"TPAR holds {len(nouns)} nouns but DATA declares {len(noun_map)}"
        )

    for room in rooms:
        # TRANS.bas:8000 prints "YOU ARE " before the stored text.
        room["desc"] = f"YOU ARE {descriptions[room['id']]}"

    result = {
        "rooms": rooms,
        "objects": objects,
        "verbs": verbs,
        "nouns": nouns,
        "noun_map_N": noun_map,
        "counts": {"NZ": len(noun_map), "M": len(objects), "LZ": len(rooms)},
    }
    if basic_path:
        result["verb_targets"] = parse_verb_targets(basic_path)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", help="path to a .do / .dsk disk image")
    parser.add_argument("-o", "--output", required=True, help="game.json to write")
    parser.add_argument(
        "--basic",
        help="detokenised TRANS.bas listing, for the ON..GOTO verb targets",
    )
    args = parser.parse_args()

    data = extract(args.image, args.basic)
    Path(args.output).write_text(json.dumps(data, indent=1) + "\n")
    print(
        f'wrote {args.output}: {len(data["rooms"])} rooms, {len(data["objects"])} objects, '
        f'{len(data["verbs"])} verbs, {len(data["nouns"])} nouns'
    )


if __name__ == "__main__":
    main()
