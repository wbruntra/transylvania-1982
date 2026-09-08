# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-09-05 | User | Test expected only "POOF!" for `knock stump` teleport | In TRANS.bas:7990/8000, any room change during a turn redescribes the destination room; `engine.execute` appends room description when `state.room !== roomBefore`, so tests must expect action message followed by destination room description. |
| 2026-09-06 | User | Map taking up 1/3 of the screen in normal view | Never place secondary UI like the map inline next to `#scene` inside `#stage` (and beware CSS specificity on class selectors overriding HTML `hidden`). The art must remain unobstructed in normal view. Instead, use an unobtrusive floating corner mini-map HUD (`140px × 105px`) and a slide-in drawer/modal sheet for the full chart, opened on demand via click, hotkey, or `MAP` command. |
| 2026-09-06 | User | CSS hover transform on SVG prop overridden by element transform attribute | In SVG, CSS transform declarations override SVG presentation attributes outright. To prevent hovering from resetting the element's position to (0,0), wrap interactive props in two nested groups (`PROP_ROOTS` / `placeProp` / `propRoot`): outer carries the placement transform, inner carries the interactive CSS class and hover scale. |
| 2026-09-08 | User | Changed git default branch from `master` to `main` without instruction | Never rename `master` to `main` or alter branch names. Preserve `master` as the default branch locally and on remote. |


## User Preferences
- Git Branch: Always use `master` as the primary/default branch. Never rename to `main`.
- Maximize screen real estate for artwork: the scene art must take up as much screen space as possible (73-75% screen width), using container queries (`min(calc(100cqw - 32px), calc(100cqh - 32px))`) to fit the largest 1:1 box. Never divide or shrink the normal art viewport with secondary views.
- Command input line placement: the command input line (`#row`) sits directly underneath the scene image inside `#stage` within `.stage-frame` (matching the image width), while the rest of the controls (action chips, D-pad, quick buttons, and log) reside in the console box on the right.
- Cat Guard & Ravenous Mice: The black cat in Room 7 blocks taking the acid and broom (`"THE CAT SCOWLS FIERCELY AND WON'T LET YOU NEAR."`) until distracted by releasing/dropping the mice in Room 7 (`"THE MICE RUN AWAY AND THE CAT CHASES AFTER THEM."`). The loaf of stale bread is an authentic 1982 red herring (`EAT BREAD` -> `"IT TASTED AWFUL."`) and is not needed to catch the mice.
- Unobtrusive mini-map & large slide-in drawer: display a small, floating corner mini-map radar during normal gameplay; expand into a large slide-in drawer covering up to 88vw (or 100vw when maximized) when clicked or when the player types `MAP` / `M`, with enlarged room cards (88x40), bold labels, high-contrast paths, and a prominent player beacon. Easily dismissible via Close button, Escape, or backdrop click.
- Eliminate the "Focus" button: with the primary stage layout already claiming ~75% of the viewport and scaling dynamically via container queries, the separate "Focus" button is no longer needed and has been removed from the console header.

## Patterns That Work
- Track visited rooms in `state.visitedRooms` (serialized in saves); provide a non-turn-consuming `MAP` meta command and live UI updates.
- Run tests via headless engine test suite (`npm test` under `web/`).
- Check transcripts and routines directly against BASIC listing `trans_port_kit/TRANS.bas`.
- Match 5-character words as prefixes (e.g. "CEMETERY" matches "CEMET") and shorter words exactly (e.g. "CAT" matches "CAT", not "CATTLE").
- Resolve typed nouns against `world.nouns` to `X`, applying room overrides (1022 for P=5, 1024 for P=37) and alias table (`nounMap[X-1] < 0`).
- Carry verb id `I` and noun id `X` on parsed `Command`.
- Rules in `RULES` run before generic verb handlers: use `RULES` for special-case puzzle payoffs (wake damsel, feed bullfrog, say ijnid, knock stump, look <thing>) and handlers in `COMMANDS` for default/refusal behavior.
- Support non-turn-consuming commands (like LISTEN line 9930 `GOTO 1000`, sailing back without Sabrina) by returning `{ messages, consumeTurn: false }` from handlers.
- Dynamic object names (`OD$`), takeability (`T%`), and noun mapping (`N%`) can mutate during play; track them via sparse overrides on `state` (`objectNames`, `objectTakeable`, `nounMapOverrides`) with helpers (`getObjectName`, `setObjectName`, etc.).
- `MOVE` (verb 41, routine 7800) is a distinct verb from `GO` (verbs 1..4, routine 5700).
- Layered SVG Scene Overlays: mount an SVG with `viewBox="0 0 1024 1024"` directly over the `.scene-art` 1024x1024 square background to render dynamic scene variations (crumpled note, acid runes, open/closed coffin with corpse and silver bullet, glowing saucer, opened grate shaft, awakened Sabrina). Supports click-to-interact handlers for effortless point-and-click interactions alongside text parser.
- Dynamic wandering entities (Ravenous Mice, Snarling Werewolf, Lethal Vampire) and environmental state changes (defeated ashes, embers, unlocked iron doors, tangled vines, smoking shattered pedestals) can be dispatched globally in `updateSceneOverlay` after room-specific switches, layering interactive SVG actors over background art wherever they spawn.
- Room 22 (Secret Annex) exit: In `TRANS.bas:4700-4704`, `PULL ANTLERS` is a bidirectional toggle between Room 21 (Log Cabin) and Room 22 (Secret Annex). Because Room 22's description does not mention antlers or exits, support `PULL WALL` as an alias and provide an interactive `Revolving Secret Wall` SVG overlay in Room 22.
- iPad / Touch UI Ergonomics:
  - iOS Safari Auto-Zoom Fix: any text `<input>` (`#cmd`) must have `font-size: 16px` (or `max(16px, 1rem)`) and `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />`. Any size below 16px triggers automatic page zooming on touch focus, destroying web app layout.
  - Safe Area Insets: use `padding: max(14px, env(safe-area-inset-*))` on `#app` with `height: 100dvh` so Home Indicator bar and status bar never clip interactive buttons.
  - D-Pad with Dynamic Exit Illumination: 3x3 D-Pad with compass directions (`N`, `S`, `W`, `E`) and vertical routes (`U`, `D`). Examine `room.exits` on every turn and illuminate active routes (`.active-exit` cyan border and glow) while muting blocked directions (`.disabled-exit` low opacity).
  - Contextual Smart Action Chips (`#actionChips`): horizontal swipeable chip strip computed from `objectsInRoom`, carried items, and room puzzle rules (e.g. `[📜 GET NOTE]`, `[📖 READ NOTE]`, `[🦌 PULL ANTLERS]`, `[🐺 SHOOT WEREWOLF]`), enabling 90%+ of gameplay via comfortable one-tap thumb interactions.
  - Coarse Pointer Refinement: in `@media (pointer: coarse)`, interactive SVG prop badges (`.prop-badge`) must be gently visible (`opacity: 0.95`) since touch devices lack cursor hover. Buttons must set `touch-action: manipulation; -webkit-tap-highlight-color: transparent;` with minimum 44×44px hit targets.
  - Keyboard Accommodation: on small viewports or when virtual keyboard slides up (`@media (max-height: 540px)`), collapse `#touchDeck` and `#actionChips` so the transcript log and command input retain full view.
