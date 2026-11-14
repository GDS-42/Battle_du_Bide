// Barème du jeu (voir docs/01-concept.md §5). Valeurs de départ, à calibrer avec l'usage.

export const RULES = {
  /** Points de vie de chaque camp au début d'un round. */
  HP: 100,
  /** Coefficient de la moyenne mobile pondérée (tendance). */
  ALPHA: 0.2,
  /** Jab selon le combo : moins de 7 jours, 7 à 20 jours, 21 jours et plus. */
  JAB: [4, 5, 6] as const,
  COMBO_TIER_1: 7,
  COMBO_TIER_2: 21,
  /** Dégâts du crochet pour 1 % de baisse de tendance (5 PV par 0,1 %). */
  CROCHET_PER_PCT: 50,
  /** Super : dégâts, crans nécessaires. */
  SUPER_DAMAGE: 15,
  SUPER_MAX: 7,
  /** Gardes (jokers) : une tous les 7 jours de combo, 2 au maximum. */
  GARDE_EVERY: 7,
  GARDE_MAX: 2,
  /** Variation quotidienne au-delà de laquelle une pesée est « à confirmer ». */
  ANOMALY: 0.02,
  /** Tolérance de confirmation d'une pesée signalée. */
  CONFIRM: 0.01,
  /**
   * Boss « Le Bide » (nombre impair de camps) : il frappe comme la moyenne des autres combattants du soir,
   * avec ce minimum (un jab de base), pour qu'une absence soit toujours punie.
   */
  BOSS_MIN: 4,
  /** Équipes : bonus si tous les membres se sont pesés le même jour. */
  TEAM_BONUS: 2,
  /** Défense de ceinture : écart de tendance toléré et pesées minimales sur 7 jours. */
  BELT_TOLERANCE: 0.01,
  BELT_MIN_WEIGHINS: 5,
  /** Flamme du ring : jours d'affilée où tous les joueurs se sont pesés. À chaque palier, le décor du ring s'embellit. */
  FLAME_TIERS: [7, 14, 30] as const
} as const;

export const BOSS_ID = 'boss';
export const BOSS_NAME = 'Le Bide';
