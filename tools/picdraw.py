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
whose high byte it forms by adding HPAG ($E6). Half the drawing therefore lives
in the machine rather than on the disk, so this maps an Apple II ROM image in
alongside the picture data and runs the real 6502 code -- Penguin's and Apple's
both -- against a real 8K framebuffer, then decodes the resulting page the way
an Apple II would have displayed it. Without a ROM the four entry points fall
back to Python imitations, which are close but not dot-exact; `load_rom` says
why that matters.
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

# TRANS.bas:8070 -- O10 and O38 are big enough that $19E8 would run them into
# the hires page at $2000, so the game BLOADs those two at the room address
# instead and calls the same entry point. Loading them at $19E8 lets the draw
# overwrite its own source data part way through.
BIG_OBJECTS = {10, 38}
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

# The eight HCOLOR masks, which are all PICDRAW2 ever asks the ROM for. Bit 7
# is the palette bit; the low seven bits are the dot pattern the ROM stamps
# into a byte.
HCOLOR_MASKS = [0x00, 0x2A, 0x55, 0x7F, 0x80, 0xAA, 0xD5, 0xFF]

# Seven dots to a byte is an odd number, so the dot parity that decides the hue
# flips at every byte boundary: stamping $D5 into byte after byte draws blue,
# orange, blue, orange. The ROM keeps a colour looking like itself by swapping
# the mask on odd bytes, and PICDRAW2's own fill table spells out the same
# pairing -- solid blue is stored there as D5 AA D5 AA.
ODD_COLUMN_MASK = {
    0x00: 0x00, 0x2A: 0x55, 0x55: 0x2A, 0x7F: 0x7F,
    0x80: 0x80, 0xAA: 0xD5, 0xD5: 0xAA, 0xFF: 0xFF,
}


ROM_BASE = 0xD000            # where an Apple II ROM image is mapped
ROM_ENV = "APPLE2_ROM"


def load_rom(path=None):
    """An Apple II ROM image, so the Applesoft routines can be run rather than
    imitated.

    PICDRAW2 draws its outlines through four ROM entry points, and the fills
    are a seeded flood that stops at dots that are already drawn -- so a fill
    only lands where the artist meant it to if the outline is correct to the
    exact dot. Imitating HLIN in Python gets close, but 'close' puts a dot on
    top of a seed now and then, and that fill then escapes and floods the
    picture. Running the real code removes the guesswork.

    Any image covering $D000-$FFFF will do; linapple and AppleWin both ship
    one as `Apple2_Plus.rom`. Point `--rom` or $APPLE2_ROM at it.
    """
    path = path or os.environ.get(ROM_ENV)
    if not path:
        return None
    with open(path, "rb") as handle:
        rom = handle.read()
    if len(rom) != 0x10000 - ROM_BASE:
        raise ValueError(f"{path}: expected a ${0x10000 - ROM_BASE:04X}-byte "
                         f"$D000-$FFFF image, got ${len(rom):04X}")
    # Cheapest proof it is what it claims: HCOLOR is LDA $F6F6,X / STA $E4.
    if rom[HCOLOR - ROM_BASE:HCOLOR - ROM_BASE + 10] != bytes(
            (0xE0, 0x08, 0xB0, 0xF6, 0xBD, 0xF6, 0xF6, 0x85, 0xE4, 0x60)):
        raise ValueError(f"{path}: no Applesoft HCOLOR at ${HCOLOR:04X}")
    return rom


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


def render(picdraw, data, *, is_object, page=None, rom=None, addr=None):
    """Runs the picture program and returns the page it drew.

    With `rom` -- an Apple II ROM image covering $D000-$FFFF -- the four
    Applesoft entry points are executed for real. Without one they are
    simulated in Python, which gets the drawing approximately right but not
    dot-exactly: see `load_rom`."""
    cpu = CPU()
    cpu.mem[PICDRAW_ORG:PICDRAW_ORG + len(picdraw)] = picdraw

    base = addr if addr is not None else (OBJECT_ADDR if is_object else ROOM_ADDR)
    cpu.mem[base:base + len(data)] = data
    cpu.wr(DATA_POINTER, base & 0xFF)
    cpu.wr(DATA_POINTER + 1, base >> 8)

    # HGR would have set this; PICDRAW2 folds it into every screen address.
    cpu.wr(HPAG, HIRES >> 8)
    if page is not None:
        cpu.mem[HIRES:HIRES + 0x2000] = page

    picture = Picture()

    def plot(x, y, mask):
        """One hires dot, the way the ROM's HPLOT does it: the bit comes from
        the colour mask at this column, and bit 7 selects the palette."""
        if not (0 <= x < WIDTH and 0 <= y < HEIGHT):
            return
        column, bit = divmod(x, 7)
        if column & 1:
            mask = ODD_COLUMN_MASK.get(mask, mask)
        addr = line_base(y) + column
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

    def watch_bkgnd(cpu):
        picture.background = cpu.a & 0xFF

    def watch_hcolor(cpu):
        picture.color = cpu.x & 7

    def watch_hposn(cpu):
        picture.x = (cpu.x | (cpu.y << 8)) & 0x1FF
        picture.y = cpu.a & 0xFF
        picture.moves += 1

    def watch_hlin(cpu):
        x1 = (cpu.a | (cpu.x << 8)) & 0x1FF
        y1 = cpu.y & 0xFF
        picture.lines.append((picture.x, picture.y, x1, y1, picture.color))
        picture.x, picture.y = x1, y1

    watch = None
    if rom is None:
        cpu.hooks = {BKGND: on_bkgnd, HPOSN: on_hposn, HLIN: on_hlin, HCOLOR: on_hcolor}
    else:
        # The real thing. Nothing is standing in for anything any more, so the
        # four entry points are only watched, to keep the same bookkeeping.
        cpu.mem[ROM_BASE:ROM_BASE + len(rom)] = rom
        watch = {BKGND: watch_bkgnd, HPOSN: watch_hposn,
                 HLIN: watch_hlin, HCOLOR: watch_hcolor}

    ret = STOP - 1
    cpu.push(ret >> 8)
    cpu.push(ret & 0xFF)
    cpu.run(DRAW_OBJECT if is_object else DRAW_ROOM, STOP, watch=watch)

    picture.page = bytes(cpu.mem[HIRES:HIRES + 0x2000])
    return picture


