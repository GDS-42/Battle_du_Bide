// Générateur de combattant paramétrique (vue 3/4, garde de boxe, tourné vers la droite).
// Même logique que le composant du canevas de DA (design/canvas/Fighter.dc.html).
import type { FighterRender } from './types';

export const SKINS: Record<string, string> = { porcelaine: '#F7D9C4', peche: '#F0B38A', miel: '#DDA06B', caramel: '#C68350', cannelle: '#A86B45', noisette: '#8E5532', cacao: '#6E3F25', ebene: '#4E2C1C' };
export const HAIRS: Record<string, string> = { noir: '#1B1420', brun: '#3B2416', chatain: '#6B4226', roux: '#B5532A', blond: '#E2B54B', gris: '#9C97A6', blanc: '#EDE8F2', rose: '#FF5FA2', bleu: '#2BB5FF' };

type Pt = { x: number; y: number };
type Node = { x: number; y: number; w: number };
export type FighterView = ReturnType<typeof gen>;

const r1 = (n: number) => Math.round(n * 10) / 10;
const hex = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return '#' + [0, 1, 2].map((i) => { const v = Math.round(A[i] + (B[i] - A[i]) * t); return (v < 16 ? '0' : '') + v.toString(16); }).join('');
};
const P = (x: number, y: number): Pt => ({ x, y });
const closed = (pts: Pt[]) => {
  const n = pts.length; let d = 'M ' + r1(pts[0].x) + ' ' + r1(pts[0].y);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ' C ' + r1(p1.x + (p2.x - p0.x) / 6) + ' ' + r1(p1.y + (p2.y - p0.y) / 6) + ' ' + r1(p2.x - (p3.x - p1.x) / 6) + ' ' + r1(p2.y - (p3.y - p1.y) / 6) + ' ' + r1(p2.x) + ' ' + r1(p2.y);
  }
  return d + ' Z';
};
const open = (pts: Pt[]) => {
  const n = pts.length; let d = '';
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    d += ' C ' + r1(p1.x + (p2.x - p0.x) / 6) + ' ' + r1(p1.y + (p2.y - p0.y) / 6) + ' ' + r1(p2.x - (p3.x - p1.x) / 6) + ' ' + r1(p2.y - (p3.y - p1.y) / 6) + ' ' + r1(p2.x) + ' ' + r1(p2.y);
  }
  return d;
};
const sides = (nodes: Node[], extra = 0) => {
  const L: Pt[] = [], R: Pt[] = [], n = nodes.length;
  for (let i = 0; i < n; i++) {
    const a = nodes[Math.max(0, i - 1)], b = nodes[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len, ny = dx / len, h = (nodes[i].w + extra) / 2;
    L.push(P(nodes[i].x + nx * h, nodes[i].y + ny * h));
    R.push(P(nodes[i].x - nx * h, nodes[i].y - ny * h));
  }
  return { L, R };
};
const limb = (nodes: Node[], extra = 0) => {
  const s = sides(nodes, extra), n = nodes.length;
  const rEnd = r1((nodes[n - 1].w + extra) / 2), rStart = r1((nodes[0].w + extra) / 2);
  let d = 'M ' + r1(s.L[0].x) + ' ' + r1(s.L[0].y) + open(s.L);
  d += ' A ' + rEnd + ' ' + rEnd + ' 0 0 0 ' + r1(s.R[n - 1].x) + ' ' + r1(s.R[n - 1].y);
  d += open(s.R.slice().reverse());
  d += ' A ' + rStart + ' ' + rStart + ' 0 0 0 ' + r1(s.L[0].x) + ' ' + r1(s.L[0].y) + ' Z';
  return d;
};
const edge = (nodes: Node[], side: 'L' | 'R', inset: number) => {
  const s = sides(nodes.map((q) => ({ x: q.x, y: q.y, w: q.w - 2 * inset })));
  const pts = side === 'L' ? s.L : s.R;
  return 'M ' + r1(pts[0].x) + ' ' + r1(pts[0].y) + open(pts);
};
const dot = (cx: number, cy: number, r: number) => 'M ' + r1(cx - r) + ' ' + r1(cy) + ' a ' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0 a ' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0 Z ';
const scallop = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number, bump: number) => {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180, f = i % 2 ? 1 : 1 + bump;
    pts.push(P(cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f));
  }
  return pts;
};

