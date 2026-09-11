// Tiny WebAudio bleeps approximating the SID cues ($D400: pickup blip,
// death jingle, clear arpeggio). No assets, mutable.

let ac = null;
function ctx() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === "suspended") void ac.resume();
  return ac;
}
function tone(f, t, d = 0.08, type = "square", g = 0.04) {
  try {
    const a = ctx();
    const o = a.createOscillator();
    const gn = a.createGain();
    o.type = type;
    o.frequency.value = f;
    gn.gain.setValueAtTime(g, a.currentTime + t);
    gn.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + d);
    o.connect(gn).connect(a.destination);
    o.start(a.currentTime + t);
    o.stop(a.currentTime + t + d + 0.02);
  } catch { /* audio unavailable */ }
}
export const sfx = {
  pickup: () => tone(880, 0),
  ring: () => { tone(660, 0); tone(990, 0.07); },
  death: () => { tone(220, 0, 0.15, "sawtooth"); tone(147, 0.16, 0.2, "sawtooth"); },
  clear: () => { [523, 659, 784].forEach((f, i) => tone(f, i * 0.09)); },
  win: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12)); },
};
