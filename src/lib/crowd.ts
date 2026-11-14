// La foule du ring, fabriquée par le code : aucun fichier audio.
// Une foule n'est pas un souffle : ce sont des dizaines de voix. Chaque voix est une source « vocale » (une onde
// dont la hauteur dérive et tremble un peu, mêlée de souffle) passée dans les résonances d'une voyelle. Les voix
// sont décalées, désaccordées et réparties entre la gauche et la droite. Les applaudissements sont des centaines
// de claquements très brefs. Tout ici est pur (aucun accès au navigateur) et reproductible : donc testable.

export type CrowdName = 'fond' | 'acclame' | 'ovation' | 'ooh' | 'decu' | 'huees' | 'applaud' | 'stupeur' | 'he';
export const CROWD_NAMES: CrowdName[] = ['fond', 'acclame', 'ovation', 'ooh', 'decu', 'huees', 'applaud', 'stupeur', 'he'];
/** Échantillons par seconde : une foule n'a presque rien au-dessus de 8 kHz, et le calcul reste léger. */
export const CROWD_RATE = 22050;
export interface CrowdClip { left: Float32Array; right: Float32Array; loop: boolean }

type Rng = () => number;
/** Hasard reproductible (mulberry32) : la même graine donne la même foule. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Voyelles : les trois résonances (en Hz) qui font qu'on entend « a », « é », « è », « o » ou « ou ». */
const VOWELS = { a: [750, 1250, 2600], e: [480, 1900, 2600], ai: [580, 1750, 2500], o: [460, 820, 2500], ou: [320, 760, 2300] } as const;
type Vowel = keyof typeof VOWELS;
const FORMANT_Q = [6, 8, 9], FORMANT_GAIN = [1, 0.62, 0.26];
const TAU = Math.PI * 2;

interface Voice {
  at: number; dur: number;
  /** Hauteur de départ (Hz), puis rapport hauteur finale / hauteur de départ. */
  f0: number; bend: number;
  /** Hauteur à l'attaque, en part de f0 (1 = pas d'élan ; 0,85 = la voix « monte » en entrant). */
  scoop: number;
  vowel: Vowel;
  /** Part de souffle : 0 = voix pure, 1 = chuchotement. */
  breath: number;
  gain: number;
  /** De −1 (gauche) à 1 (droite). */
  pan: number;
  attack: number;
}

/** Coefficients d'un résonateur passe-bande (crête à 0 dB). */
function band(f: number, q: number): [number, number, number] {
  const w = (TAU * Math.min(f, CROWD_RATE * 0.45)) / CROWD_RATE, alpha = Math.sin(w) / (2 * q), a0 = 1 + alpha;
  return [alpha / a0, (-2 * Math.cos(w)) / a0, (1 - alpha) / a0];
}

