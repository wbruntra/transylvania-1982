# Porting checklist

What is left to turn the web port into a winnable game, ordered so that each
tier is useful on its own. Line numbers refer to
[`trans_port_kit/TRANS.bas`](trans_port_kit/TRANS.bas), the detokenised listing.

Status at time of writing: **45 of 45 routines ported**, covering all 89 verbs,
and the game is winnable end to end — see below.

## Before anything else: two enabling changes

Neither is a verb, and everything below is easier afterwards.

**1. Resolve nouns to ids.** The port currently matches typed nouns against
object names. Every script below instead keys on `X`, the noun id. The data now
carries the word table, so:

- match the typed word against `world.nouns` (five-character prefixes, so
  `CEMETERY` matches `CEMET`) to get `X`
- apply the alias table: `if (nounMap[X-1] < 0) X = -nounMap[X-1]` (line 1030)
- put `X` on the parsed command next to `noun`

Note `X` is *not* an object id. Some nouns are scenery (`WALL`, `TREES`), and
`N%(X)` maps a noun to its object where one exists — that is what lines like
`4400 I=N%(X): IF NOT I THEN 240` are doing.

**2. Give handlers `I`, the verb id.** A few routines branch on which synonym
was used — `6140 IF X=56 THEN I=59: GOTO 9400` and the `I=61` tests at 4600.
Carry the verb's index alongside the canonical name.

## Shared conventions

Worth encoding once rather than per routine:

| BASIC | Meaning |
| --- | --- |
| `GOTO 7000` | End of turn. Run the per-turn block, then re-prompt. |
| `GOTO 1000` | Re-prompt *without* consuming a turn. |
| `GOTO 200` | "IT'S LOCKED." |
| `GOTO 210` | "NOT HERE." |
| `GOTO 230` | "I'M SORRY - I DON'T UNDERSTAND." |
| `GOTO 240` | "SORRY - YOU CAN'T." |
| `GOTO 260` | "IT WON'T BUDGE." |
| `GOTO 280` | "IT'S ALREADY OPEN." |
| `GOTO 290` | "NOTHING HAPPENED." |
| `GOTO 330` | "YOU DON'T HAVE IT." |
| `GOSUB 220` | "<PRESS A KEY TO CONTINUE>" — a pause, not a message. |
| `GOSUB 8070` | Announce an object that just appeared. |
| `GOTO 30000` | Death. "SO MUCH FOR THAT TRY..." |
| `AX` | Redraw suppression. Display-only; ignore it. |
| `BR`, `CR` | Last drawn room. Display-only; ignore. |

`P` = room, `P%(n)` = object location, `T%(n)` = takeable, `RT%(n)` = room type,
`H` = carried count, `TU` = turn count.

---

## Tier 1 — canned refusals (16 verbs, 4 routines)

Pure table entries. No logic, no state.

- [x] **210** — `HUNT` → "NOT HERE."
- [x] **230** — `HOLD`, `USE` → "I'M SORRY - I DON'T UNDERSTAND."
- [x] **240** — `BREAK`, `CLEAN`, `SCRAP`, `BRUSH`, `PET`, `PAT` → "SORRY - YOU CAN'T."
- [x] **290** — `SCREA`, `SING`, `KICK`, `SHAKE`, `SWEEP`, `DUST`, `TOUCH` → "NOTHING HAPPENED."

Also in this tier, though they dispatch elsewhere:

- [x] **1599** — `TURN` → "YOU SEE NOTHING UNUSUAL."
- [x] **5950** — `KILL` → falls straight through to 240.
- [x] **9000** — `WHIST` → "YOUR WHISTLE ECHOED EERILY BACK TO YOU."
- [x] **9600** — `KISS` → "ISN'T THAT A LITTLE CORNY?"

## Tier 2 — one condition, one outcome

Small enough to be `RULES` entries rather than handlers.

- [x] **2990** — `PICK`. Only noun 121; in rooms 9/10 defers to 6315, else 240.
- [x] **4300** — `FEED`. Feed the flies (`X=10`) to the bullfrog: needs object 7
      carried, `P=16`, object 8 present. Else 240.
- [x] **4400** — `WEAR`. `I=N%(X)`; refuse if the noun has no object, "YOU DON'T
      HAVE IT." if not carried, else "OK." — note it does *not* track being worn.
- [x] **7600** — `CLOSE`. Only noun 29. Rewrites `N%(34)` and shuffles objects
      37/21/19/22 — reads as the coffin trick; port carefully.
- [x] **7900** — `CLAP`. Requires `PO=1`, `SH`, and `P=37`; wakes the damsel.
- [x] **8500** — `SAY`/`YELL`. Prints "OKAY."; `X=81` with the goblin in room 26
      makes it drop the key. Else 290.