export function gen(o0: FighterRender & { id: string }) {
  const o = { ...o0 } as FighterRender & { id: string; fem?: boolean; hair?: string; shorts?: string };
  if (o.fem && !o.base) o.base = 'B';
  const isB = o.base === 'B';
  if (o.hair && !o.hairColor) o.hairColor = o.hair;
  if (!o.hairStyle) o.hairStyle = isB ? 'ponytail' : 'spiky';
  if (o.shorts && !o.main) o.main = o.shorts;
  const acc = o.acc ?? [];
  const has = (a: string) => (acc as string[]).indexOf(a) >= 0;
  const outfit = o.outfit ?? 'boxe';
  const senior = (o.age ?? 'adulte') === 'senior';
  const k = Math.max(0, Math.min(1, o.k));
  const pose = o.pose ?? 'guard';
  const id = o.id;
  const lerp = (a: number, b: number) => a + (b - a) * k;

  const ghost = !!o.ghost;
  const OUTS = {
    boxe: { foot: 'boot', pants: false, sleeves: null, garment: o.tank ? 'tank' : isB ? 'bra' : null, main: '#D22B3A' },
    catch: { foot: 'high', pants: false, sleeves: null, garment: 'singlet', main: '#E8287C' },
    kimono: { foot: 'bare', pants: true, sleeves: 'kimono', garment: 'kimono', main: '#F4F1EA' },
    mma: { foot: 'bare', pants: false, sleeves: 'short', garment: 'rash', main: '#2A1548' },
    track: { foot: 'sneaker', pants: true, sleeves: 'long', garment: 'track', main: '#5A2A7A' }
  } as const;
  const OUT = OUTS[outfit] ?? OUTS.boxe;
  const shadowTint = '#4B2273';
  let skin = SKINS[o.skin ?? ''] || o.skin || SKINS.peche;
  let hairC = HAIRS[o.hairColor ?? ''] || o.hairColor || (senior ? HAIRS.gris : HAIRS.brun);
  let main = o.main || OUT.main;
  let trim = o.trim || '#FFF4E3';
  let glove = o.glove || (outfit === 'kimono' ? '#D22B3A' : outfit === 'mma' ? '#E8287C' : main);
  let top = o.top || main;
  let bottom = o.bottom || (outfit === 'mma' ? '#140A22' : main);
  let boot = o.boot || (OUT.foot === 'high' ? '#2A1548' : trim);
  let belt = o.belt || '#140A22';
  let band = o.band || '#E8287C';
  let bandanaC = o.bandana || '#D22B3A';
  const mask = outfit === 'catch' && !!o.mask;
  if (ghost) {
    const g = '#2A1548';
    skin = g; hairC = g; main = g; trim = g; glove = g; top = g; bottom = g; boot = g; belt = g; band = g; bandanaC = g;
  }
  const skinSh = mix(skin, '#A33A6A', 0.36), skinHi = mix(skin, '#FFF4E3', 0.4), skinDeep = mix(skin, '#7A2E63', 0.42);
  const sh = (c: string) => mix(c, shadowTint, 0.45);
  const hi = (c: string) => mix(c, '#FFF4E3', 0.35);

  // Torse
  const fs = isB ? 4 : 0, fh = isB ? 4 : 0;
  const T = {
    neckB: P(lerp(112, 108), 84), trapB: P(lerp(98, 90) + fs * 0.5, lerp(92, 90)), shB: P(lerp(84, 74) + fs, 104),
    upB: P(lerp(85, 70) + fs * 0.5, 126), midB: P(lerp(94, 68), 154), lowB: P(lerp(96, 72) - fh * 0.5, 178),
    hipB: P(lerp(96, 78) - fh, 199), hipF: P(lerp(146, 166) + fh, 201), lowF: P(lerp(149, 190), lerp(180, 186)),
    belly: P(lerp(151, 200), lerp(157, 160)), chestU: P(lerp(158, 184) + (isB ? 3 : 0), 134), chest: P(lerp(163, 176) + (isB ? 4 : 0), 114),
    shF: P(lerp(158, 166) - fs, 99), trapF: P(lerp(141, 146), 87), neckF: P(lerp(132, 136), 83)
  };
  const torso = closed([T.neckB, T.trapB, T.shB, T.upB, T.midB, T.lowB, T.hipB, T.hipF, T.lowF, T.belly, T.chestU, T.chest, T.shF, T.trapF, T.neckF]);
  const nw = 7 * k;
  const neck = 'M ' + r1(110 - nw) + ' 60 L ' + r1(136 + nw) + ' 64 L ' + r1(140 + nw) + ' 92 L ' + r1(108 - nw) + ' 94 Z';
  const cxm = lerp(138, 154);

  // Tête et traits
  const chinF = P(lerp(147, 151), lerp(72, 76)), chinU = P(lerp(135, 134), lerp(78, 86)), jaw = P(lerp(118, 110), lerp(72, 78));
  const head = closed([P(104, 46), P(109, 30), P(125, 21), P(143, 26), P(150, 39), P(152, 50), P(151, 61), chinF, chinU, jaw, P(lerp(106, 103), 60)]);
  const noses: Record<string, string> = { fin: 'M 152 50 Q 160 57 151 61', large: 'M 151 49 Q 163 55 158.5 61 Q 155 63.5 149.5 61', busque: 'M 151 43 Q 159 49 160.5 58 Q 158 61.5 151 61' };
  const nose = noses[o.nose ?? ''] || noses.fin;
  const chin2 = 'M ' + r1(lerp(124, 120)) + ' ' + r1(lerp(80, 85)) + ' Q 140 ' + r1(lerp(84, 91)) + ' ' + r1(lerp(148, 151)) + ' ' + r1(lerp(76, 78));
  const hurt = pose === 'hurt';
  const EYES: Record<string, { d: string; p: number[] }> = {
    amande: { d: 'M 126 50 Q 133 44.5 141 48.5 Q 134 54.5 126 50 Z M 145.5 49 Q 149.5 45.5 153.5 47.5 Q 149.5 52.5 145.5 49 Z', p: [136.5, 49, 2.7, 150.5, 48.6, 1.9] },
    ronds: { d: 'M 127 49.5 Q 133 42 140.5 47.5 Q 134 56.5 127 49.5 Z M 145.5 48.5 Q 149.5 43 153.5 46.5 Q 150 54 145.5 48.5 Z', p: [135.5, 48.8, 3.1, 150, 48.3, 2.1] },
    etires: { d: 'M 126 50.5 Q 133 46.5 141.5 47.5 Q 134 52.5 126 50.5 Z M 145.5 48.5 Q 149.5 46 153.5 46.5 Q 149.5 50.5 145.5 48.5 Z', p: [136.2, 49.3, 2.3, 150.3, 48, 1.7] }
  };
  const E = EYES[o.eyes ?? ''] || EYES.amande;
  const eye = hurt ? 'M 127 46 L 137 50 L 127 54 M 153 46 L 146 49.5 L 153 53' : E.d;
  const pupils = hurt || ghost ? '' : dot(E.p[0], E.p[1], E.p[2]) + dot(E.p[3], E.p[4], E.p[5]);
  const brow = hurt ? 'M 124 39 Q 132 37 140 40 M 145 40 Q 149 38 153 40' : 'M 124 39.5 L 140 42.5 M 145.5 42.5 L 153 39.5';
  const mouth = hurt ? 'M 136 65 Q 143 61 150 66 Q 142 71 136 65 Z' : 'M 136 67 Q 143 65 150 66.5';
  const lips = !hurt && o.lips === 'pleines' ? 'M 138.5 68.4 Q 143.8 72.4 149 68.1 Q 143.8 69.6 138.5 68.4 Z M 138 66.2 Q 143 63.4 149.5 65.6' : '';
  let wrinkles = senior ? 'M 129 33 Q 137 31 145 33.5 M 131 36.5 Q 137.5 35.2 144 37 M 124.5 47 L 120.5 45 M 124.5 50.5 L 120.5 52 M 129 55.5 Q 134 57.5 139.5 55.5 M 149.5 59 Q 146 63 147 68.5' : '';
  const browC = senior ? mix(hairC, '#140A22', 0.3) : '#140A22';

  // Coiffures
  let hairBack = '', hairStrands = '', hairCap = '', hairFront = '', hairLines = '', shine = '';
  const capPony = 'M 151 36 C 152 18 133 9 116 13 C 101 17 95 33 99 50 L 106 61 L 111 49 C 115 38 128 32 143 37 Z';
  const capBuzz = 'M 149 33 C 146 21 132 15 118 17 C 105 20 99 32 100 46 L 106 57 L 110 46 C 114 36 128 30 147 36 Z';
  const hs = o.hairStyle;
  if (hs === 'spiky') hairFront = 'M 150 33 L 153 22 L 143 23 L 145 13 L 131 18 L 129 8 L 117 17 L 109 12 L 107 24 L 97 25 L 102 38 L 98 50 L 107 58 L 111 46 L 117 37 L 131 32 L 146 36 Z';
  if (hs === 'buzz') hairCap = capBuzz;
  if (hs === 'mohawk') { hairCap = capBuzz; hairFront = 'M 147 31 L 155 15 L 142 19 L 146 4 L 131 14 L 127 -1 L 118 14 L 107 6 L 109 22 L 99 23 L 105 32 L 118 27 L 134 25 Z'; }
  if (hs === 'afro') {
    hairFront = closed(scallop(124, 30, 41, 35, 12, -196, 22, 0.07).concat([P(99, 62), P(106, 52), P(114, 41), P(130, 34), P(146, 37), P(156, 42)]));
    hairLines = 'M 112 14 q 4 -3 8 0 M 134 10 q 4 -3 8 0 M 98 30 q 3 -4 7 -1 M 146 22 q 4 -2 7 1 M 122 4 q 4 -3 8 0';
  }
  if (hs === 'braids') {
    hairFront = capPony;
    hairLines = 'M 149 34 C 136 21 118 19 104 30 M 150 38 C 138 28 120 27 103 39 M 147 30 C 134 15 116 14 106 23';
    hairStrands = 'M 104 50 C 92 66 82 88 78 112 M 109 56 C 99 74 91 96 88 118';
  }
  if (hs === 'dreads') {
    hairFront = capPony;
    hairLines = 'M 140 26 l 2 6 M 128 20 l 1 7 M 116 20 l 0 7 M 106 28 l -1 6';
    hairStrands = 'M 104 34 C 90 52 80 76 78 100 M 99 44 C 86 60 76 80 72 98 M 110 30 C 98 50 92 72 90 94 M 116 28 C 108 46 104 64 104 80';
  }
  if (hs === 'bun') { hairBack = dot(104, 19, 13); hairFront = capPony; hairLines = 'M 147 33 C 137 25 122 23 110 28 M 148 37 C 138 31 124 30 112 35'; }
  if (hs === 'ponytail') { hairBack = 'M 104 30 C 84 25 69 40 73 63 C 75 78 69 90 60 97 C 80 94 93 79 93 61 C 93 49 98 41 108 38 Z'; hairFront = capPony; }
  if (hs === 'long') {
    hairBack = 'M 103 28 C 80 34 70 70 72 104 C 73 120 82 130 94 130 C 106 130 114 122 116 110 L 114 70 Z';
    hairFront = 'M 152 40 C 153 18 133 8 115 12 C 99 16 93 34 96 56 C 98 70 101 82 106 92 L 114 88 C 110 76 109 60 112 50 C 116 40 128 33 146 38 Z';
    hairLines = 'M 140 30 C 128 26 116 30 108 44';
  }
  if (hs === 'bob') {
    hairFront = 'M 153 42 C 154 18 134 8 116 12 C 98 16 92 36 95 58 C 96 68 99 76 105 80 L 117 78 C 113 68 111 56 113 48 C 117 40 130 34 153 44 Z';
    hairLines = 'M 140 32 C 132 30 124 33 118 40';
  }
  if (hs === 'receding') { hairFront = 'M 121 40 C 116 33 105 33 100 41 C 96 48 97 58 102 65 L 108 66 L 109 59 C 106 55 106 49 110 45 C 113 42 117 42 121 43 Z'; hairLines = 'M 103 46 q 2 5 1 10 M 107 39 q 3 2 6 1'; shine = 'M 122 25 q 8 -4 15 0 q -8 2 -15 0 Z'; }
  if (hs === 'bald') shine = 'M 120 26 q 9 -5 18 0 q -9 2.5 -18 0 Z';
  const capC = mix(hairC, skin, 0.45);

  // Barbes
  const beardC = HAIRS[o.beardColor ?? ''] || o.beardColor || hairC;
  let beard = '', moustache = '', stubble = '';
  const shortBeard = closed([P(113, 48), P(lerp(116, 108), lerp(72, 79)), P(lerp(134, 133), lerp(83, 91)), P(lerp(150, 154), lerp(76, 80)), P(152.5, 68), P(146, 70.5), P(137, 70.5), P(126, 64), P(119, 53)]);
  const musta = 'M 135 64.5 Q 142 58.5 151.5 61.5 Q 154.5 65.5 150 66.2 Q 143 62.8 136 66.8 Z';
  if (o.beard === 'stubble') stubble = shortBeard;
  if (o.beard === 'short') { beard = shortBeard; moustache = musta; }
  if (o.beard === 'big') {
    beard = closed([P(113, 48), P(lerp(114, 106), lerp(80, 86)), P(lerp(123, 119), lerp(101, 107)), P(lerp(137, 137), lerp(112, 118)), P(lerp(151, 157), lerp(99, 103)), P(lerp(155, 159), lerp(78, 82)), P(152.5, 68), P(146, 71), P(137, 71), P(126, 64), P(119, 53)]);
    moustache = musta;
  }
  if (o.beard === 'moustache') moustache = 'M 134 65 Q 141 57.5 152 61 Q 156 66 151 67.5 Q 143 63.5 135 68 Z';
  if (o.beard === 'goatee') { beard = closed([P(139.5, 70.5), P(145, 69.6), P(151, 70), P(r1(lerp(151.5, 155)), r1(lerp(78, 82))), P(145, r1(lerp(84.5, 89))), P(139.5, r1(lerp(79, 83)))]); moustache = 'M 137 65 Q 143 60.5 150.5 62 Q 152 65 149 65.8 Q 143 63.4 138 66.5 Z'; }

  // Accessoires
  let glasses = '';
  if (has('glassesRound')) glasses = dot(133.5, 49, 8.5) + 'M 145.5 47.5 a 4.5 7.5 0 1 0 9 0 a 4.5 7.5 0 1 0 -9 0 Z M 142 47.5 Q 143.7 46 145.5 47 M 125 48 L 113 50';
  if (has('glassesSquare')) glasses = 'M 124.5 43 L 142.5 43 L 141.5 55 L 125.5 55 Z M 145.5 43 L 154.5 42.5 L 154 54 L 145.5 54.5 Z M 142.5 47 L 145.5 47 M 124.5 47 L 113 50';
  let bandD = has('headband') ? 'M 103 40 C 116 28 137 25 151 32 L 151 40 C 137 34 119 36 105 47 Z' : '';
  let bandana = has('bandana') ? 'M 152 39 C 153 18 133 8 115 12 C 99 16 93 32 98 48 L 104 53 C 108 42 121 35 152 39 Z M 99 41 L 82 48 L 89 55 L 101 47 Z M 100 46 L 87 62 L 95 64 L 103 50 Z' : '';
  let bandanaDots = has('bandana') ? dot(128, 20, 2.2) + dot(140, 26, 2.2) + dot(114, 22, 2.2) + dot(108, 36, 2.2) + dot(124, 31, 2.2) : '';
  const earring = has('earrings') ? dot(110, 67, 3.6) : '';

  // Masque de catch
  const maskD = mask ? 'M 0 -10 L 240 -10 L 240 63.5 L 0 63.5 Z' : '';
  const maskTrim = mask ? 'M 121 51 Q 132 36.5 145.5 46.5 Q 135 59.5 121 51 Z M 143 49.5 Q 150.5 39.5 158 46 Q 152 56.5 143 49.5 Z M 128 20 L 134 30 L 128 36 L 122 30 Z' : '';
  if (mask) { hairBack = ''; hairStrands = ''; hairCap = ''; hairFront = ''; hairLines = ''; shine = ''; bandD = ''; bandana = ''; bandanaDots = ''; wrinkles = ''; }

  // Bras
  const aw = (a: number) => a + 15 * k;
  let leadNodes: Node[], leadG: { x: number; y: number; r: number };
  if (pose === 'punch') {
    leadNodes = [{ x: lerp(160, 168), y: 103, w: aw(24) }, { x: lerp(180, 188), y: 101, w: aw(21) }, { x: lerp(200, 206), y: 100, w: aw(15) - 4 * k }, { x: lerp(214, 220), y: 99, w: aw(17) - 3 * k }, { x: lerp(226, 230), y: 98, w: aw(13) - 6 * k }];
    leadG = { x: lerp(238, 242), y: 97, r: 0 };
  } else {
    leadNodes = [{ x: lerp(160, 168), y: 105, w: aw(24) }, { x: lerp(172, 184), y: 122, w: aw(22) }, { x: lerp(180, 194), y: 139, w: aw(16) - 4 * k }, { x: lerp(190, 202), y: 124, w: aw(18) - 3 * k }, { x: lerp(198, 208), y: 110, w: aw(14) - 6 * k }];
    leadG = { x: lerp(205, 214), y: 97, r: -35 };
  }
  const rearNodes: Node[] = [{ x: lerp(97, 86), y: 106, w: aw(23) }, { x: lerp(98, 84), y: 126, w: aw(21) }, { x: lerp(105, 92), y: 146, w: aw(16) - 4 * k }, { x: lerp(117, 108), y: 134, w: aw(18) - 3 * k }, { x: lerp(130, 124), y: 116, w: aw(14) - 6 * k }];
  const rearG = { x: lerp(138, 132), y: 100, r: -62 };
  if (hurt) { leadG = { x: lerp(200, 208), y: 118, r: -5 }; leadNodes[3] = { x: lerp(190, 202), y: 132, w: aw(18) - 3 * k }; leadNodes[4] = { x: lerp(194, 204), y: 126, w: aw(14) - 6 * k }; }
  const sleeve = (nodes: Node[]) => {
    if (OUT.sleeves === 'short') return limb(nodes.slice(0, 2), 6);
    if (OUT.sleeves === 'long') return limb(nodes.slice(0, 5), 5);
    if (OUT.sleeves === 'kimono') return limb(nodes.slice(0, 4), 12);
    return '';
  };
  const sleeveStripe = (nodes: Node[]) => (OUT.sleeves === 'long' ? edge(nodes.slice(0, 5), 'R', 4) : '');

  // Jambes
  const lw = (a: number, b: number) => a + b * k * 1.5 + (outfit === 'kimono' ? 8 : outfit === 'track' ? 4 : 0);
  const sx = 7 * k;
  const legFN: Node[] = [{ x: 140 + sx, y: 196, w: lw(31, 15) }, { x: 151 + sx, y: 223, w: lw(28, 14) }, { x: 160 + sx, y: 248, w: lw(19, 8) }, { x: 161 + sx, y: 264, w: lw(21, 10) }, { x: 158 + sx, y: 285, w: lw(14, 4) }];
  const legRN: Node[] = [{ x: 106 - sx, y: 196, w: lw(31, 15) }, { x: 98 - sx, y: 223, w: lw(28, 14) }, { x: 90 - sx, y: 248, w: lw(19, 8) }, { x: 88 - sx, y: 264, w: lw(21, 10) }, { x: 86 - sx, y: 285, w: lw(14, 4) }];
  const legF = limb(legFN), legR = limb(legRN);
  const legC = OUT.pants ? bottom : skin;
  const pantsStripe = outfit === 'track' ? edge(legFN.slice(1), 'R', 4) : '';
  const hem = OUT.pants ? 'M ' + r1(158 + sx - lw(14, 4) / 2) + ' 279 L ' + r1(158 + sx + lw(14, 4) / 2) + ' 279 M ' + r1(86 - sx - lw(14, 4) / 2) + ' 279 L ' + r1(86 - sx + lw(14, 4) / 2) + ' 279' : '';

  // Pieds
  const FEET = {
    boot: { d: 'M -9 -13 L 10 -13 L 11 4 C 22 5 30 9 30 17 L -11 17 Z', band: 'M -10 -4 L 10 -4', sole: 'M -11 12 L 30 12', fill: boot },
    high: { d: 'M -11 -36 L 12 -36 L 12 4 C 23 5 31 9 31 17 L -12 17 Z', band: 'M -11 -30 L 12 -30 M -5 -22 L 6 -18 M -5 -14 L 6 -10 M -5 -6 L 6 -2', sole: 'M -12 12 L 31 12', fill: boot },
    sneaker: { d: 'M -10 -8 L 10 -8 C 16 -4 29 2 31 10 L 31 17 L -11 17 Z', band: 'M 0 -3 L 13 8', sole: 'M -11 11 L 31 11', fill: '#FFF4E3' },
    bare: { d: 'M -8 -8 L 9 -8 C 16 0 30 5 31 12 C 31 16 27 18 21 17 L -9 17 Z', band: 'M 23 12 L 23 17 M 27 12 L 27 16', sole: '', fill: skin }
  } as const;
  const F = FEET[OUT.foot];
  const footScale = OUT.foot === 'high' ? r1(1 + 0.55 * k) : 1;

  // Short / bas
  const tF = lw(28, 14) / 2, wf = 4 * k;
  const shortsD = 'M ' + r1(T.hipB.x - 3) + ' ' + r1(186 + wf * 0.5) + ' L ' + r1(T.hipF.x + 3) + ' ' + r1(188 + wf) +
    ' L ' + r1(155 + sx + tF + 6) + ' 242 L ' + r1(155 + sx - tF - 2) + ' 246 L 123 224 L ' + r1(95 - sx + tF + 2) + ' 246 L ' + r1(95 - sx - tF - 6) + ' 242 Z';
  const waist = 'M ' + r1(T.hipB.x - 3) + ' ' + r1(186 + wf * 0.5) + ' L ' + r1(T.hipF.x + 3) + ' ' + r1(188 + wf) +
    ' L ' + r1(T.hipF.x + 4) + ' ' + r1(198 + wf) + ' L ' + r1(T.hipB.x - 4) + ' ' + r1(196 + wf * 0.5) + ' Z';
  const stripe = 'M ' + r1(T.hipF.x - 1) + ' ' + r1(199 + wf) + ' L ' + r1(155 + sx + tF + 3) + ' 241';
  const waistOp = outfit === 'boxe' || outfit === 'mma' || outfit === 'track' ? 1 : 0;
  const stripeOp = outfit === 'boxe' || outfit === 'mma' ? 1 : 0;
  const waistC = outfit === 'track' ? sh(bottom) : trim;

  // Hauts
  let g0 = '', g1 = '', gLines = '', beltD = '', beltKnot = '';
  const g0C = trim, g1C = top;
  const G = OUT.garment;
  if (G === 'tank') g1 = 'M 30 330 L 30 106 L ' + r1(T.neckB.x - 6) + ' 96 Q ' + r1(cxm - 14) + ' 126 ' + r1(cxm + 4) + ' 100 L 230 100 L 230 330 Z';
  if (G === 'bra') { g1 = 'M 60 93 L 210 93 L 210 136 Q 140 146 60 140 Z'; gLines = 'M 60 140 Q 140 146 210 136'; }
  if (G === 'singlet') {
    g1 = 'M 30 330 L 30 132 Q 120 120 230 128 L 230 330 Z M ' + r1(T.trapB.x + 4) + ' 86 L ' + r1(T.trapB.x + 17) + ' 86 L ' + r1(T.trapB.x + 26) + ' 134 L ' + r1(T.trapB.x + 12) + ' 136 Z M ' + r1(T.trapF.x + 2) + ' 82 L ' + r1(T.trapF.x + 15) + ' 86 L ' + r1(T.trapF.x + 9) + ' 130 L ' + r1(T.trapF.x - 4) + ' 128 Z';
    gLines = 'M 30 132 Q 120 120 230 128';
  }
  if (G === 'rash') { g1 = 'M 30 330 L 30 92 L ' + r1(T.neckB.x) + ' 86 Q ' + r1(cxm - 8) + ' 100 ' + r1(T.neckF.x + 2) + ' 85 L 230 92 L 230 330 Z'; gLines = 'M 70 150 L 230 150'; }
  if (G === 'kimono') {
    g0 = isB ? 'M 30 330 L 30 80 L 230 80 L 230 330 Z' : '';
    g1 = 'M 30 330 L 30 90 L ' + r1(T.neckB.x) + ' 84 L ' + r1(cxm - 2) + ' 148 L ' + r1(T.neckF.x + 4) + ' 84 L 230 90 L 230 330 Z';
    gLines = 'M ' + r1(T.neckB.x) + ' 84 L ' + r1(cxm - 2) + ' 148 L ' + r1(T.lowB.x + 28) + ' ' + r1(186 + 4 * k) + ' M ' + r1(T.neckF.x + 4) + ' 84 L ' + r1(cxm - 2) + ' 148';
    beltD = 'M 30 ' + r1(181 + 4 * k) + ' L 230 ' + r1(183 + 4 * k) + ' L 230 ' + r1(194 + 4 * k) + ' L 30 ' + r1(192 + 4 * k) + ' Z';
    const bx = cxm + 8, by = 187 + 4 * k;
    beltKnot = 'M ' + r1(bx - 6) + ' ' + r1(by - 6) + ' L ' + r1(bx + 6) + ' ' + r1(by - 6) + ' L ' + r1(bx + 6) + ' ' + r1(by + 6) + ' L ' + r1(bx - 6) + ' ' + r1(by + 6) + ' Z M ' + r1(bx - 3) + ' ' + r1(by + 5) + ' L ' + r1(bx - 9) + ' ' + r1(by + 27) + ' L ' + r1(bx - 2) + ' ' + r1(by + 28) + ' L ' + r1(bx + 2) + ' ' + r1(by + 6) + ' Z M ' + r1(bx + 3) + ' ' + r1(by + 5) + ' L ' + r1(bx + 11) + ' ' + r1(by + 25) + ' L ' + r1(bx + 17) + ' ' + r1(by + 22) + ' L ' + r1(bx + 6) + ' ' + r1(by + 4) + ' Z';
  }
  if (G === 'track') {
    g0 = 'M 30 330 L 30 90 L ' + r1(T.neckB.x) + ' 86 Q ' + r1(cxm - 8) + ' 100 ' + r1(T.neckF.x + 2) + ' 85 L 230 90 L 230 330 Z';
    g1 = 'M 20 330 L 20 80 L ' + r1(T.neckB.x + 6) + ' 82 L ' + r1(cxm - 13) + ' 122 L ' + r1(cxm - 11) + ' 330 Z M ' + r1(cxm + 12) + ' 330 L ' + r1(cxm + 12) + ' 122 L ' + r1(T.neckF.x + 7) + ' 82 L 240 80 L 240 330 Z';
    gLines = 'M ' + r1(cxm - 13) + ' 122 L ' + r1(cxm - 11) + ' 200 M ' + r1(cxm + 12) + ' 122 L ' + r1(cxm + 12) + ' 200';
  }
  const covered = G === 'tank' || G === 'singlet' || G === 'rash' || G === 'kimono' || G === 'track';

  // Musculature / ventre
  const mo = r1(Math.max(0, 1 - 2.6 * k));
  const bo = r1(Math.max(0, (k - 0.3) / 0.7));
  const abs = 'M ' + r1(cxm) + ' 134 Q ' + r1(cxm + 2) + ' 156 ' + r1(cxm + 1) + ' 180 M ' + r1(cxm - 10) + ' 142 Q ' + r1(cxm) + ' 146 ' + r1(cxm + 11) + ' 142 M ' + r1(cxm - 10) + ' 156 Q ' + r1(cxm) + ' 160 ' + r1(cxm + 10) + ' 156 M ' + r1(cxm - 9) + ' 169 Q ' + r1(cxm) + ' 172 ' + r1(cxm + 9) + ' 169';
  const pecs = 'M ' + r1(T.shB.x + 14) + ' 116 Q ' + r1(cxm - 14) + ' 131 ' + r1(cxm - 1) + ' 122 Q ' + r1(cxm + 14) + ' 132 ' + r1(T.chest.x - 4) + ' 120';
  const oblique = 'M ' + r1(T.midB.x + 14) + ' 150 Q ' + r1(T.midB.x + 18) + ' 170 ' + r1(T.midB.x + 24) + ' 188';
  const bellyLine = 'M ' + r1(T.lowB.x + 22) + ' ' + r1(188 + 2 * k) + ' Q ' + r1(cxm + 4) + ' ' + r1(198 + 3 * k) + ' ' + r1(T.lowF.x - 2) + ' ' + r1(183 + 2 * k);
  const navel = 'M ' + r1(cxm + 2) + ' 166 q 3 3 6 0';
  const softChest = 'M ' + r1(T.shB.x + 14) + ' 118 Q ' + r1(cxm - 12) + ' 136 ' + r1(cxm) + ' 126 Q ' + r1(cxm + 14) + ' 138 ' + r1(T.chest.x - 2) + ' 124';
  const dOp = covered ? 0 : 1;

  const gx = (q: { x: number; y: number; r: number }) => 'translate(' + r1(q.x) + ' ' + r1(q.y) + ') rotate(' + q.r + ') scale(' + r1(1 + 0.12 * k) + ')';
  const w = o.w ?? 240;
  const ink = ghost ? '#5A2A7A' : '#140A22';

  return {
    w, h: Math.round((w * 4) / 3), flip: o.flip ? 'scaleX(-1)' : 'none', ink,
    faceOp: ghost ? 0 : 1, glossOp: ghost ? 0 : 0.5,
    skin, skinSh, skinDeep, skinHi,
    legC, legSh: OUT.pants ? sh(legC) : skinSh, legHi: OUT.pants ? hi(legC) : skinHi, legDeep: OUT.pants ? mix(legC, '#2A1548', 0.45) : skinDeep,
    bottom, bottomSh: sh(bottom), trim, waistC,
    glove, gloveSh: sh(glove), hairC, capC, browC, beardC,
    groundRx: r1(64 + 16 * k),
    torso, neck, head, nose, noseFill: mask ? main : skin, chin2, chin2Op: r1(Math.max(0, (k - 0.5) * 1.6)),
    eye, eyeFill: hurt ? 'none' : '#FFFFFF', pupils, brow, mouth, mouthFill: hurt ? '#140A22' : 'none',
    lips, lipC: mix(skin, '#B04A5A', 0.28), wrinkles,
    earOp: mask ? 0 : 1,
    hairBack, hairStrands, hairCap, hairFront, hairLines, shine,
    beard, moustache, stubble,
    glasses, band: bandD, bandC: band, bandana, bandanaC, bandanaDots, earring,
    maskD, maskC: main, maskSh: sh(main), maskTrim,
    lead: limb(leadNodes), rear: limb(rearNodes), leadG: gx(leadG), rearG: gx(rearG),
    sleeveL: sleeve(leadNodes), sleeveR: sleeve(rearNodes), sleeveStripeL: sleeveStripe(leadNodes), sleeveStripeR: sleeveStripe(rearNodes), sleeveC: top, sleeveSh: sh(top), sleeveHi: hi(top),
    legF, legR, pantsStripe, hem,
    footD: F.d, footBand: F.band, footSole: F.sole, footC: F.fill, footSh: mix(F.fill, shadowTint, 0.4), footBandC: OUT.foot === 'sneaker' ? main : OUT.foot === 'high' ? trim : glove,
    footF: 'translate(' + r1(158 + sx) + ' 285) scale(' + footScale + ' 1)', footR: 'translate(' + r1(86 - sx) + ' 285) scale(' + footScale + ' 1)',
    shortsD, waist, waistOp, stripe, stripeOp,
    g0, g0C, g0Sh: sh(g0C), g1, g1C, g1Sh: sh(g1C), gLines, beltD, beltC: belt, beltKnot,
    abs, pecs, oblique, absOp: r1(mo * (isB ? 0.55 : 1) * dOp), pecsOp: isB ? 0 : r1(mo * dOp),
    bellyLine, navel, softChest, bo: r1(bo * dOp), softOp: isB ? 0 : r1(bo * 0.7 * dOp),
    clipTorso: `url(#${id}-t)`, clipHead: `url(#${id}-h)`, clipLegF: `url(#${id}-lf)`, clipLead: `url(#${id}-al)`, clipRear: `url(#${id}-ar)`, clipShorts: `url(#${id}-s)`, clipSL: `url(#${id}-sl)`, clipSR: `url(#${id}-sr)`,
    idT: `${id}-t`, idH: `${id}-h`, idLF: `${id}-lf`, idAL: `${id}-al`, idAR: `${id}-ar`, idS: `${id}-s`, idSL: `${id}-sl`, idSR: `${id}-sr`
  };
}
