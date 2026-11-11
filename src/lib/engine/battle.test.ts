import { describe, expect, it } from 'vitest';
import { battleEndDate, beltHeld, buildSides, playerDayPreview, rivalsOn, roundPairings, simulateBattle, simulatePlayer } from './battle';
import { commentary } from './commentary';
import { RULES } from './rules';
import { settleStakes } from './stakes';
import { bmi, kFromBmi, stageIndex } from './silhouette';
import type { EngineInput, EngineWeighIn } from './types';
import { addDays } from '../time';

const START = '2026-11-16'; // un lundi

/** Génère une pesée par jour entre deux dates, poids linéaire. */
function series(userId: string, from: string, days: number, w0: number, perDay: number, skip: number[] = []): EngineWeighIn[] {
  const out: EngineWeighIn[] = [];
  for (let i = 0; i < days; i++) {
    if (skip.includes(i)) continue;
    out.push({ userId, date: addDays(from, i), weight: Math.round((w0 + perDay * i) * 10) / 10 });
  }
  return out;
}

function duel(weighIns: EngineWeighIn[], supers: { userId: string; date: string }[] = [], rounds = 2): EngineInput {
  return { battle: { format: 'duel', startDate: START, rounds, members: [{ userId: 'marc' }, { userId: 'julie' }] }, weighIns, supers };
}

describe('joueur : tendance, jab, crochet', () => {
  it("prend la moyenne des 3 dernières pesées d'échauffement comme poids de départ", () => {
    const w = [
      { userId: 'm', date: addDays(START, -5), weight: 101 },
      { userId: 'm', date: addDays(START, -3), weight: 99 },
      { userId: 'm', date: addDays(START, -2), weight: 98 },
      { userId: 'm', date: addDays(START, -1), weight: 97 }
    ];
    const sim = simulatePlayer('m', { weighIns: w, supers: [] }, START, START);
    expect(sim.startWeight).toBeCloseTo(98, 5);
  });

  it('sans échauffement, la première pesée fixe le départ et ne donne pas de crochet', () => {
    const sim = simulatePlayer('m', { weighIns: [{ userId: 'm', date: START, weight: 90 }], supers: [] }, START, START);
    expect(sim.startWeight).toBe(90);
    expect(sim.days[0].attack).toMatchObject({ weighed: true, jab: 4, crochet: 0, blocked: true, total: 4 });
  });

  it('jab de 4, puis 5 à 7 jours de combo, puis 6 à 21 jours', () => {
    const sim = simulatePlayer('m', { weighIns: series('m', START, 21, 90, 0), supers: [] }, START, addDays(START, 20));
    expect(sim.days[0].attack.jab).toBe(4);
    expect(sim.days[5].attack.jab).toBe(4);
    expect(sim.days[6].attack.jab).toBe(5);
    expect(sim.days[19].attack.jab).toBe(5);
    expect(sim.days[20].attack.jab).toBe(6);
  });

  it('le crochet vaut 50 PV par % de baisse de tendance sous le plus bas du round', () => {
    const w = [{ userId: 'm', date: addDays(START, -1), weight: 100 }, { userId: 'm', date: START, weight: 99 }];
    const sim = simulatePlayer('m', { weighIns: w, supers: [] }, START, START);
    // tendance : 100 + 0,2 × (99 − 100) = 99,8 → baisse de 0,2 % du départ (100) → 10 PV
    expect(sim.days[0].trend).toBeCloseTo(99.8, 5);
    expect(sim.days[0].attack.crochetPct).toBeCloseTo(0.2, 5);
    expect(sim.days[0].attack.crochet).toBeCloseTo(10, 5);
    expect(sim.days[0].attack.total).toBeCloseTo(14, 5);
  });

  it('une tendance qui remonte bloque le crochet sans pénalité', () => {
    const w = [{ userId: 'm', date: addDays(START, -1), weight: 100 }, { userId: 'm', date: START, weight: 101 }];
    const sim = simulatePlayer('m', { weighIns: w, supers: [] }, START, START);
    expect(sim.days[0].attack).toMatchObject({ crochet: 0, blocked: true, total: 4 });
  });

  it('le plus bas de référence repart de la tendance du lundi (nouveau départ)', () => {
    // semaine 1 : baisse ; semaine 2 : on repart du niveau du lundi, pas du plus bas absolu
    const w = [{ userId: 'm', date: addDays(START, -1), weight: 100 }, ...series('m', START, 14, 99, -0.1)];
    const sim = simulatePlayer('m', { weighIns: w, supers: [] }, START, addDays(START, 13));
    expect(sim.days[7].attack.crochet).toBeGreaterThan(0);
  });
});

