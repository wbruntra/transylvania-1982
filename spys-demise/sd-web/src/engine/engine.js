import {
  PLAYER_SPEED, RIDE_SPEED, SHAFT_HALF_W, KILL_DFLOOR, KILL_DX,
  RING_SCORE, FILM_SCORE, CLEAR_BONUS_PER_SEC, SECRET, liftShaft,
} from "./constants.js";
import { nextBuilding, resetAfterDeath } from "./state.js";

// input: -1 | 0 | 1 (mirrors $1C: $00 left / $FF right at $92D5)
export function step(s, input, dt) {
  if (s.phase !== "play") return s;
  dt = Math.min(dt, 0.05);
  s = { ...s, time: s.time + dt };
  s.timer -= dt;
  if (s.timer <= 0) {
    return kill(s, "TIME UP");
  }

  // Elevators bounce between ground and top (guard patrol, $93FA loop).
  s.elevators = s.elevators.map((e) => {
    let y = e.y + e.dir * e.speed * dt;
    let dir = e.dir;
    if (y >= s.floors - 1) { y = s.floors - 1; dir = -1; }
    if (y <= 0) { y = 0; dir = 1; }
    return { ...e, y, dir };
  });

  // Player run.
  const p = { ...s.player };
  p.x = clamp(p.x + input * PLAYER_SPEED * dt, 0.02, 0.98);

  // One floor per ride: the active end shaft (alternating by floor) lifts;
  // other shafts, including the idle end, never lift. Controls stay
  // left/right only — after each ride, cross to the other side.
  const want = liftShaft(p.floor);
  const shaft = s.elevators.findIndex(
    (e, i) => i === want && Math.abs(e.x - p.x) < SHAFT_HALF_W);
  if (shaft >= 0 && p.floor < s.floors - 1) {
    // Clamp to exactly one floor above where the ride started; the active
    // shaft flips on arrival, so the player must cross to ride again.
    p.floor = Math.min(Math.floor(p.floor) + 1, p.floor + RIDE_SPEED * dt);
  }

  // Pickups.
  s.pickups = s.pickups.map((k) => {
    if (!k.taken && k.floor === Math.round(p.floor) && Math.abs(k.x - p.x) < 0.03) {
      k = { ...k, taken: true };
      s.score += k.kind === "ring" ? RING_SCORE : FILM_SCORE;
      s.msg = k.kind === "ring" ? `RING +${RING_SCORE}` : `FILM +${FILM_SCORE}`;
      s.msgT = 1.2;
      s.onPickup?.(k.kind);
    }
    return k;
  });

  // Guards catch you ($D01F collision at $945D).
  for (const e of s.elevators) {
    if (Math.abs(e.x - p.x) < KILL_DX && Math.abs(e.y - p.floor) < KILL_DFLOOR) {
      return kill({ ...s, player: p }, "CAUGHT BY KGB");
    }
  }

  // Cryptogram piece at top floor.
  if (Math.round(p.floor) >= s.floors - 1 && Math.abs(p.x - s.pieceX) < 0.05) {
    s.score += Math.ceil(s.timer) * CLEAR_BONUS_PER_SEC;
    s.onClear?.();
    return nextBuilding({ ...s, player: p });
  }

  if (s.msgT > 0) s.msgT -= dt;
  return { ...s, player: p };
}

function kill(s, msg) {
  s.lives -= 1;
  s.onDeath?.();
  if (s.score > s.high) {
    s.high = s.score;
    try { localStorage.setItem("sd-high", String(s.high)); } catch { /* noop */ }
  }
  if (s.lives < 0) return { ...s, phase: "over", msg };
  return { ...resetAfterDeath(s), msg: `${msg} — ${s.lives + 1} LEFT`, msgT: 1.6, phase: "dead", deadT: 1.4 };
}

// Advance short interstitial phases; returns mutated copy.
export function tickPhase(s, dt) {
  if (s.phase === "dead") {
    s = { ...s, deadT: (s.deadT ?? 1.4) - dt };
    if (s.deadT <= 0) s = resetAfterDeath(s);
    return s;
  }
  if (s.phase === "clear") {
    s = { ...s, msgT: (s.msgT ?? 0) + dt };
    if (s.msgT > 1.6) s = { ...s, phase: "play" };
    return s;
  }
  return s;
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

export { SECRET };
