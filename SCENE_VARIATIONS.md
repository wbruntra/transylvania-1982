# Visual Scene Variations & Dynamic States Catalog

This document catalogues every location in *Transylvania* (1982) where a player action or state transition alters the visual appearance of the scene. It specifies the underlying engine condition, before/after visual states, and the corresponding visual layer specifications (e.g., SVG overlays or asset layers).

---

## Summary Table

| Room | Name | Triggering Action | Engine Condition | Visual Change (Before $\rightarrow$ After) | Overlay Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Room 1** | Ancient Stump | `POUR ACID` | `state.flags.SM === 1` | Mossy stump $\rightarrow$ Acid-burned wood revealing glowing etched runes: **"KNOCK HERE"** | Etched glowing rune glyphs |
| **Room 3** | Dark Forest | `GET NOTE` / `DROP NOTE` | `state.objectLoc[18] === 3` | Ground has crumpled parchment note $\rightarrow$ Ground is bare | Folded parchment note sprite |
| **Room 4** | Forest Clearing | `WAVE WAND/RING` | `state.objectLoc[2] === -1` | Gargoyle alien statue $\rightarrow$ Annihilated into smoking base & embers | Smoking cracked pedestal |
| **Room 4** | Forest Clearing | 20 turns after alien event | `state.objectLoc[28] === 4` | Bare clearing $\rightarrow$ Crashed, pulsating extraterrestrial saucer | Glowing cyan saucer with radial aura |
| **Room 5** | Cemetery | `TAKE CROSS` / `DROP CROSS` | `state.objectLoc[6] === 5` | Weathered wooden cross in soil $\rightarrow$ Empty indentation | Weathered timber cross |
| **Room 5** | Cemetery | `MOVE GRAVESTONE` | `state.objectLoc[13] === 5` | Solid tombstone $\rightarrow$ Tombstone shifted, exposing heavy iron grate | Heavy iron grate in earth |
| **Room 5** | Cemetery | `UNLOCK GRATE` | `state.flags.GT === 1` | Padlocked grate $\rightarrow$ Open grate with ladder descending into pitch black | Open grate & dark shaft |
| **Room 7** | Clay Hut Interior | `TAKE ACID` | `state.objectLoc[1] === 7` | Vial of weak bubbling acid on shelf $\rightarrow$ Empty shelf slot | Green chemical vial |
| **Room 7** | Clay Hut Interior | `TAKE BROOM` | `state.objectLoc[25] === 7` | Witch's broom propped against clay wall $\rightarrow$ Empty corner | Straw broomstick |
| **Room 7** | Clay Hut Interior | Black cat presence | `state.objectLoc[24] === 7` | Black cat glaring from wooden stool $\rightarrow$ Cat gone (if moved) | Black cat with yellow slit eyes |
| **Room 9** | Dark Cave | `CATCH FLIES` | `state.objectLoc[7] === 9` | Cloud of buzzing flies in cavern air $\rightarrow$ Air clear | Animated swarm particles |
| **Room 9 & 10** | Caverns | `UNLOCK DOOR` / `PICK DOOR` | `state.flags.DR === 1` | Massive locked iron door $\rightarrow$ Door swung ajar into crystal glow | Arched iron door (closed vs open) |
| **Room 11** | Secret Chamber | `TAKE ELIXIR` | `state.objectLoc[36] === 11` | Luminescent blue potion bottle on altar $\rightarrow$ Empty altar | Glowing sapphire elixir bottle |
| **Room 16** | Lake Shore | `FEED FLIES` (to frog) | `state.objectLoc[8] === 16` | Plump bullfrog perched on shoreline rock $\rightarrow$ Frog gone (water ripples) | Bullfrog on rock / water ripples |
| **Room 16** | Lake Shore | Moored Boat | `state.objectLoc[30] === 16` | Small rowboat moored to wooden post at shoreline | Moored wooden rowboat |
| **Room 20** | Grim Shack | `TAKE GARLIC` | `state.objectLoc[32] === 20` | Braided garlic clove hanging on hook $\rightarrow$ Empty hook | Hanging braided garlic |
| **Room 21** | Log Cabin | `PULL ANTLERS` | Room transition $21 \leftrightarrow 22$ | Solid timber wall $\rightarrow$ Revolving panel spinning into secret room | Rotating secret passage seam |
| **Room 22** | Secret Annex | `TAKE CLOAK` | `state.objectLoc[3] === 22` | Celestial wizard's cloak with stars on peg $\rightarrow$ Empty peg | Velvet star cloak |
| **Room 22** | Secret Annex | `LOOK CLOAK` | `state.objectLoc[26] === 22` | Bare table/floor $\rightarrow$ Slender steel lockpick discovered | Gleaming steel lockpick |
| **Room 24** | Frame House | `TAKE BREAD` | `state.objectLoc[9] === 24` | Stale bread loaf on dining table $\rightarrow$ Empty table | Crusty bread loaf |
| **Room 25** | House Attic | `TAKE PISTOL` | `state.objectLoc[17] === 25` | Antique flintlock pistol on floorboards $\rightarrow$ Empty floor | Brass flintlock pistol |
| **Room 26** | Sandy Field | `SAY IJNID` | `state.objectLoc[10] === 26` (goblin) vs `state.objectLoc[11] === 26` (key) | Taunting goblin with key $\rightarrow$ Goblin fled; tiny gleaming key left on sand | Goblin figure $\rightarrow$ Golden key sparkle |
| **Room 27** | Castle Entrance | `SHOOT WEREWOLF` | `state.objectLoc[34] === 27` vs `flags.WF === 1` | Snarling werewolf blocking entrance $\rightarrow$ Collapsed old man $\rightarrow$ Pile of ash | Werewolf $\rightarrow$ Smoking ash pile |
| **Room 29** | East Parlor | `TAKE FLYPAPER` | `state.objectLoc[31] === 29` | Strip of amber flypaper ribbon hanging $\rightarrow$ Empty ribbon hook | Sticky flypaper ribbon |
| **Room 30** | Grand Chamber | `WAVE CROSS` | `state.objectLoc[39] === 30` vs `flags.VR === 1` | Vampire threatening player $\rightarrow$ Blinding holy light $\rightarrow$ Pile of burning embers | Vampire $\rightarrow$ Burning ember pile |
| **Room 35** | Royal Treasure | `OPEN COFFER` | `state.objectLoc[4] === 35` | Locked iron-banded treasure chest $\rightarrow$ Chest open with gold and shiny ring | Open treasure chest |
| **Room 35** | Royal Treasure | `TAKE RING` | `state.objectLoc[5] === 35` | Shiny gemstone ring inside open chest $\rightarrow$ Ring removed | Sparkle gemstone ring |
| **Room 37** | Moonlit Tower | `PULL VINES` | `state.objectLoc[14] === 37` vs `state.objectLoc[15] === 37` | Room choked by thick creeping vines $\rightarrow$ Vines cleared, revealing sarcophagus | Tangled vine curtain $\rightarrow$ Sarcophagus |
| **Room 37** | Moonlit Tower | `PUSH BUTTON` | `state.objectLoc[16] === 37` | Sealed sarcophagus $\rightarrow$ Lid blasted off; sleeping Princess Sabrina revealed | Sleeping Princess Sabrina |
| **Room 37** | Moonlit Tower | `WAVE` $\rightarrow$ `POUR` $\rightarrow$ `CLAP` | `state.objectLoc[38] === 37` | Sleeping Sabrina in trance $\rightarrow$ Sabrina awake, standing beside player | Wide Awake Princess Sabrina |
| **Room 38** | Inside Wagon | `OPEN COFFIN` | `state.objectLoc[19] === 38` | Closed pine coffin $\rightarrow$ Open coffin with rotting corpse, silver bullet, & mice | Open coffin, corpse & silver bullet |
| **Room 38** | Inside Wagon | `TAKE BULLET` | `state.objectLoc[22] === 38` | Silver bullet in coffin $\rightarrow$ Bullet taken | Silver bullet sprite |
| **Room 38** | Inside Wagon | `CLOSE COFFIN` | `state.objectLoc[21] === 38` | Open coffin $\rightarrow$ Closed wooden coffin | Closed pine coffin lid |

