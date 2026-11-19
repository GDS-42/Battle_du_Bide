// Géométrie de la courbe de pesées (pure, testée) : le composant WeightChart ne fait que la dessiner.

export interface ChartDay { date: string; weight: number | null; trend: number | null }

export const CHART = { W: 340, H: 150, left: 40, right: 14, top: 16, bottom: 24 } as const;

export interface ChartModel {
  /** Aucune pesée dans la période. */
  empty: boolean;
  /** Nombre de pesées dans la période. */
  count: number;
  from: string;
  to: string;
  points: { x: number; y: number; date: string; weight: number }[];
  /** Tracé SVG de la tendance. */
  path: string;
  /** Graduations horizontales (kg), de haut en bas. */
  ticks: { y: number; value: number }[];
  /** Dernier point de la tendance ; `labelBelow` = le trait passe au-dessus à gauche, l'étiquette va donc dessous. */
  last: { x: number; y: number; value: number; labelBelow: boolean } | null;
  /** Repère vertical (début de battle), s'il tombe dans la période. */
  marker: { x: number; label: string } | null;
  /** Trait horizontal du prochain palier, quand il tient dans le cadre (voir chartModel) ; `side` = côté libre pour son étiquette. */
  target: { y: number; weight: number; label: string; side: 'left' | 'right' } | null;
  firstWeight: number | null;
  lastWeight: number | null;
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** '2026-11-12' → '12 nov.' */
export function shortDate(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${d === 1 ? '1er' : d} ${MOIS[m - 1]}`;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Prépare la courbe des `range` derniers jours (toute la série si `range` est nul).
 * L'axe vertical est en kg, calé sur des demi-kilos, avec au moins 1 kg d'amplitude
 * pour qu'une variation de 200 g ne ressemble pas à une chute libre.
 * `target` (prochain palier, en kg) est tracé s'il tombe dans les valeurs affichées, ou si l'axe peut descendre
 * jusqu'à lui sans plus que doubler d'amplitude : un palier lointain écraserait la courbe, il n'est alors pas tracé.
 */
export function chartModel(
  all: ChartDay[], range: number | null, marker?: { date: string; label: string } | null, target?: { weight: number; label: string } | null
): ChartModel {
  const days = range && all.length > range ? all.slice(-range) : all;
  const n = days.length;
  const weights = days.filter((d): d is ChartDay & { weight: number } => d.weight !== null);
  const base = { from: days[0]?.date ?? '', to: days[n - 1]?.date ?? '' };
  if (!weights.length) {
    return { ...base, empty: true, count: 0, points: [], path: '', ticks: [], last: null, marker: null, target: null, firstWeight: null, lastWeight: null };
  }
  const values = days.flatMap((d) => [d.weight, d.trend]).filter((v): v is number => v !== null);
  const max = Math.max(...values);
  let min = Math.min(...values);
  const shown = !!target && target.weight <= max && min - target.weight <= Math.max(1, max - min) + 1e-9;
  if (shown) min = Math.min(min, target.weight);
  let lo = Math.floor((min - 0.15) * 2) / 2, hi = Math.ceil((max + 0.15) * 2) / 2;
  if (hi - lo < 1) { const mid = (lo + hi) / 2; lo = Math.floor((mid - 0.5) * 2) / 2; hi = lo + 1; }
  if (Math.round((hi - lo) * 2) % 2 === 1) hi += 0.5; // milieu sur un demi-kilo
  const { W, H, left, right, top, bottom } = CHART;
  const x = (i: number) => r1(n === 1 ? (left + W - right) / 2 : left + (i * (W - left - right)) / (n - 1));
  const y = (v: number) => r1(top + ((hi - v) / (hi - lo)) * (H - top - bottom));

  const line = days.flatMap((d, i) => (d.trend === null ? [] : [{ x: x(i), y: y(d.trend), value: d.trend }]));
  const path = line.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const end = line[line.length - 1];
  // L'étiquette de la dernière valeur se place en haut à gauche du point, sauf si le trait y passe déjà.
  const last: ChartModel['last'] = end
    ? { ...end, labelBelow: line.some((p) => p.x >= end.x - 34 && p.x <= end.x - 8 && p.y < end.y - 4) }
    : null;
  const mi = marker ? days.findIndex((d) => d.date === marker.date) : -1;
  const points = days.flatMap((d, i) => (d.weight === null ? [] : [{ x: x(i), y: y(d.weight), date: d.date, weight: d.weight }]));
  // L'étiquette du palier se pose au-dessus du trait, à gauche ; à droite si des pesées ou la tendance occupent la place.
  const ty = shown ? y(target.weight) : 0;
  const busy = (x0: number, x1: number) => [...points, ...line].some((p) => p.x >= x0 && p.x <= x1 && p.y >= ty - 16 && p.y <= ty + 3);
  const side = !busy(left, left + 72) || busy(W - right - 72, W - right) ? 'left' as const : 'right' as const;
  return {
    ...base,
    empty: false,
    count: weights.length,
    points,
    path,
    ticks: [hi, (lo + hi) / 2, lo].map((value) => ({ y: y(value), value })),
    last,
    marker: marker && mi >= 0 ? { x: x(mi), label: marker.label } : null,
    target: shown ? { y: ty, weight: target.weight, label: target.label, side } : null,
    firstWeight: weights[0].weight,
    lastWeight: weights[weights.length - 1].weight
  };
}