- [x] **9800** — `STRIK`/`KNOCK`/`HIT`. Only noun 49; knocking at room 1 teleports
      you to room 9 ("POOF!"). This is the payoff for the acid-on-stump puzzle.
- [x] **9900** — `LISTE`. 1-in-7 gives "YOU HEARD NOTHING, WHICH IS ODD…" and
      **does not consume a turn** (`GOTO 1000`); otherwise falls into the ambient
      message block at 7175.

## Tier 3 — real puzzle logic

Each needs its own handler and touches flags or object placement.

- [x] **4500** — `LOAD`. Pistol + ammo, sets `GN`, renames object 17 to "LOADED
      FLINTLOCK PISTOL." Object renaming is a mechanic the port does not have yet.
- [x] **4600** — `SHOOT`/`FIRE`. Consumes `GN`, kills the werewolf when `X=34`,
      renames object 17 to "SMOKING…", drops the spent ball at `P+3`.
- [x] **4700** — `PULL`. Noun 46 spins the wall between rooms 21 and 22; noun 69
      defers to 7820.
- [x] **4800** — `POUR`. The acid chain. `X=36` → 4860; `X=28` needs object 36
      carried; sets `PO`; interacts with `SH` and room 37.
- [x] **4900** — `PUSH`/`PRESS`. The box button (noun 76). Kills you in rooms
      9/10; different outcomes for the sarcophagus and rooms 27–37.
- [x] **6140** — `RIDE` / **6142** — `FLY`. Broomstick: needs object 25, moves you
      to room 15 and prints the flyover. `RIDE` re-dispatches into 9400.
- [x] **6300** — `UNLOC` / **6400** — `LOCK`. Noun 61 in rooms 9/10, gated on `DR`
      and object 26 carried; noun 27 branches to 6370/6470.
- [x] **6500** — `EAT` / **6600** — `DRINK`. Bread (`X=41`), lake water (`X=117`),
      potion (`X=36`), acid (`X=28`, refused). Both adjust `H` when the item was
      carried.
- [x] **6700** — `CLIMB`. Noun 13 outside room 16 → the mossy-trees refusal (310);
      noun 57 → 12000; noun 59 → 5880.
- [x] **7500** — `OPEN`. The largest: coffin, door, sarcophagus, several nouns.
- [x] **7700** — `WAVE`/`SHOW`. Wand and cross combinations; the room-4 statue
      sequence at 7745.
- [x] **7800** — `MOVE`/`PRY`. Moving the gravestone in room 5 reveals the grate
      (`P%(13)=5`) — the route into the secret chamber.
- [x] **9400** — `SET`/`CAST`/`SAIL`. The lake crossing at room 16, with several
      verb/noun pairings; two endings depending on object 38.
- [x] **9700** — `READ`. Sign, gravestone, note, stump (`9710` → `9760`, gated on
      `SM`), and the magic book in room 9.
- [x] **10000** — `EXIT`/`IN` and **11000** — `ENTER`/`OUT`. Room-type arithmetic:
      `RT%` encodes enterable structures, so `P=P-RT%(P)+3` and friends. Port these
      as arithmetic, not as a lookup table — the original is compact and correct.

## Tier 4 — not verbs

- [x] **The `LOOK <thing>` table, 1500–1599.** Around 20 `(noun, room, object,
      flag)` tests. Straight into `RULES` now that noun ids resolve. Default is
      "YOU SEE NOTHING UNUSUAL." (1599).
- [x] **The per-turn block, 7000–7180.** Registered as turn hooks:
  - `7000/7001` — clear `V`/`W` when the vampire (39) or werewolf (34) is absent.
  - `7003` — object 5 vanishes and 23 appears if you leave room 35.
  - `7005` — **the clock**: `TU=TU+1`; every 70 turns `Y=TU/70` and it chimes.
    At the fifth chime (turn 350) the game jumps to 27000, the sunrise ending.
    The `Y=12` at line 874 is only the opening chime, not a countdown.
  - `7015/7020` — death one turn after the vampire or werewolf is in your room.
  - `7021–7028` — object 20 walks a fixed circuit (2→17→3→19→2, and 38/74 wrap
    by −36). A wandering NPC.
  - `7030` — every 20 turns past `R`, the shooting star, which places object 28
    in room 4.
  - `7050–7056` — the goblin's random harassment in room 26.
  - `7090–7100` — the werewolf's random appearance, suppressed by `WF` and for
    the first 10 turns.
- [x] **Endings.** 27000 (sunrise / time out) and 30000 (death). Both have terminal
      state `isGameOver`, and commands prompt to restart.
- [x] **25000 — `SAVE`, and RESTORE at line 50.** LocalStorage + state serialization.
- [x] **Room 32 has no description.** Confirmed: blank stub record in original
      `ROOMS` file, never referenced in `TRANS.bas`.

