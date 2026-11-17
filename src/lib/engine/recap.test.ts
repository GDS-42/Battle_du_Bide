import { describe, expect, it } from 'vitest';
import { battleEndDate, simulateBattle } from './battle';
import { resultLabel, roundEndedOn, roundRecap, trendLabel } from './recap';
import type { EngineInput, EngineWeighIn } from './types';
import { addDays } from '../time';

const START = '2026-11-11';
function series(userId: string, from: string, days: number, w0: number, perDay: number, skip: number[] = []): EngineWeighIn[] {
  const out: EngineWeighIn[] = [];
  for (let i = 0; i < days; i++) if (!skip.includes(i)) out.push({ userId, date: addDays(from, i), weight: Math.round((w0 + perDay * i) * 10) / 10 });
  return out;
}
const duel = (weighIns: EngineWeighIn[], rounds = 2, startDate = START): EngineInput => ({
  battle: { format: 'duel', startDate, rounds, members: [{ userId: 'marc' }, { userId: 'julie' }] }, weighIns, supers: []
});

describe('roundRecap', () => {
  // Marc perd du poids et ne rate rien ; Julie stagne et saute 2 jours
  const input = duel([...series('marc', addDays(START, -3), 17, 100, -0.15), ...series('julie', START, 14, 70, 0, [2, 5])]);

  it('résume un round terminé pour le vainqueur et pour le perdant', () => {
    const state = simulateBattle(input, addDays(START, 6));
    const marc = roundRecap(state, 'marc', 0, 2)!, julie = roundRecap(state, 'julie', 0, 2)!;
    expect(marc).toMatchObject({ round: 1, rounds: 2, complete: true, result: 'win', ko: false, startDate: START, endDate: addDays(START, 6), days: 7, weighIns: 7, late: 0 });
    expect(julie).toMatchObject({ result: 'loss', weighIns: 5, crochets: 0 });
    expect(marc.hp.me).toBeGreaterThan(marc.hp.opp);
    expect(marc.hp).toEqual({ me: julie.hp.opp, opp: julie.hp.me });
    expect(marc.crochets).toBeGreaterThan(0);
    expect(marc.bestHit).toBeGreaterThan(4);
    expect(marc.combo).toBe(7);
    expect(marc.lossPct).toBeGreaterThan(0);
    expect(julie.lossPct).toBe(0);
    expect(marc.oppSide).toBe('julie');
    expect(marc.nextOpponent).toBe('julie');
    expect(marc.rank).toBe(1);
    expect(julie.rank).toBe(2);
    expect(marc.ranked).toBe(2);
  });

  it('signale un round en cours, et l’absence de round suivant au dernier round', () => {
    const mid = roundRecap(simulateBattle(input, addDays(START, 2)), 'marc', 0, 2)!;
    expect(mid).toMatchObject({ complete: false, result: 'pending', days: 3, weighIns: 3 });
    const last = roundRecap(simulateBattle(input, battleEndDate(input.battle)), 'marc', 1, 2)!;
    expect(last).toMatchObject({ round: 2, complete: true, nextOpponent: null });
  });

  it('mesure l’évolution de la tendance sur le round seulement', () => {
    const end = simulateBattle(input, battleEndDate(input.battle));
    const r1 = roundRecap(end, 'marc', 0, 2)!, r2 = roundRecap(end, 'marc', 1, 2)!;
    const total = end.players.marc.lossPct;
    expect(r1.lossPct! + r2.lossPct!).toBeCloseTo(total, 1);
  });

  it('compte les pesées après la cloche à part', () => {
    const w = [...series('marc', START, 7, 100, 0), ...series('julie', START, 7, 70, 0)].map((x) => (x.userId === 'marc' && x.date === addDays(START, 3) ? { ...x, late: true } : x));
    const r = roundRecap(simulateBattle(duel(w), addDays(START, 6)), 'marc', 0, 2)!;
    expect(r).toMatchObject({ weighIns: 6, late: 1, combo: 7, result: 'loss' });
  });

  it('ancienne règle : reconnaît un K.O. qui a arrêté le round, et une égalité', () => {
    const OLD = '2026-10-07'; // bien avant RULES.KO_REVIVE_FROM
    const ko = duel([...series('marc', addDays(OLD, -3), 10, 100, -0.9), ...series('julie', OLD, 7, 70, 0)], 2, OLD);
    const rk = roundRecap(simulateBattle(ko, addDays(OLD, 6)), 'julie', 0, 2)!;
    expect(rk).toMatchObject({ result: 'loss', ko: true, kos: { me: 0, opp: 1 }, resuming: false });
    expect(rk.hp.me).toBe(0);
    expect(rk.days).toBeLessThan(7);
    expect(resultLabel(rk).text).toBe('K.O.…');
    const flat = duel([...series('marc', START, 7, 100, 0), ...series('julie', START, 7, 70, 0)]);
    expect(roundRecap(simulateBattle(flat, addDays(START, 6)), 'marc', 0, 2)!.result).toBe('draw');
  });

  it('K.O. « on se relève » : le round reste en cours, puis se gagne aux K.O.', () => {
    const NEW = '2026-11-23'; // après RULES.KO_REVIVE_FROM
    const ko = duel([...series('marc', addDays(NEW, -3), 10, 100, -0.9), ...series('julie', NEW, 7, 70, 0)], 2, NEW);
    const full = simulateBattle(ko, addDays(NEW, 6));
    const koDay = full.days.find((d) => d.pairings[0].ko)!;
    expect(koDay.dayIndex).toBeLessThan(6);
    // Le soir du K.O. : un point pour Marc, round en cours, reprise au prochain combat.
    const eve = simulateBattle(ko, koDay.date);
    expect(roundRecap(eve, 'marc', 0, 2)).toMatchObject({ result: 'pending', complete: false, kos: { me: 1, opp: 0 }, resuming: true, ko: true });
    expect(roundRecap(eve, 'julie', 0, 2)).toMatchObject({ result: 'pending', kos: { me: 0, opp: 1 }, resuming: true });
    expect(resultLabel(roundRecap(eve, 'marc', 0, 2)!).text).toBe('EN COURS');
    // Au 7e soir : 7 combats joués, victoire par K.O., et l'exploit qui va avec.
    const marc = roundRecap(full, 'marc', 0, 2)!, julie = roundRecap(full, 'julie', 0, 2)!;
    expect(marc).toMatchObject({ result: 'win', complete: true, ko: true, days: 7, resuming: false });
    expect(marc.kos.me).toBeGreaterThanOrEqual(1);
    expect(marc.feats).toContain('ko');
    expect(resultLabel(marc).text).toBe('VICTOIRE PAR K.O. !');
    expect(julie).toMatchObject({ result: 'loss', ko: true });
    expect(julie.feats).not.toContain('ko');
    expect(resultLabel(julie).text).toBe('K.O.…');
  });

  it('sait quel soir le round s’est terminé : le 7e, ou le soir du K.O. sous l’ancienne règle seulement', () => {
    const ko = (start: string) => duel([...series('marc', addDays(start, -3), 10, 100, -0.9), ...series('julie', start, 7, 70, 0)], 2, start);
    // Ancienne règle : le K.O. clôt le round ; le bilan est proposé ce soir-là, et encore au 7e soir (sans combat).
    const OLD = '2026-10-07';
    const old = simulateBattle(ko(OLD), addDays(OLD, 6));
    const oldKo = old.rounds[0].pairings[0].koDate!;
    expect(oldKo < addDays(OLD, 5)).toBe(true);
    expect(roundEndedOn(old, 'marc', oldKo)).toBe(true);
    expect(roundEndedOn(old, 'julie', addDays(oldKo, 1))).toBe(false);
    expect(roundEndedOn(old, 'marc', addDays(OLD, 6))).toBe(true);
    expect(roundEndedOn(simulateBattle(ko(OLD), oldKo), 'marc', oldKo)).toBe(true);
    // Règle « on se relève » : le soir du K.O. ne termine rien, même relu une fois le round fini.
    const NEW = '2026-11-23';
    const fresh = simulateBattle(ko(NEW), addDays(NEW, 6));
    const newKo = fresh.days.find((d) => d.pairings[0].ko)!.date;
    expect(newKo < addDays(NEW, 6)).toBe(true);
    expect(roundEndedOn(fresh, 'marc', newKo)).toBe(false);
    expect(roundEndedOn(fresh, 'marc', addDays(NEW, 6))).toBe(true);
    expect(roundEndedOn(simulateBattle(ko(NEW), newKo), 'marc', newKo)).toBe(false);
    // Round en cours, date inconnue, camp inconnu.
    expect(roundEndedOn(simulateBattle(ko(NEW), addDays(NEW, 2)), 'marc', addDays(NEW, 2))).toBe(false);
    expect(roundEndedOn(fresh, 'marc', '2030-01-01')).toBe(false);
    expect(roundEndedOn(fresh, 'inconnu', addDays(NEW, 6))).toBe(false);
  });

  it('renvoie null pour un joueur étranger ou un round pas encore commencé', () => {
    const state = simulateBattle(input, addDays(START, 2));
    expect(roundRecap(state, 'inconnu', 0, 2)).toBeNull();
    expect(roundRecap(state, 'marc', 1, 2)).toBeNull();
  });

  it('tournoi : annonce le prochain adversaire, y compris Le Bide', () => {
    const t: EngineInput = { battle: { format: 'tournoi', startDate: START, rounds: 3, members: [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }] }, weighIns: ['a', 'b', 'c'].flatMap((u) => series(u, START, 7, 80, 0)), supers: [] };
    const r = roundRecap(simulateBattle(t, addDays(START, 6)), 'a', 0, 3)!;
    expect(r.oppSide).toBe('boss');
    expect(['b', 'c']).toContain(r.nextOpponent);
    expect(r.ranked).toBe(3);
  });
});

