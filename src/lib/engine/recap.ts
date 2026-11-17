// Bilan d'un round pour un joueur : résultat de son camp et ses statistiques de la semaine. Pur et testé.
import { trailedAtMidRound } from './badges';
import { roundPairings } from './battle';
import { BOSS_ID } from './rules';
import type { BattleState } from './types';

export type RoundFeat = 'perfect' | 'ko' | 'boss' | 'comeback' | 'super';

export const FEAT_LABELS: Record<RoundFeat, string> = {
  perfect: '7 pesées sur 7',
  ko: 'Victoire par K.O.',
  boss: 'Le Bide au tapis',
  comeback: 'Remontée',
  super: 'Super déclenché'
};

export interface RoundRecap {
  /** Numéro du round (1 = premier) et nombre de rounds de la battle. */
  round: number;
  rounds: number;
  startDate: string;
  endDate: string;
  /** Round terminé : 7 soirs joués (ou K.O. sous l'ancienne règle, quand un K.O. arrêtait le round). */
  complete: boolean;
  result: 'win' | 'loss' | 'draw' | 'pending';
  /** Le round s'est joué aux K.O. : un camp en a marqué plus que l'autre. */
  ko: boolean;
  /** K.O. marqués dans le round par chaque camp. */
  kos: { me: number; opp: number };
  /** Un K.O. vient de tomber : le duel reprend au prochain combat, 100 PV partout. */
  resuming: boolean;
  mySide: string;
  oppSide: string;
  hp: { me: number; opp: number };
  damage: { me: number; opp: number };
  /** Soirs déjà joués dans ce round (7 quand il est terminé sans K.O.). */
  days: number;
  /** Pesées du joueur : à l'heure, et après la cloche. */
  weighIns: number;
  late: number;
  /** Meilleur coup du joueur sur un soir, en PV. */
  bestHit: number;
  crochets: number;
  supers: number;
  /** Série (jours de pesée d'affilée) au dernier soir joué. */
  combo: number;
  /** Évolution de la tendance sur le round, en % du poids de départ (positif = perte) ; null sans poids de départ. */
  lossPct: number | null;
  /** Camp affronté au round suivant, s'il y en a un. */
  nextOpponent: string | null;
  /** Exploits du round : semaine sans pesée ratée, K.O. infligé, victoire sur Le Bide, remontée, super déclenché. */
  feats: RoundFeat[];
  /** Rang du camp au classement à l'issue de ce round (hors boss). */
  rank: number | null;
  ranked: number;
}

/**
 * `state` doit être simulé jusqu'à la fin du round (ou jusqu'au dernier soir révélé s'il est en cours) :
 * le classement est alors celui « à l'issue du round ».
 */
