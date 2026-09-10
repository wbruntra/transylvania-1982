#!/usr/bin/env python3
"""Extracts The Quest's game text from the T1..T7 message files.

Unlike Transylvania (one flat text table baked into ROOMS), The Quest's prose
lives in seven binary blobs, T1-T7 (T1-T3 on disk 1, T4-T7 on disk 2). Each is
a straight concatenation of messages:

    <high-bit ASCII text> $8D $00 <high-bit ASCII text> $8D $00 ...

($8D is a high-bit-clear carriage return; $00 is a plain null.) No compression,
no length-prefixing -- just CR+NUL as a delimiter. Confirmed by grepping T1 for
every byte below $80 and finding exactly that two-byte pattern between runs of
high-bit text, plus 3937 bytes of "real" content followed by zero padding to
the file's end.

The game addresses these with one absolute message number `T`, resolved to
(file, index-within-file) by a boundary table `B%()` loaded from `QB` line 23:

    DATA 25,51,69,92,143,167,187

Our raw split counts per file (25, 28, 22, 24, 51, 24, 21) run a little ahead
of the cumulative B%() values (25, 51, 69, 92, 143, 167, 187) by a small and
growing offset -- almost certainly because the low end of the numbering space
(T=1..~7) is reserved for something else (room-description-style messages
handled elsewhere, going by B%(0)=25 lining up almost exactly with T1's own
count of 25). This script does not attempt to resolve `T` numbers to specific
call sites yet -- it just extracts everything, in order, per file, as a
starting point. See RESEARCH.md for the open question.

    python3 the-quest/tools/extract_text.py --disk1 "<disk 1 image>" \
        --disk2 "<disk 2 image>" -o the-quest/quest_port_kit/TEXT.json
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from dos33 import catalog, file_data, read_image  # noqa: E402

DELIM = b"\x00"
BOUNDARIES = [0, 25, 51, 69, 92, 143, 167, 187]
FILES = [
    ("T1", 1),
    ("T2", 1),
    ("T3", 1),
    ("T4", 2),
    ("T5", 2),
    ("T6", 2),
    ("T7", 2),
]


def load_body(image, entries, name):
    raw = file_data(image, entries[name]["tslist"])
    length = raw[2] | (raw[3] << 8)
    return raw[4 : 4 + length]


def to_text(chunk):
    return "".join(chr(b & 0x7F) for b in chunk)


def split_messages(body):
    parts = body.split(DELIM)
    while parts and parts[-1] == b"":
        parts.pop()
    return [to_text(part) for part in parts]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--disk1", required=True)
    parser.add_argument("--disk2", required=True)
    parser.add_argument("-o", "--output", required=True)
    args = parser.parse_args()

    img1 = read_image(args.disk1)
    img2 = read_image(args.disk2)
    e1 = {e["name"]: e for e in catalog(img1)}
    e2 = {e["name"]: e for e in catalog(img2)}

    by_file = {}
    by_id = {}
    t_abs = 1

    for file_idx, (name, disk_num) in enumerate(FILES):
        cat = e1 if disk_num == 1 else e2
        msgs = split_messages(load_body(cat == e1 and img1 or img2, cat, name))
        expected_len = BOUNDARIES[file_idx + 1] - BOUNDARIES[file_idx]
        assert len(msgs) == expected_len, f"{name}: got {len(msgs)}, expected {expected_len}"
        by_file[name] = msgs
        for in_file_idx, text in enumerate(msgs):
            by_id[str(t_abs)] = {
                "id": t_abs,
                "file": name,
                "index_in_file": in_file_idx + 1,
                "text": text,
            }
            t_abs += 1

    result = {
        "boundaries": BOUNDARIES,
        "by_file": by_file,
        "messages": by_id,
    }
    Path(args.output).write_text(json.dumps(result, indent=1) + "\n")
    print(f"wrote {args.output}: {len(by_id)} calibrated messages across {len(by_file)} files")
    for name, msgs in by_file.items():
        print(f"  {name}: {len(msgs)} messages")



if __name__ == "__main__":
    main()