/** Ajoute une voix au mixage. `wrap` : ce qui dépasse la fin revient au début (pour un son en boucle). */
function addVoice(L: Float32Array, R: Float32Array, v: Voice, rand: Rng, wrap: boolean) {
  const len = L.length, n = Math.floor(v.dur * CROWD_RATE), start = Math.floor(v.at * CROWD_RATE);
  const size = 0.88 + rand() * 0.24; // chaque gorge a sa taille : les résonances se décalent d'une personne à l'autre
  const F = VOWELS[v.vowel];
  const [b1, c1, d1] = band(F[0] * size, FORMANT_Q[0]), [b2, c2, d2] = band(F[1] * size, FORMANT_Q[1]), [b3, c3, d3] = band(F[2] * size, FORMANT_Q[2]);
  const g1 = FORMANT_GAIN[0], g2 = FORMANT_GAIN[1], g3 = FORMANT_GAIN[2];
  const ang = ((v.pan + 1) * Math.PI) / 4, gl = Math.cos(ang) * v.gain, gr = Math.sin(ang) * v.gain;
  const vibRate = 4.5 + rand() * 2.5, vibDepth = 0.008 + rand() * 0.014, vibPhase = rand() * TAU;
  const att = Math.max(1, Math.floor(v.attack * CROWD_RATE)), rel = Math.max(1, Math.floor(n * 0.45));
  const voiced = 1 - v.breath, airy = v.breath * 1.7;
  let seed = (rand() * 4294967296) >>> 0, phase = rand(), drift = 0, inc = v.f0 / CROWD_RATE, env = 0;
  let x1 = 0, x2 = 0, p1 = 0, p2 = 0, q1 = 0, q2 = 0, r1 = 0, r2 = 0;
  for (let i = 0; i < n; i++) {
    if ((i & 15) === 0) { // hauteur et volume évoluent lentement : on ne les recalcule que 1 fois sur 16
      const t = i / n;
      drift = drift * 0.97 + (rand() - 0.5) * 0.004; // une voix n'est jamais tenue parfaitement
      const scoop = t < 0.15 ? v.scoop + (1 - v.scoop) * (t / 0.15) : 1;
      inc = (v.f0 * scoop * (1 + (v.bend - 1) * t) * (1 + vibDepth * Math.sin(vibPhase + (TAU * vibRate * i) / CROWD_RATE)) * (1 + drift)) / CROWD_RATE;
      env = (i < att ? 0.5 - 0.5 * Math.cos((Math.PI * i) / att) : 1) * (i > n - rel ? 0.5 + 0.5 * Math.cos((Math.PI * (i - (n - rel))) / rel) : 1);
    }
    phase += inc; if (phase >= 1) phase -= 1;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const x = (2 * phase - 1) * voiced + (seed / 2147483648 - 1) * airy;
    // trois résonateurs en parallèle : y = b·(x − x2) − c·y1 − d·y2
    const dx = x - x2;
    const y1 = b1 * dx - c1 * p1 - d1 * p2; p2 = p1; p1 = y1;
    const y2 = b2 * dx - c2 * q1 - d2 * q2; q2 = q1; q1 = y2;
    const y3 = b3 * dx - c3 * r1 - d3 * r2; r2 = r1; r1 = y3;
    x2 = x1; x1 = x;
    const s = (y1 * g1 + y2 * g2 + y3 * g3) * env;
    let j = start + i;
    if (j >= len) { if (!wrap) break; j %= len; }
    L[j] += s * gl; R[j] += s * gr;
  }
}

/** Un claquement de mains : un éclat de bruit de quelques millisecondes, résonnant autour de `f`. */
function addClap(L: Float32Array, R: Float32Array, at: number, f: number, gain: number, pan: number, rand: Rng) {
  const len = L.length, start = Math.floor(at * CROWD_RATE), n = Math.floor((0.006 + rand() * 0.006) * CROWD_RATE);
  const [b, c, d] = band(f, 1.6), ang = ((pan + 1) * Math.PI) / 4, gl = Math.cos(ang) * gain, gr = Math.sin(ang) * gain, decay = Math.exp(-1 / (0.0028 * CROWD_RATE));
  let seed = (rand() * 4294967296) >>> 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0, e = 1;
  for (let i = 0; i < n * 3 && start + i < len; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const x = i < n ? seed / 2147483648 - 1 : 0, y = b * (x - x2) - c * y1 - d * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    L[start + i] += y * e * gl * 6; R[start + i] += y * e * gr * 6;
    e *= decay;
  }
}

/** Un sifflet : une note pure qui glisse, avec un vibrato rapide. */
function addWhistle(L: Float32Array, R: Float32Array, at: number, dur: number, f0: number, f1: number, gain: number, pan: number, rand: Rng) {
  const len = L.length, start = Math.floor(at * CROWD_RATE), n = Math.floor(dur * CROWD_RATE);
  const ang = ((pan + 1) * Math.PI) / 4, gl = Math.cos(ang) * gain, gr = Math.sin(ang) * gain, vib = 6 + rand() * 4;
  let phase = 0;
  for (let i = 0; i < n && start + i < len; i++) {
    const t = i / n, f = (f0 + (f1 - f0) * Math.sqrt(t)) * (1 + 0.012 * Math.sin((TAU * vib * i) / CROWD_RATE));
    phase += (TAU * f) / CROWD_RATE;
    const s = Math.sin(phase) * Math.sin(Math.PI * t) ** 0.7;
    L[start + i] += s * gl; R[start + i] += s * gr;
  }
}

