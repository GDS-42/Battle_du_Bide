'use client';
// Bruitages d'arcade synthétisés en direct (Web Audio) : aucun fichier audio.
// Chaque son superpose plusieurs couches (l'attaque, le corps, le souffle). Tous passent par un bus commun,
// avec un limiteur, et envoient une part réglable dans une petite réverbération de salle fabriquée sur place.
// Point de départ : design/canvas/Sons.dc.html.
// Deux familles ne sont pas fabriquées : la salle du ring (fond de foule, réactions du public) et les coups (poings,
// chute, cloche). Ce sont de vrais sons, chargés depuis public/son/v1 (voir sound-files.ts) et joués à travers le
// même bus. Tant qu'un coup n'est pas chargé, sa version fabriquée, plus bas, sert de repli.
import { CROWD_FILES, CROWD_LOOP, HIT_FILES, SOUND_BASE, type CrowdName, type HitName } from './sound-files';

export type { CrowdName };

export type SoundName = 'pesee' | 'charge' | 'jab' | 'crochet' | 'bloque' | 'superCoup' | 'ko' | 'cloche' | 'combat' | 'coude'
  // bruitages du combat animé (look « BD »)
  | 'whoosh' | 'thud' | 'boing' | 'pop' | 'ting' | 'fall' | 'wind' | 'zap' | 'slow' | 'cutin' | 'inflate' | 'pschitt' | 'snore' | 'superImpact';

const KEY = 'bdb-sound';
let ctx: AudioContext | null = null;
let bus: AudioNode | null = null; // entrée du son direct
let wet: AudioNode | null = null; // entrée de la réverbération
let nb: AudioBuffer | null = null;
const curves = new Map<number, Float32Array<ArrayBuffer>>();

export function soundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}
export function setSoundOn(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
  if (!on) crowdBed(false);
}

/** Courbe de saturation douce (tanh), normalisée : arrondit les crêtes au lieu de les couper net. */
function curve(drive: number): Float32Array<ArrayBuffer> {
  let c = curves.get(drive);
  if (!c) {
    const n = 1024, k = Math.tanh(drive);
    c = new Float32Array(n);
    for (let i = 0; i < n; i++) c[i] = Math.tanh(((i * 2) / (n - 1) - 1) * drive) / k;
    curves.set(drive, c);
  }
  return c;
}

/** Réponse d'une petite salle : un bruit qui s'éteint en moins d'une seconde, un peu assourdi. */
function room(c: BaseAudioContext): AudioBuffer {
  const len = Math.floor(c.sampleRate * 0.85), buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      lp += 0.42 * (Math.random() * 2 - 1 - lp);
      d[i] = lp * Math.pow(1 - i / len, 2.6) * Math.min(1, i / 60);
    }
  }
  return buf;
}

