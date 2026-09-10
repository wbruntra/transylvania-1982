# The Quest (1983, Penguin Software) — research notes

Reconnaissance for a web port in the style of the [Transylvania port](../PORTING.md).
This is an *engine*, not just a new game: The Quest shares Penguin's picture
interpreter with Transylvania almost byte-for-byte, but the parser, world-state
storage, and text are all built differently. This document is what's confirmed
so far and what's still open.

## Disk contents

Two `.DO` (DOS 3.3) disk images, one game split across a lot more files than
Transylvania's `TRANS`/`DATA`/`ROOMS`/`TPAR` quartet:

| File | Type | Role |
| --- | --- | --- |
| `QA` | A (Applesoft), 1 line | Boot stub: `PRINT "<^D>BRUNQUEST"` — hands off to the `QUEST` binary via an embedded DOS command char. |
| `QUEST` | binary | Presumably title screen / menu (not yet disassembled). |
| `QB` | A (Applesoft), 26 lines | Real boot: BLOADs `AMP 2.8` and `PICDRAWF`, DIMs `D%`/`M%`/`I%`/`F%`/`V$`/`HO%`/`B%`, restores the saved array contents from `ARRAY.*`, then `BLOAD CHAIN,A520` and `CALL 520 "MQ"` to chain into the main program. |
| `MQ` | A (Applesoft), 318 lines | The main game engine/parser loop. Chained from `QB`, keeps `QB`'s variables alive. |
| `AMP 2.8` | binary, loads `$9192` len `$08F3` | Ampersand (`&`) extension — implements the custom mini-verbs used everywhere in `MQ`/`QB` (`& INPUT`, `& VAL`, `& PRINT`, `& GOTO`, `& STR$`, `& GOSUB`). Also holds the **parser vocabulary** (60 verb words, 80 noun/topic words) at a fixed offset — see "Vocabulary" below. The rest of the binary (the actual `&`-dispatch code) isn't disassembled yet. |
| `PICDRAWF` | binary, loads `$0800` len `$0A00` | The picture interpreter. **Same load address and length as Transylvania's `PICDRAW2`.** See "Art" below — it is a straight reuse. |
| `ARRAY` | binary, loads `$0300` len `82` | A small ML helper (`CALL 768`) that resolves a BASIC variable's live memory address/length by walking the DOS variable table, so `QB`/`MQ` can `BSAVE`/`BLOAD` an array by name into its own memory. |
| `ARRAY.D%`, `ARRAY.F%`, `ARRAY.I%` | binary | Saved contents of the `D%`, `F%`, `I%` arrays — this **is** the game's world data (see "World state" below), not a separate DATA file. |
| `CHAIN` | binary, loads `$0808` len `456` | Standard Applesoft chain-loader (loads a new program without clearing variables). |
| `T1`–`T3` (disk 1), `T4`–`T7` (disk 2) | binary | Game text, one message per game "screen" of prose. See "Text" below — fully decoded. |
| `P<n>` (~110 across both disks, some duplicated) | binary | Room/scene pictures for `PICDRAWF`, one per location. Named `P` instead of Transylvania's `R`. |
| `O1` | binary (disk 2 only) | The *only* object picture found so far — this game leans much less on individually-drawn objects than Transylvania did. |
| `EQ` | binary, loads `$0800` len `544` | `BRUN` (not chained) from `MQ` line 8000 — likely an equipment/inventory screen, separate small program. Not yet investigated. |
| `EQA` | binary, loads `$4A38` len **19400 bytes** | Large data blob associated with `EQ`. Not yet decoded — plausibly more text, plausibly a big table. Worth checking with the same CR+NUL splitter used on `T1`-`T7` first. |

## Art: PICDRAWF is PICDRAW2

`QB`/`MQ` draw pictures with the identical calling convention as `TRANS.bas`:

```
POKE 2560,<addr low>  POKE 2561,<addr high>  CALL 2608   ; room  ($0A30)
POKE 2560,<addr low>  POKE 2561,<addr high>  CALL 2613   ; object ($0A35)
```