---

## Layered Architecture Implementation

The viewport `#scene` is a square 1:1 container (`1024×1024`).
Dynamic elements are mounted via an SVG overlay layer directly over the background raster art:

```html
<div id="scene">
  <!-- 1. Base Generated Background Art (1024x1024 webp) -->
  <img class="scene-art" src="art/room-1.webp" alt="Room Art" />

  <!-- 2. Dynamic Interactive Scene Overlay (1024x1024 viewBox) -->
  <svg id="sceneOverlay" class="scene-overlay" viewBox="0 0 1024 1024">
    <!-- Dynamic state groups rendered here -->
  </svg>

  <!-- 3. Ambient Room HUD Label -->
  <div class="label" id="sceneLabel">ROOM 1</div>
</div>
```

### Advantages of the SVG Layer Approach
1. **Pixel-Perfect Alignment:** The `viewBox="0 0 1024 1024"` matches the exact dimensions of the background art.
2. **State-Driven Reactivity:** On every room change or command execution, `scene.update(room, state, world)` instantly checks object locations and flags, rendering or removing visual elements.
3. **Player Interactivity:** Overlay items have tooltips, cursor hover effects, and click-to-interact handlers (e.g. clicking the note executes `GET NOTE`, clicking the coffin executes `OPEN COFFIN`).
4. **Iterative Asset Upgrade:** SVG vector components can easily be styled, textured, or swapped for transparent WebP cutouts later without altering game logic.

---

# Where an overlay is not enough: background variants

The catalogue above assumes every change can be drawn *on top of* the room art.
That holds for props, and it is how the original worked — `TRANS.bas:8000` loads
exactly one picture per room (`BLOADR<P>`) and `8070` composites object pictures
over it, so 1982 had no variant backgrounds at all.

