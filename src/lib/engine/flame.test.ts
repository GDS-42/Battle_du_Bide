import { describe, expect, it } from 'vitest';
import { simulatePlayer } from './battle';
import { ringFlame } from './flame';
import { RULES } from './rules';
import type { EngineInput, EngineMember, EngineWeighIn, Format } from './types';
import { addDays } from '../time';

const START = '2026-11-16'; // un lundi
const day = (i: number) => addDays(START, i);

/** Une pesée par jour pendant `days` jours à partir du jour `from` de la battle (0 = premier combat), sauf les jours `skip`. */
function series(userId: string, from: number, days: number, skip: number[] = []): EngineWeighIn[] {
  const out: EngineWeighIn[] = [];
  for (let i = from; i < from + days; i++) if (!skip.includes(i)) out.push({ userId, date: day(i), weight: 90 });
  return out;
}

function ring(
  weighIns: EngineWeighIn[],
  o: { rounds?: number; format?: Format; members?: EngineMember[] } = {}
): Pick<EngineInput, 'battle' | 'weighIns'> {
  return {
    battle: { format: o.format ?? 'duel', startDate: START, rounds: o.rounds ?? 6, members: o.members ?? [{ userId: 'marc' }, { userId: 'julie' }] },
    weighIns
  };
}

describe('flamme du ring', () => {
  it('compte les jours d’affilée où tous les joueurs se sont pesés', () => {
    const f = ringFlame(ring([...series('marc', 0, 5), ...series('julie', 0, 5)]), day(4));
    expect(f).toEqual({ days: 5, best: 5, level: 0, next: RULES.FLAME_TIERS[0], missing: 0 });
  });

  it('un seul absent éteint la flamme de tout le ring', () => {
    const f = ringFlame(ring([...series('marc', 0, 5), ...series('julie', 0, 5, [2])]), day(4));
    expect(f).toMatchObject({ days: 2, best: 2 });
  });

  it('un aujourd’hui incomplet ne casse pas encore la flamme, mais un hier incomplet oui', () => {
    const w = [...series('marc', 0, 4), ...series('julie', 0, 3)];
    expect(ringFlame(ring(w), day(3))).toMatchObject({ days: 3, best: 3, missing: 1 });
    expect(ringFlame(ring(w), day(4))).toMatchObject({ days: 0, best: 3, missing: 2 });
  });

  it('une pesée tardive entretient la flamme', () => {
    const w = [...series('marc', 0, 3), ...series('julie', 0, 3).map((x) => ({ ...x, late: true }))];
    expect(ringFlame(ring(w), day(2)).days).toBe(3);
  });

  it('une garde sauve la série du joueur, pas la flamme', () => {
    const w = [...series('marc', 0, 9, [7]), ...series('julie', 0, 9)];
    const marc = simulatePlayer('marc', { weighIns: w, supers: [] }, START, day(8));
    expect(marc.days[7].attack.gardeUsed).toBe(true);
    expect(marc.days[8].combo).toBe(8);
    expect(ringFlame(ring(w), day(8))).toMatchObject({ days: 1, best: 7 });
  });

  it('les pesées d’échauffement ne comptent pas, et la flamme reste éteinte avant le premier combat', () => {
    const w = [...series('marc', -5, 7), ...series('julie', -5, 7)];
    expect(ringFlame(ring(w), day(-1))).toEqual({ days: 0, best: 0, level: 0, next: RULES.FLAME_TIERS[0], missing: 0 });
    expect(ringFlame(ring(w), day(1)).days).toBe(2);
  });

  it('après la battle, la flamme est figée au dernier jour, sans sursis', () => {
    const full = ring([...series('marc', 0, 7), ...series('julie', 0, 7)], { rounds: 1 });
    expect(ringFlame(full, day(10))).toEqual({ days: 7, best: 7, level: 1, next: RULES.FLAME_TIERS[1], missing: 0 });
    const broken = ring([...series('marc', 0, 7), ...series('julie', 0, 7, [6])], { rounds: 1 });
    expect(ringFlame(broken, day(6))).toMatchObject({ days: 6, missing: 1 });
    expect(ringFlame(broken, day(7))).toMatchObject({ days: 0, best: 6, missing: 0 });
  });

  it('le décor s’embellit à 7, 14 et 30 jours', () => {
    const at = (n: number) => ringFlame(ring([...series('marc', 0, n), ...series('julie', 0, n)]), day(n - 1));
    expect(at(6)).toMatchObject({ level: 0, next: 7 });
    expect(at(7)).toMatchObject({ level: 1, next: 14 });
    expect(at(13)).toMatchObject({ level: 1, next: 14 });
    expect(at(14)).toMatchObject({ level: 2, next: 30 });
    expect(at(29)).toMatchObject({ level: 2, next: 30 });
    expect(at(30)).toMatchObject({ level: 3, next: null });
    expect(at(40)).toMatchObject({ days: 40, level: 3, next: null });
  });

  it('un décor gagné reste acquis quand la flamme s’éteint', () => {
    const f = ringFlame(ring([...series('marc', 0, 10), ...series('julie', 0, 10, [8])]), day(9));
    expect(f).toEqual({ days: 1, best: 8, level: 1, next: 14, missing: 0 });
  });

  it('en équipes, tous les joueurs comptent, pas seulement un camp', () => {
    const members = [{ userId: 'a', team: 1 }, { userId: 'b', team: 1 }, { userId: 'c', team: 2 }, { userId: 'd', team: 2 }];
    const w = [...series('a', 0, 4), ...series('b', 0, 4), ...series('c', 0, 4), ...series('d', 0, 4, [1])];
    expect(ringFlame(ring(w, { format: 'equipes', members }), day(3))).toMatchObject({ days: 2, best: 2 });
  });

  it('un joueur seul face au Bide entretient sa propre flamme', () => {
    const f = ringFlame(ring(series('marc', 0, 8, [3]), { members: [{ userId: 'marc' }] }), day(7));
    expect(f).toMatchObject({ days: 4, best: 4 });
  });

  it('sans pesée ou sans joueur, la flamme est éteinte', () => {
    expect(ringFlame(ring([]), day(3))).toMatchObject({ days: 0, best: 0, missing: 2 });
    expect(ringFlame(ring([], { members: [] }), day(3))).toEqual({ days: 0, best: 0, level: 0, next: 7, missing: 0 });
  });
});
