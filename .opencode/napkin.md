# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|

## User Preferences
- (accumulate here as you learn them)

## Patterns That Work
- Run tests via headless engine test suite (`npm test` under `web/`).
- Check transcripts and routines directly against BASIC listing `trans_port_kit/TRANS.bas`.
- Match 5-character words as prefixes (e.g. "CEMETERY" matches "CEMET") and shorter words exactly (e.g. "CAT" matches "CAT", not "CATTLE").
- Resolve typed nouns against `world.nouns` to `X`, applying room overrides (1022 for P=5, 1024 for P=37) and alias table (`nounMap[X-1] < 0`).
- Carry verb id `I` and noun id `X` on parsed `Command`.
- Rules in `RULES` run before generic verb handlers: use `RULES` for special-case puzzle payoffs (wake damsel, feed bullfrog, say ijnid, knock stump, look <thing>) and handlers in `COMMANDS` for default/refusal behavior.
- Support non-turn-consuming commands (like LISTEN line 9930 `GOTO 1000`, sailing back without Sabrina) by returning `{ messages, consumeTurn: false }` from handlers.
- Dynamic object names (`OD$`), takeability (`T%`), and noun mapping (`N%`) can mutate during play; track them via sparse overrides on `state` (`objectNames`, `objectTakeable`, `nounMapOverrides`) with helpers (`getObjectName`, `setObjectName`, etc.).
- `MOVE` (verb 41, routine 7800) is a distinct verb from `GO` (verbs 1..4, routine 5700).

## Patterns That Don't Work
- Matching nouns only against object names: fails for scenery (trees, wall, stump) and misses alias chains in `noun_map_N`.
- Including "move" under `go` verbs: masks verb 41 (`MOVE`/`PRY` at 7800).

## Domain Notes
- Porting 1982 Apple II game Transylvania (`trans_port_kit/TRANS.bas`) to web engine (`web/`).
- Follow `PORTING.md`.
- `X` is 1-based noun id (1..171), `I` is 1-based verb id (1..89). `N%(X)` maps noun to object id (or negative alias).
- Canned refusals (Tier 1) end in `GOTO 7000`, consuming a turn.
- Tier 2 routines (PICK, FEED, WEAR, CLOSE, CLAP, SAY, STRIKE, LISTEN) and LOOK <thing> table (1500-1575) ported.
- Tier 3 routines (LOAD, SHOOT/FIRE, PULL, POUR, PUSH/PRESS, RIDE/FLY, UNLOCK/LOCK, EAT/DRINK, CLIMB, OPEN, WAVE/SHOW, MOVE/PRY, SET/CAST/SAIL, READ, EXIT/IN & ENTER/OUT) ported with shared helpers (stairs 12000, ladder 5880, sarcophagus 7820, statue alien 7745, cross light 7769, pie-man 6107, special nav 5737).
- Total status: **39 of 45 routines ported**, covering **86 of 89 verbs**. Only SAVE (45), LIST (48), HELP (57), per-turn block (7000-7180), and endings (27000/30000) remain.