It does not hold here, for one reason: **the art prompts were generated from each
room's static description text** (`tools/art-prompts.mjs` builds `subject` from
`room.desc`). That text is the text the game never changes — so anything the
description mentions is painted into the background permanently, in a 1024×1024
illustration far more detailed than the 280×192 vector art it replaces. Where the
description names something a player action later alters, the background and the
game state disagree, and no additive overlay can reconcile them.

Only six room descriptions name a physical feature at all:

| Room | Description names | Does it change? |
| --- | --- | --- |
| 1 | "ancient stump covered with faint writing" | **Yes** — acid makes the writing readable (`SM`) |
| 8 | "cave entrance shut by a rock slide" | No — "THE ROCK SLIDE IS IMPENETRABLE" (5770) |
| 9 | "a door mounted on the northern wall" | **Yes** — `DR` unlocks it, and you walk through it |
| 10 | "on a stalagmite rests a crystal ball" | No |
| 15 | "a sign hangs nearby" | No |
| 31 | "the cellar with a vault door" | No — the vault is the Pie-Man easter egg (6107) |

So the exposure is much smaller than the catalogue's 33 rows suggest. Ranked:

## 1. Room 9's door — a real variant, not an overlay (highest priority)

`public/art/room-9.webp` paints the door dead centre, shut, as the focal point of
the image: an octagonal iron-bound frame with its own perspective and rim
lighting. `UNLOCK DOOR` sets `DR` and `GO DOOR` then walks you through it, but
the picture shows it closed for the rest of the game.

An overlay cannot open it. It would have to *opaquely cover* the painted door
with an open-door sprite matching that exact octagon, viewing angle and palette —
at which point it is a second background, drawn worse. This one wants
`room-9-open.webp`, selected on `state.flags.DR`.

**Related, and arguably worse: room 10 has no door at all.** Its art is a
stalagmite and crystal ball in a closed cavern. You walk south through a door
from 9 and arrive somewhere with no way back visible, even though `LOOK DOOR`
answers in room 10 (1750) and `GO DOOR` returns you (6115). That is a continuity
bug in the art rather than a state variant, and it needs a regenerated
`room-10.webp` with the door in the near wall — at which point it needs the open
variant too.

## 2. Room 4's clearing after the fire (strong second)

The clearing art is bare, so the statue, the saucer and the smoking circle are
all legitimately overlays. But `7745` is not a prop swap:

> GREEN AND WHITE FLAMES BURN QUICKLY, **ENGULFING ALL THAT IS AROUND YOU** ...
> THERE IS A VIOLENT EXPLOSION.

and what it leaves behind is object 29, a **"30 FOOT CIRCLE OF SMOKING BRUSH"** —
a terrain change covering most of the frame. `room-4.webp` is full of lush green
and magenta undergrowth that should be burnt away. A scorched variant would carry
the moment; an overlay can only add smoke on top of healthy foliage.

Room 4 has four distinct states (statue → scorched → saucer → smoking circle),
which is more than any other room in the game.

## 3. Room 1's stump — overlay is fine

The art already carries carved runes on the stump face, deliberately drawn as
"abstract marks rather than letters". `SM` makes them readable, and lighting a
glow over marks that are already there is exactly what an overlay does well. No
variant needed.

## 4. Room 5's cemetery — overlay is fine

`MOVE GRAVESTONE` reveals the grate, but object 12 is never relocated in state —
only object 13 appears. The art is a field of many gravestones with an open
foreground path, so a grate drawn on the ground reads correctly without any
painted element having to move. `GT` then toggles the same overlay between shut
and open. No variant needed.

## Everything else is genuinely a prop

Every remaining mutation in the engine — verified by enumerating each
`placeObject` and flag assignment across `src/engine/` — moves a discrete object
against a background that does not depict it: the coffin and corpse in the wagon
(38), the coffer and ring in the treasure room (35), the vines, sarcophagus and
sleeping damsel in the tower (37), the goblin and key (26), the frog (16), the
cat, broom and acid in the hut (7), the vampire and werewolf anywhere in the
castle. The overlay layer is the right home for all of them.

## Done

Four backgrounds generated with `edit_image`, each starting from the current
webp (or, for room 10, the room-9 door as a style reference) so everything but
the one named change stayed pixel-for-pixel the same composition:

- `room-9-open.webp` — the cave door standing open, same crystals and walls
- `room-10.webp` — regenerated with a door matching room 9's exactly, fixing
  the continuity bug (originals confirm there never was a door here at all)
- `room-10-open.webp` — that door, open
- `room-4-burnt.webp` — the clearing's undergrowth scorched to ash and embers,
  trees at the frame's edge left intact, keyed on `objectLoc[2] === -1`

`src/ui/scene.js` picks the background with a small per-room table,
`BACKGROUND_VARIANTS`, exposed as the pure function `artCandidates(room, state)`
so the mapping is unit-tested (`test/scene.test.js`) without a DOM. Confirmed
live end-to-end over CDP: `UNLOCK DOOR` in room 9 swapped the art immediately,
`GO DOOR` carried the open state into room 10 and back.

Any future scene variant is the same shape: add one line to
`BACKGROUND_VARIANTS`, generate the art, done.
