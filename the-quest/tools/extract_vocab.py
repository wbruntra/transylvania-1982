#!/usr/bin/env python3
"""Extracts The Quest's parser vocabulary from `AMP 2.8`.

Unlike Transylvania's `TPAR` (a clean fixed-width 5-byte-per-word table),
`AMP 2.8` stores words as variable-length plain ASCII with the high bit set
on only the *last* character of each word -- a classic space-saving
terminator scheme. Confirmed against the very first entries: bytes
`CE 4E 4F 52 54 C8` decode (stripping the high bit) to `N` (a single
high-bit-terminated byte) immediately followed by `NORTH` (terminated by
`H`+0x80) -- i.e. the vocabulary lists single-letter compass abbreviations
(`N`, `S`, `E`, `W`, `U`, `D`) as their own separate words right before the
full compass words, exactly the shortcut a text adventure parser supports.

The word list runs from `N` through `RIDE` (verbs, offset 1034-1271 in the
binary's data body), then exactly 120 bytes (offset 1273-1392) -- one 16-bit
little-endian slot per verb word, in table order -- that mostly (not fully)
decodes as a per-verb dispatch table: the slots landing on round-number
values (multiples of 50 -- `SAVE`->1200, `READ`->750, `SWIM`->1000, the
compass directions at 200/210/220/230/240, etc.) match real `MQ.bas` lines
whose content fits the verb exactly. Others (`DOWN`->506, `RESTORE`->1506,
`PURCHASE`->812, `CLIMB`->962, ...) don't correspond to any real line, which
looks like this table has one slot per unique verb *meaning* rather than per
synonym word, throwing off a naive 1:1 reading once a synonym group's real
size stops matching what was assumed. Included below as `verb_dispatch` for
whoever wants to take another run at it -- treat it as a lead, not a solved
table. See RESEARCH.md's "Vocabulary" section for the full derivation.

The word list resumes at `CARTOGRAPH` (offset 1393) with nouns, and runs into
what read as book titles and conversation topics (`LINGUA DRACO FLAMEUS`,
`SOFTALK MAGAZINE`) matching the reading material described in
`MQ.bas:7000-7050`, ending at `SOFTALK` (offset 1909).

These byte ranges were found by manual inspection (`RESEARCH.md` has the hex
dump) and are hardcoded here rather than auto-detected, because a generic
"does it look like ASCII" scanner also fires on stretches of ordinary 6502
code -- see git history for that version if it's ever needed again.

    python3 the-quest/tools/extract_vocab.py --disk1 "<disk 1 image>" \
        -o the-quest/quest_port_kit/vocabulary.json
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from dos33 import catalog, file_data, read_image  # noqa: E402

VERB_RANGE = (1034, 1271)
DISPATCH_RANGE = (1272, 1392)
NOUN_RANGE = (1393, 1910)
ITEM_MAP_RANGE = (1911, 1991)


def scan_words(data, start, end):
    words = []
    i = start
    while i < end:
        chars = []
        while i < end:
            byte = data[i]
            chars.append(chr(byte & 0x7F))
            i += 1
            if byte & 0x80:
                break
        words.append("".join(chars))
    return words


def scan_dispatch(data, start, end, verbs):
    body = data[start:end]
    # Applesoft integer format is big-endian (MSB first)
    return [
        (body[i * 2] << 8) | body[i * 2 + 1]
        for i in range(len(verbs))
    ]


def scan_item_mapping(data, start, end, nouns):
    body = data[start:end]
    noun_to_item = [int(body[i]) for i in range(len(nouns))]
    items = {}
    for idx, item_id in enumerate(noun_to_item):
        noun = nouns[idx]
        if item_id not in items:
            items[item_id] = {
                "id": item_id,
                "name": noun,
                "synonyms": [noun],
            }
        else:
            items[item_id]["synonyms"].append(noun)
    return noun_to_item, [items[k] for k in sorted(items.keys())]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--disk1", required=True)
    parser.add_argument("-o", "--output", required=True)
    args = parser.parse_args()

    image = read_image(args.disk1)
    entries = {e["name"]: e for e in catalog(image)}
    raw = file_data(image, entries["AMP 2.8"]["tslist"])
    length = raw[2] | (raw[3] << 8)
    data = raw[4 : 4 + length]

    verbs = scan_words(data, *VERB_RANGE)
    dispatch = scan_dispatch(data, *DISPATCH_RANGE, verbs)
    nouns = scan_words(data, *NOUN_RANGE)
    noun_to_item, items = scan_item_mapping(data, *ITEM_MAP_RANGE, nouns)

    result = {
        "verbs": verbs,
        "verb_dispatch": dispatch,
        "nouns_and_topics": nouns,
        "noun_to_item": noun_to_item,
        "items": items,
    }
    Path(args.output).write_text(json.dumps(result, indent=1) + "\n")
    print(
        f"wrote {args.output}: {len(verbs)} verb words, {len(dispatch)} dispatch "
        f"values, {len(nouns)} noun/topic words, {len(items)} items"
    )


if __name__ == "__main__":
    main()