describe('libellés du bilan', () => {
  it('écrit la tendance sans « −0,00 % »', () => {
    expect(trendLabel(null)).toBe('—');
    expect(trendLabel(0)).toBe('stable');
    expect(trendLabel(0.004)).toBe('stable');
    expect(trendLabel(0.62)).toBe('−0,62 %');
    expect(trendLabel(-0.1)).toBe('+0,10 %');
  });

  it('nomme le résultat', () => {
    expect(resultLabel({ result: 'win', ko: false }).text).toBe('VICTOIRE !');
    expect(resultLabel({ result: 'win', ko: true }).text).toMatch(/K\.O\./);
    expect(resultLabel({ result: 'loss', ko: true }).text).toMatch(/K\.O\./);
    expect(resultLabel({ result: 'draw', ko: false }).text).toBe('ÉGALITÉ');
    expect(resultLabel({ result: 'pending', ko: false }).text).toBe('EN COURS');
  });
});

describe('exploits du round', () => {
  it('7 pesées sur 7, K.O. et victoire sur Le Bide', () => {
    const ko = duel([...series('marc', addDays(START, -3), 10, 100, -0.9), ...series('julie', START, 7, 70, 0)]);
    expect(roundRecap(simulateBattle(ko, addDays(START, 6)), 'marc', 0, 2)!.feats).toContain('ko');
    const flat = duel([...series('marc', START, 7, 100, 0), ...series('julie', START, 7, 70, 0, [1])]);
    const state = simulateBattle(flat, addDays(START, 6));
    expect(roundRecap(state, 'marc', 0, 2)!.feats).toEqual(['perfect']);
    expect(roundRecap(state, 'julie', 0, 2)!.feats).toEqual([]);
    const trio: EngineInput = {
      battle: { format: 'tournoi', startDate: START, rounds: 1, members: [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }] },
      weighIns: [...series('a', START, 7, 100, -0.15), ...series('b', START, 7, 100, 0), ...series('c', START, 7, 100, 0)], supers: []
    };
    expect(roundRecap(simulateBattle(trio, addDays(START, 6)), 'a', 0, 1)!.feats).toEqual(expect.arrayContaining(['perfect', 'boss']));
  });

  it('remontée : mené au 4e soir, vainqueur à la fin', () => {
    const w = [...series('julie', START, 4, 70, 0), ...series('marc', addDays(START, -3), 3, 100, 0), ...series('marc', addDays(START, 4), 3, 99, -0.8)];
    const state = simulateBattle(duel(w, 1), addDays(START, 6));
    expect(roundRecap(state, 'marc', 0, 1)!.feats).toContain('comeback');
    expect(roundRecap(state, 'julie', 0, 1)!.feats).not.toContain('comeback');
  });
});
