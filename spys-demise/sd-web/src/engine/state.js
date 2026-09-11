import {
  BUILDINGS, ELEVATOR_X, FLOORS, TIMER_SECS, PIECES,
  START_LIVES, buildingParams,
} from "./constants.js";

export function startBuilding(b) {
  const floors = FLOORS[b];
  const { speeds, dirs } = buildingParams(b);
  const elevators = ELEVATOR_X.map((x, i) => ({
    x,
    y: (i * 1.7) % floors, // staggered cabs; original staggers via $44 init
    dir: dirs[i],
    speed: speeds[i],
  }));
  // Pickups: rings + microfilm spread over middle floors (original scatters
  // tools of the trade; exact spots are level dressing, values are original).
  const pickups = [];
  const defs = [
    { dx: 0.15, kind: "ring" }, { dx: 0.45, kind: "film" },
    { dx: 0.65, kind: "ring" }, { dx: 0.85, kind: "film" },
  ];
  for (let f = 1; f < floors - 1; f += 2) {
    const d = defs[f % defs.length];
    pickups.push({ x: d.dx, floor: f, kind: d.kind, taken: false });
  }
  return {
    building: b,
    floors,
    elevators,
    pickups,
    pieceX: 0.9, // cryptogram piece, top floor
    // Spawn in a gap between shafts (shaft 0 spans .053–.097 at char col 3;
    // shaft 1 starts at .153), clear of the elevator 0 cab at y=0.
    player: { x: 0.13, floor: 0 },
    timer: TIMER_SECS[b],
  };
}

function loadHigh() {
  try { return Number(localStorage.getItem("sd-high") || 0); }
  catch { return 0; }
}

export function initialState() {
  return {
    phase: "title", // title | play | clear | dead | over | win
    building: 0,
    ...startBuilding(0),
    score: 0,
    lives: START_LIVES,
    pieces: [],
    high: loadHigh(),
    msg: "",
    msgT: 0,
    time: 0,
  };
}

export function nextBuilding(s) {
  if (s.building + 1 >= BUILDINGS) {
    s.phase = "win";
    s.pieces = [...PIECES];
    return s;
  }
  const keep = { score: s.score, lives: s.lives, pieces: [...s.pieces, PIECES[s.building]], high: s.high };
  const nb = startBuilding(s.building + 1);
  return { ...s, ...nb, ...keep, phase: "clear", msgT: 0 };
}

export function resetAfterDeath(s) {
  const nb = startBuilding(s.building);
  return { ...s, ...nb, score: s.score, lives: s.lives, pieces: s.pieces, high: s.high, phase: "play" };
}
