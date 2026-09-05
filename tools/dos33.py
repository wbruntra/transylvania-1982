"""Minimal DOS 3.3 reader for .do (DSK order) Apple II images.

Enough to list a catalog and pull a file's data fork out. No dependencies.
"""
import sys

SECTOR = 256
SECTORS_PER_TRACK = 16

FILE_TYPES = {0x00: "T", 0x01: "I", 0x02: "A", 0x04: "B",
              0x08: "S", 0x10: "R", 0x20: "N", 0x40: "N"}


def read_image(path):
    with open(path, "rb") as fh:
        return fh.read()


def sector(image, track, sec):
    offset = (track * SECTORS_PER_TRACK + sec) * SECTOR
    return image[offset:offset + SECTOR]


def catalog(image):
    """Yields (name, type, locked, sectors, tslist_track, tslist_sector)."""
    vtoc = sector(image, 17, 0)
    track, sec = vtoc[1], vtoc[2]
    seen = set()
    while track and (track, sec) not in seen:
        seen.add((track, sec))
        cat = sector(image, track, sec)
        for i in range(7):
            entry = cat[11 + i * 35: 11 + (i + 1) * 35]
            if not entry or entry[0] in (0x00, 0xFF):
                continue
            type_byte = entry[2]
            name = "".join(chr(b & 0x7F) for b in entry[3:33]).rstrip()
            yield {
                "name": name,
                "type": FILE_TYPES.get(type_byte & 0x7F, "?"),
                "locked": bool(type_byte & 0x80),
                "sectors": entry[33] | (entry[34] << 8),
                "tslist": (entry[0], entry[1]),
            }
        track, sec = cat[1], cat[2]


def file_data(image, tslist):
    """Concatenates the sectors a file's track/sector list points at."""
    track, sec = tslist
    out = bytearray()
    seen = set()
    while track and (track, sec) not in seen:
        seen.add((track, sec))
        ts = sector(image, track, sec)
        for i in range(12, SECTOR, 2):
            t, s = ts[i], ts[i + 1]
            if t == 0 and s == 0:
                continue
            out += sector(image, t, s)
        track, sec = ts[1], ts[2]
    return bytes(out)


if __name__ == "__main__":
    img = read_image(sys.argv[1])
    for entry in catalog(img):
        lock = "*" if entry["locked"] else " "
        print(f'{lock}{entry["type"]} {entry["sectors"]:3d}  {entry["name"]}')
