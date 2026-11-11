import { describe, expect, it } from 'vitest';
import { BADGES, badgeStates, career, earnedKeys, streaks, trailedAtMidRound } from './badges';
import { battleEndDate, simulateBattle } from './battle';
import type { EngineInput, EngineWeighIn } from './types';
import { addDays } from '../time';

const START = '2026-11-11';
function series(userId: string, from: string, days: number, w0: number, perDay: number, skip: number[] = []): EngineWeighIn[] {
  const out: EngineWeighIn[] = [];
  for (let i = 0; i < days; i++) if (!skip.includes(i)) out.push({ userId, date: addDays(from, i), weight: Math.round((w0 + perDay * i) * 10) / 10 });
  return out;
}
/** Série personnelle : tendance = pesée, pour simplifier. */
function personal(weights: (number | null)[]) {
  let trend: number | null = null;
  return weights.map((w, i) => { if (w !== null) trend = w; return { date: addDays('2026-09-01', i), weight: w, trend }; });
}
const duel = (weighIns: EngineWeighIn[], rounds = 2): EngineInput => ({
  battle: { format: 'duel', startDate: START, rounds, members: [{ userId: 'marc' }, { userId: 'julie' }] }, weighIns, supers: []
});

describe('streaks', () => {
  it('trouve la plus longue série et la série en cours', () => {
    expect(streaks(personal([80, 80, null, 80, 80, 80]))).toEqual({ best: 3, current: 3 });
    expect(streaks(personal([80, 80, 80, null, 80]))).toEqual({ best: 3, current: 1 });
    expect(streaks([])).toEqual({ best: 0, current: 0 });
  });

  it('un aujourd’hui sans pesée ne casse pas encore la série, mais deux jours oui', () => {
    expect(streaks(personal([80, 80, 80, null])).current).toBe(3);
    expect(streaks(personal([80, 80, 80, null, null])).current).toBe(0);
  });
});

describe('career', () => {
  it('compte les pesées, la série et la perte depuis la première pesée', () => {
    const c = career({ days: personal([100, 99.5, 99, null, 98.4]), battles: [] }, 'marc');
    expect(c).toMatchObject({ weighIns: 4, bestStreak: 3, currentStreak: 1, lostKg: 1.6, lostPct: 1.6, battles: 0, roundsWon: 0 });
  });

  it('ne compte pas de perte quand le poids monte', () => {
    expect(career({ days: personal([80, 81]), battles: [] }, 'marc')).toMatchObject({ lostKg: 0, lostPct: 0 });
  });

  it('résume les combats : rounds, crochets, ceinture', () => {
    // Marc descend et ne rate rien, Julie stagne : Marc gagne les 2 rounds et la battle
    const input = duel([...series('marc', addDays(START, -3), 17, 100, -0.15), ...series('julie', START, 14, 70, 0)]);
    const state = simulateBattle(input, battleEndDate(input.battle));
    const marc = career({ days: [], battles: [{ state, finished: true }] }, 'marc');
    const julie = career({ days: [], battles: [{ state, finished: true }] }, 'julie');
    expect(marc).toMatchObject({ battles: 1, finished: 1, belts: 1, roundsWon: 2, roundsLost: 0, kos: 0, bossWins: 0 });
    expect(marc.crochets).toBeGreaterThan(5);
    expect(marc.damage).toBeGreaterThan(julie.damage);
    expect(julie).toMatchObject({ belts: 0, roundsWon: 0, roundsLost: 2, crochets: 0 });
  });

  it('une battle en cours ne donne pas de ceinture', () => {
    const input = duel([...series('marc', addDays(START, -3), 10, 100, -0.15), ...series('julie', START, 7, 70, 0)]);
    const c = career({ days: [], battles: [{ state: simulateBattle(input, addDays(START, 6)), finished: false }] }, 'marc');
    expect(c).toMatchObject({ finished: 0, belts: 0, roundsWon: 1 });
  });

  it('compte un K.O. et une victoire contre Le Bide', () => {
    const ko = duel([...series('marc', addDays(START, -3), 10, 100, -0.9), ...series('julie', START, 7, 70, 0)], 1);
    expect(career({ days: [], battles: [{ state: simulateBattle(ko, addDays(START, 6)), finished: true }] }, 'marc').kos).toBe(1);
    const trio: EngineInput = {
      battle: { format: 'tournoi', startDate: START, rounds: 1, members: [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }] },
      weighIns: [...series('a', START, 7, 100, -0.15), ...series('b', START, 7, 100, 0), ...series('c', START, 7, 100, 0)], supers: []
    };
    expect(career({ days: [], battles: [{ state: simulateBattle(trio, addDays(START, 6)), finished: true }] }, 'a').bossWins).toBe(1);
  });

  it('repère une remontée : mené au 4e soir, vainqueur à la fin', () => {
    // Julie frappe seule les 4 premiers soirs, puis Marc se réveille avec de gros crochets
    const w = [...series('julie', START, 4, 70, 0), ...series('marc', addDays(START, -3), 3, 100, 0), ...series('marc', addDays(START, 4), 3, 99, -0.8)];
    const state = simulateBattle(duel(w, 1), addDays(START, 6));
    expect(trailedAtMidRound(state, 0, 'marc')).toBe(true);
    expect(state.rounds[0].pairings[0].winner).toBe('marc');
    expect(career({ days: [], battles: [{ state, finished: true }] }, 'marc').comebacks).toBe(1);
    expect(career({ days: [], battles: [{ state, finished: true }] }, 'julie').comebacks).toBe(0);
  });
});

describe('badges', () => {
  it('rien au départ, puis les paliers un à un', () => {
    const none = career({ days: [], battles: [] }, 'marc');
    expect(earnedKeys(none)).toEqual([]);
    expect(earnedKeys(career({ days: personal([90]), battles: [] }, 'marc'))).toEqual(['first-weigh']);
    const week = career({ days: personal(Array.from({ length: 7 }, (_, i) => 90 - i * 0.2)), battles: [] }, 'marc');
    expect(earnedKeys(week)).toEqual(['first-weigh', 'streak-7', 'kg-1']);
    const long = career({ days: personal(Array.from({ length: 50 }, (_, i) => 100 - i * 0.25)), battles: [] }, 'marc');
    expect(earnedKeys(long)).toEqual(expect.arrayContaining(['streak-21', 'streak-50', 'pct-2', 'pct-5', 'pct-10']));
  });

  it('garde un badge de série même une fois la série cassée (c’est un record)', () => {
    const days = personal([...Array.from({ length: 7 }, () => 90), null, null, 90]);
    const c = career({ days, battles: [] }, 'marc');
    expect(c.currentStreak).toBe(1);
    expect(earnedKeys(c)).toContain('streak-7');
  });

  it('expose la progression vers chaque badge', () => {
    const states = badgeStates(career({ days: personal([90, 90, 90, 90]), battles: [] }, 'marc'));
    const s7 = states.find((b) => b.def.key === 'streak-7')!;
    expect(s7).toMatchObject({ earned: false, value: 4 });
    expect(s7.def.goal).toBe(7);
  });

  it('a des clés uniques et un texte pour chaque badge', () => {
    expect(new Set(BADGES.map((b) => b.key)).size).toBe(BADGES.length);
    for (const b of BADGES) { expect(b.name.length).toBeGreaterThan(2); expect(b.how.length).toBeGreaterThan(10); expect(b.goal).toBeGreaterThan(0); }
  });
});