describe('combo, gardes et super', () => {
  it('gagne une garde tous les 7 jours et la consomme un jour raté', () => {
    const w = series('m', START, 10, 90, 0, [7]);
    const sim = simulatePlayer('m', { weighIns: w, supers: [] }, START, addDays(START, 9));
    expect(sim.days[6].garde).toBe(1);
    expect(sim.days[7].attack.gardeUsed).toBe(true);
    expect(sim.days[7].combo).toBe(7);
    expect(sim.days[8].combo).toBe(8);
  });

  it('sans garde, un jour raté remet le combo à zéro', () => {
    const w = series('m', START, 5, 90, 0, [2]);
    const sim = simulatePlayer('m', { weighIns: w, supers: [] }, START, addDays(START, 4));
    expect(sim.days[2].combo).toBe(0);
    expect(sim.days[3].combo).toBe(1);
  });

  it('le super ajoute 15 PV quand la jauge est pleine, puis la vide', () => {
    const w = series('m', START, 9, 90, 0);
    const sim = simulatePlayer('m', { weighIns: w, supers: [{ userId: 'm', date: addDays(START, 2) }, { userId: 'm', date: addDays(START, 7) }] }, START, addDays(START, 8));
    expect(sim.days[2].attack.super).toBe(0); // jauge pas encore pleine
    expect(sim.days[6].gauge).toBe(RULES.SUPER_MAX);
    expect(sim.days[7].attack.super).toBe(15);
    expect(sim.days[7].gauge).toBe(0);
    expect(sim.supers).toBe(1);
  });
});

describe('anti-triche', () => {
  it('une variation de plus de 2 % est signalée et ignorée par la tendance, puis confirmée', () => {
    const w = [
      { userId: 'm', date: addDays(START, -1), weight: 100 },
      { userId: 'm', date: START, weight: 95 },
      { userId: 'm', date: addDays(START, 1), weight: 95.2 }
    ];
    const sim = simulatePlayer('m', { weighIns: w, supers: [] }, START, addDays(START, 1));
    expect(sim.days[0].attack.flagged).toBe(true);
    expect(sim.days[0].trend).toBe(100);
    expect(sim.days[0].attack.crochet).toBe(0);
    expect(sim.days[1].attack.flagged).toBe(false);
    expect(sim.days[1].trend).toBeLessThan(100);
  });
});

describe('duel', () => {
  it('remet les PV à 100 chaque lundi et désigne le vainqueur du round aux PV', () => {
    const w = [
      ...series('marc', addDays(START, -1), 15, 100, -0.15),
      ...series('julie', addDays(START, -1), 15, 70, 0)
    ];
    const s = simulateBattle(duel(w), addDays(START, 13));
    expect(s.rounds).toHaveLength(2);
    expect(s.rounds[0].pairings[0].winner).toBe('marc');
    const mondayRound2 = s.days.find((d) => d.date === addDays(START, 7))!;
    expect(mondayRound2.pairings[0].hpBefore).toEqual({ a: 100, b: 100 });
    expect(s.finished).toBe(true);
    expect(s.champion).toBe('marc');
    expect(s.standings[0]).toMatchObject({ sideId: 'marc', wins: 2, losses: 0 });
  });

  it('égalité parfaite : départage aux pesées, sinon match nul', () => {
    const w = [...series('marc', START, 7, 90, 0), ...series('julie', START, 7, 70, 0, [3])];
    // julie rate un jour sans garde : moins de pesées, mais elle a aussi moins de PV infligés
    const s = simulateBattle(duel(w, [], 1), addDays(START, 6));
    expect(s.rounds[0].pairings[0].winner).toBe('marc');
    const w2 = [...series('marc', START, 7, 90, 0), ...series('julie', START, 7, 70, 0)];
    const s2 = simulateBattle(duel(w2, [], 1), addDays(START, 6));
    expect(s2.rounds[0].pairings[0].winner).toBeNull();
    expect(s2.champion).toBeNull();
  });

  it('KO quand les PV tombent à zéro : le round s’arrête pour ce duel', () => {
    const w = [
      { userId: 'marc', date: addDays(START, -1), weight: 100 },
      ...series('marc', START, 7, 99, -0.6),
      ...series('julie', START, 7, 70, 0)
    ];
    const s = simulateBattle(duel(w, [], 1), addDays(START, 6));
    const r = s.rounds[0].pairings[0];
    expect(r.ko).toBe(true);
    expect(r.winner).toBe('marc');
    const koDay = s.days.find((d) => d.date === r.koDate)!;
    expect(koDay.pairings[0].ko).toBe('b');
    const after = s.days.filter((d) => d.date > r.koDate!);
    for (const d of after) expect(d.pairings[0].hpAfter).toEqual(d.pairings[0].hpBefore);
  });

  it('rien n’est simulé avant le premier lundi', () => {
    const s = simulateBattle(duel([]), addDays(START, -1));
    expect(s.days).toHaveLength(0);
    expect(s.until).toBeNull();
  });

  it("l'aperçu du coup chargé ne dépend que de ses propres pesées", () => {
    const input = duel([{ userId: 'marc', date: addDays(START, -1), weight: 100 }, { userId: 'marc', date: START, weight: 99 }]);
    const p = playerDayPreview(input, 'marc', START)!;
    expect(p.attack.total).toBeCloseTo(14, 5);
  });
});

