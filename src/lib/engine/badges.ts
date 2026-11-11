// Palmarès et badges d'un joueur : calculés à partir de ses pesées et de ses battles, jamais stockés. Pur et testé.
import { BOSS_ID } from './rules';
import type { BattleState } from './types';

export interface CareerInput {
  /** Série personnelle : un point par jour, de la première pesée à aujourd'hui (weight = null sans pesée). */
  days: { date: string; weight: number | null; trend: number | null }[];
  /** Battles du joueur, simulées jusqu'au dernier soir révélé. */
  battles: { state: BattleState; finished: boolean }[];
}

export interface Career {
  weighIns: number;
  /** Jours de pesée d'affilée : record, et série en cours (aujourd'hui ne la casse pas tant qu'il n'est pas fini). */
  bestStreak: number;
  currentStreak: number;
  /** Perte de tendance depuis la première pesée, en kg et en % (0 si le poids n'a pas baissé). */
  lostKg: number;
  lostPct: number;
  battles: number;
  finished: number;
  belts: number;
  roundsWon: number;
  roundsLost: number;
  roundsDrawn: number;
  /** Rounds gagnés par K.O. */
  kos: number;
  /** Rounds gagnés contre Le Bide. */
  bossWins: number;
  /** Rounds gagnés après avoir été mené au soir du 4e jour. */
  comebacks: number;
  crochets: number;
  supers: number;
  damage: number;
}

/** Séries de jours de pesée consécutifs : la plus longue, et celle en cours. */
export function streaks(days: { weight: number | null }[]): { best: number; current: number } {
  let best = 0, run = 0;
  for (const d of days) { run = d.weight !== null ? run + 1 : 0; best = Math.max(best, run); }
  // Série en cours : on remonte depuis aujourd'hui ; un aujourd'hui sans pesée ne la casse pas encore.
  let i = days.length - 1, current = 0;
  if (i >= 0 && days[i].weight === null) i -= 1;
  for (; i >= 0 && days[i].weight !== null; i--) current += 1;
  return { best, current };
}

export function career(input: CareerInput, userId: string): Career {
  const weighed = input.days.filter((d) => d.weight !== null);
  const { best, current } = streaks(input.days);
  const first = weighed[0]?.weight ?? null;
  const trend = input.days[input.days.length - 1]?.trend ?? null;
  const lostKg = first !== null && trend !== null ? Math.max(0, Math.round((first - trend) * 10) / 10) : 0;
  const c: Career = {
    weighIns: weighed.length, bestStreak: best, currentStreak: current,
    lostKg, lostPct: first ? Math.round((lostKg / first) * 1000) / 10 : 0,
    battles: input.battles.length, finished: 0, belts: 0,
    roundsWon: 0, roundsLost: 0, roundsDrawn: 0, kos: 0, bossWins: 0, comebacks: 0, crochets: 0, supers: 0, damage: 0
  };
  for (const { state, finished } of input.battles) {
    const mine = state.sides.find((s) => s.members.includes(userId));
    if (!mine) continue;
    if (finished) {
      c.finished += 1;
      if (state.champion === mine.id) c.belts += 1;
    }
    c.damage += state.players[userId]?.damage ?? 0;
    for (const d of state.days) {
      const p = d.pairings.find((x) => x.a === mine.id || x.b === mine.id);
      const att = p?.attacks[p.a === mine.id ? 'a' : 'b'].members[userId];
      if (att?.crochet) c.crochets += 1;
      if (att?.super) c.supers += 1;
    }
    for (const r of state.rounds) {
      const p = r.pairings.find((x) => x.a === mine.id || x.b === mine.id);
      if (!p || !p.complete) continue;
      if (p.winner === null) { c.roundsDrawn += 1; continue; }
      if (p.winner !== mine.id) { c.roundsLost += 1; continue; }
      c.roundsWon += 1;
      if (p.ko) c.kos += 1;
      if (p.a === BOSS_ID || p.b === BOSS_ID) c.bossWins += 1;
      if (trailedAtMidRound(state, r.index, mine.id)) c.comebacks += 1;
    }
  }
  c.damage = Math.round(c.damage);
  return c;
}

/** Le camp était-il mené au soir du 4e jour de ce round ? */
export function trailedAtMidRound(state: BattleState, roundIndex: number, sideId: string): boolean {
  const day = state.days.find((d) => d.roundIndex === roundIndex && d.dayIndex === 3);
  const p = day?.pairings.find((x) => x.a === sideId || x.b === sideId);
  if (!p) return false;
  const me = p.a === sideId ? 'a' : 'b', opp = me === 'a' ? 'b' : 'a';
  return p.hpAfter[me] < p.hpAfter[opp];
}

