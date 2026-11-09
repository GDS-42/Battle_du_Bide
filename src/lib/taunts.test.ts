import { describe, expect, it } from 'vitest';
import { cleanTaunt, TAUNT_MAX, TAUNTS } from './taunts';

describe('cleanTaunt', () => {
  it('garde un message normal', () => {
    expect(cleanTaunt('Ce soir, au tapis !')).toBe('Ce soir, au tapis !');
  });
  it('resserre les espaces et retire retours à la ligne et caractères invisibles', () => {
    expect(cleanTaunt('  Salut\n\n  toi\t!  ')).toBe('Salut toi !');
    expect(cleanTaunt('a‮b​c\u0007d')).toBe('a b c d');
  });
  it('borne la longueur', () => {
    expect(cleanTaunt('x'.repeat(500))).toHaveLength(TAUNT_MAX);
  });
  it('rend une chaîne vide pour un message vide ou absent', () => {
    expect(cleanTaunt('   \n ')).toBe('');
    expect(cleanTaunt(null)).toBe('');
  });
  it('propose 3 suggestions courtes par ton', () => {
    for (const tone of ['bon', 'trash'] as const) {
      expect(TAUNTS[tone]).toHaveLength(3);
      for (const t of TAUNTS[tone]) expect(t.length).toBeLessThanOrEqual(25);
    }
  });
});
