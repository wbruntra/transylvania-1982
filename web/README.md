# Transylvania — web port

A port of the 1982 Penguin Software Apple II adventure, driven by data
extracted from the original disk images.

## Running

```sh
npm install
npm run dev      # http://localhost:8099
npm test         # headless walkthrough, no browser needed
npm run build
```

## How it fits together

The engine knows nothing about the DOM and the UI knows nothing about the
rules. `engine.execute(input)` takes a line of text and returns the lines to
print — which is why the whole game can be played in a test.

```
tools/sync-data.mjs        trans_port_kit/game.json -> web/public/game.json
                           (validated; run by predev/prebuild/pretest)

src/main.js                bootstrap: data -> engine -> view
src/data/gameData.js       load + validate the extracted data
src/engine/
  constants.js             directions, sentinels, limits from TRANS.bas
  world.js                 rooms, objects, exits (never changes during play)
  state.js                 room, turns, object locations, the 14 saved flags
  vocabulary.js            words -> canonical verbs
  parser.js                a line of input -> {verb, noun, direction}
  rules.js                 per-room/object special cases, as data
  commands/                one handler per verb + the registry
  describe.js              room descriptions
  messages.js              every string the game says
  engine.js                the turn loop
src/ui/view.js             transcript, prompt, shortcut buttons
src/ui/scene.js            scene art, with a gradient placeholder
```

## Adding to it

**A verb.** Add its synonyms to `src/engine/vocabulary.js`, write a handler in
`src/engine/commands/`, register it in `commands/index.js`. Handlers return the
lines to print, or `null` for "I don't understand". Nothing else changes.

**A special case** — the `IF X=37 AND P=2 THEN PRINT ...` tests that make up
most of TRANS.bas — is an entry in the `RULES` table in `src/engine/rules.js`,
not an `if` inside a handler. Rules run before the generic verb handler, so a
room-specific response overrides the default one.

**Something that happens on a timer** — the tower clock, the vampire and
werewolf at TRANS.bas:7015-7030 — is `engine.addTurnHook(...)`, which runs
after every command.

**A message** goes in `src/engine/messages.js` so it can be diffed against the
listing.

## Where the data comes from

`tools/extract.py` reads the Apple II disk image directly (no emulator or Apple
tooling needed -- `tools/dos33.py` is a small DOS 3.3 reader):

```sh
python3 tools/extract.py "Transylvania ... (Disk 1 of 2).do" \
    --basic trans_port_kit/TRANS.bas -o trans_port_kit/game.json
```

It pulls room exits and objects from `DATA`, room descriptions from the
random-access `ROOMS` file (69-byte records indexed by room number), and the
word table -- 89 verbs and 171 nouns -- from `TPAR`, the parser binary behind
`CALL 37901`. `tools/sync-data.mjs` then copies and re-validates the result into
`public/`.

## What is still missing

See [`../PORTING.md`](../PORTING.md) for the full checklist: every unported verb
mapped to its TRANS.bas routine, in tiers.


- 6 of the original's 89 verbs are implemented. `verbs` and `verb_targets` in
  the data line up index-for-index, so `verb_targets` is the checklist: each
  entry is the TRANS.bas line that verb still needs ported from.
- The `RULES` table is empty and no turn hooks are registered. Both mechanisms
  are in place and tested; the noun ids the original scripts key on (`X=37`) can
  now be resolved through the `nouns` table.
- Nouns are still matched against object names rather than resolved to noun ids
  via `nouns` + `noun_map_N`. That swap is what unlocks the rules table.
- Rooms 9, 10, 22 and 32 have no ordinary exits and room 32 has no description.
  This is faithful: TRANS.bas moves the player in and out of them with scripts
  (`IF P=9 THEN P=10`), so they need rules, not data fixes.