## Known gaps

- **Two jumps in the original go nowhere. This is a bug in the 1982 game, not in
  the extraction** — verified by walking the Applesoft line table in the `TRANS`
  program on the disk: 396 lines, and neither target is among them.

  | Reached from | Target | Trigger |
  | --- | --- | --- |
  | `1167` dispatch | `1110` | the verb `LIST` |
  | `5930 IF X=77 THEN 6130` | `6130` | `KILL` + noun 77 (`PASSA`) |

  In the original both raise `?UNDEF'D STATEMENT ERROR`, which the `ONERR GOTO
  58` installed at line 5 catches. `EC=3` once play has started (line 30), so it
  lands on line 70 and prints **"DISK ERROR."** then **"INSERT YOUR GAME DISK."**
  before `GOTO 1000` — back to the prompt, no turn consumed, no state touched.

  Winnability is unaffected, and provably: the lines never existed, so no player
  of the original could reach those actions either. `KILL` falls through to 240
  ("SORRY - YOU CAN'T.") for every other noun.

  The intended code is not recoverable from these images (all three disks carry
  identical contents), so pick a behaviour rather than reconstructing one:

  1. *Faithful* — reproduce the "DISK ERROR." misfire. Accurate, but meaningless
     in a browser with no disk.
  2. *Pragmatic (recommended)* — route both to "I'M SORRY - I DON'T UNDERSTAND."
     (line 230) with a comment pointing here. Indistinguishable to a player,
     since neither action does anything in the original. **Applied.**

- **The listing is missing lines 1–3, which are on the disk.** They are not game
  logic — they are a crack patch:

  ```basic
  1 LOC = 37888 + 61
  2 FOR C9 = LOC TO LOC+2: POKE C9, (14*16+10): NEXT
  3 REM IMPORTANT NOTICE (!) WITHOUT THIS PATCH,EXECUTION FAILS
  ```

  That writes three `$EA` (NOP) bytes into TPAR at `$943D`, disabling a
  copy-protection check inside the parser. All three images here are cracked
  releases. Nothing in the port depends on it, and it does not touch the word
  table at the file's tail.

- The `2000`, `3061`, `4100`, `5737`, `5880`, `6370`, `6470`, `7140`, `7175`,
  `7330`, `7350`, `7745`, `7769`, `7780`, `7820`, `8070`, `12000` subroutines are
  shared destinations reached from several verbs. Port them as helpers rather
  than inlining them into each caller.
- Descriptions are the Apple II's 40-column text with hard-wrapped spacing
  ("HORSE-   DRAWN WAGON"). Faithful, but it reads oddly in a fluid layout.

## The game is winnable, and there is a test that plays it

`web/test/winnable.test.js` plays one game from the opening prompt to
"WELL DONE!" using nothing but commands a player could type — no assignments to
`state.room` or `objectLoc` anywhere. It wins in **94 turns**, against a
350-turn limit (the fifth chime at 7005).

The chain it walks, which is the shortest one there is:

| Step | Needs | Line |
| --- | --- | --- |
| Take the cross | — | — |
| `SAY IJNID` to the goblin | — | 8510 |
| `MOVE GRAVESTONE`, `UNLOCK GRATE`, `GO GRATE` | the goblin's key | 7815 / 6370 / 6010 |
| Take the elixir | — | — |
| `PULL ANTLERS` in the cabin, take the cloak | — | 4703 |
| `WAVE CROSS` at the vampire | the cross, and the vampire | 7769 |
| `OPEN COFFER`, take the ring | `VR` from the cross | 7530 / 3067 |
| `WAVE RING` at the statue | ring **and** cloak, in room 4 | 7745 |
| `GO UFO`, twenty turns later | the shooting star | 7030 / **5920** |
| `CLIMB LADDER` to the tower | `VR` again | 6095 |
| `MOVE VINES`, `PUSH BUTTON` | the black box | 7820 / 4933 |
| `WAVE ELIXIR`, `POUR ELIXIR`, `CLAP` | the elixir, in that order | 7780 / 4840 / 7900 |
| Carry her to the lake, `SAIL BOAT` | the princess | 9440 |

**The ending depends on a random event.** The vampire only appears by chance
(7350-7355: 20% a turn, rooms 27-37), and destroying him is the only way to set
`VR` — which gates both the ring and the ladder to the tower. There is no
deterministic route to the princess. The test holds the RNG in the dead band
where nothing fires and dips it once, deliberately, so this dependency is
written down rather than left to luck; a fourth test asserts that without the
dip the tower stays shut.

Writing that test found four defects, now fixed:

- **5920 was never ported**, and it is the only line in the listing that puts
  the black metal box in your hands (`P%(27)=-2`). Without it the sarcophagus
  can never be blasted open, so **the port was not winnable at all**.
