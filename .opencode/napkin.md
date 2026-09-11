# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-09-05 | User | Test expected only "POOF!" for `knock stump` teleport | In TRANS.bas:7990/8000, any room change during a turn redescribes the destination room; `engine.execute` appends room description when `state.room !== roomBefore`, so tests must expect action message followed by destination room description. |
| 2026-09-06 | User | Map taking up 1/3 of the screen in normal view | Never place secondary UI like the map inline next to `#scene` inside `#stage` (and beware CSS specificity on class selectors overriding HTML `hidden`). The art must remain unobstructed in normal view. Instead, use an unobtrusive floating corner mini-map HUD (`140px × 105px`) and a slide-in drawer/modal sheet for the full chart, opened on demand via click, hotkey, or `MAP` command. |
| 2026-09-06 | User | CSS hover transform on SVG prop overridden by element transform attribute | In SVG, CSS transform declarations override SVG presentation attributes outright. To prevent hovering from resetting the element's position to (0,0), wrap interactive props in two nested groups (`PROP_ROOTS` / `placeProp` / `propRoot`): outer carries the placement transform, inner carries the interactive CSS class and hover scale. |
| 2026-09-08 | User | Changed git default branch from `master` to `main` without instruction | Never rename `master` to `main` or alter branch names. Preserve `master` as the default branch locally and on remote. |
| 2026-09-08 | User | Auto-executing puzzle actions on generic USE bypassed the canonical verb requirement | Require canonical verbs (WAVE, POUR, FEED, UNLOCK, SHOOT, etc.) to solve puzzles; provide a mild hint system that acknowledges player phrasing (e.g. "HOW DO YOU WANT TO USE IT?", "YOU TOUCH IT, BUT NOTHING HAPPENS.") rather than cold "I DON'T UNDERSTAND." |
| 2026-09-08 | User | Scene image collapsed to 0px height on mobile | `#stage` has `container-type: size;` in desktop CSS, which applies size containment in both axes (calculating height as having no contents). When switching `#stage` to `height: auto` in a flex column on mobile, size containment caused `#stage` to collapse to 0px with `overflow: hidden`. Always reset `container-type: normal;` on `#stage` in mobile queries and use `aspect-ratio: 1 / 1; width: 100%;` to establish the square frame. |
| 2026-09-08 | User | PUSH GRAVESTONE refused with "IT WON'T BUDGE." while MOVE GRAVESTONE succeeded | In TRANS.bas:4900, PUSH was narrowly reserved for the metal box button (noun 76), refusing everything else with line 260. Support PUSH, PULL, and MOVE symmetrically for interactive environmental fixtures (gravestone in cemetery room 5, vines in room 37, revolving wall/antlers in room 21), eliminating confusing refusals. |


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
- Dynamic wandering entities (Ravenous Mice, Snarling Werewolf, Lethal Vampire):
  - Ravenous Mice patrol a fixed loop across Rooms 38 -> 2 -> 17 -> 3 -> 19 -> 2... advancing one room per turn after the wagon coffin is opened. Rendered via dedicated character sprite `art/props/mice.webp` with interactive badge and click-to-take (`get mice`).
  - Snarling Werewolf and Lethal Vampire render across rooms with their respective danger badges and one-tap combat actions (`shoot werewolf`, `wave cross`). Ambient message 11 ("A CAT DARTED BY...") is gated on `state.timers.ZZ === 11` matching `TRANS.bas:7170/4190` so it only occurs after the cat is chased.
- Room 22 (Secret Annex) exit: In `TRANS.bas:4700-4704`, `PULL ANTLERS` is a bidirectional toggle between Room 21 (Log Cabin) and Room 22 (Secret Annex). Because Room 22's description does not mention antlers or exits, support `PULL WALL` as an alias and provide an interactive `Revolving Secret Wall` SVG overlay in Room 22.
- iPad / Touch UI Ergonomics:
  - iOS Safari Auto-Zoom Fix: any text `<input>` (`#cmd`) must have `font-size: 16px` (or `max(16px, 1rem)`) and `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />`. Any size below 16px triggers automatic page zooming on touch focus, destroying web app layout.
  - Safe Area Insets: use `padding: max(14px, env(safe-area-inset-*))` on `#app` with `height: 100dvh` so Home Indicator bar and status bar never clip interactive buttons.
  - D-Pad with Dynamic Exit Illumination: 3x3 D-Pad with compass directions (`N`, `S`, `W`, `E`) and vertical routes (`U`, `D`). Examine `room.exits` on every turn and illuminate active routes (`.active-exit` cyan border and glow) while muting blocked directions (`.disabled-exit` low opacity).
  - Contextual Smart Action Chips (`#actionChips`): horizontal swipeable chip strip computed from `objectsInRoom`, carried items, and room puzzle rules (e.g. `[📜 GET NOTE]`, `[📖 READ NOTE]`, `[🦌 PULL ANTLERS]`, `[🐺 SHOOT WEREWOLF]`), enabling 90%+ of gameplay via comfortable one-tap thumb interactions.
  - Coarse Pointer Refinement: in `@media (pointer: coarse)`, interactive SVG prop badges (`.prop-badge`) must be gently visible (`opacity: 0.95`) since touch devices lack cursor hover. Buttons must set `touch-action: manipulation; -webkit-tap-highlight-color: transparent;` with minimum 44×44px hit targets.
  - Keyboard Accommodation: on small viewports or when virtual keyboard slides up (`@media (max-height: 540px)`), collapse `#touchDeck` and `#actionChips` so the transcript log and command input retain full view.
