#!/usr/bin/env python3
"""Bundles the extracted game data (game.json, vocabulary.json, TEXT.json)
into one file the frontend can import, and copies the room art it needs into
frontend/public/art/.

    python3 the-quest/tools/build_frontend_bundle.py
"""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
KIT = ROOT / "quest_port_kit"
FRONTEND = ROOT / "frontend"


def main():
    game = json.loads((KIT / "game.json").read_text())
    text = json.loads((KIT / "TEXT.json").read_text())
    vocab = json.loads((KIT / "vocabulary.json").read_text())

    messages = {int(k): v["text"] for k, v in text["messages"].items()}

    bundle = {
        "rooms": game["rooms"],
        "items": game["items"],
        "messages": messages,
        "verbs": vocab["verbs"],
        "verbDispatch": vocab["verb_dispatch"],
    }

    data_dir = FRONTEND / "src" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "quest-data.json").write_text(json.dumps(bundle) + "\n")

    art_src = KIT / "art_samples"
    art_dst = FRONTEND / "public" / "art"
    art_dst.mkdir(parents=True, exist_ok=True)
    referenced = {r["picture"] for r in game["rooms"] if r["picture"]}
    copied = 0
    for pic in referenced:
        src = art_src / f"p{pic}.png"
        if src.exists():
            shutil.copy(src, art_dst / src.name)
            copied += 1
    # The one object picture, for flavor (not composited in the MVP).
    o1 = art_src / "o1.png"
    if o1.exists():
        shutil.copy(o1, art_dst / "o1.png")

    print(
        f"wrote {data_dir/'quest-data.json'}: {len(game['rooms'])} rooms, "
        f"{len(game['items'])} items, {len(messages)} messages, "
        f"{len(vocab['verbs'])} verbs"
    )
    print(f"copied {copied}/{len(referenced)} room pictures into {art_dst}")


if __name__ == "__main__":
    main()