- Non-turn-consuming unrecognized input: "I DON'T UNDERSTAND." must never consume a turn (`consumeTurn: false`). Consuming turns on syntax/verb discovery penalized players unfairly, instantly triggering timed deaths from the werewolf or vampire while trying to discover verbs or typing typos. Additionally, bare `SHOOT` and bare `WAVE` (when carrying the cross) default to target the active monster present in the room.
- Unlimited inventory & starting armament: Inventory item-carrying limit is removed (`MAX_CARRIED = Infinity`), and the player starts holding the Flintlock Pistol (Obj 17) and Silver Bullet (Obj 22) for easier exploration and defense against werewolf attacks. Guarded coffin opening (`open.js`) so it does not overwrite bullet location if already carried or loaded into the pistol.
- Flypaper & Flies UX (Room 9): In original `TRANS.bas:3095`, the only supported command was `GET/TAKE FLIES`, which dropped the flypaper in Room 9 (to work around H=5 limit) without rendering it. Support all intuitive synonyms: `USE FLYPAPER`, `CATCH FLIES WITH FLYPAPER`, `WAVE FLYPAPER`, and `DROP/PUT FLYPAPER` in Room 9 (which catches the flies instead of orphaning the item). Provide contextual action chips `[🪰 CATCH FLIES]` and `[🪰 USE FLYPAPER]` in Room 9, render SVG flypaper on the cave floor if lying in Room 9, and rename Object 7 to `FLIES ON FLYPAPER.` so players clearly see they possess the caught flies on the paper.
- Two-Noun Intent Parsing & Spoiler-Free Action Chips:
  - Multi-word and prepositional inputs (`USE <X> ON <Y>`, `PUT <X> IN <Y>`, `FEED <X> TO <Y>`, `UNLOCK <X> WITH <Y>`, `SHOOT <X> WITH <Y>`, `POINT <X> AT <Y>`) are parsed cleanly into direct/indirect objects and routed to their semantic handlers without requiring the player to guess narrow 1982 verb pairs.
  - Action chips must strictly facilitate exploration (`LOOK`, `GET`, `READ`, `OPEN`, `PULL`) and life-or-death reactions (`SHOOT WEREWOLF`, `WAVE CROSS`), never pre-baking puzzle solutions (no `SAY IJNID`, `POUR ACID`, `FEED FROG`, `RELEASE MICE`, `WAKE SABRINA`). Stump knocking only reveals after acid makes the carving legible.

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
- Tier 4 per-turn block (7000-7180), endings (sunrise 27000, deaths 7015/7020/30000, win 9440), meta commands (SAVE 25000, RESTORE 50, HELP 4200, QUIT/END 30040), and known gap fallbacks (LIST 1110, KILL+PASSA 6130) fully ported.
- Total status: **45 of 45 routines ported**, covering **all 89 verbs**. Complete port finished.

## Deployment & Hosting
- Public GitHub Repo: `https://github.com/wbruntra/transylvania-1982`
- GitHub Pages URL: `https://wbruntra.github.io/transylvania-1982/`
- Automated Deployment: `.github/workflows/deploy.yml` triggers on push to `main`, tests with Node 22, builds `web/` with `base: "./"` in `vite.config.js`, and publishes artifact to GitHub Pages.

