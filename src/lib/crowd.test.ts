import { describe, expect, it } from 'vitest';
import { CROWD_NAMES, CROWD_RATE, makeCrowd, rng, type CrowdName } from './crowd';

const SECONDS: Record<CrowdName, number> = { fond: 4, acclame: 1.8, ovation: 3.8, ooh: 1.25, decu: 1.3, huees: 1.6, applaud: 2.2, stupeur: 0.6, he: 0.4 };
const rms = (a: Float32Array, from = 0, to = a.length) => { let s = 0; for (let i = from; i < to; i++) s += a[i] * a[i]; return Math.sqrt(s / (to - from)); };

describe('foule du ring', () => {
  it('le hasard est reproductible', () => {
    const a = rng(42), b = rng(42), c = rng(43);
    const xs = [a(), a(), a()], ys = [b(), b(), b()];
    expect(xs).toEqual(ys);
    expect(c()).not.toBe(xs[0]);
    for (const x of xs) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
  });

  it('chaque son a sa durée, aucun échantillon invalide, un niveau borné et de la largeur', () => {
    for (const name of CROWD_NAMES) {
      const c = makeCrowd(name);
      expect(c.left.length, name).toBe(Math.floor(SECONDS[name] * CROWD_RATE));
      expect(c.right.length, name).toBe(c.left.length);
      let peak = 0, diff = 0;
      for (let i = 0; i < c.left.length; i++) {
        expect(Number.isFinite(c.left[i]) && Number.isFinite(c.right[i]), `${name} échantillon ${i}`).toBe(true);
        peak = Math.max(peak, Math.abs(c.left[i]), Math.abs(c.right[i]));
        diff = Math.max(diff, Math.abs(c.left[i] - c.right[i]));
      }
      expect(peak, name).toBeLessThanOrEqual(0.9001);
      expect(peak, name).toBeGreaterThan(0.85); // mis à niveau
      expect(rms(c.left), name).toBeGreaterThan(0.02); // pas un silence
      expect(diff, name).toBeGreaterThan(0.05); // gauche et droite diffèrent : la salle a de la largeur
    }
  });

  it('la même graine donne la même foule, une autre graine une autre foule', () => {
    const a = makeCrowd('ooh', 7), b = makeCrowd('ooh', 7), c = makeCrowd('ooh', 8);
    expect(Array.from(a.left.slice(2000, 2050))).toEqual(Array.from(b.left.slice(2000, 2050)));
    expect(Array.from(a.left.slice(2000, 2050))).not.toEqual(Array.from(c.left.slice(2000, 2050)));
  });

  it('les réactions commencent et finissent au silence', () => {
    for (const name of CROWD_NAMES.filter((n) => n !== 'fond')) {
      const c = makeCrowd(name);
      expect(c.loop, name).toBe(false);
      expect(Math.abs(c.left[0]), name).toBeLessThan(1e-6);
      expect(Math.abs(c.left[c.left.length - 1]), name).toBeLessThan(1e-6);
    }
  });

  it('le fond est une boucle : il ne s’éteint ni au début ni à la fin, et son niveau reste régulier', () => {
    const c = makeCrowd('fond');
    expect(c.loop).toBe(true);
    const n = c.left.length, slice = Math.floor(n / 8), levels = Array.from({ length: 8 }, (_, i) => rms(c.left, i * slice, (i + 1) * slice));
    const mean = levels.reduce((s, x) => s + x, 0) / 8;
    // aucun huitième de la boucle n'est un trou ni une bosse : sinon le raccord s'entendrait à chaque tour
    for (const l of levels) { expect(l).toBeGreaterThan(mean * 0.45); expect(l).toBeLessThan(mean * 1.9); }
  });

  it('les applaudissements sont faits d’éclats : beaucoup plus de crêtes que de niveau moyen', () => {
    const c = makeCrowd('applaud');
    expect(0.9 / rms(c.left)).toBeGreaterThan(4); // facteur de crête élevé, signature de claquements
  });
});
