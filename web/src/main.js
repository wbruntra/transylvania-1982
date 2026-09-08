// Bootstrap: load the data, build the engine, wire it to the page.
// The only file that knows about both halves.

import { fetchGameData } from "./data/gameData.js";
import { createEngine } from "./engine/engine.js";
import { getGameOverInfo } from "./engine/gameOver.js";
import { createDebug } from "./ui/debug.js"; // TEMPORARY -- see ui/debug.js
import { isDebugInventoryEnabled, toggleDebugInventory } from "./ui/debugMode.js";
import { createEffects } from "./ui/effects.js";
import { createGameOverOverlay } from "./ui/gameOverOverlay.js";
import { createMap } from "./ui/map.js";
import { createScene } from "./ui/scene.js";
import { createView } from "./ui/view.js";

async function main() {
  const data = await fetchGameData();
  const engine = createEngine(data, { randomEvents: true, debugInventory: isDebugInventoryEnabled() });

  let handleCommand = (input) => {};

  const scene = createScene(
    /** @type {HTMLElement} */ (document.getElementById("scene")),
    /** @type {HTMLElement} */ (document.getElementById("sceneLabel")),
    /** @type {SVGSVGElement} */ (document.getElementById("sceneOverlay")),
    (actionCmd) => handleCommand(actionCmd),
  );

  const effects = createEffects(
    /** @type {HTMLElement} */ (document.getElementById("scene")),
    /** @type {HTMLElement} */ (document.getElementById("log")),
  );

  const mapToggle = /** @type {HTMLButtonElement} */ (document.getElementById("mapToggle"));
  const artToggle = /** @type {HTMLButtonElement} */ (document.getElementById("artToggle"));
  const artToggleLabel = document.getElementById("artToggleLabel");

  function syncArtToggle() {
    if (!artToggle) return;
    const isClassic = scene.getArtMode() === "classic";
    artToggle.classList.toggle("active", isClassic);
    if (artToggleLabel) artToggleLabel.textContent = isClassic ? "1982" : "CLASSIC";
    artToggle.title = isClassic
      ? "Switch to illustrated graphics"
      : "Switch to 1982 Apple II graphics";
  }

  if (artToggle) {
    artToggle.addEventListener("click", () => {
      scene.toggleArtMode();
      syncArtToggle();
    });
    syncArtToggle();
  }

  const debugToggle = /** @type {HTMLButtonElement} */ (document.getElementById("debugToggle"));
  if (debugToggle) {
    debugToggle.classList.toggle("active", isDebugInventoryEnabled());
    debugToggle.addEventListener("click", () => {
      // The engine is already built with the old inventory baked in, and a
      // handful of other modules close over it too -- reloading is simpler
      // and more reliable than trying to retrofit the running game.
      toggleDebugInventory();
      location.reload();
    });
  }

  const map = createMap({
    miniMapElement: document.getElementById("miniMap"),
    miniMapViewport: document.getElementById("miniMapViewport"),
    miniMapBadge: document.getElementById("miniMapBadge"),
    drawerElement: document.getElementById("mapDrawer"),
    drawerBody: document.getElementById("mapDrawerBody"),
    drawerStats: document.getElementById("mapDrawerStats"),
    drawerClose: document.getElementById("mapDrawerClose"),
    drawerBackdrop: document.getElementById("mapDrawerBackdrop"),
  });

  if (mapToggle) {
    mapToggle.addEventListener("click", () => {
      map.toggle();
    });
  }

  function updateMap() {
    map.update({
      currentRoom: engine.state.room,
      visitedRooms: engine.getVisitedRooms(),
      world: engine.world,
      state: engine.state,
    });
  }

  const gameOverOverlay = createGameOverOverlay({
    overlayElement: /** @type {HTMLElement} */ (document.getElementById("gameOverOverlay")),
    onRestart: () => handleCommand("restart"),
  });

  let view;

  const render = () => {
    const currentRoom = engine.world.room(engine.state.room);
    scene.show(currentRoom, engine.state, engine.world);
    updateMap();
    if (view) {
      view.update({ room: currentRoom, state: engine.state, world: engine.world });
    }
    if (engine.isGameOver()) {
      const info = getGameOverInfo(engine.state);
      gameOverOverlay.show(info);
    } else {
      gameOverOverlay.hide();
    }
  };

  // TEMPORARY: "/" commands are handled here and never reach the engine.
  const debug = createDebug({ engine, onJump: render });

  // The transcript covers one room at a time: leaving a room clears it, so what
  // is on screen always belongs to where you are now. Exchanges *within* a room
  // still accumulate, so "GET NOTE" -> "OK." stays readable.
  let shownRoom = engine.state.room;
  function clearOnRoomChange() {
    if (engine.state.room === shownRoom) return;
    shownRoom = engine.state.room;
    view.clear();
  }

  const turnBadge = document.getElementById("turnBadge");

  function updateMeta() {
    if (turnBadge) turnBadge.textContent = `TURN ${engine.state.turns}`;
  }

  handleCommand = function(input) {
    if (engine.isGameOver()) {
      input = "restart";
    }

    const trimmed = input.trim().toLowerCase();
    if (trimmed === "map" || trimmed === "m") {
      map.open();
    } else if (trimmed === "scene" || (trimmed === "close" && map.isOpen())) {
      map.close();
    }

    const debugOutput = debug.handle(input);
    if (debugOutput !== null) {
      Promise.resolve(debugOutput).then((lines) => {
        clearOnRoomChange();
        view.echo(input);
        view.print(lines);
        updateMeta();
        updateMap();
        render();
      });
      return;
    }

    // Typing counts as the user gesture browsers require before audio.
    effects.prime();

    const { echo, messages, events } = engine.execute(input);
    if (echo === null) return;
    clearOnRoomChange();
    view.echo(echo);
    view.print(messages);
    render();
    updateMeta();
    // Something happened TO the player (the eagle, a death): jolt and sound, so
    // a line of text scrolling past is not the only signal.
    if (events?.length) effects.play(events);
  };

  window.addEventListener("keydown", (event) => {
    if (!engine.isGameOver()) return;
    if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(event.key)) {
      return;
    }
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
    }
    handleCommand("restart");
  });

  view = createView({
    onCommand: handleCommand,
  });

  view.print(engine.start());
  updateMeta();
  updateMap();

  // TEMPORARY: honour #room-<id> so a reload returns to the room under review.
  const startRoom = debug.initialRoom();
  if (startRoom !== null) {
    engine.state.room = startRoom;
    clearOnRoomChange();
    view.print([`DEBUG: resumed at room ${startRoom}`, engine.world.room(startRoom).desc]);
  }

  render();
  view.focus();
}

main().catch((error) => {
  console.error(error);
  const log = document.getElementById("log");
  if (log) log.textContent += `\nFAILED TO START: ${error.message}\n`;
});
