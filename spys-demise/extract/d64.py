"""CBM 1541 D64 reader (35-track, no errors/halftracks)."""

from dataclasses import dataclass


def sectors_per_track(track):
    if 1 <= track <= 17:
        return 21
    if 18 <= track <= 24:
        return 19
    if 25 <= track <= 30:
        return 18
    if 31 <= track <= 35:
        return 17
    raise ValueError(track)


def track_offset(track, sector):
    off = 0
    for tr in range(1, track):
        off += sectors_per_track(tr) * 256
    return off + sector * 256


@dataclass
class DirEntry:
    name: str
    raw_name: bytes
    ftype: int
    track: int
    sector: int
    blocks: int


def read_sector(image, track, sector):
    return image[track_offset(track, sector):track_offset(track, sector) + 256]


def directory(image):
    sec = read_sector(image, 18, 1)
    entries = []
    for i in range(8):
        o = 2 + i * 32
        e = sec[o:o + 32]
        if e[0] == 0:
            continue
        raw = bytes(e[3:19])
        name = raw.decode("ascii", errors="replace").strip("\xa0 ").strip()
        entries.append(DirEntry(name, raw, e[0], e[1], e[2], e[28] + e[29] * 256))
    return entries


def read_chain(image, track, sector, last_sector_full=True):
    """Follow a T/S chain. For the last sector (T=0) S is unreliable across
    images, so take the whole sector; callers trim trailing padding."""
    out = bytearray()
    while track != 0:
        sec = read_sector(image, track, sector)
        nt, ns = sec[0], sec[1]
        if nt == 0:
            out.extend(sec[2:] if last_sector_full else sec[2:2 + max(ns - 1, 0)])
            break
        out.extend(sec[2:])
        track, sector = nt, ns
    return bytes(out)
