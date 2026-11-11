// Bilan d'un round pour un joueur : résultat de son camp et ses statistiques de la semaine. Pur et testé.
import { roundPairings } from './battle';
import type { BattleState } from './types';

export interface RoundRecap {
  /** Numéro du round (1 = premier) et nombre de rounds de la battle. */
  round: number;
  rounds: number;
  startDate: string;
  endDate: string;
  /** Round terminé (7 soirs joués, ou K.O.). */
  complete: boolean;
  result: 'win' | 'loss' | 'draw' | 'pending';
  /** Le round s'est fini par K.O. */
  ko: boolean;
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

  return {
    round: roundIndex + 1, rounds: totalRounds, startDate: r.startDate, endDate: r.endDate,
    complete: pair.complete,
    result: !pair.complete ? 'pending' : pair.winner === null ? 'draw' : pair.winner === mine.id ? 'win' : 'loss',
    ko: pair.ko,
    mySide: mine.id, oppSide: pair[opp],
    hp: { me: Math.max(0, Math.round(pair.hp[me])), opp: Math.max(0, Math.round(pair.hp[opp])) },
    damage: { me: Math.round(pair.damage[me]), opp: Math.round(pair.damage[opp]) },
    days, weighIns, late, bestHit: Math.round(bestHit), crochets, supers, combo, lossPct,
    nextOpponent,
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

/** Titre du résultat d'un round, et sa couleur (page du bilan et image à partager). */
export function resultLabel(r: Pick<RoundRecap, 'result' | 'ko'>): { text: string; color: string } {
  if (r.result === 'pending') return { text: 'EN COURS', color: '#CDB8F0' };
  if (r.result === 'draw') return { text: 'ÉGALITÉ', color: '#FFF4E3' };
  if (r.result === 'win') return { text: r.ko ? 'VICTOIRE PAR K.O. !' : 'VICTOIRE !', color: '#FFD23D' };
  return { text: r.ko ? 'K.O.…' : 'DÉFAITE', color: '#FF8FA3' };
}
