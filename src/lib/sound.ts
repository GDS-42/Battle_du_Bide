'use client';
// Sons d'arcade synthétisés (Web Audio), portés de design/canvas/Sons.dc.html. Aucun fichier audio.

export type SoundName = 'pesee' | 'charge' | 'jab' | 'crochet' | 'bloque' | 'superCoup' | 'ko' | 'cloche' | 'combat' | 'coude'
  // bruitages du combat animé (look « BD »)
  | 'whoosh' | 'thud' | 'boing' | 'pop' | 'ting' | 'fall' | 'wind' | 'zap' | 'slow' | 'cutin' | 'inflate' | 'pschitt' | 'snore' | 'superImpact';

const KEY = 'bdb-sound';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let nb: AudioBuffer | null = null;

export function soundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}
export function setSoundOn(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
}

function ac(): AudioContext {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
function noiseBuf(): AudioBuffer {
  const c = ac();
  if (!nb) {
    const len = c.sampleRate * 1.5;
    nb = c.createBuffer(1, len, c.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return nb;
}
function env(g: GainNode, t: number, a: number, peak: number, dec: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
}
function tone(type: OscillatorType, f0: number, f1: number, t: number, dur: number, peak: number, dest?: AudioNode) {
  const c = ac();
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, 0.005, peak, dur);
  o.connect(g); g.connect(dest ?? master!);
  o.start(t); o.stop(t + dur + 0.05);
}
function noise(t: number, dur: number, peak: number, type: BiquadFilterType, f0: number, f1: number, q = 1) {
  const c = ac();
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noiseBuf();
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, 0.004, peak, dur);
  s.connect(f); f.connect(g); g.connect(master!);
  s.start(t); s.stop(t + dur + 0.05);
}
function crush(): WaveShaperNode {
  const c = ac();
  const ws = c.createWaveShaper(), n = 256, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; curve[i] = Math.tanh(x * 4); }
  ws.curve = curve; ws.connect(master!);
  return ws;
}
function bell(t: number, base: number) {
  const partials = [1, 1.51, 2.15, 2.94, 4.1];
  partials.forEach((p, i) => tone('sine', base * p, 0, t, 1.6 - i * 0.22, 0.22 / (i + 1)));
}
function arp(notes: number[], t: number, step: number, type: OscillatorType = 'square', peak = 0.12) {
  notes.forEach((n, i) => tone(type, n, 0, t + i * step, step * 1.6, peak));
}

