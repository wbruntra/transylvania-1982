// The terminal: transcript, prompt, illuminated D-pad, and touch-first action chips.
// It prints what the engine hands back, illuminates available paths,
// and presents contextual action chips for effortless play on iPad and touch screens.

import { isCarried, isObjectTakeable, getObjectName } from "../engine/state.js";
import { objectsInRoom } from "../engine/world.js";

/**
 * Computes contextual action chips for the current room state.
 * @param {import("../data/gameData.js").RawRoom} room
 * @param {import("../engine/state.js").GameState} state
 * @param {ReturnType<typeof import("../engine/world.js").createWorld>} world
 * @returns {Array<{cmd: string, label: string, icon?: string, danger?: boolean}>}
 */
export function computeActionChips(room, state, world) {
  if (!room || !state || !world) return [];
  /** @type {Array<{cmd: string, label: string, icon?: string, danger?: boolean}>} */
  const chips = [];
  const roomId = room.id;

  // 1. Dynamic threats in room
  // Werewolf (object 34)
  if (state.objectLoc[34] === roomId && !state.flags?.WF) {
    chips.push({ cmd: "shoot werewolf", label: "SHOOT WEREWOLF", icon: "🐺", danger: true });
  }
  // Vampire (object 39)
  if (state.objectLoc[39] === roomId && !state.flags?.VR) {
    if (isCarried(state, 6)) {
      chips.push({ cmd: "wave cross", label: "WAVE CROSS", icon: "✝️", danger: true });
    }
  }
  // Mice (object 20)
  if (state.objectLoc[20] === roomId) {
    if (isCarried(state, 25)) {
      chips.push({ cmd: "wave broom", label: "WAVE BROOM", icon: "🧹" });
    }
  }

  // 2. Objects lying in the room
  const here = objectsInRoom(world, state, roomId);
  for (const obj of here) {
    if (isObjectTakeable(world, state, obj.id)) {
      // In Room 7, the Black Cat guards the acid (1) and broom (25)
      if (roomId === 7 && state.objectLoc[24] === 7 && (obj.id === 1 || obj.id === 25)) {
        continue;
      }
      const name = getObjectName(world, state, obj.id);
      let icon = "📦";
      let shortCmd = `get ${name.toLowerCase().replace(/\.$/, "")}`;
      if (obj.id === 18) { icon = "📜"; shortCmd = "get note"; }
      else if (obj.id === 20) { icon = "🐀"; shortCmd = "get mice"; }
      else if (obj.id === 32) { icon = "🧄"; shortCmd = "get garlic"; }
      else if (obj.id === 3) { icon = "🧥"; shortCmd = "get cloak"; }
      else if (obj.id === 26) { icon = "🗝️"; shortCmd = "get pick"; }
      else if (obj.id === 17) { icon = "🔫"; shortCmd = "get pistol"; }
      else if (obj.id === 22) { icon = "⚪"; shortCmd = "get bullet"; }
      else if (obj.id === 6) { icon = "✝️"; shortCmd = "get cross"; }
      else if (obj.id === 31) { icon = "🪰"; shortCmd = "get flypaper"; }
      else if (obj.id === 11) { icon = "🔑"; shortCmd = "get key"; }
      else if (obj.id === 36) { icon = "🧪"; shortCmd = "get elixir"; }
      else if (obj.id === 25) { icon = "🧹"; shortCmd = "get broom"; }
      else if (obj.id === 1) { icon = "🧪"; shortCmd = "get acid"; }
      else if (obj.id === 9) { icon = "🍞"; shortCmd = "get bread"; }
      else if (obj.id === 5) { icon = "💍"; shortCmd = "get ring"; }
      chips.push({ cmd: shortCmd, label: `GET ${name.replace(/\.$/, "").toUpperCase()}`, icon });
    }
  }

  // 3. Room-specific puzzle actions
  if (roomId === 1) { // Stump
    chips.push({ cmd: "look stump", label: "LOOK STUMP", icon: "🪵" });
    chips.push({ cmd: "go stump", label: "ENTER STUMP", icon: "🚪" });
    chips.push({ cmd: "knock stump", label: "KNOCK STUMP", icon: "🚪" });
    if (isCarried(state, 1)) { // acid
      chips.push({ cmd: "pour acid", label: "POUR ACID", icon: "🧪" });
    }
  } else if (roomId === 4) { // Clearing / Alien statue
    chips.push({ cmd: "look statue", label: "LOOK STATUE", icon: "🛸" });
  } else if (roomId === 5) { // Grate
    if (!state.flags?.GT && state.objectLoc[13] !== 5) {
      chips.push({ cmd: "open grate", label: "OPEN GRATE", icon: "🕳️" });
    } else {
      chips.push({ cmd: "down", label: "CLIMB DOWN", icon: "🕳️" });
    }
  } else if (roomId === 9 || roomId === 10) { // Cave Door & Flies
    if (roomId === 9 && state.objectLoc[7] === 9) {
      if (isCarried(state, 31) || state.objectLoc[31] === 9) {
        chips.push({ cmd: "catch flies", label: "CATCH FLIES", icon: "🪰" });
        chips.push({ cmd: "use flypaper", label: "USE FLYPAPER", icon: "🪰" });
      } else {
        chips.push({ cmd: "catch flies", label: "CATCH FLIES", icon: "🪰" });
      }
    }
    if (roomId === 9 && state.objectLoc[31] === 9) {
      chips.push({ cmd: "get flypaper", label: "GET FLYPAPER", icon: "🪰" });
    }
    if (!state.flags?.DR) {
      if (isCarried(state, 11)) {
        chips.push({ cmd: "unlock door", label: "UNLOCK DOOR", icon: "🗝️" });
      }
      chips.push({ cmd: "open door", label: "OPEN DOOR", icon: "🚪" });
    } else {
      chips.push({ cmd: "go door", label: "GO DOOR", icon: "🚪" });
    }
  } else if (roomId === 7) { // Clay Hut (Cat Guard)
    if (state.objectLoc[24] === 7) {
      if (isCarried(state, 20)) {
        chips.push({ cmd: "drop mice", label: "RELEASE MICE", icon: "🐀" });
      } else {
        chips.push({ cmd: "look cat", label: "LOOK CAT", icon: "🐱" });
      }
    }
  } else if (roomId === 16) { // Bullfrog
    chips.push({ cmd: "feed frog", label: "FEED FROG", icon: "🐸" });
  } else if (roomId === 21) { // Cabin
    chips.push({ cmd: "pull antlers", label: "PULL ANTLERS", icon: "🦌" });
  } else if (roomId === 22) { // Annex
    chips.push({ cmd: "pull wall", label: "REVOLVE WALL", icon: "🔄" });
  } else if (roomId === 24 || roomId === 38) { // Coffin in cemetery
    chips.push({ cmd: "open coffin", label: "OPEN COFFIN", icon: "⚰️" });
  } else if (roomId === 25 || roomId === 33) { // Lake
    chips.push({ cmd: "board boat", label: "BOARD BOAT", icon: "⛵" });
    chips.push({ cmd: "sail boat", label: "SAIL BOAT", icon: "⛵" });
  } else if (roomId === 26) { // Goblin
    chips.push({ cmd: "say ijnid", label: "SAY IJNID", icon: "🗣️" });
  } else if (roomId === 37) { // Sabrina Tower
    if (!state.flags?.SH) {
      chips.push({ cmd: "cut vines", label: "CUT VINES", icon: "🌿" });
    } else if (!state.flags?.PO) {
      chips.push({ cmd: "open coffin", label: "OPEN COFFIN", icon: "⚰️" });
    } else {
      chips.push({ cmd: "wake damsel", label: "WAKE SABRINA", icon: "👸" });
    }
  }

  // 4. Carried item usable actions
  if (isCarried(state, 18)) { // Note
    chips.push({ cmd: "read note", label: "READ NOTE", icon: "📖" });
  }
  if (isCarried(state, 17) && isCarried(state, 22)) { // Pistol + Bullet
    chips.push({ cmd: "load pistol", label: "LOAD PISTOL", icon: "⚙️" });
  }
  if (isCarried(state, 3)) { // Cloak
    chips.push({ cmd: "wear cloak", label: "WEAR CLOAK", icon: "🧥" });
  }
  if (isCarried(state, 36)) { // Elixir
    chips.push({ cmd: "drink elixir", label: "DRINK ELIXIR", icon: "🧪" });
  }
  if (isCarried(state, 25) && state.objectLoc[24] !== roomId) {
    chips.push({ cmd: "ride broom", label: "RIDE BROOM", icon: "🧹" });
  }

  // Always offer standard quick look and inventory if room is quiet
  if (chips.length < 3) {
    chips.push({ cmd: "look", label: "LOOK AROUND", icon: "👁️" });
    chips.push({ cmd: "inventory", label: "INVENTORY", icon: "🎒" });
  }

  // Deduplicate commands
  const seen = new Set();
  /** @type {typeof chips} */
  const uniqueChips = [];
  for (const chip of chips) {
    if (!seen.has(chip.cmd)) {
      seen.add(chip.cmd);
      uniqueChips.push(chip);
    }
  }

  return uniqueChips;
}

