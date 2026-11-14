import { describe, expect, it } from 'vitest';
import { actorsOf, blowOf, toBeats, type Scene, type SideView } from './model';

const side = (over: Partial<SideView['attack']> = {}, extra: Partial<SideView> = {}): SideView => ({
  id: 'x', name: 'X', sub: '', boss: false, fighters: [],
  attack: { total: 5, jab: 5, crochet: 0, super: 0, teamBonus: 0, weighed: true, late: false, blocked: false, garde: false, combo: 1, ...over },
  ...extra
});
const scene = (a: SideView, b: SideView, ko: Scene['ko'] = null, idle = false): Scene => ({
  key: 'k', mine: true, idle, a, b, hpBefore: { a: 60, b: 55 }, hpAfter: { a: 50, b: 45 }, ko, lines: { a: [], b: [], end: null }
});

describe('replay : du combat aux séquences', () => {
  it('le coup d’un camp suit la même priorité que l’étiquette du replay', () => {
    expect(blowOf(side({}, { boss: true }))).toBe('bide');
    expect(blowOf(side({ weighed: false, total: 0 }))).toBe('absent');
    expect(blowOf(side({ weighed: false, super: 15 }))).toBe('absent');
    expect(blowOf(side({ super: 15, crochet: 7 }))).toBe('super');
    expect(blowOf(side({ crochet: 7 }))).toBe('crochet');
    expect(blowOf(side({ blocked: true }))).toBe('bloque');
    expect(blowOf(side())).toBe('jab');
  });

  it('sans K.O. : face-à-face éventuel, A frappe, puis B', () => {
    const s = scene(side({ crochet: 7, total: 12.4 }), side());
    expect(toBeats(s, true).map((b) => b.kind)).toEqual(['intro', 'blow', 'blow']);
    const beats = toBeats(s, false);
    expect(beats).toEqual([
      { kind: 'blow', by: 'a', blow: 'crochet', dmg: 12, late: false, move: null },
      { kind: 'blow', by: 'b', blow: 'jab', dmg: 5, late: false, move: null }
    ]);
  });

  it('K.O. : le futur vaincu frappe d’abord, le vainqueur porte le coup final', () => {
    const a = side({ super: 15, total: 20 }, { move: 'La Tornade' }), b = side();
    expect(toBeats(scene(a, b, 'b'), false)).toEqual([
      { kind: 'blow', by: 'b', blow: 'jab', dmg: 5, late: false, move: null },
      { kind: 'ko', by: 'a', blow: 'super', dmg: 20, late: false, move: 'La Tornade' }
    ]);
    expect(toBeats(scene(a, b, 'a'), false).map((x) => [x.kind, 'by' in x ? x.by : null])).toEqual([['blow', 'a'], ['ko', 'b']]);
  });

  it('double K.O. : une seule séquence croisée ; combat déjà plié : aucune séquence', () => {
    expect(toBeats(scene(side(), side(), 'both'), true).map((b) => b.kind)).toEqual(['intro', 'doubleKo']);
    expect(toBeats(scene(side(), side(), 'b', true), true)).toEqual([]);
  });

  it('chaque camp agit exactement une fois, quel que soit le cas', () => {
    const sides = [side(), side({ crochet: 9 }), side({ super: 15 }), side({ weighed: false, total: 0 }), side({ weighed: false, late: true, total: 0 }), side({ blocked: true }), side({}, { boss: true })];
    for (const a of sides) for (const b of sides) for (const ko of [null, 'a', 'b', 'both'] as const) {
      const acted = toBeats(scene(a, b, ko), true).flatMap(actorsOf);
      expect(acted.filter((x) => x === 'a')).toHaveLength(1);
      expect(acted.filter((x) => x === 'b')).toHaveLength(1);
    }
  });

  it('un absent ne porte jamais de coup final', () => {
    const beats = toBeats(scene(side({ weighed: false, total: 0 }), side(), 'b'), false);
    expect(beats.map((b) => b.kind)).toEqual(['blow', 'blow']);
  });
});
