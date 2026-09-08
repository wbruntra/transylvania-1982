// Scene art: one image per room, with a coloured gradient standing in wherever
// artwork does not exist yet. Swap the body of `show` for generated images or a
// Three.js canvas without touching the engine.

import { updateSceneOverlay } from "./sceneOverlay.js";

/** Room type (RT%) -> [background, highlight] for the placeholder gradient. */
const PALETTE_BY_ROOM_TYPE = {
  1: ["#0d3311", "#7fd18b"],
  2: ["#1a1a2e", "#8b8bd1"],
  4: ["#331a0d", "#d1a67f"],
  5: ["#330d1f", "#d17fa6"],
  6: ["#222", "#aaa"],
  7: ["#101", "#5ff"],
  8: ["#000", "#333"],
};
const DEFAULT_PALETTE = PALETTE_BY_ROOM_TYPE[1];

/**
 * Rooms whose *background* changes with game state, not just their props.
 * These exist because the art was generated from each room's fixed
 * description text, so anything the description names is painted in
 * permanently -- a change the description never mentions (a door opening,
 * ground burning) has to be a different picture, not an overlay. See
 * SCENE_VARIATIONS.md for why these three and not others.
 *
 * @type {Record<number, (state: import("../engine/state.js").GameState) => string>}
 */
const BACKGROUND_VARIANTS = {
  // 4867: acid burns the faint carving on the stump's face into legible
  // "KNOCK HERE" lettering. Painted into the wood itself rather than an SVG
  // text overlay, same as the other permanent state changes below.
  1: (state) => (state.flags.SM ? "-runes" : ""),
  // The cave door (TRANS.bas:6310/6320) is painted shut in both rooms it
  // joins; DR is the same flag that actually unlocks and opens it.
  9: (state) => (state.flags.DR ? "-open" : ""),
  10: (state) => (state.flags.DR ? "-open" : ""),
  // 7745: the alien statue's destruction leaves a scorched 30-foot circle
  // (object 29) that no prop overlay could cover convincingly.
  4: (state) => (state.objectLoc[2] === -1 ? "-burnt" : ""),
  // The vines (object 14) hide a sarcophagus (15) that PULL VINES reveals;
  // PUSH BUTTON then blasts its lid off, leaving the sleeping damsel (16)
  // lying inside. Once she wakes (38) she's standing beside the player, not
  // lying in the coffin, so the coffin reads as empty again from then on --
  // same picture as once she's carried off entirely. Four backgrounds, not
  // overlays -- see the room-37 set in SCENE_VARIATIONS.md.
  37: (state) => {
    if (state.objectLoc[16] === 37) return "-open"; // sleeping Sabrina still in the coffin
    if (state.objectLoc[15] === 37) return "-sarcophagus";
    // The vines (object 14) never actually leave room 37 -- neither
    // revealSarcophagus() nor anything downstream relocates them, same as
    // the original BASIC (TRANS.bas:300 only ever adds the sarcophagus, it
    // never clears the vines). So "vines still in the room" can't be used
    // to detect "nothing has happened yet"; object 38's untouched -1
    // (GONE) start value is the only reliable signal for that.
    if (state.objectLoc[38] === -1) return ""; // still vine-covered
    return "-empty"; // awake and standing, or carried off -- coffin is empty either way
  },
};

const ART_MODE_KEY = "transylvania-art-mode";

/**
 * The art paths to try, in order, for a room in the current state. A pure
 * function so the state -> art mapping is testable without a DOM.
 * @param {import("../data/gameData.js").RawRoom} room
 * @param {import("../engine/state.js").GameState} [state]
 * @param {"enhanced" | "classic"} [mode]
 * @returns {string[]}
 */
export function artCandidates(room, state, mode = "enhanced") {
  if (state?.isGameOver && (state?.gameOverReason === "win" || (!state?.isDead && state?.objectLoc?.[38] === -2))) {
    return ["art/victory.webp", "art/victory.jpg", "art/victory.png"];
  }
  const variant = state ? BACKGROUND_VARIANTS[room.id]?.(state) ?? "" : "";
  const enhanced = [`art/room-${room.id}${variant}.webp`, `art/room-${room.id}.webp`, `art/room-${room.id}.png`];
  // Classic art has no state variants (it's a direct render of the 1982
  // vector program for the room, R1..R38) and no room 32 (a blank stub in
  // the original -- see PORTING.md). Missing ones fall through to enhanced.
  if (mode === "classic") return [`art/classic/room-${room.id}.webp`, ...enhanced];
  return enhanced;
}

const preloadedUrls = new Set();

/** Preloads an image into browser cache */
export function preloadImage(url) {
  if (!url || preloadedUrls.has(url)) return;
  preloadedUrls.add(url);
  if (typeof Image !== "undefined") {
    const img = new Image();
    img.src = url;
  }
}

/** Preloads the art for a given room */
export function preloadRoomArt(world, roomId, state, mode) {
  if (!world || !roomId) return;
  try {
    const room = typeof roomId === "number" ? world.room(roomId) : null;
    if (room) {
      const candidates = artCandidates(room, state, mode);
      if (candidates[0]) preloadImage(candidates[0]);
    } else if (roomId === "victory") {
      preloadImage("art/victory.webp");
    }
  } catch {}
}

/** Preloads all adjacent rooms connected by exits */
export function preloadSurroundings(world, currentRoomId, state, mode) {
  if (!world || !currentRoomId) return;
  try {
    const room = world.room(currentRoomId);
    if (!room || !room.exits) return;
    for (const destId of Object.values(room.exits)) {
      if (destId > 0) {
        preloadRoomArt(world, destId, state, mode);
      }
    }
  } catch {}
}