describe('tournoi et équipes', () => {
  it('appariements : chacun rencontre tout le monde en n − 1 rounds', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const seen = new Set<string>();
    for (let r = 0; r < 3; r++) for (const [x, y] of roundPairings(ids, r)) seen.add([x, y].sort().join('-'));
    expect(seen.size).toBe(6);
  });

  it('nombre impair : le boss « Le Bide » complète le tableau et ne figure pas au classement', () => {
    const input: EngineInput = {
      battle: { format: 'tournoi', startDate: START, rounds: 3, members: [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }] },
      weighIns: [...series('a', START, 21, 80, -0.05), ...series('b', START, 21, 80, 0), ...series('c', START, 21, 80, 0.02)],
      supers: []
    };
    expect(buildSides(input.battle).map((s) => s.id)).toContain('boss');
    const s = simulateBattle(input, battleEndDate(input.battle));
    expect(s.standings.map((x) => x.sideId)).not.toContain('boss');
    for (const r of s.rounds) expect(r.pairings).toHaveLength(2);
  });

  it('équipes : moyenne des coups des membres + 2 PV si tout le monde est pesé', () => {
    const input: EngineInput = {
      battle: { format: 'equipes', startDate: START, rounds: 1, members: [{ userId: 'a', team: 1 }, { userId: 'b', team: 1 }, { userId: 'c', team: 2 }, { userId: 'd', team: 2 }] },
      weighIns: [...series('a', START, 7, 80, 0), ...series('b', START, 7, 80, 0), ...series('c', START, 7, 80, 0), ...series('d', START, 7, 80, 0, [0])],
      supers: []
    };
    const s = simulateBattle(input, START);
    const p = s.days[0].pairings[0];
    expect(p.attacks.a.total).toBe(6); // (4 + 4) / 2 + 2
    expect(p.attacks.b.total).toBe(2); // (4 + 0) / 2, pas de bonus
  });
});

describe('ceinture', () => {
  it('le champion garde la ceinture s’il se pèse et reste à ±1 %', () => {
    const w = [...series('marc', START, 30, 90, 0), ...series('julie', START, 30, 70, 0)];
    const input = duel(w, [], 2);
    expect(beltHeld('marc', input, addDays(START, 20))).toBe(true);
    const w2 = [...series('marc', START, 14, 90, 0), ...series('julie', START, 30, 70, 0)];
    expect(beltHeld('marc', duel(w2, [], 2), addDays(START, 24))).toBe(false);
  });
});