/** Les applaudissements : `count` claquements répartis selon une courbe de densité (0 à 1) au fil du temps. */
function applause(L: Float32Array, R: Float32Array, count: number, density: (t: number) => number, rand: Rng, gain = 1) {
  const seconds = L.length / CROWD_RATE;
  for (let placed = 0, tries = 0; placed < count && tries < count * 20; tries++) {
    const at = rand() * (seconds - 0.03);
    if (rand() > density(at)) continue;
    addClap(L, R, at, 900 + rand() * 1700, (0.35 + rand() * 0.65) * gain, rand() * 2 - 1, rand);
    placed++;
  }
}
/** Courbe en trapèze : monte jusqu'à `up`, tient jusqu'à `hold`, retombe jusqu'à `end`. */
const trapeze = (up: number, hold: number, end: number) => (t: number) => (t < up ? t / up : t < hold ? 1 : t < end ? 1 - (t - hold) / (end - hold) : 0);

const pick = <T,>(rand: Rng, list: readonly T[]): T => list[Math.floor(rand() * list.length)];
const between = (rand: Rng, a: number, b: number) => a + rand() * (b - a);

interface Chorus {
  count: number; vowels: readonly Vowel[];
  /** Fenêtre des départs, durée, hauteur, glissement, élan d'attaque, souffle, attaque : [min, max]. */
  at: [number, number]; dur: [number, number]; f0: [number, number]; bend: [number, number]; scoop: [number, number]; breath: [number, number]; attack: [number, number];
}
/** Un chœur : `count` voix tirées au hasard dans les plages données. */
function chorus(L: Float32Array, R: Float32Array, c: Chorus, rand: Rng, wrap = false) {
  const seconds = L.length / CROWD_RATE;
  for (let i = 0; i < c.count; i++) {
    const at = between(rand, c.at[0], c.at[1]);
    const dur = wrap ? between(rand, c.dur[0], c.dur[1]) : Math.min(between(rand, c.dur[0], c.dur[1]), seconds - at - 0.01);
    if (dur < 0.05) continue;
    // les voix aiguës (femmes, enfants) sont moins nombreuses : la plage est parcourue en favorisant le grave
    const f0 = c.f0[0] + (c.f0[1] - c.f0[0]) * rand() ** 1.6;
    addVoice(L, R, {
      at, dur, f0, bend: between(rand, c.bend[0], c.bend[1]), scoop: between(rand, c.scoop[0], c.scoop[1]), vowel: pick(rand, c.vowels),
      breath: between(rand, c.breath[0], c.breath[1]), gain: between(rand, 0.5, 1), pan: between(rand, -1, 1), attack: between(rand, c.attack[0], c.attack[1])
    }, rand, wrap);
  }
}

const SECONDS: Record<CrowdName, number> = { fond: 4, acclame: 1.8, ovation: 3.8, ooh: 1.25, decu: 1.3, huees: 1.6, applaud: 2.2, stupeur: 0.6, he: 0.4 };