/** Background idle preloader for all game rooms */
export function preloadAllRooms(world, mode) {
  if (!world || !world.rooms) return;
  preloadImage("art/victory.webp");
  const roomIds = [...world.rooms.keys()];
  let index = 0;
  function step() {
    const slice = roomIds.slice(index, index + 4);
    index += 4;
    for (const id of slice) {
      preloadRoomArt(world, id, null, mode);
    }
    if (index < roomIds.length) {
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(step, { timeout: 2000 });
      } else {
        setTimeout(step, 200);
      }
    }
  }
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(step, { timeout: 1500 });
  } else {
    setTimeout(step, 300);
  }
}

/** Loads an image candidate asynchronously and resolves once decoded/ready */
function loadCandidate(url) {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined") {
      resolve(url);
      return;
    }
    const img = new Image();
    img.onload = () => {
      preloadedUrls.add(url);
      resolve(url);
    };
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
    if (img.complete && img.naturalWidth !== 0) {
      preloadedUrls.add(url);
      resolve(url);
    }
  });
}

/**
 * @param {HTMLElement} container
 * @param {HTMLElement} label
 * @param {SVGSVGElement} [overlaySvg]
 * @param {(action: string) => void} [onAction]
 */
export function createScene(container, label, overlaySvg, onAction) {
  const image = document.createElement("img");
  image.className = "scene-art";
  image.alt = "";
  container.prepend(image);

  const backdrop = document.getElementById("sceneBackdrop");

  let mode = /** @type {"enhanced" | "classic"} */ (
    (() => {
      try {
        return localStorage.getItem(ART_MODE_KEY) === "classic" ? "classic" : "enhanced";
      } catch {
        return "enhanced";
      }
    })()
  );
  /** @type {{room: import("../data/gameData.js").RawRoom, state?: import("../engine/state.js").GameState, world?: unknown} | null} */
  let lastShown = null;
  let currentShowId = 0;

  /** @param {import("../data/gameData.js").RawRoom} room */
  function paintPlaceholder(room) {
    image.style.display = "none";
    const [background, highlight] = PALETTE_BY_ROOM_TYPE[room.type] ?? DEFAULT_PALETTE;
    container.style.background = `radial-gradient(circle at 50% 30%, ${highlight}, ${background} 70%)`;
    if (backdrop) {
      backdrop.style.backgroundImage = "none";
      backdrop.style.background = `radial-gradient(circle at 50% 50%, ${highlight}, ${background} 80%)`;
      backdrop.style.opacity = "0.35";
    }
  }

  return {
    /**
     * @param {import("../data/gameData.js").RawRoom} room
     * @param {import("../engine/state.js").GameState} [state]
     * @param {ReturnType<typeof import("../engine/world.js").createWorld>} [world]
     */
    show(room, state, world) {
      lastShown = { room, state, world };
      const showId = ++currentShowId;

      // Hide and clear SVG overlay immediately so old or premature props NEVER display
      // before the new background image is actually loaded and ready!
      if (overlaySvg) {
        overlaySvg.innerHTML = "";
        overlaySvg.style.visibility = "hidden";
      }

      const candidates = artCandidates(room, state, mode);

      async function resolveAndDisplay() {
        let loadedUrl = null;

        for (const candidate of candidates) {
          try {
            await loadCandidate(candidate);
            loadedUrl = candidate;
            break;
          } catch {
            // Try next candidate
          }
        }

        // If another show() was requested while loading, discard this stale response
        if (showId !== currentShowId) return;

        if (loadedUrl) {
          image.src = loadedUrl;
          image.style.display = "block";
          container.style.background = "#000";
          if (backdrop) {
            backdrop.style.backgroundImage = `url("${loadedUrl}")`;
            backdrop.style.opacity = "0.45";
          }
        } else {
          paintPlaceholder(room);
        }

        // Now that the background image is loaded and ready, render the SVG props
        if (overlaySvg && state && world) {
          if (
            state.isGameOver &&
            (state.gameOverReason === "win" || (!state.isDead && state.objectLoc?.[38] === -2))
          ) {
            overlaySvg.innerHTML = "";
          } else {
            updateSceneOverlay(overlaySvg, {
              roomId: room.id,
              state,
              world,
              onAction,
            });
          }
          overlaySvg.style.visibility = "visible";
        }

        // Update scene label in unison
        if (state?.isGameOver) {
          label.textContent =
            state.gameOverReason === "win" || (!state.isDead && state.objectLoc?.[38] === -2)
              ? "VICTORY · KING'S CASTLE"
              : `GAME OVER · ROOM ${room.id}`;
        } else {
          label.textContent = `ROOM ${room.id} · TYPE ${room.type}`;
        }

        // Proactively preload adjacent surrounding rooms
        if (world) {
          preloadSurroundings(world, room.id, state, mode);
        }
      }

      resolveAndDisplay();
    },

    /** @returns {"enhanced" | "classic"} */
    getArtMode() {
      return mode;
    },

    /** Toggles between the AI-illustrated art and the decoded 1982 vector renders, redrawing the current room. */
    toggleArtMode() {
      mode = mode === "classic" ? "enhanced" : "classic";
      try {
        localStorage.setItem(ART_MODE_KEY, mode);
      } catch {
        // Private browsing / storage disabled: the toggle just won't persist.
      }
      if (lastShown) this.show(lastShown.room, lastShown.state, lastShown.world);
      return mode;
    },
  };
}
