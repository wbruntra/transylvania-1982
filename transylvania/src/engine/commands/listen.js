// LISTEN command handler.
// TRANS.bas:9900-9930, 7175-7225

export const AMBIENT_SOUNDS = [
  "A WITCH'S CACKLE CUTS THROUGH THE STILL AIR OF THE NIGHT.",
  "A FEW BATS HOVERED OVER YOU FOR A WHILE, BUT FLEW AWAY.",
  "YOU HEAR A WOLF HOWL IN THE DISTANCE.",
  "YOU HEAR MOANING NOISES IN THE DISTANCE.",
  "YOU HEARD SOME RUSTLING NOISES NEARBY.",
  "A ROUGH VOICE SHOUTS 'GET OUT!'",
  "HOOOO! HOOOO! (WHO?) - JUST AN OWL.",
  "A GRIM CHUCKLE ERUPTS BEHIND YOU.",
  // TRANS.bas:9900-9930 says "RAVENOUS-LOOKING MICE" -- dropped, matching
  // turnHooks.js's copy of the same line (7225).
  "A CAT DARTED BY, FOLLOWED BY THREE MICE.",
];

/** @type {import("./index.js").CommandHandler} */
export function listen() {
  // TRANS.bas:9900 -- Z=INT (RND (1)*7)+1: IF Z<>6 THEN 7175
  // 1-in-7 gives: "YOU HEARD NOTHING, WHICH IS ODD IN THIS FOREST."
  // and does NOT consume a turn (GOTO 1000).
  const roll = Math.floor(Math.random() * 7);
  if (roll === 0) {
    return {
      messages: ["YOU HEARD NOTHING, WHICH IS ODD IN THIS FOREST."],
      consumeTurn: false,
    };
  }

  const sound = AMBIENT_SOUNDS[Math.floor(Math.random() * AMBIENT_SOUNDS.length)];
  return [sound];
}
