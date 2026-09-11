# Porting checklist

What is left to turn the web port into a winnable game, ordered so that each
tier is useful on its own — modeled on [`../PORTING.md`](../PORTING.md), which
did this for Transylvania. Line numbers refer to
[`quest_port_kit/MQ.bas`](quest_port_kit/MQ.bas), the detokenised listing.

Status at time of writing: the engine can move through all 255 rooms with
real art and text, take/drop/look/read/inventory/save/restore work against
real item data, and the frontend clears its transcript per room (with a
dismissible overlay for long scene-setting text). Most of the puzzle-specific
verb logic below has since been implemented (see the checkmarks) — this
document's checklist is otherwise as originally written and hasn't been
re-audited line by line against the current `engine.js`; treat unchecked items
as "not confirmed," not necessarily "not done."

**Tests: `frontend/test/{winnable,interactions,coverage}.test.js` (`bun test`).**
`winnable.test.js` plays one full game to the real victory text.
`interactions.test.js` exercises individual puzzles in isolation, including
ones off the win path (surviving thirst, a fight you didn't have to start).
`coverage.test.js` is a completeness check rather than a gameplay test: it
reads `engine.js`'s own source and asserts every room-arrival event and every
parser-reachable verb has *some* code referencing it, so a forgotten case
fails a test instead of silently shrugging at the player forever. It found
real gaps on first run — `FILL` had no handler at all, and three rooms
(82, 96, 118) were scripted deaths/captures in `MQ.bas` that the port hadn't
wired up, so wandering into them soft-locked the game instead of ending it.
All are fixed. What it does *not* catch: whether a handler's behavior is
actually correct (that's what `interactions.test.js` is for) — passing
`coverage.test.js` only proves code exists, not that it does the right thing.

## Before anything else: two things already done, one still open

Unlike Transylvania, where noun-id resolution and verb-id tracking were the
two prerequisite enabling changes, both of the equivalent problems here are
already solved by the extraction:

- **Nouns are already ids.** `quest_port_kit/game.json`'s items carry
  `synonyms`, and `frontend/src/engine/parser.js` resolves a typed noun
  phrase straight to an item object. No id-resolution work needed before
  writing a handler — just take the resolved `item` parameter.
- **Verbs are already dispatch-grouped.** `vocabulary.json`'s
  `verb_dispatch` maps all 60 verb words to their real `MQ.bas` line number
  (see `RESEARCH.md`'s "Vocabulary" section for how this was cross-checked),
  and `frontend/src/engine/world.js`'s `ACTIONS_BY_DISPATCH` collapses those
  into the action names used in `engine.js`'s `runTurn` switch. Adding a verb
  means adding a case to that switch, not re-deriving synonym groups.

**What's still open:** which noun in `vocabulary.json`'s noun list is which
of `game.json`'s 38 items. A rough positional correspondence looks likely
(see RESEARCH.md) but isn't confirmed the way the verb table now is. Worth
nailing down before leaning on item ids >12 or so for puzzle logic, in case
the mapping drifts partway through the list the way the verb dispatch table
initially seemed to.

## Shared conventions

Worth encoding once rather than per routine (constants from `QB.bas:8`,
`A=3050:B=9200:C=9210:D=9300:E=9410:FF=9458`):

| BASIC | Meaning |
| --- | --- |
| `GOTO 35` | Re-prompt without consuming a turn or redescribing. |
| `GOTO 40` | "(GORN) I'M NOT SURE I UNDERSTAND YOU." |
| `GOTO 202` | Generic movement refusal ("I DON'T WANT TO GO THAT WAY.") |
| `GOSUB 180` | Redraw the "VISIBLE EXITS"/"VISIBLE ITEMS" header line. |
| `GOSUB 100` | Read and lex one input line into a verb line (`V`) and noun id (`N`), plus a numeral (`NU`) if one was typed -- `MQ.bas`'s own parser, already superseded by `parser.js`. |
| `& GOSUB D` (9300) | Print message `T` (see RESEARCH.md's "Text" section -- already implemented as `messageText()`). |
| `& GOSUB B` (9200) | Redraw the room picture, if the redraw flag `G` is set. |
| `& GOSUB C` (9210) | Draw whatever picture is currently loaded at `P`. |
| `& GOSUB E` (9410) | Load and draw object picture `O%` at the standard position. |
| `& GOSUB FF` (9458) | Load and draw object picture `O%` at explicit position `(X,Y)` -- used for composited sprites like the flying carpet. |
| `& GOTO A` (3050) | Death/ending: "START AGAIN OR RESTORE PREVIOUS GAME?" -- this game's equivalent of Transylvania's `GOTO 30000`. |
| `& GET` | "<PRESS A KEY TO CONTINUE>" -- a pause, not a message. |
| `F%(row, 0)` | Scratch storage reused per row: `F%(3,0)` is turns-since-last-move, `F%(4,0)` is the global turn counter, `F%(2,0)` is **the player's gold purse** (starts at 150 -- `QB.bas:22`), `F%(0,0)` is the currently-loaded text file index. None of these are room 0 (room ids start at 1). |
| `M%(0..14)` | Transient flags, reset each game (`QB.bas:22`). Individual meanings noted per routine below where relevant. |

## Tier 1 -- movement needs its special cases finished

Basic compass movement (exits, redescribing the destination) already works.
Ported:

- [x] **202/204** -- the boat-crossing refusal. Moving into water outside
      rooms 93-96 without a boat prints: "GORN YELLS AT YOU FROM THE SHORE THAT  YOU CAN'T GO THAT WAY."
- [x] **260-290** -- **the thirst mechanic.** Every 10 moves since the last
      drink (`turns - lastDrinkTurn >= 10`, skipped in rooms 93-96 water
      crossing), automatically drinks from waterskin if carried and non-empty
      (resetting counter and deducting water; kills if poisoned by room 73).
      Without water, issues warning on turn 10 and death ("YOU JUST DIED OF THIRST!") on turn 20.
- [x] **30** -- per-room arrival events. Wired in `handleMove`: dark caves check
      (3800-3805) requiring lit lantern, Sphinx riddle (3100), shop inventory
      migration (3200), sign placements (4000/4100), and dragon delivery / victory (3400/8000).

## Tier 2 -- one item, one mechanic

- [x] **450-460 `CLIMB`.** Reads dynamic vertical exits (`up`, `down`) and moves
      accordingly; refuses with standard movement refusal if neither is available.
- [x] **500-530 `TIE`.** Only noun 7 (rope). Refuses without rope; ties rope in
      room 77 to unlock `up: 77` in room 81; ties in room 252 to create
      bidirectional exit (`down: 244` in 252, `up: 252` in 244). Picking up rope clears those exits.
- [x] **600-618 `OPEN`.** Refuses in room 255 (locked house) and non-chest rooms;
      opens chest in room 81, sets `flags.chestOpen = true`, places carpet (31) in 81, and prints message 48.
- [x] **650-660 `KNOCK`.** In room 255: if Lisa joined, prints refusal; if player
      lacks ring (4), slams door shut; if player carries ring, runs 3700-3720 cutscene,
      gives ring to Lisa, and joins Lisa (`flags.lisaJoined = true`).
- [x] **850-865 `LIGHT`/`IGNITE`.** Only noun 22 (lantern); requires lantern carried,
      sets `flags.lanternLit = true`, gates entry to dark caves (3800).
- [x] **1400-1430 `RIDE`.** Only noun 31 (carpet). Refuses without it; teleports
      room 219 -> 244 (message 184); room 244/251/253 -> 252 (message 185) returning
      carpet to chest in 81; elsewhere returns carpet to chest in 81.

## Tier 3 -- real puzzle logic and set-piece scenes

- [x] **300-395 `GET`/`TAKE`/`BUY`/`PURCHASE`.** Full shop economy (deducting price
      from 150 gold sovereigns in rooms 2 and 116); filling waterskin (20) with water;
      sword inspection on pickup; clearing rope exits on pickup; scenery take refusals;
      and **325 `TAKE ALL`** taking all items in current room.
- [x] **350-395 `DROP`/`PUT`/`THROW`/`POUR`.** Dropping items in room; throwing/pouring
      salt (5) on baby dragon tail (message 168).
- [x] **700-735 `GIVE`/`PAY`/`OFFER`.** "GIVE GOLD TO GORN" refusal; highwaymen
      negotiation in room 19 with numeral parsing (`NU`), graduated messages (22, 23, 24, 25),
      and threshold success (`NU >= 51`) setting `flags.highwaymenPaid = true`.
- [x] **750-785 `READ`.** Signs (rooms 15, 16, 73); shop price list (rooms 2, 116);
      library books (33-38) with Pig Latin (36) unlocking Dragonese dictionary (35)
      to understand dragon speech.
- [x] **800-849 `LOOK`.** Bare `LOOK` redescribes room; `LOOK WATERFALL` in room 38
      unlocks hidden passage (`east: 40`); `LOOK SWORD` shows DRAGONBANE inscription;
      flavor descriptions for snake, ring, carpet, cub, etc.
- [x] **900-925 `TALK`/`SPEAK`/`ASK`.** Champion's verbal proficiency refusal;
      Lisa conversation; highwaymen advice; dragon dialogue (untranslated Dragonese
      vs translated); and **Sphinx riddle scene (3101-3110)** in room 104 with riddle (133),
      wrong answer (135), and correct answer "SPHINX" (134) unlocking south exit to room 202.
- [x] **1000-1020 `SWIM`.** Valid in island rooms 92-96; "SWIM TO SHORE" moves North,
      "SWIM TO ISLAND" moves South; elsewhere gives refusal.
- [x] **1050-1095 `ATTACK`/`FIGHT`/`HIT`/`STAB`/`SLAY`/`KILL`/`SMITE`.** Lizard men combat
      in room 57 (guarded by Lisa if joined); dragon confrontation; elsewhere scrap refusal.
- [x] **1200/1250 `SAVE`/`RESTORE`.** Saves and restores full game state (inventory, locations,
      gold, water, flags, dynamic exits).
- [x] **1300 `QUIT`.** Resets to new game.
- [x] **1350 `BOOK`/`BOOKS`/`SHELF`.** In room 2, lists library books (33-38) and sovereign prices.

## Tier 4 -- not verbs

- [x] **`GOSUB 100`'s numeral extraction (`NU`).** `parser.js` extracts integer `numeral`
      for commands like `GIVE 50 GOLD`.
- [x] **`3050` -- the death/restart prompt.** Handled via `state.over` terminal state.
- [x] **`3200-3205` and `4000`/`4100`.** Wired to room arrival events.
- [x] **`3700-3720` -- meeting Lisa.** Full cutscene with ring check and Lisa recruitment.
- [x] **The victory ending.** Reached at room 149 when returning living dragon cub,
      transporting to room 4 (King's castle) and printing full ending victory prose.
- [ ] **`QUEST`/`TP` title sequence.** Optional title splash screen.


## Suggested method

Same one that worked for Transylvania: port a routine, add a played sequence
to a headless test, and check the transcript against the BASIC by reading the
lines rather than by playing the original. There's no test runner wired up in
`the-quest/frontend` yet -- `web/test/walkthrough.test.js` is the model to
follow (a headless engine makes a played sequence a test). Adding `vitest` (or
reusing whatever the root project already has) and a
`frontend/src/engine/*.test.js` per routine, plus one `winnable.test.js` that
assigns nothing and just plays from the intro to the dragon fight, would give
the same safety net Transylvania's port relied on.

The sphinx riddle (Tier 3, `900-925`/`3101-3110`) is the best starting point:
its text is already calibrated end-to-end, the branch condition (`M%(Z)=104`)
is simple, and it's fully self-contained (doesn't depend on any other
unported mechanic).