describe('cagnotte', () => {
  const players = [{ userId: 'a', lossPct: 6 }, { userId: 'b', lossPct: 3 }, { userId: 'c', lossPct: 5.5 }];
  it('mode « le vainqueur rafle tout »', () => {
    const s = settleStakes({ mode: 'winner', amount: 2000, objectivePct: 5, players, championMembers: ['a'] });
    expect(s.transfers).toEqual([{ from: 'b', to: 'a', amount: 2000 }, { from: 'c', to: 'a', amount: 2000 }]);
  });
  it('mode « objectif commun » : les perdants paient ceux qui réussissent', () => {
    const s = settleStakes({ mode: 'objectif', amount: 2000, objectivePct: 5, players, championMembers: [] });
    expect(s.winners).toEqual(['a', 'c']);
    expect(s.transfers).toEqual([{ from: 'b', to: 'a', amount: 1000 }, { from: 'b', to: 'c', amount: 1000 }]);
  });
  it('personne ne réussit : la cagnotte est reportée sur la revanche', () => {
    const s = settleStakes({ mode: 'objectif', amount: 2000, objectivePct: 10, players, championMembers: [] });
    expect(s.carryOver).toBe(true);
    expect(s.transfers).toHaveLength(0);
  });
});

describe('silhouette', () => {
  it('convertit l’IMC en corpulence du combattant', () => {
    expect(bmi(98, 178)).toBeCloseTo(30.9, 1);
    expect(kFromBmi(42)).toBe(1);
    expect(kFromBmi(30)).toBeCloseTo(0.6, 5);
    expect(kFromBmi(22)).toBe(0);
    expect(stageIndex(41)).toBe(0);
    expect(stageIndex(23)).toBe(5);
  });
});

describe('commentateur', () => {
  it('commente chaque soirée sans jamais viser le corps', () => {
    const w = [...series('marc', addDays(START, -1), 8, 100, -0.3), ...series('julie', START, 7, 70, 0, [2])];
    const s = simulateBattle(duel(w, [], 1), addDays(START, 6));
    for (const tone of ['bon', 'trash'] as const) {
      for (const d of s.days) {
        const lines = commentary(d.pairings[0], { marc: 'Marc', julie: 'Julie' }, tone, d.date);
        if (!d.pairings[0].idle) expect(lines.length).toBeGreaterThan(1);
        for (const l of lines) expect(l).not.toMatch(/\b(gros|grosse|ventre|bouboule|obèse|graisse)\b/i);
      }
    }
  });
});

describe('date de départ libre', () => {
  // Mercredi 11 novembre 2026 : la battle ne démarre pas un lundi.
  const WED = '2026-11-11';
  const input = (weighIns: EngineWeighIn[], rounds = 2): EngineInput => ({
    battle: { format: 'duel', startDate: WED, rounds, members: [{ userId: 'marc' }, { userId: 'julie' }] }, weighIns, supers: []
  });

  it('découpe la battle en rounds de 7 jours à partir du jour de départ', () => {
    expect(battleEndDate({ startDate: WED, rounds: 2 })).toBe('2026-11-24'); // un mardi
    const w = [...series('marc', WED, 14, 100, -0.1), ...series('julie', WED, 14, 80, 0)];
    const state = simulateBattle(input(w), '2026-11-24');
    expect(state.rounds).toHaveLength(2);
    expect(state.rounds[0]).toMatchObject({ startDate: WED, endDate: '2026-11-17' });
    expect(state.rounds[1]).toMatchObject({ startDate: '2026-11-18', endDate: '2026-11-24' });
    expect(state.finished).toBe(true);
    // Les PV repartent à 100 au 8e jour, un mercredi
    const day8 = state.days.find((d) => d.date === '2026-11-18')!;
    expect(day8.roundIndex).toBe(1);
    expect(day8.pairings[0].hpBefore).toEqual({ a: 100, b: 100 });
  });

  it('se joue dès le premier soir, la première pesée servant de poids de départ', () => {
    const state = simulateBattle(input([{ userId: 'marc', date: WED, weight: 100 }]), WED);
    expect(state.players.marc.startWeight).toBe(100);
    const p = state.days[0].pairings[0];
    expect(state.days[0].date).toBe(WED);
    // Marc s'est pesé : jab ; Julie non : pas de coup
    expect(p.hpAfter).toEqual({ a: 100, b: 100 - RULES.JAB[0] });
  });

  it('remet la référence du crochet à zéro au début de chaque round', () => {
    // Tendance qui descend régulièrement : un crochet chaque jour, y compris au 8e jour (nouveau round)
    const w = [...series('marc', addDays(WED, -3), 17, 100, -0.2), ...series('julie', WED, 14, 80, 0)];
    const sim = simulatePlayer('marc', { weighIns: w, supers: [] }, WED, '2026-11-24');
    expect(sim.days[7].date).toBe('2026-11-18');
    expect(sim.days[7].attack.crochet).toBeGreaterThan(0);
    expect(sim.days.every((d) => d.attack.crochet > 0)).toBe(true);
  });
});

