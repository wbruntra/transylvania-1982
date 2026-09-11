// Feedback for things that happen TO the player.
//
// The giant eagle (TRANS.bas:7271) picks you up and drops you somewhere else
// mid-turn. As a line of text among other lines it is very easy to miss, and
// missing it makes the map feel broken -- you walk east, then west, and end up
// somewhere you have never seen. A jolt and a sound make it unmissable.
//
// Sound is synthesised with WebAudio rather than loaded from a file: no assets
// to ship, and nothing to fail at load time.

/** Browsers require a user gesture before audio; created on first command. */
let audio = null;

function audioContext() {
  if (audio === null) {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    audio = Ctor ? new Ctor() : false;
  }
  if (audio && audio.state === "suspended") audio.resume();
  return audio || null;
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * A descending filtered-noise whoosh with a low thud under it -- something
 * large grabbing you and carrying you off.
 */
function playWhoosh(ctx) {
  const now = ctx.currentTime;
  const duration = 0.9;

  // Noise burst swept downward: the rush of wings.
  const frames = Math.floor(ctx.sampleRate * duration);
  const noise = ctx.createBuffer(1, frames, ctx.sampleRate);
  const channel = noise.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    channel[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const source = ctx.createBufferSource();
  source.buffer = noise;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(2400, now);
  filter.frequency.exponentialRampToValueAtTime(220, now + duration);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.28, now + 0.08);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter).connect(noiseGain).connect(ctx.destination);
  source.start(now);
  source.stop(now + duration);

  // Low thud: the impact of being seized.
  const thud = ctx.createOscillator();
  thud.type = "sine";
  thud.frequency.setValueAtTime(140, now);
  thud.frequency.exponentialRampToValueAtTime(42, now + 0.35);

  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.0001, now);
  thudGain.gain.exponentialRampToValueAtTime(0.45, now + 0.02);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

  thud.connect(thudGain).connect(ctx.destination);
  thud.start(now);
  thud.stop(now + 0.5);
}

/** A single dull knock -- the game ending. */
function playThud(ctx) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.7);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.4, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.8);
}

const SOUNDS = { teleport: playWhoosh, gameOver: playThud };

/**
 * @param {HTMLElement} scene   The scene frame, which gets jolted.
 * @param {HTMLElement} [log]   The transcript, whose newest lines get flashed.
 */
export function createEffects(scene, log) {
  return {
    /** Called on every command so the audio context is live before it is needed. */
    prime() {
      audioContext();
    },

    /**
     * @param {string[]} events  Event names from engine.execute.
     */
    play(events) {
      for (const event of events) {
        if (!(event in SOUNDS)) continue;

        const ctx = audioContext();
        if (ctx) {
          try {
            SOUNDS[event](ctx);
          } catch {
            // Audio is a nicety; never let it break a turn.
          }
        }

        if (prefersReducedMotion()) {
          // Still mark it, just without the movement.
          flash(scene, event);
        } else {
          jolt(scene, event);
        }
        if (log) flash(log, event);
      }
    },
  };
}

/** Restart a CSS animation reliably by removing the class and reflowing. */
function restartAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  element.addEventListener(
    "animationend",
    () => element.classList.remove(className),
    { once: true },
  );
}

function jolt(element, event) {
  restartAnimation(element, event === "gameOver" ? "fx-sink" : "fx-jolt");
}

function flash(element, event) {
  restartAnimation(element, event === "gameOver" ? "fx-flash-red" : "fx-flash");
}