- **5700-5737 was not wired to `GO`.** `GO GRATE` and `GO CABIN` — what the room
  descriptions tell you to type — were refused; only `ENTER` reached 5737.
- **Every non-compass arrival described the room twice**, because the movement
  helpers each called `describeRoom` and the turn loop then did it again.
- **Winning did not end the game**; 9450 falls through to 30040 like every other
  ending, so `isGameOver` is now set there too.

3067 (the ring is barred by "A MYSTERIOUS BARRIER" until `VR`) was also missing
and is now in; it is what forces the cross to come before the treasure room.

## The cave behind the stump is the hint room

`KNOCK` on the stump drops you into room 9, which has no exits in `ROOMS` and
whose `EXIT` is refused outright (10019). That looks like a dead end, and it is
not one — three of the lines that make it work were unported, which is what made
it look like a trap:

- **3080 — `TAKE BOOK` in room 9** prints "IT IS MINE! GO AWAY!" and sets `P=1`.
  This is the way out, and the only one.
- **1780/1785-1787 — `LOOK CRYSTAL` in room 10** shows a figure in a wizard's
  cloak, wearing a shiny ring, waving at the statue until everything goes ablaze.
  This is the game's *only* statement of the cloak-plus-ring-at-the-statue
  puzzle, which is otherwise unguessable.
- **3090/3095 — `TAKE FLIES`** scatters them unless the flypaper is carried,
  and catching them is what makes object 7 takeable at all.

So the cave is two clue rooms with a door between them (pick from the cloak,
6320), holding the two things a player cannot deduce: how the elixir works
(9720) and what the ring and cloak are for. `web/test/winnable.test.js` now
plays that loop, and the flypaper -> flies -> bullfrog -> IJNID chain with it.

## The original artwork, rendered

`tools/picdraw.py` reproduces the 1982 art by running the game's own drawing
code. The pictures on disk are not bitmaps: each room (`R1`..`R38`, no `R32`)
and each object (`O1`..`O39`) is a vector program for `PICDRAW2`, which
`TRANS.bas` drives as

```
8000  BLOAD R<P>,A4608   POKE 2560,0    POKE 2561,18   CALL 2608
8070  BLOAD O<I>,A6632   POKE 2560,232  POKE 2561,25   CALL 2613
```

`PICDRAW2` loads at `$0800` and ends exactly where the room data begins
(`$1200`); `$0A00/$0A01` is its data pointer. The two `CALL`s are one routine
with two entry points — `$0A30` floods the page white first, `$0A35` draws on
top, which is how objects composite over rooms.

It draws two ways. Outlines go through four Applesoft HIRES ROM entry points
(`$F3F4` BKGND, `$F6EC` HCOLOR, `$F411` HPOSN, `$F53A` HLIN); fills are written
straight into the hires page through a pointer at `$08/$09`, whose high byte it
forms by adding HPAG (`$E6`). So the tool is a small 6502 interpreter
(`tools/cpu6502.py`) plus a real 8K framebuffer, with those four routines
supplied in Python and the finished page decoded the way an Apple II displays
it — colour from *pairs* of bits, bit 7 selecting violet/green or orange/blue.

```sh
python3 tools/picdraw.py --out web/public/art/original     # all 76
python3 tools/picsheet.py                                  # contact sheets
python3 tools/picsheet.py --compose 5:6,12                 # room + objects
```

All 76 render without a failure. The decoder is checked against `PIC`, the one
genuine bitmap on the disk (the title screen), which comes out as the original
artwork.

Three things this settles that guesswork could not:

- **Room 4 is an empty clearing.** The statue is object `O2`, composited. So
  every state of that room really is an overlay, as `SCENE_VARIATIONS.md`
  assumed — except the scorching, which no object covers.
- **Room 9's door is in the room art**, and there is no door object. The
  original never showed it open either, so an open variant is an improvement on
  1982 rather than a restoration of it.
- **`O12` (gravestone), `O23` (treasure coffer) and `O35` are empty programs.**
  Those things are painted into the room; the object exists only so that
  "THERE IS A ..." has something to name.

Objects render onto a blank page, so any drawn in black look empty on their own
— `O24`, the black cat, is 115 lines that only show over the white clay hut.
Compose them over their room to see them.

## Method that works

Port a routine, add its cases to `web/test/walkthrough.test.js` as a played
sequence, and check the transcript against the BASIC by reading the lines rather
than by playing the original. The engine is headless, so a test is a walkthrough
and a walkthrough is a test.

Per-routine tests place the world where the routine needs it, which verifies the
routine but hides missing links between routines. `winnable.test.js` is the
counterweight: it assigns nothing, so a puzzle with no way to reach it fails.