describe('Le Bide : il frappe comme la moyenne des autres combattants', () => {
  const trio = (weighIns: EngineWeighIn[]): EngineInput => ({
    battle: { format: 'tournoi', startDate: START, rounds: 1, members: [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }] }, weighIns, supers: []
  });
  /** Le duel contre le boss du premier soir, et le coup de chaque vrai joueur. */
  function firstNight(input: EngineInput) {
    const day = simulateBattle(input, START).days[0];
    const hits: Record<string, number> = {};
    for (const p of day.pairings) for (const k of ['a', 'b'] as const) if (p[k] !== 'boss') hits[p[k]] = p.attacks[k].total;
    const vs = day.pairings.find((p) => p.a === 'boss' || p.b === 'boss')!;
    const bossKey = vs.a === 'boss' ? 'a' : 'b';
    return { boss: vs.attacks[bossKey].total, opponent: vs[bossKey === 'a' ? 'b' : 'a'], hits };
  }

  it('moyenne des camps autres que son adversaire', () => {
    // Échauffement à 100 kg pour tous ; le premier soir, a et b descendent (crochet), c reste stable (jab seul)
    const warm = ['a', 'b', 'c'].flatMap((u) => series(u, addDays(START, -3), 3, 100, 0));
    const { boss, opponent, hits } = firstNight(trio([...warm,
      { userId: 'a', date: START, weight: 99 }, { userId: 'b', date: START, weight: 98 }, { userId: 'c', date: START, weight: 100 }
    ]));
    const others = Object.keys(hits).filter((u) => u !== opponent);
    expect(others).toHaveLength(2);
    expect(boss).toBeCloseTo((hits[others[0]] + hits[others[1]]) / 2, 1);
    expect(boss).not.toBe(10);
  });

  it('au moins un jab de base, même si personne d’autre ne s’est pesé', () => {
    const { boss } = firstNight(trio([]));
    expect(boss).toBe(RULES.BOSS_MIN);
  });

  it('un joueur régulier peut battre Le Bide quand il fait mieux que ses rivaux', () => {
    // a perd du poids toute la semaine ; b et c se pèsent sans bouger
    const input = trio([...series('a', START, 7, 100, -0.15), ...series('b', START, 7, 100, 0), ...series('c', START, 7, 100, 0)]);
    const state = simulateBattle(input, battleEndDate(input.battle));
    // Au premier round, c'est « a » qui affronte le boss : il frappe plus fort que la moyenne de b et c, donc il gagne
    const vs = state.rounds[0].pairings.find((p) => p.a === 'boss' || p.b === 'boss')!;
    expect([vs.a, vs.b].sort()).toEqual(['a', 'boss']);
    expect(vs.winner).toBe('a');
    // À l'inverse, un joueur qui ne fait que se peser fait jeu égal avec un boss calé sur des rivaux identiques
    const flat = trio(['a', 'b', 'c'].flatMap((u) => series(u, START, 7, 100, 0)));
    const draw = simulateBattle(flat, battleEndDate(flat.battle)).rounds[0].pairings.find((p) => p.a === 'boss' || p.b === 'boss')!;
    expect(draw.hp.a).toBe(draw.hp.b);
    expect(state.standings.map((s) => s.sideId)).not.toContain('boss');
  });
});

