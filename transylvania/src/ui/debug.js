// TEMPORARY: developer commands for reviewing scene art and the map.
//
// Deliberately confined to one file at the UI layer, and intercepted before the
// engine ever sees the input, so the engine, parser and command registry stay
// clean. To remove: delete this file and the three lines in main.js that
// reference it.
//
// All debug commands start with "/" -- no game verb can collide with that.
//
//   /room 12     jump to room 12
//   /next        jump to the next room by id (wraps)
//   /prev        jump to the previous room by id (wraps)
//   /rooms       list every room, its type, and whether it has art
//   /art         report whether the current room's art loaded
//   /help        list these
//
// The current room is mirrored into the URL hash (#room-12), so a reload lands
// you back where you were and a link can point at a specific room.

const COMMANDS = ["/room <id>", "/next", "/prev", "/rooms", "/art", "/help"];

/**
 * @param {object} options
 * @param {ReturnType<typeof import("../engine/engine.js").createEngine>} options.engine
 * @param {(roomId: number) => void} options.onJump  Re-render after a jump.
 */
export function createDebug({ engine, onJump }) {
  const roomIds = [...engine.world.rooms.keys()].sort((a, b) => a - b);

  function jump(roomId) {
    if (!engine.world.rooms.has(roomId)) {
      return [`DEBUG: no room ${roomId} (valid: ${roomIds[0]}-${roomIds.at(-1)})`];
    }
    engine.state.room = roomId;
    // replaceState rather than assigning location.hash: no history spam while
    // stepping through 38 rooms.
    history.replaceState(null, "", `#room-${roomId}`);
    onJump(roomId);
    const room = engine.world.room(roomId);
    return [`DEBUG: jumped to room ${roomId} (type ${room.type})`, room.desc];
  }

  function step(offset) {
    const index = roomIds.indexOf(engine.state.room);
    const next = roomIds[(index + offset + roomIds.length) % roomIds.length];
    return jump(next);
  }

  /** Does art/room-<id>.webp exist? Resolved once, then cached. */
  const artCache = new Map();
  async function hasArt(roomId) {
    if (!artCache.has(roomId)) {
      artCache.set(
        roomId,
        fetch(`art/room-${roomId}.webp`, { method: "HEAD" })
          .then((response) => response.ok)
          .catch(() => false),
      );
    }
    return artCache.get(roomId);
  }

  return {
    /** The room named by the URL hash at startup, if any. */
    initialRoom() {
      const match = /^#room-(\d+)$/.exec(location.hash);
      const roomId = match ? Number(match[1]) : null;
      return roomId !== null && engine.world.rooms.has(roomId) ? roomId : null;
    },

    /**
     * @param {string} input
     * @returns {string[] | Promise<string[]> | null}  null = not a debug command.
     */
    handle(input) {
      const text = input.trim().toLowerCase();
      if (!text.startsWith("/")) return null;

      const [command, argument] = text.split(/\s+/);
      switch (command) {
        case "/room":
          return jump(Number(argument));
        case "/next":
          return step(1);
        case "/prev":
          return step(-1);
        case "/art":
          return hasArt(engine.state.room).then((found) => [
            `DEBUG: art/room-${engine.state.room}.webp ${found ? "found" : "MISSING (showing gradient)"}`,
          ]);
        case "/rooms":
          return Promise.all(roomIds.map(hasArt)).then((found) =>
            roomIds.map((roomId, index) => {
              const room = engine.world.room(roomId);
              const mark = found[index] ? "*" : " ";
              const here = roomId === engine.state.room ? ">" : " ";
              return `${here}${mark} ${String(roomId).padStart(2)} t${room.type} ${room.desc.slice(8, 52)}`;
            }),
          );
        case "/help":
          return ["DEBUG COMMANDS:", ...COMMANDS.map((entry) => `  ${entry}`), "  (* = has art)"];
        default:
          return [`DEBUG: unknown command ${command}. Try /help`];
      }
    },
  };
}