# One scan line is 560 samples: 40 bytes x 7 dots, each dot two samples wide.
# That is four samples per colour-subcarrier cycle, so any four consecutive
# samples span exactly one cycle and there are only sixteen distinct ones --
# the sixteen colours an Apple II can put on an NTSC screen.
SAMPLES = WIDTH * 2

NTSC_PALETTE = [
    (0, 0, 0),          # 0000 black
    (221, 0, 51),       # 0001 magenta
    (0, 0, 153),        # 0010 dark blue
    (221, 34, 221),     # 0011 violet
    (0, 119, 34),       # 0100 dark green
    (85, 85, 85),       # 0101 grey
    (34, 34, 255),      # 0110 medium blue
    (102, 170, 255),    # 0111 light blue
    (136, 85, 0),       # 1000 brown
    (255, 102, 0),      # 1001 orange
    (170, 170, 170),    # 1010 grey
    (255, 153, 136),    # 1011 pink
    (0, 221, 0),        # 1100 green
    (255, 255, 0),      # 1101 yellow
    (68, 255, 153),     # 1110 aqua
    (255, 255, 255),    # 1111 white
]

# Four samples centred on the one being coloured, and the weight a sample
# carries depends on its absolute position, so the palette index means the same
# thing everywhere on the line regardless of where the window happens to sit.
WINDOW = (-1, 0, 1, 2)
PAD = 4


def decode_hires(page):
    """Decodes a hires page the way an NTSC set would have shown it.

    Colour on this machine is an artifact of the video signal, not a property
    of a pixel: the dot stream runs at four times the colour subcarrier, so what
    the eye sees at any point is decided by a whole subcarrier cycle of dots
    around it. Bit 7 of a byte delays that byte's dots by half a dot -- one
    sample -- which is what turns violet into blue and green into orange.

    Reading pixels in isolation, or in fixed pairs, cannot express this: it
    forces every dot into one of six colours and it puts the pair boundaries in
    arbitrary places. That is what turned the Graphics Magician's patterned
    fills -- which are dithers precisely because dithers are how you get browns
    and greys out of this hardware -- into checkerboards and byte-wide stripes.

    Returns 192 rows of SAMPLES colours: half-dot resolution, because bit 7
    means the picture genuinely carries detail at that scale.
    """
    rows = []
    for y in range(HEIGHT):
        addr = line_base(y) - HIRES

        samples = bytearray(SAMPLES + 2 * PAD)
        for byte_index in range(40):
            byte = page[addr + byte_index]
            # Bit 7 delays the whole byte by one sample.
            base = PAD + byte_index * 14 + (1 if byte & 0x80 else 0)
            for bit in range(7):
                if (byte >> bit) & 1:
                    samples[base + bit * 2] = 1
                    samples[base + bit * 2 + 1] = 1

        row = []
        for i in range(SAMPLES):
            index = 0
            for offset in WINDOW:
                if samples[PAD + i + offset]:
                    index |= 1 << ((i + offset) & 3)
            row.append(NTSC_PALETTE[index])
        rows.append(row)
    return rows


def image_from_page(page, scale=1):
    """`scale` is in screen pixels: the picture is 280x192 as the machine
    thinks of it, even though we decode it at 560 samples wide. Any scale of 2
    or more therefore keeps every half-dot."""
    from PIL import Image

    rows = decode_hires(page)
    image = Image.new("RGB", (SAMPLES, HEIGHT))
    image.putdata([px for row in rows for px in row])
    return image.resize((WIDTH * scale, HEIGHT * scale), Image.NEAREST)


def rasterise(picture, scale=1):
    return image_from_page(picture.page, scale)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--disk", default="Transylvania (1982)(Penguin Software)"
                        "(Disk 1 of 2).DO/Transylvania (1982)(Penguin Software)(Disk 1 of 2).do")
    parser.add_argument("--out", default="transylvania/public/art/original")
    parser.add_argument("--scale", type=int, default=3, help="PNG upscale factor")
    parser.add_argument("--only", help="render just this file, e.g. R9 or O18")
    parser.add_argument("--rom", help="Apple II $D000-$FFFF ROM image; without "
                        f"one (or ${ROM_ENV}) the Applesoft routines are imitated")
    args = parser.parse_args()

    rom = load_rom(args.rom)
    if rom is None:
        print(f"warning: no ROM (--rom or ${ROM_ENV}); imitating Applesoft, "
              "which leaves some fills misplaced\n")

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
        is_object = name.startswith("O")
        addr = ROOM_ADDR if is_object and int(name[1:]) in BIG_OBJECTS else None
        try:
            picture = render(picdraw, data, is_object=is_object, rom=rom, addr=addr)
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