describe('pesée après l’heure du combat', () => {
  const late = (date: string, weight: number): EngineWeighIn => ({ userId: 'marc', date, weight, late: true });

  it('ne donne pas de coup ce soir-là, mais conserve la série, la jauge et la tendance', () => {
    const w = [...series('marc', START, 3, 100, -0.2), late(addDays(START, 3), 99.2), ...series('marc', addDays(START, 4), 1, 99, 0)];
    const sim = simulatePlayer('marc', { weighIns: w, supers: [] }, START, addDays(START, 4));
    const d3 = sim.days[3], d4 = sim.days[4];
    expect(d3.attack).toMatchObject({ weighed: false, late: true, total: 0, jab: 0, crochet: 0, gardeUsed: false });
    expect(d3.combo).toBe(4);
    expect(d3.gauge).toBe(4);
    expect(d3.weight).toBe(99.2);
    expect(d3.trend).toBeLessThan(sim.days[2].trend!);
    expect(d4.combo).toBe(5);
    expect(d4.attack.weighed).toBe(true);
  });

  it('une vraie absence, elle, remet la série à zéro', () => {
    const w = [...series('marc', START, 3, 100, -0.2), ...series('marc', addDays(START, 4), 1, 99, 0)];
    const sim = simulatePlayer('marc', { weighIns: w, supers: [] }, START, addDays(START, 4));
    expect(sim.days[3].combo).toBe(0);
    expect(sim.days[4].combo).toBe(1);
  });

  it('reporte le crochet sur la prochaine pesée à l’heure', () => {
    // Deux jours de baisse : pesés à l'heure, ils donnent deux crochets ; avec le 2e jour en retard, un seul crochet, du même total
    const onTime = simulatePlayer('marc', { weighIns: [...series('marc', addDays(START, -3), 3, 100, 0), ...series('marc', START, 3, 99.5, -0.5)], supers: [] }, START, addDays(START, 2));
    const withLate = simulatePlayer('marc', {
      weighIns: [...series('marc', addDays(START, -3), 3, 100, 0), { userId: 'marc', date: START, weight: 99.5 }, late(addDays(START, 1), 99), { userId: 'marc', date: addDays(START, 2), weight: 98.5 }],
      supers: []
    }, START, addDays(START, 2));
    const crochets = (s: typeof onTime) => s.days.reduce((t, d) => t + d.attack.crochet, 0);
    expect(withLate.days[1].attack.crochet).toBe(0);
    expect(crochets(withLate)).toBeCloseTo(crochets(onTime), 1);
  });

  it('ne déclenche pas le super armé et ne compte pas comme pesée pour départager le round', () => {
    const w = [...series('marc', addDays(START, -8), 8, 100, 0), late(START, 100), ...series('julie', START, 1, 80, 0)];
    const input = duel(w, [{ userId: 'marc', date: START }], 1);
    const p = simulateBattle(input, START).days[0].pairings[0];
    expect(p.attacks.a.total).toBe(0);
    expect(p.attacks.a.members.marc.super).toBe(0);
    expect(simulateBattle(input, START).rounds[0].pairings[0].weighIns).toEqual({ a: 0, b: 1 });
  });
});

describe('rivalsOn : qui prévenir quand un joueur se pèse', () => {
  it('duel : l’adversaire, pas de coéquipier', () => {
    const b = duel([]).battle;
    expect(rivalsOn(b, 'marc', START)).toEqual({ opponents: ['julie'], mates: [] });
  });

  it('rien avant le départ ni après la fin', () => {
    const b = duel([]).battle;
    expect(rivalsOn(b, 'marc', addDays(START, -1)).opponents).toEqual([]);
    expect(rivalsOn(b, 'marc', addDays(battleEndDate(b), 1)).opponents).toEqual([]);
    expect(rivalsOn(b, 'inconnu', START)).toEqual({ opponents: [], mates: [] });
  });

  it('équipes : les deux adversaires et le coéquipier', () => {
    const b = { format: 'equipes' as const, startDate: START, rounds: 2, members: [{ userId: 'a', team: 1 }, { userId: 'b', team: 1 }, { userId: 'c', team: 2 }, { userId: 'd', team: 2 }] };
    expect(rivalsOn(b, 'a', START)).toEqual({ opponents: ['c', 'd'], mates: ['b'] });
  });

  it('tournoi : l’adversaire change à chaque round, et personne face au Bide', () => {
    const b = { format: 'tournoi' as const, startDate: START, rounds: 3, members: [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }] };
    const perRound = [0, 7, 14].map((d) => rivalsOn(b, 'a', addDays(START, d)).opponents.join(','));
    expect(new Set(perRound).size).toBe(3);
    expect(perRound).toContain(''); // un round contre Le Bide : aucun humain à prévenir
    expect(perRound).toContain('b');
    expect(perRound).toContain('c');
  });
});