function ac(): AudioContext {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const c = new C();
    // Sortie : limiteur (les coups superposés ne saturent pas), puis un écrêtage doux en dernier filet.
    const out = c.createGain();
    out.gain.value = 0.8;
    let tail: AudioNode = out;
    try { const soft = c.createWaveShaper(); soft.curve = curve(1.4); out.connect(soft); tail = soft; } catch {}
    tail.connect(c.destination);
    let head: AudioNode = out;
    try {
      const lim = c.createDynamicsCompressor();
      lim.threshold.value = -13; lim.knee.value = 9; lim.ratio.value = 7; lim.attack.value = 0.002; lim.release.value = 0.15;
      lim.connect(out); head = lim;
    } catch {}
    const dry = c.createGain();
    dry.gain.value = 0.6;
    dry.connect(head);
    bus = dry;
    // Réverbération : si le navigateur ne sait pas faire, les sons restent simplement secs.
    const send = c.createGain();
    wet = send;
    try {
      const rev = c.createConvolver(), back = c.createGain();
      rev.buffer = room(c);
      back.gain.value = 0.5;
      send.connect(rev); rev.connect(back); back.connect(head);
    } catch {}
    ctx = c;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
function noiseBuf(): AudioBuffer {
  const c = ac();
  if (!nb) {
    const len = Math.floor(c.sampleRate * 1.5);
    nb = c.createBuffer(1, len, c.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return nb;
}
function now() { return ac().currentTime + 0.02; }

/**
 * Départ d'un son : une entrée reliée au bus, avec une part `send` vers la réverbération.
 * `drive` > 0 fait d'abord passer le son par une saturation (du grain et du poids pour les gros coups).
 */
function mix(send = 0, drive = 0): AudioNode {
  const c = ac(), input = c.createGain();
  let node: AudioNode = input;
  if (drive > 0) { const ws = c.createWaveShaper(); ws.curve = curve(drive); input.connect(ws); node = ws; }
  node.connect(bus!);
  if (send > 0) { const s = c.createGain(); s.gain.value = send; node.connect(s); s.connect(wet!); }
  return input;
}

interface Opt {
  /** Destination (un départ créé par mix) ; le bus sinon. */
  to?: AudioNode;
  /** Durée de l'attaque, en secondes. */
  a?: number;
  /** Étape intermédiaire de la hauteur : [fréquence, part de la durée]. */
  mid?: [number, number];
  /** Vibrato : [vitesse en Hz, profondeur en Hz]. */
  vib?: [number, number];
  /** Trémolo (battement du volume) : [vitesse en Hz, profondeur de 0 à 1]. */
  trem?: [number, number];
}

/** Enveloppe : silence → crête en `a` secondes → silence en `d` secondes. */
function env(g: AudioParam, t: number, a: number, peak: number, d: number) {
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function sweep(p: AudioParam, f0: number, f1: number, t: number, dur: number, mid?: [number, number]) {
  p.setValueAtTime(f0, t);
  if (mid) p.exponentialRampToValueAtTime(mid[0], t + dur * mid[1]);
  if (f1 && f1 !== f0) p.exponentialRampToValueAtTime(f1, t + dur);
}
/** Sortie d'une couche : son volume (enveloppe), un trémolo éventuel, puis sa destination. */
function layer(src: AudioNode, t: number, dur: number, peak: number, o: Opt) {
  const c = ac(), g = c.createGain(), a = o.a ?? 0.005;
  env(g.gain, t, a, peak, dur);
  src.connect(g);
  let node: AudioNode = g;
  if (o.trem) {
    const am = c.createGain(), lfo = c.createOscillator(), depth = c.createGain();
    am.gain.value = 1 - o.trem[1] / 2;
    lfo.frequency.value = o.trem[0]; depth.gain.value = o.trem[1] / 2;
    lfo.connect(depth); depth.connect(am.gain);
    lfo.start(t); lfo.stop(t + a + dur + 0.1);
    g.connect(am); node = am;
  }
  node.connect(o.to ?? bus!);
  return t + a + dur + 0.08;
}
function vibrato(target: AudioParam, t: number, end: number, vib: [number, number]) {
  const c = ac(), lfo = c.createOscillator(), depth = c.createGain();
  lfo.frequency.value = vib[0]; depth.gain.value = vib[1];
  lfo.connect(depth); depth.connect(target);
  lfo.start(t); lfo.stop(end);
}

/** Les vrais sons déjà chargés (salle et coups), par nom : une ou plusieurs prises. */
const samples = new Map<string, AudioBuffer[]>();
const lastTake = new Map<string, number>();
/** Choisit une prise : jamais la même deux fois de suite quand il y en a plusieurs. */
function take(name: string, takes: AudioBuffer[]): AudioBuffer {
  let i = Math.floor(Math.random() * takes.length);
  if (takes.length > 1 && i === lastTake.get(name)) i = (i + 1) % takes.length;
  lastTake.set(name, i);
  return takes[i];
}
/** Volume de chaque coup enregistré, réglé à la mesure pour retrouver la hiérarchie des coups fabriqués. */
const HIT_GAIN: Record<HitName, number> = { jab: 2.1, crochet: 2, ko: 2.2, thud: 0.85, cloche: 1 };
/**
 * Joue un vrai coup à l'instant `at`, s'il est chargé. Renvoie false sinon : l'appelant joue alors la version fabriquée.
 * La hauteur varie un peu d'une fois à l'autre (sauf la cloche, qui doit rester juste). `drive` sature le coup :
 * du grain et de la tenue pour les coups lourds.
 */
function hit(name: HitName, at: number, level = 1, send = 0.15, drive = 0): boolean {
  const takes = samples.get(name);
  if (!takes?.length) return false;
  const c = ac(), src = c.createBufferSource(), g = c.createGain();
  src.buffer = take(name, takes);
  if (name !== 'cloche') src.playbackRate.value = 0.94 + Math.random() * 0.12;
  g.gain.value = HIT_GAIN[name] * level;
  src.connect(g); g.connect(mix(send, drive));
  src.start(at);
  return true;
}

/** Une note : un oscillateur dont la hauteur glisse de f0 à f1 (f1 = 0 : hauteur fixe). */
function tone(type: OscillatorType, f0: number, f1: number, t: number, dur: number, peak: number, o: Opt = {}) {
  const c = ac(), osc = c.createOscillator();
  osc.type = type;
  sweep(osc.frequency, f0, f1, t, dur, o.mid);
  const end = layer(osc, t, dur, peak, o);
  if (o.vib) vibrato(osc.frequency, t, end, o.vib);
  osc.start(t); osc.stop(end);
}
/** Un souffle : du bruit derrière un filtre dont la fréquence glisse de f0 à f1. */
function noise(t: number, dur: number, peak: number, type: BiquadFilterType, f0: number, f1: number, q = 1, o: Opt = {}) {
  const c = ac(), s = c.createBufferSource(), f = c.createBiquadFilter();
  s.buffer = noiseBuf(); s.loop = true;
  f.type = type; f.Q.value = q;
  sweep(f.frequency, f0, f1, t, dur, o.mid);
  s.connect(f);
  const end = layer(f, t, dur, peak, o);
  s.start(t, Math.random()); s.stop(end);
}
/** Le corps d'un coup : un grave qui plonge très vite, comme une grosse caisse. */
function thump(t: number, f0: number, f1: number, dur: number, peak: number, to?: AudioNode) {
  const c = ac(), osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.55);
  osc.start(t); osc.stop(layer(osc, t, dur, peak, { a: 0.002, to }));
}
/**
 * Une nappe : des dents de scie désaccordées deux à deux, derrière un filtre passe-bas dont l'ouverture
 * glisse de cut[0] à cut[1]. `glide` multiplie la hauteur au fil de la note (montée ou effondrement).
 */
function pad(freqs: number[], t: number, dur: number, peak: number, o: Opt & { cut: [number, number]; q?: number; glide?: number }) {
  const c = ac(), f = c.createBiquadFilter(), a = o.a ?? 0.02, end = t + a + dur + 0.08;
  f.type = 'lowpass'; f.Q.value = o.q ?? 1;
  sweep(f.frequency, o.cut[0], o.cut[1], t, a + dur);
  for (const hz of freqs) for (const cents of [-8, 8]) {
    const osc = c.createOscillator();
    osc.type = 'sawtooth'; osc.detune.value = cents;
    osc.frequency.setValueAtTime(hz, t);
    if (o.glide && o.glide !== 1) osc.frequency.exponentialRampToValueAtTime(hz * o.glide, t + a + dur);
    osc.connect(f); osc.start(t); osc.stop(end);
  }
  layer(f, t, dur, peak / Math.sqrt(freqs.length), { ...o, a });
}
/** Une note claire et brève, comme un carillon : la fondamentale et deux harmoniques qui s'éteignent vite. */
function chime(t: number, f: number, peak: number, to?: AudioNode) {
  tone('sine', f, 0, t, 0.45, peak, { a: 0.003, to });
  tone('sine', f * 2, 0, t, 0.28, peak * 0.34, { a: 0.003, to });
  tone('sine', f * 3.01, 0, t, 0.18, peak * 0.13, { a: 0.003, to });
}
/**
 * La cloche du ring : le coup du marteau, puis des partiels inharmoniques (ceux d'un métal frappé), chacun
 * doublé d'un jumeau à peine désaccordé pour le chatoiement. Les aigus s'éteignent avant les graves.
 */
function bell(t: number, f: number, level = 1) {
  const v = mix(0.4);
  const partials: [number, number, number][] = [[1, 1, 1.5], [2, 0.5, 1.15], [2.76, 0.42, 0.9], [4.07, 0.24, 0.62], [5.4, 0.15, 0.45], [6.8, 0.08, 0.3]];
  for (const [ratio, amp, decay] of partials) for (const off of [0.9985, 1.0015]) {
    tone('sine', f * ratio * off, 0, t, decay, 0.085 * amp * level, { a: 0.002, to: v });
  }
  noise(t, 0.014, 0.3 * level, 'bandpass', 3400, 0, 1.2, { a: 0.001, to: v });
  thump(t, 240, 150, 0.05, 0.12 * level, v);
}
/**
 * L'impact du super : claque, explosion, grondement, grave, accord de puissance et retombée d'étincelles.
 * Comme pour tous les coups, le médium compte autant que le grave : un téléphone ne restitue presque rien sous 200 Hz.
 */
/** Un coup de cloche : la vraie cloche du ring si elle est chargée, sinon la cloche fabriquée. */
function ring(t: number, level = 1) {
  if (!hit('cloche', t, level, 0.3)) bell(t, 880, level);
}
function blast(t: number) {
  const v = mix(0.4), d = mix(0.3, 3.5);
  noise(t, 0.03, 2.5, 'bandpass', 2400, 800, 0.7, { a: 0.001, to: v });
  noise(t, 0.5, 2, 'lowpass', 5000, 200, 1, { to: d });
  noise(t, 0.35, 1.3, 'bandpass', 900, 300, 0.8, { to: d });
  tone('triangle', 360, 90, t, 0.2, 1.1, { a: 0.002, to: d });
  thump(t, 140, 30, 0.7, 0.75, d);
  pad([98, 147, 196, 247], t, 0.5, 0.32, { cut: [2600, 500], q: 1.5, to: v });
  [1568, 1319, 1047].forEach((n, i) => chime(t + 0.06 + i * 0.07, n, 0.09, v));
}

const SOUNDS: Record<SoundName, () => void> = {
  // La balance encaisse, puis deux notes claires.
  pesee: () => {
    const t = now(), v = mix(0.3);
    thump(t, 150, 62, 0.14, 0.7, v);
    noise(t, 0.05, 0.4, 'lowpass', 1800, 500, 1, { to: v });
    noise(t + 0.01, 0.03, 0.18, 'bandpass', 3200, 0, 2, { a: 0.001, to: v });
    chime(t + 0.09, 988, 0.2, v); chime(t + 0.19, 1319, 0.22, v);
  },
  // Le coup se charge : une nappe qui monte derrière un filtre qui s'ouvre, un souffle qui grimpe, puis l'étincelle.
  charge: () => {
    const t = now(), v = mix(0.25);
    pad([196, 294], t, 0.42, 0.3, { cut: [300, 2600], q: 4, glide: 2, to: v });
    noise(t, 0.42, 0.1, 'bandpass', 400, 4200, 2.5, { a: 0.12, to: v });
    [523, 659, 784, 1047, 1319].forEach((n, i) => tone('triangle', n, 0, t + 0.05 + i * 0.06, 0.1, 0.13, { to: v }));
    chime(t + 0.4, 1568, 0.15, v); chime(t + 0.46, 2093, 0.09, v);
  },
  // Jab : la claque du gant, la chair, un « toc » médium, le corps.
  jab: () => {
    const t = now();
    if (hit('jab', t)) return;
    const v = mix(0.14);
    noise(t, 0.022, 2.5, 'bandpass', 2600, 1300, 0.9, { a: 0.001, to: v });
    noise(t, 0.1, 4, 'lowpass', 2600, 600, 1, { to: v });
    tone('triangle', 430, 150, t, 0.08, 1.4, { a: 0.002, to: v });
    thump(t, 190, 60, 0.11, 0.7, v);
  },
  // Crochet : le même coup en plus lourd, saturé, avec la salle qui gronde derrière.
  // Avec le vrai coup : son claquement, posé sur un grave fabriqué qui lui donne du poids.
  crochet: () => {
    const t = now();
    if (hit('crochet', t, 1, 0.22, 2.5)) {
      const d = mix(0.15, 3);
      thump(t, 150, 40, 0.3, 0.45, d);
      noise(t, 0.14, 1.3, 'lowpass', 3000, 400, 1, { to: d }); // un peu de chair sous le claquement, pour la tenue
      return;
    }
    const v = mix(0.26), d = mix(0.2, 3);
    noise(t, 0.028, 2.5, 'bandpass', 2200, 900, 0.8, { a: 0.001, to: v });
    noise(t, 0.17, 2.6, 'lowpass', 3400, 320, 1.2, { to: d });
    tone('triangle', 380, 110, t, 0.12, 1.2, { a: 0.002, to: d });
    thump(t, 150, 40, 0.3, 0.75, d);
    tone('square', 92, 40, t, 0.13, 0.2, { to: d });
    noise(t + 0.03, 0.3, 0.5, 'bandpass', 420, 180, 1.5, { a: 0.03, to: v });
  },
  // Coup bloqué : un « toc » mat sur la garde.
  bloque: () => {
    const t = now(), v = mix(0.18);
    noise(t, 0.03, 1.6, 'bandpass', 1500, 900, 2, { a: 0.001, to: v });
    noise(t, 0.05, 0.4, 'highpass', 2800, 0, 1, { to: v });
    tone('triangle', 560, 380, t, 0.07, 0.55, { to: v });
    tone('sine', 320, 230, t + 0.015, 0.17, 0.5, { to: v });
  },
  // Super (replay sobre) : la montée, puis l'impact.
  superCoup: () => {
    const t = now(), v = mix(0.3);
    pad([196, 294], t, 0.5, 0.15, { cut: [300, 3600], q: 5, glide: 3, to: v });
    noise(t, 0.5, 0.3, 'bandpass', 300, 5000, 3, { a: 0.2, to: v });
    [392, 523, 659, 784, 1047, 1319].forEach((n, i) => tone('sawtooth', n, 0, t + i * 0.075, 0.1, 0.07, { to: v }));
    blast(t + 0.5);
  },
  // K.O. : l'impact, un grave qui n'en finit pas de tomber, un « pwaaah » qui s'effondre, puis trois coups de cloche.
  // Avec le vrai coup : l'impact enregistré et un grave fabriqué, sans le « pwaaah ».
  ko: () => {
    const t = now();
    if (hit('ko', t, 1, 0.3, 2)) {
      const d = mix(0.25, 3.5);
      hit('crochet', t, 1.3, 0.25, 2.5); // un second claquement par-dessus : c'est le médium qui porte le coup sur un téléphone
      thump(t, 130, 26, 1, 0.3, d);
      noise(t, 0.24, 1.3, 'lowpass', 3600, 260, 1, { to: d });
      noise(t, 0.28, 0.9, 'bandpass', 800, 260, 0.8, { to: d });
    } else {
      const v = mix(0.35), d = mix(0.3, 3.5);
      noise(t, 0.03, 2.5, 'bandpass', 2400, 800, 0.7, { a: 0.001, to: v });
      noise(t, 0.27, 2.4, 'lowpass', 3600, 240, 1, { to: d });
      noise(t, 0.3, 1.3, 'bandpass', 800, 260, 0.8, { to: d });
      tone('triangle', 340, 80, t, 0.22, 1.2, { a: 0.002, to: d });
      thump(t, 130, 26, 1.2, 0.75, d);
      pad([220], t + 0.14, 0.85, 0.24, { cut: [1800, 220], q: 6, glide: 0.25, to: v });
    }
    ring(t + 0.9, 0.9); ring(t + 1.22, 0.9); ring(t + 1.54);
  },
  cloche: () => { const t = now(); ring(t); ring(t + 0.32); },
  // Ouverture du combat : cinq notes de cuivres sur une basse, un coup de caisse claire, et la cloche.
  combat: () => {
    const t = now(), v = mix(0.3);
    ([[392, 0, 0.1], [392, 0.12, 0.1], [523, 0.24, 0.15], [659, 0.42, 0.12], [784, 0.56, 0.4]] as const).forEach(([f, at, dur]) => {
      pad([f], t + at, dur, 0.21, { cut: [f * 1.2, f * 6], q: 2, a: 0.015, to: v });
    });
    pad([98, 196], t + 0.42, 0.55, 0.14, { cut: [900, 400], to: v });
    noise(t + 0.42, 0.07, 0.28, 'highpass', 3800, 0, 1, { a: 0.001, to: v });
    ring(t + 0.62, 0.8);
  },
  // Coup de coude : un ressort de dessin animé, annoncé par un petit « pop ».
  coude: () => {
    const t = now(), v = mix(0.2);
    noise(t, 0.02, 0.2, 'bandpass', 1800, 0, 2, { a: 0.001, to: v });
    tone('sine', 220, 260, t, 0.5, 0.5, { a: 0.01, mid: [520, 0.24], vib: [18, 40], to: v });
    tone('triangle', 440, 520, t, 0.36, 0.1, { a: 0.01, mid: [1040, 0.24], vib: [18, 80], to: v });
  },
  // --- Combat animé ---
  // L'air fendu : un souffle qui monte puis retombe.
  whoosh: () => {
    const t = now(), v = mix(0.12);
    noise(t, 0.2, 0.68, 'bandpass', 300, 900, 1.3, { a: 0.07, mid: [2800, 0.45], to: v });
    noise(t, 0.16, 0.16, 'highpass', 5000, 0, 1, { a: 0.06, to: v });
  },
  // Chute sur le tapis.
  thud: () => {
    const t = now();
    if (hit('thud', t, 1, 0.2)) return;
    const v = mix(0.22);
    thump(t, 120, 42, 0.2, 0.75, v);
    noise(t, 0.1, 3.8, 'lowpass', 1100, 300, 1, { to: v });
    tone('triangle', 330, 140, t, 0.09, 1.2, { a: 0.002, to: v });
    noise(t, 0.02, 1.2, 'bandpass', 1300, 0, 1, { a: 0.001, to: v });
  },
  // Ressort : la note bondit, retombe, et tremble tout du long.
  boing: () => {
    const t = now(), v = mix(0.2);
    tone('sine', 170, 250, t, 0.5, 0.46, { mid: [440, 0.22], vib: [26, 46], to: v });
    tone('triangle', 340, 500, t, 0.4, 0.24, { mid: [880, 0.22], vib: [26, 90], to: v });
    noise(t, 0.02, 0.2, 'bandpass', 900, 0, 2, { a: 0.001, to: v });
  },
  // Bouchon qui saute.
  pop: () => {
    const t = now(), v = mix(0.2);
    tone('sine', 320, 1250, t, 0.05, 1.3, { a: 0.002, to: v });
    tone('triangle', 640, 2500, t, 0.04, 0.25, { a: 0.002, to: v });
    noise(t, 0.03, 0.6, 'bandpass', 2400, 0, 1.2, { a: 0.001, to: v });
  },
  // Éclat : deux notes de carillon très aiguës, dans beaucoup de réverbération.
  ting: () => { const t = now(), v = mix(0.45); chime(t, 2093, 0.2, v); chime(t + 0.06, 3136, 0.12, v); },
  // Sifflement d'une chute, avec un léger vibrato.
  fall: () => {
    const t = now(), v = mix(0.25);
    tone('sine', 1650, 270, t, 0.55, 0.2, { a: 0.03, vib: [9, 22], to: v });
    tone('triangle', 825, 135, t, 0.55, 0.06, { a: 0.03, to: v });
  },
  // Vent : une rafale qui enfle et retombe, avec un sifflement lointain.
  wind: () => {
    const t = now(), v = mix(0.3);
    noise(t, 1, 0.6, 'bandpass', 320, 420, 3, { a: 0.5, mid: [760, 0.4], to: v });
    noise(t + 0.1, 0.9, 0.22, 'bandpass', 1100, 900, 5, { a: 0.5, mid: [1700, 0.45], to: v });
    tone('sine', 600, 520, t + 0.2, 0.8, 0.05, { a: 0.4, vib: [5, 14], to: v });
  },
  // Éclairs : des salves serrées, de hauteur irrégulière, sur un bourdon électrique.
  zap: () => {
    const t = now(), v = mix(0.2);
    tone('square', 196, 0, t, 0.95, 0.05, { a: 0.02, vib: [50, 24], to: v });
    for (let i = 0; i < 8; i++) {
      const at = t + i * 0.118 + Math.random() * 0.04;
      tone('sawtooth', 900 + Math.random() * 900, 160 + Math.random() * 120, at, 0.08, 0.27, { a: 0.001, to: v });
      noise(at, 0.045, 0.4, 'highpass', 3200, 0, 1, { a: 0.001, to: v });
    }
  },
  // Ralenti : tout s'affaisse vers le grave.
  slow: () => {
    const t = now(), v = mix(0.35);
    tone('sine', 250, 54, t, 0.75, 0.2, { a: 0.06, to: v });
    pad([250], t, 0.75, 0.3, { cut: [1600, 300], q: 3, glide: 0.4, a: 0.08, to: v });
    noise(t, 0.7, 0.3, 'bandpass', 1500, 300, 2, { a: 0.1, to: v });
  },
  // Annonce du super : une gerbe de notes, un « shing » métallique, un accord qui s'ouvre.
  cutin: () => {
    const t = now(), v = mix(0.38);
    [523, 784, 1047, 1568].forEach((n, i) => tone('sawtooth', n, 0, t + i * 0.045, 0.09, 0.13, { to: v }));
    noise(t, 0.3, 0.26, 'highpass', 5500, 0, 1, { a: 0.02, to: v });
    pad([262, 330, 392, 523], t + 0.16, 0.5, 0.22, { cut: [900, 3200], q: 2, to: v });
    chime(t + 0.2, 2093, 0.13, v);
  },
  // Le Bide gonfle : une montée, le caoutchouc qui couine, l'air qui entre.
  inflate: () => {
    const t = now(), v = mix(0.15);
    tone('sine', 110, 340, t, 0.7, 0.24, { a: 0.05, to: v });
    tone('triangle', 220, 700, t, 0.7, 0.3, { a: 0.1, vib: [31, 26], to: v });
    noise(t, 0.7, 0.4, 'bandpass', 300, 1700, 2, { a: 0.15, to: v });
  },
  // « Pschitt » : un souffle aigu qui bat et s'épuise, sur un sifflet qui descend.
  pschitt: () => {
    const t = now(), v = mix(0.12);
    noise(t, 0.5, 0.3, 'highpass', 6000, 1800, 1, { a: 0.01, trem: [34, 0.5], to: v });
    tone('triangle', 520, 110, t, 0.5, 0.11, { vib: [14, 18], to: v });
  },
  // Ronflement : un grave qui racle, et le souffle.
  snore: () => {
    const t = now(), v = mix(0.1);
    pad([88], t, 0.36, 0.26, { cut: [600, 1100], q: 3, glide: 1.3, a: 0.08, trem: [23, 0.8], to: v });
    noise(t, 0.36, 0.9, 'bandpass', 700, 420, 2, { a: 0.1, trem: [23, 0.6], to: v });
  },
  // L'impact du super sans sa montée (elle est jouée à part pendant la charge).
  superImpact: () => blast(now())
};

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

// ---------- Les vrais sons : la salle du ring et les coups ----------
let soundsJob: Promise<void> | null = null;
let bed: { src: AudioBufferSourceNode; gain: GainNode; off: ReturnType<typeof setTimeout> | null } | null = null;
let bedWanted = false;
/** Volume de chaque son de la salle. Elle accompagne : elle reste quelques décibels sous les coups. */
const CROWD_GAIN: Record<CrowdName, number> = { fond: 0.43, acclame: 0.49, ovation: 0.55, ooh: 0.46, decu: 0.39, applaud: 0.38 };

/** Décode un fichier audio (forme à rappels, comprise par tous les navigateurs, anciens Safari compris). */
function decode(c: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const p = c.decodeAudioData(data, resolve, reject) as Promise<AudioBuffer> | undefined;
    if (p && typeof p.catch === 'function') p.catch(reject);
  });
}

/**
 * Charge les vrais sons (la salle et les coups), une seule fois : téléchargement puis décodage, tous en parallèle.
 * Sans effet si le son est coupé. Un fichier absent ou illisible est simplement ignoré : une réaction de la salle
 * reste alors muette, un coup garde sa version fabriquée. S'il en manque, le prochain combat réessaiera.
 * Le fond démarre dès qu'il est prêt, s'il a été demandé entre-temps.
 */
export function prepareSounds(): Promise<void> {
  if (typeof window === 'undefined' || !soundOn()) return Promise.resolve();
  soundsJob ??= (async () => {
    const c = ac();
    const files = [...Object.entries(CROWD_FILES), ...Object.entries(HIT_FILES)].flatMap(([name, list]) => list.map((file) => ({ name, file })));
    let missing = 0;
    await Promise.all(files.map(async ({ name, file }) => {
      try {
        const res = await fetch(SOUND_BASE + file);
        if (!res.ok) throw new Error(String(res.status));
        const buf = await decode(c, await res.arrayBuffer());
        samples.set(name, [...(samples.get(name) ?? []), buf]);
        if (name === 'fond' && bedWanted) crowdBed(true);
      } catch { missing++; }
    }));
    if (missing) soundsJob = null;
  })();
  return soundsJob;
}

/** Joue une réaction de la salle, si elle est chargée (sinon rien : jamais d'attente pendant le combat). */
export function cheer(name: CrowdName, level = 1) {
  if (typeof window === 'undefined' || !soundOn()) return;
  try {
    const takes = samples.get(name);
    if (!takes?.length) return;
    const c = ac(), src = c.createBufferSource(), g = c.createGain();
    src.buffer = take(name, takes);
    src.playbackRate.value = 0.97 + Math.random() * 0.06; // et jamais tout à fait à la même hauteur
    g.gain.value = CROWD_GAIN[name] * level;
    src.connect(g); g.connect(mix(0.12));
    src.start(c.currentTime + 0.02);
  } catch {}
}

/** Le fond de salle : `true` le fait monter (en boucle), `false` l'éteint en fondu. */
export function crowdBed(on: boolean) {
  if (typeof window === 'undefined') return;
  try {
    bedWanted = on && soundOn();
    if (!bedWanted) {
      const b = bed;
      if (!b || !ctx) return;
      const t = ctx.currentTime;
      b.gain.gain.cancelScheduledValues(t); b.gain.gain.setValueAtTime(Math.max(0.0001, b.gain.gain.value), t); b.gain.gain.setTargetAtTime(0.0001, t, 0.12);
      if (b.off) clearTimeout(b.off);
      b.off = setTimeout(() => { try { b.src.stop(); } catch {} if (bed === b) bed = null; }, 700);
      return;
    }
    const buf = samples.get('fond')?.[0];
    if (!buf) return; // pas encore chargé : prepareSounds le lancera
    const c = ac(), t = c.currentTime;
    if (bed) {
      if (bed.off) { clearTimeout(bed.off); bed.off = null; }
      bed.gain.gain.cancelScheduledValues(t); bed.gain.gain.setValueAtTime(Math.max(0.0001, bed.gain.gain.value), t); bed.gain.gain.setTargetAtTime(CROWD_GAIN.fond, t, 0.25);
      return;
    }
    const src = c.createBufferSource(), g = c.createGain();
    // On boucle à l'intérieur du fichier (voir CROWD_LOOP) ; si le décodage a rendu un son plus court, on s'adapte.
    const end = Math.min(CROWD_LOOP.end, buf.duration - 0.05), start = Math.min(CROWD_LOOP.start, Math.max(0, end - 1));
    src.buffer = buf; src.loop = true; src.loopStart = start; src.loopEnd = end;
    g.gain.setValueAtTime(0.0001, t); g.gain.setTargetAtTime(CROWD_GAIN.fond, t, 0.35);
    src.connect(g); g.connect(mix(0.08));
    src.start(t, start + Math.random() * (end - start));
    bed = { src, gain: g, off: null };
  } catch {}
}
