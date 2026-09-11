// Extracted tuning from unpacked game_v2 (spys-demise/extract/data/unpacked.bin).
//
// - ELEVATOR_X: $957A = [3,7,12,16,20,25,29], char columns 0-39. 7 shafts,
//   matches the LDX #$00..#$06 guard loop at $93DA.
// - SPEEDS/DIRS: $9581/$95C0 rows of 7 per building. $8000 init derives
//   X = (11-$36)*7+6 ($809C), so building b reads T[X-6..X]. The table only
//   holds 40 entries, so late buildings run past it (original reads into the
//   $95C0 bytes); we wrap mod 40 and note it.
// - TIMER: $99C9 indexed by $36 ($8077 loop runs $36 = 11..3, 9 buildings).
// - Input $92D5: $1C = $00 left / $FF right from $DC01 (or $C5 keys); the web
//   port maps arrows/AD/touch to the same axis. Original has no up/down move
//   (docs.txt: "LEFT AND RIGHT"), so shafts auto-lift the player.
// - Death: sprite-sprite $D01F at $945D, lives DEC $22, SID jingle $D400.

export const COLS = 40;
export const PLAY_COLS = 32; // left area; right 8 cols are the HUD sidebar
export const ELEVATOR_X_CHARS = [3, 7, 12, 16, 20, 25, 29];
export const ELEVATOR_X = ELEVATOR_X_CHARS.map((c) => c / COLS);

const SPEED_RAW = [
  1, 89, 45, 99, 23, 89, 23, 1, 89, 45, 99, 23, 89, 23, 89, 1, 99, 45,
  89, 23, 147, 1, 1, 147, 147, 147, 1, 1, 1, 89, 45, 99, 23, 89, 23,
  1, 1, 1, 131, 131,
];
const DIR_RAW = [
  0, 255, 0, 255, 0, 255, 0, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255,
  0, 255, 0, 255, 0, 0, 255, 255, 255, 0, 0, 0, 255, 0, 255, 0, 255,
  0, 0, 0, 0, 255, 255,
];

// Raw VIC-ish magnitudes -> floors/sec. 1=slow … 147=fast.
const SPEED_MAP = new Map([
  [1, 0.35], [23, 0.5], [45, 0.7], [89, 1.0], [99, 1.15],
  [131, 1.45], [147, 1.65],
]);
const speedOf = (v) => SPEED_MAP.get(v) ?? 0.8;

// Ascent is one floor per ride, alternating ends (zigzag): even floors ride
// the left shaft up, odd floors the right shaft. Playtester report; the
// middle five shafts are KGB patrols in all cases.
export const liftShaft = (floor) => (Math.floor(floor) % 2 === 0 ? 0 : 6);

export const BUILDINGS = 9;
export const FLOORS = [11, 10, 9, 8, 7, 6, 5, 4, 3]; // $36 = 11..3
export const TIMER_SECS = [108, 100, 92, 84, 76, 68, 60, 54, 48]; // from $99C9, scaled

export function buildingParams(b) {
  const X = b * 7 + 6;
  const speeds = [];
  const dirs = [];
  for (let i = 0; i < 7; i++) {
    const raw = SPEED_RAW[(X - 6 + i) % SPEED_RAW.length];
    const d = DIR_RAW[(X - 6 + i) % DIR_RAW.length];
    speeds.push(speedOf(raw));
    dirs.push(d === 255 ? -1 : 1); // 255 ($FF) = up, 0 = down
  }
  return { speeds, dirs };
}

export const PLAYER_SPEED = 0.45; // screen widths/sec
export const RIDE_SPEED = 1.4; // floors/sec while inside a shaft
export const SHAFT_HALF_W = 0.022;
export const KILL_DFLOOR = 0.45;
export const KILL_DX = 0.03;
export const RING_SCORE = 500; // "SECRET DECODER RING IS WORTH BONUS POINTS"
export const FILM_SCORE = 200; // microfilm pickups
export const CLEAR_BONUS_PER_SEC = 10; // sooner => more points
export const START_LIVES = 3;
export const PIECES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
export const SECRET = "MIDNIGHT";
