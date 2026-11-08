import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import path from 'node:path';
import { gen } from './gen';
import { PRESETS } from './presets';

// Le générateur de l'app doit dessiner exactement comme celui de l'atelier de DA (design/atelier/fighter.js).
const require = createRequire(import.meta.url);
const atelier = require(path.resolve(__dirname, '../../../design/atelier/fighter.js'));

describe('générateur de combattant', () => {
  const cases = [
    ...PRESETS.flatMap((p) => [0, 0.5, 1].map((k) => ({ ...p.cfg, k }))),
    { k: 0.3, outfit: 'track' as const, pose: 'hurt' as const, acc: ['bandana' as const, 'glassesSquare' as const], beard: 'short' as const, hairStyle: 'dreads' as const },
    { k: 0.8, outfit: 'boxe' as const, tank: true, pose: 'punch' as const, flip: true },
    { k: 0.4, ghost: true }
  ];
  it.each(cases.map((c, i) => [i, c]))('cas %i identique à l’atelier', (_i, c) => {
    const cfg = { ...(c as object), id: 'x', w: 150 } as Parameters<typeof gen>[0];
    expect(gen(cfg)).toEqual(atelier.gen(cfg));
  });
});