const SOUNDS: Record<SoundName, () => void> = {
  pesee: () => { const t = now(); noise(t, 0.05, 0.5, 'lowpass', 1800, 0, 1); tone('sine', 140, 70, t, 0.12, 0.6); arp([988, 1319], t + 0.08, 0.07, 'square', 0.1); },
  charge: () => { const t = now(); noise(t, 0.35, 0.15, 'bandpass', 400, 3200, 2); arp([523, 659, 784, 1047, 1319], t + 0.05, 0.06, 'square', 0.1); tone('triangle', 1568, 0, t + 0.38, 0.4, 0.12); },
  jab: () => { const t = now(); noise(t, 0.08, 0.9, 'lowpass', 2400, 600, 1); tone('sine', 160, 60, t, 0.1, 0.8); },
  crochet: () => { const t = now(); const d = crush(); noise(t, 0.16, 1, 'lowpass', 3000, 300, 1.2); tone('sine', 120, 38, t, 0.28, 1, d); tone('square', 90, 40, t, 0.12, 0.2); },
  bloque: () => { const t = now(); tone('square', 700, 520, t, 0.07, 0.15); noise(t, 0.05, 0.4, 'highpass', 2500, 0, 1); tone('triangle', 330, 0, t + 0.02, 0.18, 0.18); },
  superCoup: () => { const t = now(); const d = crush(); noise(t, 0.5, 0.35, 'bandpass', 300, 4000, 3); arp([392, 523, 659, 784], t, 0.08, 'sawtooth', 0.08); noise(t + 0.5, 0.3, 1, 'lowpass', 4000, 200, 1); tone('sine', 110, 30, t + 0.5, 0.6, 1, d); tone('square', 196, 0, t + 0.5, 0.5, 0.12); tone('square', 247, 0, t + 0.5, 0.5, 0.1); },
  ko: () => { const t = now(); const d = crush(); noise(t, 0.25, 1, 'lowpass', 3500, 200, 1); tone('sine', 100, 25, t, 1.2, 1, d); tone('square', 440, 110, t + 0.15, 0.9, 0.12); bell(t + 0.9, 820); bell(t + 1.25, 820); bell(t + 1.6, 820); },
  cloche: () => { const t = now(); bell(t, 820); bell(t + 0.32, 820); },
  combat: () => { const t = now(); arp([392, 392, 523], t, 0.12, 'square', 0.12); arp([659, 784], t + 0.42, 0.14, 'square', 0.12); tone('triangle', 196, 0, t + 0.42, 0.5, 0.2); },
  coude: () => {
    const t = now(), c = ac();
    const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.12);
    o.frequency.exponentialRampToValueAtTime(260, t + 0.5);
    lfo.frequency.value = 18; lg.gain.value = 40;
    lfo.connect(lg); lg.connect(o.frequency);
    env(g, t, 0.01, 0.5, 0.5);
    o.connect(g); g.connect(master!);
    o.start(t); lfo.start(t); o.stop(t + 0.6); lfo.stop(t + 0.6);
  },
  // --- Combat animé ---
  whoosh: () => { const t = now(); noise(t, 0.18, 0.45, 'bandpass', 300, 2600, 1.5); },
  thud: () => { const t = now(); tone('sine', 95, 40, t, 0.18, 0.9); noise(t, 0.08, 0.5, 'lowpass', 900, 200, 1); },
  boing: () => { const t = now(); tone('triangle', 150, 520, t, 0.12, 0.45); tone('triangle', 520, 210, t + 0.11, 0.3, 0.35); },
  pop: () => { const t = now(); tone('square', 480, 980, t, 0.05, 0.2); noise(t, 0.04, 0.3, 'highpass', 2600, 0, 1); },
  ting: () => { const t = now(); tone('sine', 1760, 0, t, 0.3, 0.16); tone('sine', 2637, 0, t + 0.05, 0.25, 0.1); },
  fall: () => { const t = now(); tone('sine', 1500, 260, t, 0.5, 0.2); },
  wind: () => { const t = now(); noise(t, 1.4, 0.16, 'bandpass', 380, 760, 2.5); },
  zap: () => { const t = now(); for (let i = 0; i < 5; i++) { tone('sawtooth', 900 - i * 40, 220, t + i * 0.13, 0.1, 0.1); noise(t + i * 0.13, 0.06, 0.2, 'highpass', 3000, 0, 1); } },
  slow: () => { const t = now(); tone('sine', 240, 62, t, 0.75, 0.5); noise(t, 0.7, 0.12, 'bandpass', 1400, 200, 2); },
  cutin: () => { const t = now(); arp([523, 784, 1047, 1568], t, 0.05, 'sawtooth', 0.09); noise(t, 0.25, 0.25, 'bandpass', 500, 4200, 2); },
  inflate: () => { const t = now(); tone('sine', 110, 330, t, 0.7, 0.3); noise(t, 0.7, 0.12, 'bandpass', 300, 1500, 2); },
  pschitt: () => { const t = now(); noise(t, 0.5, 0.3, 'highpass', 5200, 1600, 1); tone('triangle', 420, 110, t, 0.5, 0.14); },
  snore: () => { const t = now(); tone('sawtooth', 70, 95, t, 0.35, 0.07); noise(t, 0.35, 0.06, 'lowpass', 500, 300, 2); },
  // l'impact du super sans sa montée (elle est jouée à part pendant la charge)
  superImpact: () => { const t = now(); const d = crush(); noise(t, 0.3, 1, 'lowpass', 4000, 200, 1); tone('sine', 110, 30, t, 0.6, 1, d); tone('square', 196, 0, t, 0.5, 0.12); tone('square', 247, 0, t, 0.5, 0.1); }
};
function now() { return ac().currentTime + 0.02; }

/** Joue un son si le son est activé. Sans effet côté serveur ou si Web Audio est indisponible. */
export function play(name: SoundName, force = false) {
  if (typeof window === 'undefined' || (!force && !soundOn())) return;
  try { SOUNDS[name](); } catch {}
}

/**
 * À appeler dans le geste de l'utilisateur (clic), avant tout chargement : sur iPhone, le son ne peut démarrer
 * que là. Sans effet si le son est coupé.
 */
export function primeAudio() {
  if (typeof window === 'undefined' || !soundOn()) return;
  try { ac(); } catch {}
}

/** Vibration courte sur mobile (si permis). */
export function buzz(ms: number | number[]) {
  try { if (soundOn()) navigator.vibrate?.(ms); } catch {}
}