export function roundRecap(state: BattleState, userId: string, roundIndex: number, totalRounds: number): RoundRecap | null {
  const mine = state.sides.find((s) => s.members.includes(userId));
  const r = state.rounds[roundIndex];
  if (!mine || !r) return null;
  const pair = r.pairings.find((p) => p.a === mine.id || p.b === mine.id);
  if (!pair) return null;
  const me = pair.a === mine.id ? 'a' : 'b', opp = me === 'a' ? 'b' : 'a';

  let days = 0, weighIns = 0, late = 0, bestHit = 0, crochets = 0, supers = 0, combo = 0;
  for (const d of state.days) {
    if (d.roundIndex !== roundIndex) continue;
    const p = d.pairings.find((x) => x.a === mine.id || x.b === mine.id);
    if (!p) continue;
    if (!p.idle) days += 1;
    const att = p.attacks[p.a === mine.id ? 'a' : 'b'].members[userId];
    if (!att) continue;
    if (att.weighed) weighIns += 1;
    if (att.late) late += 1;
    if (att.crochet > 0) crochets += 1;
    if (att.super > 0) supers += 1;
    bestHit = Math.max(bestHit, att.total);
    combo = att.combo;
  }

  // Tendance : du dernier jour avant le round (ou du poids de départ) au dernier jour simulé du round.
  const player = state.players[userId];
  let lossPct: number | null = null;
  if (player?.startWeight) {
    const first = roundIndex * 7, last = Math.min(player.series.length - 1, first + 6);
    const from = first === 0 ? player.startWeight : player.series[first - 1]?.trend ?? player.startWeight;
    const to = player.series[last]?.trend ?? null;
    if (to !== null) lossPct = Math.round(((from - to) / player.startWeight) * 10000) / 100;
  }

  let nextOpponent: string | null = null;
  if (roundIndex + 1 < totalRounds) {
    const next = roundPairings(state.sides.map((s) => s.id), roundIndex + 1).find(([x, y]) => x === mine.id || y === mine.id);
    if (next) nextOpponent = next[0] === mine.id ? next[1] : next[0];
  }
  const rankIdx = state.standings.findIndex((s) => s.sideId === mine.id);
  const won = pair.complete && pair.winner === mine.id;
  const feats: RoundFeat[] = [];
  if (weighIns === 7) feats.push('perfect');
  if (won && pair.kos[me] > pair.kos[opp]) feats.push('ko');
  if (won && pair[opp] === BOSS_ID) feats.push('boss');
  if (won && trailedAtMidRound(state, roundIndex, mine.id)) feats.push('comeback');
  if (supers > 0) feats.push('super');

  return {
    round: roundIndex + 1, rounds: totalRounds, startDate: r.startDate, endDate: r.endDate,
    complete: pair.complete,
    result: !pair.complete ? 'pending' : pair.winner === null ? 'draw' : pair.winner === mine.id ? 'win' : 'loss',
    ko: pair.kos.a !== pair.kos.b,
    kos: { me: pair.kos[me], opp: pair.kos[opp] },
    resuming: pair.resuming,
    mySide: mine.id, oppSide: pair[opp],
    hp: { me: Math.max(0, Math.round(pair.hp[me])), opp: Math.max(0, Math.round(pair.hp[opp])) },
    damage: { me: Math.round(pair.damage[me]), opp: Math.round(pair.damage[opp]) },
    days, weighIns, late, bestHit: Math.round(bestHit), crochets, supers, combo, lossPct,
    nextOpponent,
    feats,
    rank: rankIdx >= 0 ? rankIdx + 1 : null,
    ranked: state.standings.length
  };
}

/** Évolution de la tendance, lisible : « −0,62 % », « +0,10 % » ou « stable ». */
export function trendLabel(lossPct: number | null): string {
  if (lossPct === null) return '—';
  if (Math.abs(lossPct) < 0.005) return 'stable';
  return `${lossPct > 0 ? '−' : '+'}${Math.abs(lossPct).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/**
 * Le round de ce camp s'est-il terminé ce soir-là ? Au 7e soir, ou sur un K.O. que rien n'a suivi (ancienne règle :
 * les soirs suivants du round sont sans combat). Un K.O. après lequel le duel a repris ne termine pas le round.
 */
export function roundEndedOn(state: BattleState, sideId: string, date: string): boolean {
  const fight = state.days.find((d) => d.date === date);
  if (!fight) return false;
  const pairOf = (d: BattleState['days'][number]) => d.pairings.find((p) => p.a === sideId || p.b === sideId);
  const round = state.rounds[fight.roundIndex]?.pairings.find((p) => p.a === sideId || p.b === sideId);
  if (!round?.complete) return false;
  if (fight.dayIndex === 6) return true;
  const later = state.days.filter((d) => d.roundIndex === fight.roundIndex && d.dayIndex > fight.dayIndex);
  return !!pairOf(fight)?.ko && later.every((d) => pairOf(d)?.idle === true);
}

/**
 * Faut-il afficher le score aux K.O. à côté des PV ? Oui dès qu'un K.O. a été marqué, sauf quand les barres de vie
 * le montrent déjà : un seul K.O., qui a clos le round (le vaincu est à 0 PV).
 */
export function showsKoScore(r: Pick<RoundRecap, 'kos' | 'complete' | 'hp'>): boolean {
  const total = r.kos.me + r.kos.opp;
  if (total === 0) return false;
  return !(r.complete && total === 1 && (r.hp.me === 0 || r.hp.opp === 0));
}

/** Titre du résultat d'un round, et sa couleur (page du bilan et image à partager). */
export function resultLabel(r: Pick<RoundRecap, 'result' | 'ko'>): { text: string; color: string } {
  if (r.result === 'pending') return { text: 'EN COURS', color: '#CDB8F0' };
  if (r.result === 'draw') return { text: 'ÉGALITÉ', color: '#FFF4E3' };
  if (r.result === 'win') return { text: r.ko ? 'VICTOIRE PAR K.O. !' : 'VICTOIRE !', color: '#FFD23D' };
  return { text: r.ko ? 'K.O.…' : 'DÉFAITE', color: '#FF8FA3' };
}
