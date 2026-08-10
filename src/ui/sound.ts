import type { GameStore } from "../core/state";

// M5 — Sunet (§10.3): Web Audio API generat pe loc, fără fișiere externe.
// Toate efectele verifică settings.sound intern, deci apelanții nu trebuie
// să repete condiția la fiecare punct de declanșare.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window || "webkitAudioContext" in window)) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function enabled(store: GameStore): boolean {
  return store.state.settings.sound;
}

/** Un ton simplu cu anvelopă atac-decădere exponențială, ca să nu clipească brusc. */
function tone(
  audioCtx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  peakGain: number
): void {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const startTime = audioCtx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/** Click discret la plasare de atom sau creare/ciclare de legătură (§6.1). */
export function playClick(store: GameStore): void {
  if (!enabled(store)) return;
  const audioCtx = getContext();
  if (!audioCtx) return;
  tone(audioCtx, 620, 0, 0.05, "triangle", 0.07);
}

/** Ton cald când molecula din Constructor devine validă (§6.3). */
export function playValid(store: GameStore): void {
  if (!enabled(store)) return;
  const audioCtx = getContext();
  if (!audioCtx) return;
  tone(audioCtx, 392, 0, 0.3, "sine", 0.1);
  tone(audioCtx, 494, 0.03, 0.3, "sine", 0.06);
}

/** "Pop" la sinteza reușită a unei molecule (§6.4). */
export function playSynthesize(store: GameStore): void {
  if (!enabled(store)) return;
  const audioCtx = getContext();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  const startTime = audioCtx.currentTime;
  osc.frequency.setValueAtTime(760, startTime);
  osc.frequency.exponentialRampToValueAtTime(180, startTime + 0.13);
  gain.gain.setValueAtTime(0.14, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.15);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + 0.17);
}

/** Fanfară scurtă la prima descoperire a unei molecule (§6.4). */
export function playDiscovery(store: GameStore): void {
  if (!enabled(store)) return;
  const audioCtx = getContext();
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => tone(audioCtx, freq, i * 0.09, 0.22, "triangle", 0.1));
}
