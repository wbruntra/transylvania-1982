// Scene art: one image per room, with a coloured gradient standing in wherever
// artwork does not exist yet. Swap the body of `show` for generated images or a
// Three.js canvas without touching the engine.

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
 * @param {HTMLElement} container
 * @param {HTMLElement} label
 */
export function createScene(container, label) {
  const image = document.createElement("img");
  image.className = "scene-art";
  image.alt = "";
  container.prepend(image);

  /** @param {import("../data/gameData.js").RawRoom} room */
  function paintPlaceholder(room) {
    image.style.display = "none";
    const [background, highlight] = PALETTE_BY_ROOM_TYPE[room.type] ?? DEFAULT_PALETTE;
    container.style.background = `radial-gradient(circle at 50% 30%, ${highlight}, ${background} 70%)`;
  }

  return {
    /** @param {import("../data/gameData.js").RawRoom} room */
    show(room) {
      // Try each candidate in turn; fall back to the gradient when none load.
      const candidates = [`art/room-${room.id}.webp`, `art/room-${room.id}.png`];
      container.style.background = "#000";
      image.style.display = "block";
      image.onerror = () => {
        const next = candidates.shift();
        if (next) image.src = next;
        else paintPlaceholder(room);
      };
      image.src = candidates.shift();

      label.textContent = `ROOM ${room.id} · TYPE ${room.type} · ${room.desc.slice(0, 60)}…`;
    },
  };
}
