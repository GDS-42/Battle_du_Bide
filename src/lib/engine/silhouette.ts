// Corpulence réelle -> paramètre k du combattant (0 = forme équilibrée S6, 1 = S1).
const KEYS: [number, number, string][] = [
  [40, 1, 'S1'], [35, 0.8, 'S2'], [30, 0.6, 'S3'], [27, 0.4, 'S4'], [25, 0.2, 'S5'], [23, 0, 'S6']
];

export function bmi(weightKg: number | null | undefined, heightCm: number | null | undefined): number | null {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

export function kFromBmi(b: number | null | undefined): number {
  if (b === null || b === undefined) return 0.4;
  if (b >= 40) return 1;
  if (b <= 23) return 0;
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [hb, hk] = KEYS[i];
    const [lb, lk] = KEYS[i + 1];
    if (b <= hb && b >= lb) return lk + ((b - lb) / (hb - lb)) * (hk - lk);
  }
  return 0;
}

export function stageLabel(b: number | null | undefined): string {
  if (b === null || b === undefined) return 'Silhouette à venir';
  if (b >= 40) return 'Silhouette S1';
  if (b <= 23) return 'S6 · forme équilibrée';
  for (const [kb, , s] of KEYS) if (Math.abs(b - kb) < 0.3) return `Silhouette ${s}`;
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (b < KEYS[i][0] && b > KEYS[i + 1][0]) return `Entre ${KEYS[i][2]} et ${KEYS[i + 1][2]}`;
  }
  return '';
}

/** Index de silhouette clé (0 = S1 … 5 = S6), pour détecter une « Transformation ! ». */
export function stageIndex(b: number | null | undefined): number {
  if (b === null || b === undefined) return -1;
  let idx = 0;
  for (let i = 0; i < KEYS.length; i++) if (b <= KEYS[i][0]) idx = i;
  return idx;
}