- Non-turn-consuming unrecognized input: "I DON'T UNDERSTAND." must never consume a turn (`consumeTurn: false`). Consuming turns on syntax/verb discovery penalized players unfairly, instantly triggering timed deaths from the werewolf or vampire while trying to discover verbs or typing typos. Additionally, bare `SHOOT` and bare `WAVE` (when carrying the cross) default to target the active monster present in the room. When shooting an unloaded pistol (`!state.flags.GN`), output `"CLICK - THE PISTOL IS EMPTY."` instead of a generic refusal.
- Unlimited inventory & starting armament: Inventory item-carrying limit is removed (`MAX_CARRIED = Infinity`), and the player starts holding the Flintlock Pistol (Obj 17) and Silver Bullet (Obj 22) for easier exploration and defense against werewolf attacks. Guarded coffin opening (`open.js`) so it does not overwrite bullet location if already carried or loaded into the pistol.
- Flypaper & Flies UX (Room 9): In original `TRANS.bas:3095`, the only supported command was `GET/TAKE FLIES`, which dropped the flypaper in Room 9 (to work around H=5 limit) without rendering it. Support all intuitive synonyms: `USE FLYPAPER`, `CATCH FLIES WITH FLYPAPER`, `WAVE FLYPAPER`, and `DROP/PUT FLYPAPER` in Room 9 (which catches the flies instead of orphaning the item). Provide contextual action chips `[🪰 CATCH FLIES]` and `[🪰 USE FLYPAPER]` in Room 9, render SVG flypaper on the cave floor if lying in Room 9, and rename Object 7 to `FLIES ON FLYPAPER.` so players clearly see they possess the caught flies on the paper.
- Two-Noun Intent Parsing & Spoiler-Free Action Chips:
  - Multi-word and prepositional inputs (`USE <X> ON <Y>`, `PUT <X> IN <Y>`, `FEED <X> TO <Y>`, `UNLOCK <X> WITH <Y>`, `SHOOT <X> WITH <Y>`, `POINT <X> AT <Y>`) are parsed cleanly into direct/indirect objects and routed to their semantic handlers without requiring the player to guess narrow 1982 verb pairs.
  - Action chips must strictly facilitate exploration (`LOOK`, `GET`, `READ`, `OPEN`, `PULL`) and life-or-death reactions (`SHOOT WEREWOLF`, `WAVE CROSS`), never pre-baking puzzle solutions (no `SAY IJNID`, `POUR ACID`, `FEED FROG`, `RELEASE MICE`, `WAKE SABRINA`). Stump knocking only reveals after acid makes the carving legible.
- Game Over & Victory Overlay:
  - Explanatory overlay rendered over the background image inside `#scene` detailing the cause of game end: werewolf kill (distinguishing between shooting with an empty pistol vs general ambush), vampire bite, sunrise/timeout, or sailing across the lake.
  - Victory scene displays dedicated graphic-novel artwork (`art/victory.webp` / `art/victory.jpg`) illustrating the hero sneaking away in peasant clothes from the King's castle courtyard under moonlight while plotting Sabrina's rescue from her father.
  - "Press any key to restart" is made literal: a global keydown listener and tap/click handlers on the overlay, restart button, and action chips immediately invoke `restart`.
- Synchronized Scene Loading & Image Preloader:
  - Prevent props or overlay items from rendering before the scene background is loaded: in `scene.js`, clear/hide the SVG overlay immediately on room transition, asynchronously load the candidate background image via `loadCandidate()`, and only reveal the SVG props, scene label, and background together once the image is ready.
  - Proactive preloading: `preloadSurroundings()` preloads adjacent rooms connected by exits, while `preloadAllRooms()` runs in idle batches to cache room artwork in advance, eliminating pop-in on web/GitHub Pages.