/** Fabrique un son de foule. Le fond est une boucle sans raccord ; les autres sont des réactions. */
export function makeCrowd(name: CrowdName, seed = 20100): CrowdClip {
  const n = Math.floor(SECONDS[name] * CROWD_RATE), L = new Float32Array(n), R = new Float32Array(n);
  const rand = rng(seed + CROWD_NAMES.indexOf(name) * 977);
  switch (name) {
    // Brouhaha : des syllabes courtes et soufflées, de toutes les voyelles, qui se chevauchent sans fin.
    case 'fond':
      chorus(L, R, { count: 84, vowels: ['a', 'e', 'ai', 'o', 'ou'], at: [0, 4], dur: [0.12, 0.4], f0: [95, 250], bend: [0.85, 1.15], scoop: [0.94, 1], breath: [0.35, 0.6], attack: [0.03, 0.06] }, rand, true);
      break;
    // Acclamation : « ouaaais ! » Les voix entrent en montant, deux sifflets fusent.
    case 'acclame':
      chorus(L, R, { count: 26, vowels: ['a', 'a', 'e', 'ai'], at: [0, 0.22], dur: [0.7, 1.5], f0: [160, 420], bend: [0.9, 1.02], scoop: [0.82, 0.95], breath: [0.3, 0.55], attack: [0.04, 0.1] }, rand);
      addWhistle(L, R, between(rand, 0.2, 0.5), 0.32, 1900, 2700, 0.5, -0.6, rand);
      addWhistle(L, R, between(rand, 0.6, 0.9), 0.28, 2100, 2900, 0.4, 0.7, rand);
      break;
    // Ovation : l'acclamation qui dure, portée par les applaudissements et les sifflets.
    case 'ovation': {
      chorus(L, R, { count: 38, vowels: ['a', 'a', 'e', 'ai'], at: [0, 2], dur: [0.7, 1.5], f0: [160, 420], bend: [0.9, 1.02], scoop: [0.82, 0.95], breath: [0.3, 0.55], attack: [0.04, 0.1] }, rand);
      applause(L, R, 520, trapeze(0.5, 2.4, 3.7), rand, 0.7);
      for (let i = 0; i < 5; i++) addWhistle(L, R, between(rand, 0.3, 2.6), between(rand, 0.25, 0.4), between(rand, 1800, 2200), between(rand, 2500, 3000), between(rand, 0.3, 0.5), between(rand, -1, 1), rand);
      break;
    }
    // « OOOH ! » : toute la salle sur la même voyelle, qui retombe.
    case 'ooh':
      chorus(L, R, { count: 28, vowels: ['o', 'o', 'o', 'ou'], at: [0, 0.1], dur: [0.75, 1.05], f0: [140, 300], bend: [0.84, 0.94], scoop: [0.9, 1], breath: [0.12, 0.25], attack: [0.05, 0.09] }, rand);
      break;
    // « Ohhh… » déçu : moins de monde, et la voix s'effondre.
    case 'decu':
      chorus(L, R, { count: 16, vowels: ['o', 'o', 'ou'], at: [0, 0.14], dur: [0.8, 1.1], f0: [150, 260], bend: [0.58, 0.7], scoop: [1, 1.06], breath: [0.18, 0.3], attack: [0.07, 0.12] }, rand);
      break;
    // Huées : « bouuuh », grave, tenu, qui s'installe lentement.
    case 'huees':
      chorus(L, R, { count: 24, vowels: ['ou'], at: [0, 0.25], dur: [1, 1.4], f0: [105, 190], bend: [0.92, 1], scoop: [0.97, 1.03], breath: [0.12, 0.22], attack: [0.1, 0.16] }, rand);
      break;
    case 'applaud':
      applause(L, R, 320, trapeze(0.15, 1.3, 2.1), rand);
      break;
    // Stupeur : la salle retient son souffle (presque chuchoté).
    case 'stupeur':
      chorus(L, R, { count: 14, vowels: ['a', 'e'], at: [0, 0.06], dur: [0.3, 0.5], f0: [180, 320], bend: [1.05, 1.2], scoop: [0.9, 1], breath: [0.82, 0.95], attack: [0.03, 0.06] }, rand);
      break;
    // « Hé ! » : bref, quelques voix, qui montent.
    case 'he':
      chorus(L, R, { count: 9, vowels: ['ai', 'e'], at: [0, 0.04], dur: [0.16, 0.28], f0: [190, 360], bend: [1.04, 1.12], scoop: [0.92, 1], breath: [0.25, 0.4], attack: [0.012, 0.025] }, rand);
      break;
  }
  // Mise à niveau : la crête à 0,9. Le volume de chaque réaction se règle au moment de la jouer.
  let peak = 0;
  for (let i = 0; i < n; i++) { const a = Math.abs(L[i]), b = Math.abs(R[i]); if (a > peak) peak = a; if (b > peak) peak = b; }
  const k = peak > 0 ? 0.9 / peak : 0, loop = name === 'fond', fade = Math.floor(0.02 * CROWD_RATE);
  for (let i = 0; i < n; i++) {
    const edge = loop ? 1 : Math.min(1, i / fade, (n - 1 - i) / fade); // une réaction commence et finit au silence
    L[i] *= k * edge; R[i] *= k * edge;
  }
  return { left: L, right: R, loop };
}
