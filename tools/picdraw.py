"""Renders Transylvania's original artwork by running the game's own drawing code.

The pictures on disk are not bitmaps. Each room (R1..R38) and object (O1..O39)
is a little vector program interpreted by PICDRAW2, which TRANS.bas invokes as:

    8000  BLOAD R<n>,A4608   POKE 2560,0   POKE 2561,18   CALL 2608
    8070  BLOAD O<n>,A6632   POKE 2560,232 POKE 2561,25   CALL 2613

PICDRAW2 loads at $0800 and ends exactly where the picture data begins ($1200).
$0A00/$0A01 is its data pointer, and the two CALLs are one routine with two
entry points -- $0A30 clears the page to white first, $0A35 draws on top of
whatever is there, which is how objects composite over rooms.

It draws in two ways: outlines go through four Applesoft HIRES ROM entry points,
and fills are written straight into the hires page through a pointer at $08/$09,
whose high byte it forms by adding HPAG ($E6). So this runs the real 6502 code
against a real 8K framebuffer, supplies the four ROM routines, and decodes the
resulting page the way an Apple II would have displayed it.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import dos33
from cpu6502 import CPU

PICDRAW_ORG = 0x0800
ROOM_ADDR = 0x1200          # 4608
OBJECT_ADDR = 0x19E8        # 6632
DATA_POINTER = 0x0A00
DRAW_ROOM = 0x0A30          # CALL 2608
DRAW_OBJECT = 0x0A35        # CALL 2613
STOP = 0xFFF0

# The only four ROM entry points PICDRAW2 uses.
BKGND, HPOSN, HLIN, HCOLOR = 0xF3F4, 0xF411, 0xF53A, 0xF6EC

WIDTH, HEIGHT = 280, 192
HIRES = 0x2000              # page 1, which is where TRANS.bas draws
HPAG = 0xE6                 # ROM's hires page high byte; PICDRAW2 adds it in

# Applesoft hires zero page.
HBASL, HMASK, HORIZ, VERT, HCOLOR_MASK = 0x26, 0x30, 0xE0, 0xE2, 0xE4


def line_base(y):
    """Address of scan line y on hires page 1."""
    return HIRES + (y & 7) * 0x400 + ((y >> 3) & 7) * 0x80 + (y >> 6) * 0x28

# HCOLOR 0-7. Even and odd indices are the same hue on real hardware; the
# difference is which half of a byte the bits land in, which only matters for
# the fringing we are deliberately not reproducing.
HCOLORS = [
    (0, 0, 0),          # 0 black
    (32, 240, 60),      # 1 green
    (255, 68, 253),     # 2 violet
    (255, 255, 255),    # 3 white
    (0, 0, 0),          # 4 black
    (255, 106, 60),     # 5 orange
    (32, 160, 255),     # 6 blue
    (255, 255, 255),    # 7 white
]
HCOLOR_MASKS = [0x00, 0x2A, 0x55, 0x7F, 0x80, 0xAA, 0xD5, 0xFF]


def load_disk(path):
    image = dos33.read_image(path)
    return {e["name"]: e["tslist"] for e in dos33.catalog(image)}, image


def binary(image, tslist):
    """Strips the 4-byte BLOAD header (load address, length)."""
    raw = dos33.file_data(image, tslist)
    length = raw[2] | (raw[3] << 8)
    return raw[4:4 + length]


class Picture:
    """What the program drew: the finished hires page, plus the outline
    geometry the ROM calls carried (fills bypass them, so the page is the
    authoritative result and the line list is only a record)."""

    def __init__(self):
        self.background = None
        self.lines = []          # (x0, y0, x1, y1, hcolor)
        self.color = 0
        self.x = self.y = 0
        self.moves = 0
        self.page = None


def render(picdraw, data, *, is_object, page=None):
    """Runs the picture program and returns the page it drew."""
    cpu = CPU()
    cpu.mem[PICDRAW_ORG:PICDRAW_ORG + len(picdraw)] = picdraw

    base = OBJECT_ADDR if is_object else ROOM_ADDR
    cpu.mem[base:base + len(data)] = data
    cpu.wr(DATA_POINTER, base & 0xFF)
    cpu.wr(DATA_POINTER + 1, base >> 8)

    # HGR would have set this; PICDRAW2 folds it into every screen address.
    cpu.wr(HPAG, HIRES >> 8)
    if page is not None:
        cpu.mem[HIRES:HIRES + 0x2000] = page

    picture = Picture()

    def plot(x, y, mask):
        """One hires pixel, the way the ROM's HPLOT does it: the bit comes from
        the colour mask at this column, and bit 7 selects the palette."""
        if not (0 <= x < WIDTH and 0 <= y < HEIGHT):
            return
        addr = line_base(y) + x // 7
        bit = x % 7
        value = cpu.mem[addr]
        value = (value & ~(1 << bit)) | (((mask >> bit) & 1) << bit)
        cpu.mem[addr] = (value & 0x7F) | (mask & 0x80)

    def draw_line(x0, y0, x1, y1, mask):
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        x, y = x0, y0
        while True:
            plot(x, y, mask)
            if x == x1 and y == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x += sx
            if e2 <= dx:
                err += dx
                y += sy

    def set_cursor(cpu, x, y):
        picture.x, picture.y = x, y
        cpu.wr(HORIZ, x & 0xFF)
        cpu.wr(HORIZ + 1, x >> 8)
        cpu.wr(VERT, y)
        addr = line_base(y)
        cpu.wr(HBASL, addr & 0xFF)
        cpu.wr(HBASL + 1, addr >> 8)
        cpu.wr(HMASK, 1 << (x % 7))
        cpu.y = (x // 7) & 0xFF

    def on_bkgnd(cpu):
        # BKGND floods the page with the byte in A.
        fill = cpu.a & 0xFF
        cpu.mem[HIRES:HIRES + 0x2000] = bytes([fill]) * 0x2000
        picture.background = fill

    def on_hcolor(cpu):
        picture.color = cpu.x & 7
        cpu.wr(HCOLOR_MASK, HCOLOR_MASKS[picture.color])

    def on_hposn(cpu):
        # A = vertical, X = horizontal low, Y = horizontal high.
        set_cursor(cpu, (cpu.x | (cpu.y << 8)) & 0x1FF, cpu.a & 0xFF)
        picture.moves += 1

    def on_hlin(cpu):
        # A = horizontal low, X = horizontal high, Y = vertical.
        x1 = (cpu.a | (cpu.x << 8)) & 0x1FF
        y1 = cpu.y & 0xFF
        mask = cpu.rd(HCOLOR_MASK)
        draw_line(picture.x, picture.y, x1, y1, mask)
        picture.lines.append((picture.x, picture.y, x1, y1, picture.color))
        set_cursor(cpu, x1, y1)

    cpu.hooks = {BKGND: on_bkgnd, HPOSN: on_hposn, HLIN: on_hlin, HCOLOR: on_hcolor}

    ret = STOP - 1
    cpu.push(ret >> 8)
    cpu.push(ret & 0xFF)
    cpu.run(DRAW_OBJECT if is_object else DRAW_ROOM, STOP)

    picture.page = bytes(cpu.mem[HIRES:HIRES + 0x2000])
    return picture


def decode_hires(page):
    """Apple hires colour comes from *pairs* of bits, not single ones: the 280
    bits across a line are read as 140 colour pixels, each two bits wide. Both
    bits lit reads white, neither reads black, and one of the two gives a hue
    picked by which half it is -- with bit 7 of the containing byte swapping the
    palette from violet/green to orange/blue. Fills in these pictures are byte
    patterns like $55 and $2A, which is exactly why they must be read this way:
    treating the bits individually turns a flat colour into a checkerboard."""
    violet, green, orange, blue = (255, 68, 253), (32, 240, 60), (255, 106, 60), (32, 160, 255)
    black, white = (0, 0, 0), (255, 255, 255)

    rows = []
    for y in range(HEIGHT):
        addr = line_base(y) - HIRES
        bits, shifted = [], []
        for byte_index in range(40):
            byte = page[addr + byte_index]
            for bit in range(7):
                bits.append((byte >> bit) & 1)
                shifted.append((byte >> 7) & 1)

        row = []
        for pair in range(WIDTH // 2):
            left, right = bits[pair * 2], bits[pair * 2 + 1]
            hi = shifted[pair * 2]
            if left and right:
                colour = white
            elif not left and not right:
                colour = black
            elif left:
                colour = orange if hi else violet
            else:
                colour = blue if hi else green
            row.append(colour)
            row.append(colour)
        rows.append(row)
    return rows


def rasterise(picture, scale=1):
    from PIL import Image

    rows = decode_hires(picture.page)
    image = Image.new("RGB", (WIDTH, HEIGHT))
    image.putdata([px for row in rows for px in row])
    if scale != 1:
        image = image.resize((WIDTH * scale, HEIGHT * scale), Image.NEAREST)
    return image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--disk", default="Transylvania (1982)(Penguin Software)"
                        "(Disk 1 of 2).DO/Transylvania (1982)(Penguin Software)(Disk 1 of 2).do")
    parser.add_argument("--out", default="web/public/art/original")
    parser.add_argument("--scale", type=int, default=3, help="PNG upscale factor")
    parser.add_argument("--only", help="render just this file, e.g. R9 or O18")
    args = parser.parse_args()

    catalog, image = load_disk(args.disk)
    picdraw = binary(image, catalog["PICDRAW2"])

    names = [args.only] if args.only else sorted(
        (n for n in catalog if n[0] in "RO" and n[1:].isdigit()),
        key=lambda n: (n[0], int(n[1:])),
    )

    os.makedirs(args.out, exist_ok=True)
    failures = []
    for name in names:
        data = binary(image, catalog[name])
        try:
            picture = render(picdraw, data, is_object=name.startswith("O"))
        except Exception as exc:  # noqa: BLE001 -- report and keep going
            failures.append((name, f"{type(exc).__name__}: {exc}"))
            continue

        rasterise(picture, args.scale).save(os.path.join(args.out, f"{name.lower()}.png"))
        print(f"  {name:5} {len(picture.lines):5d} lines  {picture.moves:4d} moves"
              f"  bg={'--' if picture.background is None else f'${picture.background:02X}'}")

    if failures:
        print(f"\n{len(failures)} failed:")
        for name, why in failures:
            print(f"  {name:5} {why}")
    print(f"\n{len(names) - len(failures)}/{len(names)} rendered into {args.out}/")


if __name__ == "__main__":
    main()