- Final Sequence Messaging & Character Conversation:
  - Each step of the three-part waking ritual gives clear, evocative confirmation: `WAVE ELIXIR` confirms the ingredients swirl vigorously and glow with warm magical energy; `POUR ELIXIR` confirms the energized elixir envelops Sabrina in a shimmering aura; `CLAP` awakens her.
  - Non-turn-consuming conversation (`TALK` / `SPEAK` / `SAY TO`): talking to awake Sabrina produces `"PRINCESS SABRINA SAYS, 'LET'S GET OUT OF HERE!'"`; talking while asleep explains she is in deep magical slumber. Contextual action chip `[💬 TALK TO SABRINA]` is offered whenever Sabrina is awake in the room or carried. Also supports flavorful dialogue for other world creatures (goblin, bullfrog, black cat, werewolf, vampire, alien statue).
- Flat Border Styling (No Overlapping Shadows):
  - Removed all outer drop shadows from `#stage`, `#scene`, and `#console` across all versions (`box-shadow: none;`). The image box no longer casts dark shadows over the text box, maximizing clarity and readability.
- Mobile Phone Playability (< 680px & Mobile Portrait):
  - Square Scene Image spans full screen width edge-to-edge (`width: min(100%, calc(100dvh - 180px)); aspect-ratio: 1 / 1; border-radius: 0;`), providing immersive, crisp artwork with enlarged touchable SVG props, flush against the screen bezels.
  - Floating mini-map HUD is hidden on mobile screens (accessible anytime via the MAP header button).
  - Text display (`#log`) occupies remaining vertical space (`flex: 1`, min-height 60px), with generous readability and scrolling.
  - Directional Arrow Pad is condensed into a sleek, 32px horizontal bar (`[◀ W] [▲ N] [▼ S] [▶ E] [⇡ UP] [⇣ DN]`) with dynamic exit illumination, saving 118px of vertical room.
  - Command input bar (`#row`) dynamically docks to the bottom of the console on mobile, staying above the keyboard when focused without triggering viewport auto-zoom (`font-size: 16px`).
- The Quest (1983):
  - In Applesoft memory dumps and `AMP 2.8` binary, 16-bit integer values are big-endian (MSB first, e.g. GIVAYF `$E2F2` convention).
  - `AMP 2.8` verb dispatch table is at `$968A` (offset 1272 in body), 60 big-endian 16-bit words corresponding 1:1 to the 60 verb words.
  - `AMP 2.8` item table is at `$9909` (offset 1911 in body), 80 bytes mapping each noun word to item ID 1..38.
  - Text files `T1`..`T7` are delimited by single `$00` (NUL) bytes totaling 187 messages; cumulative boundaries in `B%` are `[0, 25, 51, 69, 92, 143, 167, 187]` with `B%(0)=0` (since `QB` reads `I = 1 TO 7`).
  - `USR` has two modes in `AMP 2.8`: numeric (`USR(...)H` and `USR(...)L` for 16-bit high/low byte extraction) and string (`USR("pat1/pat2")str, start` for multi-alternative substring search).
- Preact Architecture (`transylvania/`):
  - Replaces old imperative DOM manipulation (`document.getElementById`, `createElement`, `replaceChildren`, `classList.toggle`, `syncRowPlacement` DOM reparenting) with declarative Preact functional components and hooks (`useGame`, `useResponsive`).
  - Modular component hierarchy: `<App>` -> `<Stage>` (`<Scene>`, `<SceneOverlay>`, `<MiniMap>`) + `<Console>` (`<ConsoleHeader>`, `<Log>`, `<ActionChips>`, `<TouchDeck>`, `<CommandRow>`) + `<MapDrawer>`.
  - Clean reactive state for command execution, dynamic exit lighting on D-Pad, contextual action chips, audio synthesis via WebAudio, visual feedback (jolt/flash), and interactive exploration cartography with room inspection.

## Patterns That Don't Work
- Matching nouns only against object names: fails for scenery (trees, wall, stump) and misses alias chains in `noun_map_N`.
- Including "move" under `go` verbs: masks verb 41 (`MOVE`/`PRY` at 7800).
- Reading 16-bit integers in Applesoft dumps or `AMP 2.8` tables as little-endian: corrupts line numbers and array indices.
- Splitting `The Quest` text files on `\x8d\x00`: introduces off-by-one mismatches; the actual delimiter is purely `\x00`.


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