`the-quest/tools/picdraw_quest.py` reuses `tools/picdraw.py` (Transylvania's
6502-emulated renderer) completely unmodified except for one constant: The
Quest loads *every* picture — rooms and the one object alike — at a single
address, `$1201` (the BASIC variable `P=4609` in `QB.bas` line 1), rather than
Transylvania's two separate fixed addresses for rooms vs. objects.

Ran it against all ~110 `P<n>`/`O<n>` files on both disks: **110/110 render
with no failures**, producing real, detailed illustrated scenes (see
`quest_port_kit/art_samples/`). This de-risks the art side of the port
entirely — it's the same technique as Transylvania's `tools/picdraw.py`, just
pointed at different files.

## Text: plain high-bit ASCII, CR+NUL delimited

No compression. Each `T<n>` file is a straight concatenation of messages:

```
<high-bit ASCII text> $8D $00 <high-bit ASCII text> $8D $00 ...
```

(`$8D` is a *plain*, non-high-bit carriage return; `$00` is a null.) Confirmed
by scanning `T1` for every byte below `$80`: they occur in exactly this pair,
nowhere else, until the real content ends and the rest of the sector is zero
padding.

`the-quest/tools/extract_text.py` splits all seven files on `$00` (the actual
message delimiter in `AMP 2.8`) and writes `quest_port_kit/TEXT.json`.
Message counts per file: T1=25, T2=26, T3=18, T4=23, T5=51, T6=24, T7=20
(187 total, exactly matching `B%`).

**Absolute numbering — solved.** The game addresses text by one absolute
number `T` (1..187), resolved to (file, index) via `B%()` loaded from
`QB.bas:22-23`:

```basic
22 FOR I = O TO 7: READ B%(I): NEXT
23 DATA 25,51,69,92,143,167,187
```

Because Applesoft arrays are 0-indexed and `O = 1`, `B%(0)` is untouched and
remains `0`. The cumulative boundaries are therefore:
`B% = [0, 25, 51, 69, 92, 143, 167, 187]`.

In `MQ.bas:9300-9315`:
```basic
9302 IF T <= B%(F%(O,Z) - O) THEN F%(O,Z) = F%(O,Z) - O:B% = O: GOTO 9302
9305 IF T > B%(F%(O,Z)) THEN F%(O,Z) = F%(O,Z) + O:B% = O: GOTO 9302
9310 IF B% THEN ... PRINT D$"BLOADT"F%(O,Z):B% = Z
9315 & PRINT T - B%(F%(O,Z) - O),38,21 - 17 * G: RETURN
```

`F%(1, 0)` holds the active file index (1..7). When `T` changes, the loop
adjusts `F%(1, 0)` until `B%(file - 1) < T <= B%(file)`. If a file switch is
needed, `BLOADT<file>` loads the new file at `$81F2`. Then `& PRINT` takes the
1-based index within the file: `T - B%(file - 1)`.

