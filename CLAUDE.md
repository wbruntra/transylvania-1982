Use bun instead of node for running scripts and package management.

## Regenerating the original Apple II art

The pictures on the game disks are not bitmaps. Each one is a little vector
program, and `tools/picdraw.py` renders it by running the game's own drawing
code on an emulated 6502. Half of that drawing lives in the Apple II's ROM
rather than on the disk -- the interpreter calls straight into Applesoft's
HIRES routines -- so rendering needs a $D000-$FFFF ROM image:

    export APPLE2_ROM=/home/william/workspace/linapple/res/roms/Apple2_Plus.rom

    python3 tools/picdraw.py                    # Transylvania -> transylvania/public/art/original
    python3 tools/picsheet.py                   # contact sheets of the above
    python3 the-quest/tools/picdraw_quest.py \
        --disk1 "the-quest/disks/Quest, The (1983)(Penguin Software)(Disk 1 of 2).do" \
        --disk2 "the-quest/disks/Quest, The (1983)(Penguin Software)(Disk 2 of 2).do"

linapple and AppleWin both ship a suitable image as `Apple2_Plus.rom`. It is
Apple's copyrighted code, so it stays outside the repo.

Without a ROM the four Applesoft entry points fall back to Python imitations.
Those are close, but not dot-exact, and that matters more than it sounds: the
fills are a seeded flood that stops at dots already drawn, so an outline one
dot out of place lets a fill escape and flood the picture. The tools print a
warning when they run without a ROM.

Re-rendering is only half of it. What the apps actually serve is a copy, so
re-render and then rebuild the copies, or the games keep showing the old art
while the reference PNGs next to them look right:

    python3 tools/classic-art.py                      # -> art/classic/room-N.webp
    python3 the-quest/tools/build_frontend_bundle.py  # -> frontend/public/art/

## Deploying

    bun run deploy        # both games -> gh-pages -> wbruntra.github.io/transylvania-1982/
    bun run deploy:dry    # everything except the push

Both games are built with a relative base and reference their art relatively,
because the site lives at a project subpath rather than a domain root. Do not
"fix" either app to use absolute `/art/...` paths -- that is what breaks it.
