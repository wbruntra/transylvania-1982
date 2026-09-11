"""Rebuilds the WebP copies of the original art that the game actually serves.

`picdraw.py` writes one PNG per picture into transylvania/public/art/original/.
Those are the reference renders; what the app loads in "classic" mode is
art/classic/room-<N>.webp, a lossless WebP of the same image (ui/scene.js).

Re-rendering the originals without re-running this leaves the deployed game
showing the previous render -- which is easy to miss, because the reference
PNGs sitting right next to it look correct.

    python3 tools/classic-art.py
"""

import argparse
import os
import re

from PIL import Image

DEFAULT_ART = "transylvania/public/art"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--art", default=DEFAULT_ART,
                        help="the app's public art directory")
    args = parser.parse_args()

    source = os.path.join(args.art, "original")
    target = os.path.join(args.art, "classic")
    os.makedirs(target, exist_ok=True)

    rooms = sorted(
        (int(m.group(1)) for m in
         (re.fullmatch(r"r(\d+)\.png", f) for f in os.listdir(source)) if m),
    )
    for room in rooms:
        png = os.path.join(source, f"r{room}.png")
        webp = os.path.join(target, f"room-{room}.webp")
        Image.open(png).convert("RGB").save(webp, lossless=True, quality=100)

    print(f"  {len(rooms)} rooms -> {target}/room-<N>.webp")


if __name__ == "__main__":
    main()
