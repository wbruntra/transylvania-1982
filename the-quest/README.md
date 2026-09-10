# The Quest (1983) — Web Port

An early illustrated web port of Penguin Software's 1983 graphic adventure
**The Quest**, reverse-engineered from the original Apple II disk images.
See [`RESEARCH.md`](RESEARCH.md) for the full extraction writeup.

## Playing it

```bash
cd frontend
bun install
bun run dev
```

Then open the printed local URL. `bun run build` produces a static site in
`frontend/dist/` (works with `npm`/`vite` directly too, if you prefer).

## What works

Movement across all 255 rooms, room illustrations, room descriptions, taking
and dropping items (with real names resolved from the original parser
vocabulary), inventory, reading books, and save/restore (via `localStorage`).

**Not yet ported:** the puzzle-specific logic behind verbs like `OPEN`,
`GIVE`, `ATTACK`, `LIGHT`, `TALK`, `SWIM`, `KNOCK`, `TIE`, and `RIDE` — the
parser recognizes them (and their synonyms) but they currently just shrug.
Porting those means working through `quest_port_kit/MQ.bas`'s handlers one
by one, the same way [`../PORTING.md`](../PORTING.md) did for Transylvania.

## How it's put together

- `tools/` — the extraction scripts (disk image → `quest_port_kit/*.json`),
  documented individually and in `RESEARCH.md`.
- `quest_port_kit/` — the extracted game data: `game.json` (rooms/items),
  `vocabulary.json` (parser words + item names), `TEXT.json` (room/event
  prose), `art_samples/` (rendered room pictures), and the detokenized
  original BASIC listings.
- `tools/build_frontend_bundle.py` — bundles the above into
  `frontend/src/data/quest-data.json` and copies the art the frontend needs
  into `frontend/public/art/`. Re-run it after regenerating any
  `quest_port_kit/*.json`.
- `frontend/src/engine/` — a small headless engine (`world.js` for static
  lookups, `state.js` for mutable per-session state, `parser.js` for turning
  input into an action, `engine.js` for executing it) driven entirely by the
  bundled data, no hardcoded game content.
- `frontend/src/app.jsx` — the Preact UI: room art, a scrolling transcript,
  a direction pad, and a command line.
