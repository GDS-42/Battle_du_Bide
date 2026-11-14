// Flamme du ring : la série commune d'une battle. Fonction pure, jamais stockée.
import { addDays, dayDiff } from '../time';
import { battleEndDate } from './battle';
import { RULES } from './rules';
import type { EngineInput } from './types';

/** Ce que chaque palier (`RULES.FLAME_TIERS`) ajoute au décor du ring. */
export const FLAME_DECOR = ['braseros allumés', 'fanions et projecteurs', 'cordes d’or et feu d’artifice'] as const;

export interface RingFlame {
  /** Flamme en cours : jours d'affilée où tous les joueurs se sont pesés. */
  days: number;
  /** Plus longue flamme depuis le début de la battle. */
  best: number;
  /** Palier de décor atteint, de 0 (aucun) à 3. Il suit la meilleure flamme : un décor gagné reste acquis. */
  level: number;
  /** Nombre de jours du prochain palier, ou null quand le dernier est atteint. */
  next: number | null;
  /** Joueurs qui ne se sont pas encore pesés aujourd'hui (0 hors de la battle). */
  missing: number;
}

/**
 * Un jour entretient la flamme si chaque joueur s'est pesé ce jour-là. Une pesée tardive compte ;
 * une garde ne compte pas : elle sauve la série du joueur, pas la flamme, qui demande une vraie pesée de chacun.
 * Seuls les jours de la battle comptent (pas l'échauffement). Tant que la journée en cours n'est pas
 * complète, elle ne casse pas encore la flamme.
 */
export function ringFlame(input: Pick<EngineInput, 'battle' | 'weighIns'>, today: string): RingFlame {
  const { battle, weighIns } = input;
  const players = battle.members.map((m) => m.userId);
  const end = battleEndDate(battle);
  const last = today > end ? end : today;
  const count = players.length ? dayDiff(battle.startDate, last) + 1 : 0;

  const weighed = new Map<string, Set<string>>();
  for (const w of weighIns) {
    if (!weighed.has(w.date)) weighed.set(w.date, new Set());
    weighed.get(w.date)!.add(w.userId);
  }
  const absent = (date: string) => players.filter((p) => !weighed.get(date)?.has(p)).length;

  let days = 0, best = 0;
  for (let i = 0; i < count; i++) {
    const date = addDays(battle.startDate, i);
    if (absent(date) === 0) days += 1;
    else if (date !== today) days = 0;
    best = Math.max(best, days);
  }

  const live = count > 0 && today <= end;
  const tiers = RULES.FLAME_TIERS;
  const level = tiers.filter((t) => best >= t).length;
  return { days, best, level, next: tiers[level] ?? null, missing: live ? absent(today) : 0 };
}
