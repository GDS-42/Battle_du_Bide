import { describe, expect, it } from 'vitest';
import { ALL_LINES, commentary, commentaryParts } from './commentary';
import type { PairingDay, PlayerAttack, SideAttack } from './types';

const NAMES = { marc: 'Marc', julie: 'Julie', boss: 'Le Bide' };

function member(o: Partial<PlayerAttack> = {}): PlayerAttack {
  return { weighed: true, late: false, combo: 3, flagged: false, jab: 4, crochet: 0, crochetPct: 0, super: 0, total: 4, blocked: true, gardeUsed: false, ...o };
}
function side(uid: string, o: Partial<PlayerAttack> = {}): SideAttack {
  const m = member(o);
  return { total: m.total, jab: m.jab, crochet: m.crochet, super: m.super, teamBonus: 0, members: { [uid]: m } };
}
const absent = (uid: string, o: Partial<PlayerAttack> = {}) => side(uid, { weighed: false, jab: 0, total: 0, blocked: false, combo: 0, ...o });
function pairing(a: SideAttack, b: SideAttack, hpBefore = { a: 80, b: 80 }, o: Partial<PairingDay> = {}): PairingDay {
  return { a: 'marc', b: 'julie', hpBefore, attacks: { a, b }, hpAfter: { a: hpBefore.a - b.total, b: hpBefore.b - a.total }, ko: null, idle: false, ...o };
}
/** Le bilan appartient-il à cette famille de phrases ? (on compare au gabarit, variables retirées) */
const TONES = ['bon', 'trash'] as const;
const all = (p: PairingDay, opts = {}) => TONES.flatMap((tone) => ['s1', 's2', 's3', 's4'].map((seed) => commentaryParts(p, NAMES, tone, seed, { marc: 'Le Rouleau' }, opts)));

describe('commentateur : situations', () => {
  it('ne laisse jamais de variable non remplacée et reste déterministe', () => {
    const cases = [
      pairing(side('marc'), side('julie')),
      pairing(side('marc', { crochet: 6, crochetPct: 0.12, total: 10, blocked: false }), absent('julie')),
      pairing(side('marc', { crochet: 20, crochetPct: 0.4, total: 24, blocked: false, super: 15 }), absent('julie', { late: true, combo: 5 })),
      pairing(absent('marc', { gardeUsed: true, combo: 8 }), side('julie', { combo: 7 })),
      pairing(absent('marc'), absent('julie')),
      pairing(side('marc'), side('julie'), { a: 3, b: 60 }, { ko: 'a', hpAfter: { a: -1, b: 56 } })
    ];
    for (const p of cases) for (const opts of [{}, { lastDay: true }]) {
      for (const c of all(p, opts)) {
        for (const l of [...c.a, ...c.b, c.end ?? '']) { expect(l).not.toMatch(/[{}]/); expect(l).not.toContain('undefined'); }
      }
      expect(commentary(p, NAMES, 'bon', 'x', {}, opts)).toEqual(commentary(p, NAMES, 'bon', 'x', {}, opts));
    }
  });

  it('distingue l’absence, la garde et la pesée après la cloche', () => {
    const txt = (p: PairingDay) => all(p).map((c) => c.b.join(' ')).join(' | ');
    expect(txt(pairing(side('marc'), absent('julie')))).toMatch(/séché|balance|vestiaires|couette|pesée/i);
    expect(txt(pairing(side('marc'), absent('julie', { gardeUsed: true })))).toMatch(/garde/i);
    for (const c of all(pairing(side('marc'), absent('julie', { late: true })))) expect(c.b[0]).toMatch(/cloche|tardive|retard/i);
    for (const c of all(pairing(side('marc'), absent('julie', { gardeUsed: true })))) expect(c.b[0]).toMatch(/garde/i);
  });

  it('s’emballe sur un gros crochet et salue les paliers de série', () => {
    for (const c of all(pairing(side('marc', { crochet: 20, crochetPct: 0.4, total: 24, blocked: false }), side('julie')))) expect(c.a[0]).toMatch(/−0,40 %/);
    for (const c of all(pairing(side('marc', { combo: 7 }), side('julie', { combo: 6 })))) {
      expect(c.a.join(' ')).toMatch(/7 jours/);
      expect(c.b.join(' ')).not.toMatch(/6 jours/);
    }
  });

  it('annonce un renversement quand celui qui était derrière passe devant', () => {
    // Marc mené 60 à 70, frappe 24 : il passe devant 56 à 46
    const p = pairing(side('marc', { crochet: 20, crochetPct: 0.4, total: 24, blocked: false }), side('julie'), { a: 60, b: 70 });
    for (const c of all(p)) expect(c.end).toMatch(/Marc/);
    for (const c of all(p)) expect(c.end).toMatch(/Renversement|remontée|Remontada|retourne/);
  });

  it('parle de duel serré, d’égalité ou de soirée calme selon le score', () => {
    for (const c of all(pairing(side('marc', { jab: 5, total: 5 }), side('julie'), { a: 80, b: 80 }))) expect(c.end).toMatch(/souffle|rien|cheveu|jab/);
    for (const c of all(pairing(side('marc'), side('julie')))) expect(c.end).toMatch(/partout/);
    for (const c of all(pairing(absent('marc'), absent('julie')))) expect(c.end).toMatch(/personne|Aucun|Zéro/i);
  });

  it('rend le verdict le dernier soir du round', () => {
    for (const c of all(pairing(side('marc', { jab: 6, total: 6 }), side('julie'), { a: 50, b: 40 }), { lastDay: true })) expect(c.end).toMatch(/round/i);
    for (const c of all(pairing(side('marc'), side('julie')), { lastDay: true })) expect(c.end).toMatch(/pesées|assidu/);
    // Un K.O. prime sur le verdict de fin de round
    const ko = pairing(side('marc'), side('julie'), { a: 3, b: 60 }, { ko: 'a', hpAfter: { a: -1, b: 56 } });
    for (const c of all(ko, { lastDay: true })) expect(c.end).toMatch(/K\.O\./);
  });

  it('annonce les PV du Bide', () => {
    const p: PairingDay = { ...pairing(side('marc'), { total: 6.5, jab: 6.5, crochet: 0, super: 0, teamBonus: 0, members: {} }), b: 'boss' };
    for (const c of all(p)) expect(c.b[0]).toMatch(/7 PV/);
  });

  it('ne se moque jamais du corps : aucune phrase du répertoire n’y touche', () => {
    expect(ALL_LINES.length).toBeGreaterThan(90);
    for (const l of ALL_LINES) {
      expect(l).not.toMatch(/\b(gros|grosse|gras|grasse|ventre|bide(?!\b)|bouboule|obèse|graisse|bourrelet|kilos? en trop|régime|manger?|bouffe|ration|appétit|frigo|dessert)\b/i);
    }
  });
});
