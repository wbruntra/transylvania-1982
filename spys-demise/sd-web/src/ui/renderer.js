// Canvas renderer: 32-col playfield + 8-col sidebar, like the original
// (docs.txt: score, high, lives + timer down the right side).
import { liftShaft } from "../engine/constants.js";

export function draw(ctx, s, W, H) {
  const px = (fx) => fx * W * 0.78;
  const py = (fl) => H - 24 - (fl / Math.max(s.floors - 1, 1)) * (H - 90);
  ctx.fillStyle = "#0a0a12";
  ctx.fillRect(0, 0, W, H);

  // Floors.
  ctx.strokeStyle = "#3b4a6b";
  ctx.lineWidth = 2;
  for (let f = 0; f < s.floors; f++) {
    ctx.beginPath();
    ctx.moveTo(8, py(f));
    ctx.lineTo(W * 0.78 - 8, py(f));
    ctx.stroke();
  }
  // Shafts. The active end shaft (alternates by floor) lifts and glows;
  // the idle end is marked dimmer; middle shafts are KGB-only.
  const active = liftShaft(s.player.floor);
  s.elevators.forEach((e, i) => {
    const isEnd = i === 0 || i === 6;
    const lift = i === active;
    ctx.strokeStyle = lift ? "#4d6ea5" : isEnd ? "#2c3a58" : "#22314f";
    ctx.lineWidth = lift ? 8 : 6;
    ctx.beginPath();
    ctx.moveTo(px(e.x), py(0));
    ctx.lineTo(px(e.x), py(s.floors - 1));
    ctx.stroke();
    if (lift) {
      ctx.fillStyle = "#7cf7ff";
      ctx.font = "10px monospace";
      for (let f = 0; f < s.floors; f += 2) ctx.fillText("^", px(e.x) - 3, py(f) - 20);
    }
  });
  // Pickups.
  for (const k of s.pickups) {
    if (k.taken) continue;
    ctx.fillStyle = k.kind === "ring" ? "#ffd54a" : "#7cf7ff";
    ctx.beginPath();
    ctx.arc(px(k.x), py(k.floor) - 8, 5, 0, 7);
    ctx.fill();
  }
  // Cryptogram piece.
  ctx.fillStyle = "#ff6b9d";
  ctx.fillRect(px(s.pieceX) - 6, py(s.floors - 1) - 16, 12, 12);
  ctx.fillStyle = "#0a0a12";
  ctx.font = "bold 10px monospace";
  ctx.fillText("?", px(s.pieceX) - 3, py(s.floors - 1) - 7);

  // Guards (red) + cabs.
  for (const e of s.elevators) {
    ctx.fillStyle = "#39415a";
    ctx.fillRect(px(e.x) - 7, py(e.y) - 14, 14, 14);
    ctx.fillStyle = "#ff2e4d";
    ctx.beginPath();
    ctx.arc(px(e.x), py(e.y) - 7, 6, 0, 7);
    ctx.fill();
  }
  // Player (white/blue).
  const p = s.player;
  ctx.fillStyle = "#f2f5ff";
  ctx.fillRect(px(p.x) - 6, py(p.floor) - 20, 12, 16);
  ctx.fillStyle = "#3aa0ff";
  ctx.fillRect(px(p.x) - 6, py(p.floor) - 20, 12, 4);

  // Sidebar.
  const sx = W * 0.8;
  ctx.fillStyle = "#101828";
  ctx.fillRect(sx, 0, W - sx, H);
  ctx.fillStyle = "#cfe3ff";
  ctx.font = "12px monospace";
  const line = (t, i) => ctx.fillText(t, sx + 8, 24 + i * 20);
  line(`SC ${String(s.score).padStart(6, "0")}`, 0);
  line(`HI ${String(Math.max(s.high, s.score)).padStart(6, "0")}`, 1);
  line(`MEN ${Math.max(s.lives, 0)}`, 2);
  line(`TIME ${Math.ceil(s.timer)}`, 3);
  line(`BLDG ${s.building + 1}/9`, 4);
  line(`PIECES`, 5);
  ctx.fillStyle = "#ff6b9d";
  ctx.fillText(s.pieces.join("") || "-", sx + 8, 24 + 6 * 20);

  if (s.msg && (s.msgT > 0 || s.phase !== "play")) {
    ctx.fillStyle = "#ffe08a";
    ctx.font = "bold 13px monospace";
    ctx.fillText(s.msg, 12, 20);
  }
  return { px, py };
}

export function drawTitle(ctx, W, H) {
  ctx.fillStyle = "#0a0a12";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f2f5ff";
  ctx.font = "bold 28px monospace";
  ctx.fillText("SPY'S DEMISE", 40, 80);
  ctx.font = "13px monospace";
  ctx.fillStyle = "#9fb4d8";
  const rows = [
    "After Penguin/LOADSTAR (1983). Web clone",
    "of the C64 translation by Wayne Barbarek.",
    "",
    "LEFT / RIGHT only: arrows, A/D, or tap.",
    "Ride the glowing END shaft up ONE floor,",
    "then cross to the other end for the next.",
    "Middle shafts are KGB — keep clear.",
    "Dodge the KGB cabs. Grab rings + film.",
    "Reach the ? on top for each cryptogram",
    "piece. 9 buildings, each shorter.",
    "",
    "Press J / K / P, tap, or ENTER to start.",
  ];
  rows.forEach((r, i) => ctx.fillText(r, 40, 130 + i * 20));
}
