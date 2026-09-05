# Superseded files

Kept for reference only; nothing loads them.

- `game.js` — the original single-file v0.1 port, now split across `../src/`.
  Every message it printed is preserved (see `src/engine/messages.js`) and the
  test suite in `../test/` asserts on them.
- `game.json` — a hand-copied, lossy fork of `trans_port_kit/game.json`. It had
  dropped the `noun_map_N`, `verb_targets` and `counts` vocabulary tables and
  picked up a stray top-level `exits` key (room 1's exit record, leaked out of
  the extractor). The app now reads `../public/game.json`, which
  `tools/sync-data.mjs` generates from the kit and validates.

Safe to delete once you are satisfied with the refactor.
