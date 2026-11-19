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

// ── IMC en clair et prochain palier ──────────────────────────────────────────────────────────────────────────────
// Les paliers sont les silhouettes clés S2 à S6 : en franchir un, c'est exactement déclencher une « Transformation ! ».
// Tout ce qui suit ne s'affiche qu'au joueur lui-même.

/** Seuil de maigreur de l'OMS : en dessous, l'app invite à en parler à un professionnel de santé. */
export const BMI_LOW = 18.5;

/** Catégorie d'IMC de l'OMS. */
export function bmiCategory(b: number | null | undefined): string | null {
  if (b === null || b === undefined) return null;
  if (b < BMI_LOW) return 'maigreur';
  if (b < 25) return 'corpulence normale';
  if (b < 30) return 'surpoids';
  if (b < 35) return 'obésité modérée';
  if (b < 40) return 'obésité sévère';
  return 'obésité massive';
}

export interface BmiStep {
  /** IMC du palier (35, 30, 27, 25 ou 23). */
  bmi: number;
  /** Silhouette clé atteinte à ce palier (S2 à S6). */
  stage: string;
  /** Poids du palier, au dixième de kilo. */
  weight: number;
}

/**
 * Poids le plus élevé, au dixième de kilo, dont l'IMC affiché atteint `key`. C'est le seuil qui fait changer de
 * silhouette clé : un palier affiché à ce poids ne peut pas rester « à 0,1 kg » une fois la transformation fêtée.
 */
export function stepWeight(key: number, heightCm: number): number {
  const h = heightCm / 100;
  let w = Math.floor((key + 0.05) * h * h * 10) / 10;
  while ((bmi(w, heightCm) ?? 0) > key) w = Math.round((w - 0.1) * 10) / 10; // garde-fou d'arrondi
  return w;
}

/** IMC du palier qui donne accès à une silhouette clé (« S4 » → 27) ; null pour S1, qui n'est pas un palier. */
export function stepOfStage(stage: string): number | null {
  const i = KEYS.findIndex(([, , s]) => s === stage);
  return i > 0 ? KEYS[i][0] : null;
}

/** Prochain palier sous ce poids. Null en forme équilibrée (IMC de 23 ou moins) : il n'y a plus rien à viser. */
export function nextStep(weightKg: number | null | undefined, heightCm: number | null | undefined): BmiStep | null {
  const i = stageIndex(bmi(weightKg, heightCm));
  if (i < 0 || i >= KEYS.length - 1 || !heightCm) return null;
  const [b, , stage] = KEYS[i + 1];
  return { bmi: b, stage, weight: stepWeight(b, heightCm) };
}

/** Paliers franchis en passant de `fromKg` à `toKg` (0 si le poids n'a pas baissé d'un palier). */
export function stepsCrossed(fromKg: number | null | undefined, toKg: number | null | undefined, heightCm: number | null | undefined): number {
  const a = stageIndex(bmi(fromKg, heightCm)), b = stageIndex(bmi(toKg, heightCm));
  return a < 0 || b < 0 ? 0 : Math.max(0, b - a);
}

/** Paliers encore devant un joueur à ce poids : 5 en S1, 0 en forme équilibrée (ou sans taille connue). */
export function stepsAhead(weightKg: number | null | undefined, heightCm: number | null | undefined): number {
  const i = stageIndex(bmi(weightKg, heightCm));
  return i < 0 ? 0 : KEYS.length - 1 - i;
}

export interface BmiView {
  bmi: number;
  category: string;
  /**
   * Prochain palier ; `left` = ce qu'il reste à perdre (jamais 0 : à 0, le palier est franchi) ; `progress` = chemin
   * parcouru depuis le poids de départ, de 0 à 1 (null si le départ n'était pas au-dessus du palier).
   */
  step: (BmiStep & { left: number; progress: number | null }) | null;
  /** Forme équilibrée : plus de palier à franchir, il s'agit de tenir. */
  hold: boolean;
  /** Sous le seuil de maigreur. */
  low: boolean;
}

/** Ce que le joueur lit de son IMC : valeur, catégorie, prochain palier et avancement. Null sans poids ou sans taille. */
export function bmiView(weightKg: number | null | undefined, startKg: number | null | undefined, heightCm: number | null | undefined): BmiView | null {
  const b = bmi(weightKg, heightCm);
  if (b === null || !weightKg) return null;
  const next = nextStep(weightKg, heightCm);
  const step = next ? {
    ...next,
    left: Math.max(0.1, Math.ceil((weightKg - next.weight) * 10 - 1e-6) / 10),
    progress: startKg && startKg > next.weight ? Math.min(1, Math.max(0, (startKg - weightKg) / (startKg - next.weight))) : null
  } : null;
  return { bmi: b, category: bmiCategory(b)!, step, hold: !step, low: b < BMI_LOW };
}