Confirmed against the sphinx puzzle in `MQ.bas:3101-3105`:
- `T=133` → T5 message 41 (the Sphinx's riddle)
- `T=134` → T5 message 42 (`" CORRECT.  YOU MAY PASS."`)
- `T=135` → T5 message 43 (`" WRONG.  YOU MAY NOT ENTER."`)
Room descriptions (`F%(0, room)` hi byte) also map directly: Room 1 has `T=1`
(opening throne room text), Room 2 has `T=2` (provisioner's shop).


## Vocabulary: a variable-length word table inside `AMP 2.8`

Not a fixed-width table like Transylvania's `TPAR` (5 bytes/word) — `AMP 2.8`
stores each word as plain ASCII with the high bit set on only its *last*
character, terminator-style. Confirmed against the very first bytes
(`CE 4E 4F 52 54 C8` → `N` then `NORTH`): the table lists single-letter
compass shortcuts (`N`,`S`,`E`,`W`,`U`,`D`) as their own words immediately
before the full compass words.

`the-quest/tools/extract_vocab.py` pulls two runs out (byte ranges found by
manual inspection, hardcoded — see the script's docstring):

- **Verbs** (offset 1034-1271, 60 words): `N/NORTH`, `S/SOUTH`, ... the usual
  compass set, then `GET/TAKE`, `BUY/PURCHASE`, `LOOK`, `CLIMB`, `SWIM`,
  `TALK/SPEAK/ASK`, `ATTACK/FIGHT/HIT/STAB/SLAY/KILL/SMITE`, `DROP/PUT`,
  `THROW/POUR`, `GO/LEAVE/EXIT/RUN/WALK`, `OPEN`, `LIGHT/IGNITE`,
  `INVENTORY/INV`, `SAVE`, `RESTORE`, `QUIT`, `READ`, `KNOCK`, `GIVE/PAY/OFFER`,
  `TIE/FASTEN/KNOT`, `BOOK/BOOKS`, `SHELF`, `RIDE`.
- **Nouns and topics** (offset 1393-1909, 80 words): item-shaped nouns
  (`CARTOGRAPH/MAP`, `GOLD/SOVEREIGNS`, `SWORD/BLADE`, `DRAGONBANE`, `RING`,
  `SALT`, `KEY`, `ROPE`, `WATERSKIN/FLASK/SKIN`, `ARMOR/ARMOUR`, `FLINT/ROCK`,
  `BACKPACK/PACK`, `WOLFSBANE/WOLFBANE`, `LANTERN/LAMP/TORCH`,
  `RATIONS/FOOD/EATS`, `CHEST/TRUNK`, `CARPET/RUG`, `OILSKIN/POUCH`, ...),
  scenery/NPC nouns (`HOUSE/HOME/COTTAGE`, `DOOR`, `LISA` — the companion
  character — `GIRL/LADY/WOMAN`, `WITCH`, `WATERFALL/FALLS`, `HERMIT/MAN`,
  `YOUNG DRAGON/BABY/CUB/DRAGON`, `SKELETON/BONES/CORPSE/BODY`,
  `SNAKE/PYTHON/BOA`), and — matching `MQ.bas:7000-7050`'s reading-material
  verbatim — book/topic titles: `CARE OF PET UNICORNS`, `USEFUL HERBS`,
  `LINGUA DRACO FLAMEUS`, `PIG LATIN MADE SIMPLE`,
  `BEGINNING PRESTIDIGITATION`, `SOFTALK MAGAZINE`.

Between the two word runs (offset 1272-1391, address `$968A` in `AMP 2.8`)
sits a 120-byte block of 60 sixteen-bit **big-endian** integers (MSB-first,
matching Applesoft integer format), exactly one slot per verb word in
vocabulary order.

**Verb dispatch — solved.** In `AMP 2.8`'s `& VAL` implementation at `$944C`,
word lookup at `$9487` finds the matching verb index (0..59) in `$9959`. At
`$9495`, it computes `$968A + 2 * index` and loads the big-endian 16-bit line
number `(hi << 8) | lo`, passing it back to Applesoft variable `X` via
GIVAYF (`$E2F2`). `MQ.bas:37` then immediately jumps to it: `& GOTO ABS(V)`.

Every single verb line matches valid logic in `MQ.bas`:
- Compass (`N/NORTH`→200, `S/SOUTH`→210, `E/EAST`→220, `W/WEST`→230, `U/UP`→240, `D/DOWN`→250)
- Actions (`GET/TAKE/BUY/PURCHASE`→300, `DROP/PUT/THROW/POUR`→350, `INV/I`→400,
  `CLIMB`→450, `TIE/FASTEN/KNOT`→500, `OPEN`→600, `KNOCK`→650, `GIVE/PAY/OFFER`→700,
  `READ`→750, `LOOK`→800, `LIGHT/IGNITE`→850, `TALK/SPEAK/ASK`→900, `FILL`→950,
  `SWIM`→1000, `ATTACK/FIGHT/HIT/STAB/SLAY/KILL/SMITE`→1050, `GO/LEAVE/EXIT/RUN/WALK`→1100,
  `SAVE`→1200, `RESTORE`→1250, `QUIT`→1300, `BOOK/BOOKS/SHELF`→1350, `RIDE`→1400).

**Item names (`& STR$`) — solved.** Following the noun table (offset 1911,
address `$9909` in `AMP 2.8`) sits an 80-byte table mapping each of the 80 noun
words in table order to its 1-based item ID (1..38). `& STR$ I, N$` at `$995C`
scans `$9909` for the first entry equal to item ID `I`, then extracts that
word from the noun table at `$9701`. The first occurrence of each item ID
defines its canonical display name, while subsequent entries define player input
synonyms.
- Items 33..38 are the six library books (`CARE OF PET UNICORNS`, `USEFUL HERBS`,
  `LINGUA DRACO FLAMEUS`, `PIG LATIN MADE SIMPLE`, `BEGINNING PRESTIDIGITATION`,
  `SOFTALK MAGAZINE`), explaining `MQ.bas:186`'s special-case quoting:
  `IF I > 32 THEN N$ = CHR$(34) + N$ + CHR$(34)`.
- All 38 items are now named and synced into `game.json` and `vocabulary.json`.

## Ampersand (`&`) and USR Extension Architecture

`AMP 2.8` hooks the standard Applesoft vectors upon loading (`$9192`):
- `$03F5` (Ampersand vector) → `$91A9`
- `$0A` (USR function vector) → `$92F3`

### Ampersand Dispatch Table (`$91DE`)
Matches Applesoft token, then jumps via push/RTS:
- `PRINT` ($BA) → `$99EC`: Reads null-delimited messages from `$81F2` (load address of `T1`..`T7`), word-wrapping at `width` columns for `height` lines.
- `INPUT` ($84) → `$9203`: Reads keyboard line into Applesoft string variable.
- `GOSUB` ($B0) → `$9298`: Applesoft line GOSUB by variable/expression.
- `GOTO` ($AB) → `$92C5`: Applesoft line GOTO by variable/expression.
- `GET` ($BE) → `$99E3`: Waits for a single keystroke (`LDA $C000: BPL`).
- `POKE` ($B9) → `$92D8`: Custom poke extension.
- `VAL` ($E5) → `$944C`: Lexes command `CD$`, returning verb line in `X` and noun ID in `N`.
- `STR$` ($E4) → `$995C`: Converts item ID `I` into its canonical noun string `N$`.
- `ONERR` ($A5) → `$9A7B`: Error vector setup.

### USR Hook Modes (`$92F3`)
Dispatches on data type flag `$11`:
1. **Numeric (`$99C0`):** Checks following character in command stream:
   - `'H'` (`$48`): Returns high byte of integer in FAC (`$A0`).
   - `'L'` (`$4C`): Returns low byte of integer in FAC (`$A1`).
   Used everywhere in `MQ.bas` for packing two bytes into a 16-bit array entry (e.g. `USR(F%(I,M%(Z)))H`).
2. **String / INSTR (`$92FA`):** Evaluates `USR("pat1/pat2/...")string, start`.
   Searches `string` for any slash-separated alternative in the pattern, returning 1-based character position or 0 if not found. Used for command splitting (`" THEN / AND /,/."`) and synonym checks (`USR(OP$)CD$,O`).

## Boot Chain & Ending Sequence

Disassembly of `QUEST`, `TP`, `EQ`, and `EQA` reveals the full lifecycle:

1. **Boot:**
   - `QA.bas`: Stub running `BRUN QUEST`.
   - `QUEST` (binary at `$0900`): Clears screen, prints `"THE QUEST"`, executes `BRUN TP`.
   - `TP` (binary at `$62D4`, 13 KB): Penguin's hires Title Picture interpreter. Unpacks animated title artwork onto HGR page 1 (`$2000`), displays title screen, then issues `RUN QB`.
   - `QB.bas`: Allocates memory below HIMEM 33265 (`$81F1`), loads `AMP 2.8` and `PICDRAWF`, restores world arrays (`ARRAY.*`), initializes cumulative boundary table `B%`, loads `T1`, then chains `MQ` via `CALL 520 "MQ"`.
2. **Victory Ending:**
   - On reaching the castle (Room 4 event `MQ.bas:8000`), game runs `BRUN EQ`.
   - `EQ` (binary at `$0800`): Switches to text mode, prints ending narrative (`"UPON REACHING THE CASTLE, THE DRAGON GENTLY LOWERS EVERYONE TO THE GROUND..."`), waits for a keypress at `[MORE]`, then issues `BRUN EQA`.
   - `EQA` (binary at `$4A38`, 19.4 KB): Full-screen high-res ending graphics & victory celebration sequence on HGR page 1 (`$2000`). When done, prints `"BOOTING"` and reboots disk 1.

## Disk-Side Switching

Confirmed via `MQ.bas:6000-6010`:
```basic
6000 ER = PEEK (222): & ONERR
6005 IF ER = 6 THEN PRINT "  PLEASE TURNETH THY DISKETTE OVER  ";: & GET: RESUME
```
Disk 1 holds `T1`-`T3` and pictures `P0`-`P14`, `P90`-`P120`. Disk 2 holds `T4`-`T7`, `P12`-`P89`, `O1`, `EQ`, and `EQA`. When the player moves to a location whose picture or text resides on the other disk, DOS 3.3 raises error 6 (`FILE NOT FOUND`). The ONERR handler prompts the player to flip the disk, waits for a key via `& GET`, and `RESUME`s to retry the BLOAD.
In the web port, all assets from both disks are merged into a unified bundle, eliminating disk swapping entirely.

## Web port status

A playable first version exists at `frontend/` (Preact + Vite) — see the
top-level [`README.md`](README.md) for how to run it. `tools/build_frontend_bundle.py`
bundles `quest_port_kit/*.json` into `frontend/src/data/quest-data.json` plus
the room art the frontend needs, and `frontend/src/engine/` is a small
headless engine driven by that data (no hardcoded game content — rooms,
exits, item names/synonyms, and room text all come from the extraction).

**Working:** movement across all 255 rooms, room art, room descriptions,
take/drop (via real item names and synonyms), inventory, reading books,
save/restore.

**Not working yet:** the puzzle-specific logic for `OPEN`, `GIVE`, `ATTACK`,
`LIGHT`, `TALK`, `SWIM`, `KNOCK`, `TIE`, `RIDE`, and friends. The parser
recognizes these verbs (via `vocabulary.json`'s `verb_dispatch` groupings) but
there's no handler behind them yet — they just print a shrug. Porting each
one means reading its `MQ.bas` line(s) and implementing the actual logic, the
same routine-by-routine process `../PORTING.md` documents for Transylvania.
The dispatch line numbers found in "Vocabulary" above are exactly the
checklist for this — each verb's line number is where its logic lives in
`quest_port_kit/MQ.bas`.

Also not implemented: the shop economy (items can be taken for free right
now, ignoring `price`), NPC interaction (Lisa, the goblin, etc.), and the
disk-1/disk-2 swap prompt (moot in the web port — all art/text is bundled
together, matching what `RESEARCH.md`'s "Disk-Side Switching" section
recommends).


## What's already de-risked

- **Art.** `the-quest/tools/picdraw_quest.py` renders all 110 pictures across
  both disks with zero failures, straight off Transylvania's existing 6502
  emulator and picture interpreter. This was the single biggest unknown
  going in (a second, incompatible picture format would have meant writing a
  whole new interpreter) and it turned out to be exactly reusable.
- **Text.** Fully extracted, no compression to reverse-engineer, just an
  indexing scheme to calibrate.
- **World structure.** `quest_port_kit/game.json` has all 255 rooms' exits,
  event hooks, and picture/description indices, plus raw item location/price
  data — decoded straight from the saved array memory, no guessing.
- **Vocabulary.** `quest_port_kit/vocabulary.json` has the full parser word
  list (60 verbs, 80 nouns/topics) straight out of `AMP 2.8`.

The remaining unknowns (the verb dispatch table, item name↔id mapping,
`EQ`/`EQA`) are all things
Transylvania also had to work through in some form (`TPAR`'s word table,
`PICDRAW2`'s calling convention) — there's no evidence yet of anything The
Quest does that the existing toolkit's approach (run the real 6502 code
headlessly, read the real DOS 3.3 filesystem, treat memory dumps as data)
can't handle. It's more files and more state to map, not a different
technique.