/**
 * @param {{onCommand: (input: string) => void}} handlers
 */
export function createView({ onCommand }) {
  const log = /** @type {HTMLElement} */ (document.getElementById("log"));
  const input = /** @type {HTMLInputElement} */ (document.getElementById("cmd"));
  const submit = /** @type {HTMLButtonElement} */ (document.getElementById("go"));
  const actionChipsEl = /** @type {HTMLElement | null} */ (document.getElementById("actionChips"));
  const dpadButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll(".dpad-btn"));
  const quickButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll(".quick-btn"));
  const legacyDirs = /** @type {HTMLElement | null} */ (document.getElementById("dirs"));

  function submitInput() {
    const value = input.value;
    input.value = "";
    input.focus();
    onCommand(value);
  }

  if (submit) submit.addEventListener("click", submitInput);
  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submitInput();
    });
  }

  // Wire D-Pad buttons
  dpadButtons.forEach((btn) => {
    const dir = btn.dataset.dir;
    const cmd = btn.dataset.cmd;
    btn.addEventListener("click", () => {
      if (dir) onCommand(dir);
      else if (cmd) onCommand(cmd);
    });
  });

  // Wire Quick Action buttons
  quickButtons.forEach((btn) => {
    const cmd = btn.dataset.cmd;
    if (cmd) {
      btn.addEventListener("click", () => onCommand(cmd));
    }
  });

  // Fallback for legacy #dirs if present
  if (legacyDirs && legacyDirs.children.length === 0) {
    const shortcuts = ["N", "S", "W", "E", "U", "D", "LOOK", "MAP", "INVENTORY"];
    for (const shortcut of shortcuts) {
      const button = document.createElement("button");
      button.textContent = shortcut;
      button.addEventListener("click", () => onCommand(shortcut.toLowerCase()));
      legacyDirs.append(button);
    }
  }

  /**
   * Updates exit illumination on the D-Pad.
   * @param {import("../data/gameData.js").RawRoom} room
   * @param {import("../engine/state.js").GameState} state
   */
  function updateExits(room, state) {
    if (!room) return;
    const exits = room.exits || {};
    const exitMap = {
      n: exits.N > 0,
      s: exits.S > 0,
      w: exits.W > 0,
      e: exits.E > 0,
      u: exits.U > 0,
      d: exits.D > 0 || (room.id === 5 && Boolean(state?.flags?.GT)),
    };

    dpadButtons.forEach((btn) => {
      const dir = btn.dataset.dir;
      if (!dir || !(dir in exitMap)) return;
      const isActive = exitMap[/** @type {keyof typeof exitMap} */ (dir)];
      if (isActive) {
        btn.classList.add("active-exit");
        btn.classList.remove("disabled-exit");
        btn.setAttribute("aria-disabled", "false");
      } else {
        btn.classList.remove("active-exit");
        btn.classList.add("disabled-exit");
        btn.setAttribute("aria-disabled", "true");
      }
    });
  }

  /**
   * Updates contextual action chips.
   * @param {import("../data/gameData.js").RawRoom} room
   * @param {import("../engine/state.js").GameState} state
   * @param {ReturnType<typeof import("../engine/world.js").createWorld>} world
   */
  function updateChips(room, state, world) {
    if (!actionChipsEl) return;
    const chips = computeActionChips(room, state, world);
    actionChipsEl.replaceChildren(
      ...chips.map((chip) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `action-chip ${chip.danger ? "danger" : ""}`;
        btn.innerHTML = `${chip.icon ? `<span class="chip-icon">${chip.icon}</span>` : ""}<span class="chip-label">${chip.label}</span>`;
        btn.addEventListener("click", () => {
          onCommand(chip.cmd);
        });
        return btn;
      })
    );
  }

  return {
    /** @param {string[]} lines */
    print(lines) {
      if (!log || lines.length === 0) return;
      log.textContent += `${lines.join("\n")}\n`;
      log.scrollTop = log.scrollHeight;
    },

    /** @param {string} input */
    echo(input) {
      this.print([`> ${input}`]);
    },

    /**
     * Wipes the transcript. The log shows one room at a time -- the original
     * did the same, printing into a cleared text window rather than scrolling
     * (TRANS.bas:8000 does HOME before describing a room).
     */
    clear() {
      if (!log) return;
      log.textContent = "";
      log.scrollTop = 0;
    },

    focus() {
      if (input) input.focus();
    },

    /**
     * Updates illuminated exits and contextual action chips.
     * @param {{
     *   room: import("../data/gameData.js").RawRoom,
     *   state: import("../engine/state.js").GameState,
     *   world: ReturnType<typeof import("../engine/world.js").createWorld>
     * }} context
     */
    update({ room, state, world }) {
      updateExits(room, state);
      updateChips(room, state, world);
    },
  };
}
