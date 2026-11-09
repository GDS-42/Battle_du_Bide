// Cagnotte déclarative : l'app calcule qui doit combien à qui, le paiement se fait hors de l'app.

export type PotMode = 'winner' | 'objectif';

export interface Transfer {
  from: string;
  to: string;
  /** Montant en centimes. */
  amount: number;
}

export interface Settlement {
  winners: string[];
  payers: string[];
  transfers: Transfer[];
  /** Personne n'a gagné la cagnotte : elle est reportée sur la revanche. */
  carryOver: boolean;
}

export function settleStakes(opts: {
  mode: PotMode;
  /** Mise par joueur, en centimes. */
  amount: number;
  objectivePct: number;
  players: { userId: string; lossPct: number }[];
  championMembers: string[];
}): Settlement {
  const all = opts.players.map((p) => p.userId);
  const winners = opts.mode === 'winner'
    ? opts.championMembers.filter((u) => all.includes(u))
    : opts.players.filter((p) => p.lossPct >= opts.objectivePct).map((p) => p.userId);
  if (winners.length === 0) return { winners: [], payers: [], transfers: [], carryOver: true };
  const payers = all.filter((u) => !winners.includes(u));
  const transfers: Transfer[] = [];
  const share = Math.floor(opts.amount / winners.length);
  const rest = opts.amount - share * winners.length;
  for (const p of payers) {
    winners.forEach((w, i) => {
      const amount = share + (i < rest ? 1 : 0);
      if (amount > 0) transfers.push({ from: p, to: w, amount });
    });
  }
  return { winners, payers, transfers, carryOver: false };
}

export function formatEuros(cents: number): string {
  const v = cents / 100;
  return v.toLocaleString('fr-FR', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }) + ' €';
}
