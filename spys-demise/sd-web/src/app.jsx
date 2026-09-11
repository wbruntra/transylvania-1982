import { useEffect, useRef, useState } from "preact/hooks";
import { initialState, startBuilding } from "./engine/state.js";
import { step, tickPhase, SECRET } from "./engine/engine.js";
import { draw, drawTitle } from "./ui/renderer.js";
import { sfx } from "./ui/audio.js";
import "./app.css";

const W = 640, H = 400;

export function App() {
  const canvasRef = useRef(null);
  const [snap, setSnap] = useState(() => initialState());
  const stateRef = useRef(snap);
  const inputRef = useRef(0);
  const [, force] = useState(0);

  stateRef.current = snap;

  useEffect(() => {
    const s = stateRef.current;
    s.onPickup = (k) => (k === "ring" ? sfx.ring() : sfx.pickup());
    s.onDeath = () => sfx.death();
    s.onClear = () => sfx.clear();
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      let s = stateRef.current;
      if (s.phase === "play") s = step(s, inputRef.current, dt);
      else s = tickPhase({ ...s }, dt);
      if (s.phase === "win" && stateRef.current.phase !== "win") sfx.win();
      stateRef.current = s;
      const cv = canvasRef.current;
      if (cv) {
        const ctx = cv.getContext("2d");
        if (s.phase === "title") drawTitle(ctx, W, H);
        else {
          draw(ctx, s, W, H);
          if (s.phase === "over") banner(ctx, "GAME OVER — ENTER to retry");
          if (s.phase === "win") banner(ctx, `SECRET: ${SECRET} — ENTER to play again`);
        }
      }
      setSnap({ ...s });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") inputRef.current = -1;
      else if (k === "arrowright" || k === "d") inputRef.current = 1;
      else if (k === "j" || k === "k" || k === "p" || k === "enter" || k === " ") start(e);
      else if (k === "r") restart();
    };
    const up = (e) => {
      const k = e.key.toLowerCase();
      if ((k === "arrowleft" || k === "a") && inputRef.current === -1) inputRef.current = 0;
      if ((k === "arrowright" || k === "d") && inputRef.current === 1) inputRef.current = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  function hookSfx(s) {
    s.onPickup = (k) => (k === "ring" ? sfx.ring() : sfx.pickup());
    s.onDeath = () => sfx.death();
    s.onClear = () => sfx.clear();
    return s;
  }
  function start(e) {
    e?.preventDefault?.();
    const s = stateRef.current;
    if (s.phase === "title" || s.phase === "over" || s.phase === "win") {
      const fresh = hookSfx(initialState());
      fresh.phase = "play";
      Object.assign(fresh, startBuilding(0));
      stateRef.current = fresh;
      setSnap({ ...fresh });
      force((x) => x + 1);
    }
  }
  function restart() {
    const fresh = hookSfx(initialState());
    fresh.phase = "play";
    Object.assign(fresh, startBuilding(0));
    stateRef.current = fresh;
    setSnap({ ...fresh });
  }
  function hold(dir) {
    return {
      onPointerDown: (e) => { e.preventDefault(); inputRef.current = dir; if (stateRef.current.phase !== "play") start(); },
      onPointerUp: () => { if (inputRef.current === dir) inputRef.current = 0; },
      onPointerLeave: () => { if (inputRef.current === dir) inputRef.current = 0; },
    };
  }

  return (
    <main class="sd">
      <h1>Spys Demise <span>web clone</span></h1>
      <canvas ref={canvasRef} width={W} height={H} onPointerDown={(e) => { if (stateRef.current.phase !== "play") start(e); }} />
      <div class="controls">
        <button {...hold(-1)}>◀ LEFT</button>
        <button onClick={start}>START (J/K/P)</button>
        <button {...hold(1)}>RIGHT ▶</button>
      </div>
      <p class="hint">
        Building {snap.building + 1}/9 · {snap.pieces.join("") || "no pieces yet"} · arrows/A/D or hold the buttons.
        R restarts. Original: Penguin/LOADSTAR 1983, C64 translation by Wayne Barbarek.
      </p>
    </main>
  );
}

function banner(ctx, text) {
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(60, 170, 520, 60);
  ctx.fillStyle = "#ffe08a";
  ctx.font = "bold 15px monospace";
  ctx.fillText(text, 80, 205);
}