export type BadgeGroup = 'regularite' | 'progression' | 'combat';

export interface BadgeDef {
  key: string;
  name: string;
  /** Ce qu'il faut faire pour l'obtenir. */
  how: string;
  /** Nom d'une icône de `components/ui`. */
  icon: 'scale' | 'fire' | 'glove' | 'clock' | 'zap' | 'trophy' | 'ring' | 'check' | 'play';
  group: BadgeGroup;
  /** Valeur actuelle et palier à atteindre. */
  value: (c: Career) => number;
  goal: number;
  unit?: string;
}

const count = (key: keyof Career) => (c: Career) => c[key];

export const BADGES: BadgeDef[] = [
  { key: 'first-weigh', name: 'Première pesée', how: 'Monte sur la balance une première fois.', icon: 'scale', group: 'regularite', value: count('weighIns'), goal: 1 },
  { key: 'streak-7', name: 'Semaine parfaite', how: '7 jours de pesée d’affilée.', icon: 'fire', group: 'regularite', value: count('bestStreak'), goal: 7, unit: 'jours' },
  { key: 'streak-21', name: 'Gants dorés', how: '21 jours de pesée d’affilée : tes gants deviennent dorés tant que la série tient.', icon: 'glove', group: 'regularite', value: count('bestStreak'), goal: 21, unit: 'jours' },
  { key: 'streak-50', name: 'Métronome', how: '50 jours de pesée d’affilée.', icon: 'clock', group: 'regularite', value: count('bestStreak'), goal: 50, unit: 'jours' },
  { key: 'kg-1', name: 'Premier kilo', how: 'Ta tendance a baissé d’1 kg depuis ta première pesée.', icon: 'zap', group: 'progression', value: count('lostKg'), goal: 1, unit: 'kg' },
  { key: 'pct-2', name: 'Cap des 2 %', how: 'Ta tendance a baissé de 2 % depuis ta première pesée.', icon: 'zap', group: 'progression', value: count('lostPct'), goal: 2, unit: '%' },
  { key: 'pct-5', name: 'Cap des 5 %', how: 'Ta tendance a baissé de 5 % depuis ta première pesée.', icon: 'zap', group: 'progression', value: count('lostPct'), goal: 5, unit: '%' },
  { key: 'pct-10', name: 'Cap des 10 %', how: 'Ta tendance a baissé de 10 % depuis ta première pesée.', icon: 'trophy', group: 'progression', value: count('lostPct'), goal: 10, unit: '%' },
  { key: 'first-crochet', name: 'Premier crochet', how: 'Place un crochet : ta tendance passe sous ton plus bas du round.', icon: 'glove', group: 'combat', value: count('crochets'), goal: 1 },
  { key: 'first-super', name: 'Super !', how: 'Déclenche ton super une première fois.', icon: 'zap', group: 'combat', value: count('supers'), goal: 1 },
  { key: 'first-round', name: 'Premier round', how: 'Gagne un round.', icon: 'ring', group: 'combat', value: count('roundsWon'), goal: 1 },
  { key: 'rounds-5', name: 'Cinq rounds', how: 'Gagne 5 rounds, toutes battles confondues.', icon: 'ring', group: 'combat', value: count('roundsWon'), goal: 5, unit: 'rounds' },
  { key: 'first-ko', name: 'K.O. !', how: 'Gagne un round par K.O.', icon: 'play', group: 'combat', value: count('kos'), goal: 1 },
  { key: 'boss', name: 'Tombeur du Bide', how: 'Gagne un round contre Le Bide.', icon: 'check', group: 'combat', value: count('bossWins'), goal: 1 },
  { key: 'comeback', name: 'Remontée', how: 'Gagne un round où tu étais mené à mi-parcours.', icon: 'fire', group: 'combat', value: count('comebacks'), goal: 1 },
  { key: 'belt', name: 'Ceinture', how: 'Remporte une battle : ton combattant porte la ceinture de champion.', icon: 'trophy', group: 'combat', value: count('belts'), goal: 1 }
];

export interface BadgeState { def: BadgeDef; earned: boolean; value: number }

export function badgeStates(c: Career): BadgeState[] {
  return BADGES.map((def) => {
    const value = def.value(c);
    return { def, earned: value >= def.goal, value };
  });
}

/** Clés des badges obtenus. */
export function earnedKeys(c: Career): string[] {
  return badgeStates(c).filter((b) => b.earned).map((b) => b.def.key);
}

/** Série à partir de laquelle les gants deviennent dorés. */
export const GOLD_STREAK = 21;
