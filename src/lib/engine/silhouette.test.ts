import { describe, expect, it } from 'vitest';
import { bmi, bmiCategory, bmiView, nextStep, stageIndex, stepOfStage, stepsAhead, stepsCrossed, stepWeight } from './silhouette';

describe('IMC en clair et prochain palier', () => {
  it('range l’IMC dans les catégories de l’OMS', () => {
    expect(bmiCategory(18.4)).toBe('maigreur');
    expect(bmiCategory(18.5)).toBe('corpulence normale');
    expect(bmiCategory(24.9)).toBe('corpulence normale');
    expect(bmiCategory(25)).toBe('surpoids');
    expect(bmiCategory(29.9)).toBe('surpoids');
    expect(bmiCategory(30)).toBe('obésité modérée');
    expect(bmiCategory(35)).toBe('obésité sévère');
    expect(bmiCategory(40)).toBe('obésité massive');
    expect(bmiCategory(null)).toBeNull();
  });

  it('donne le prochain palier sous le poids actuel', () => {
    // 1,78 m, 86,7 kg : IMC 27,4, entre S3 et S4 → palier 27
    expect(bmi(86.7, 178)).toBe(27.4);
    expect(nextStep(86.7, 178)).toEqual({ bmi: 27, stage: 'S4', weight: 85.7 });
    expect(nextStep(85.7, 178)).toEqual({ bmi: 25, stage: 'S5', weight: 79.3 });
    // Au-dessus de 40, le premier palier est 35, comme pour les silhouettes
    expect(nextStep(135, 178)?.bmi).toBe(35);
    expect(nextStep(null, 178)).toBeNull();
    expect(nextStep(86.7, null)).toBeNull();
  });

  it('ne propose plus aucun palier en forme équilibrée (IMC de 23 ou moins)', () => {
    expect(bmi(72.8, 178)).toBe(23);
    expect(nextStep(72.8, 178)).toBeNull();
    expect(nextStep(60, 178)).toBeNull();
    expect(nextStep(73.2, 178)?.bmi).toBe(23);
  });

  it('place le poids du palier exactement au seuil qui déclenche la transformation, pour toutes les tailles', () => {
    for (let h = 120; h <= 230; h++) {
      for (const key of [35, 30, 27, 25, 23]) {
        const w = stepWeight(key, h);
        const up = Math.round((w + 0.1) * 10) / 10;
        // À ce poids le palier est atteint ; un dixième de kilo au-dessus, pas encore.
        expect(bmi(w, h)!).toBeLessThanOrEqual(key);
        expect(bmi(up, h)!).toBeGreaterThan(key);
        expect(stageIndex(bmi(w, h))).toBe(stageIndex(bmi(up, h)) + 1);
        // Juste au-dessus, c'est bien ce palier qui est visé.
        expect(nextStep(up, h)).toEqual({ bmi: key, stage: expect.any(String), weight: w });
      }
    }
  });

  it('compte les paliers franchis et ceux qui restent', () => {
    expect(stepsCrossed(88, 86.7, 178)).toBe(0); // 27,8 → 27,4 : même silhouette
    expect(stepsCrossed(88, 85.7, 178)).toBe(1); // 27,8 → 27,0
    expect(stepsCrossed(98, 79, 178)).toBe(3); // 30,9 → 24,9 : paliers 30, 27 et 25
    expect(stepsCrossed(85.7, 88, 178)).toBe(0); // une reprise ne compte pas en négatif
    expect(stepsCrossed(88, 85.7, null)).toBe(0);
    expect(stepsAhead(135, 178)).toBe(5);
    expect(stepsAhead(86.7, 178)).toBe(3);
    expect(stepsAhead(75, 178)).toBe(1); // 23,7
    expect(stepsAhead(70, 178)).toBe(0);
    expect(stepsAhead(70, null)).toBe(0);
  });

  it('relie le palier à sa silhouette', () => {
    expect(stepOfStage('S4')).toBe(27);
    expect(stepOfStage('S6')).toBe(23);
    expect(stepOfStage('S1')).toBeNull();
    expect(stepOfStage('??')).toBeNull();
  });

  it('prépare ce que le joueur lit : IMC, catégorie, palier, reste et avancement', () => {
    const v = bmiView(86.7, 88, 178)!;
    expect(v).toMatchObject({ bmi: 27.4, category: 'surpoids', hold: false, low: false });
    expect(v.step).toMatchObject({ bmi: 27, weight: 85.7, left: 1 });
    expect(v.step!.progress).toBeCloseTo(1.3 / 2.3, 5);
    // Il reste toujours au moins 0,1 kg tant que le palier n'est pas franchi
    expect(bmiView(85.72, 88, 178)!.step).toMatchObject({ bmi: 27, left: 0.1 });
    expect(bmiView(85.7, 88, 178)!.step).toMatchObject({ bmi: 25, weight: 79.3 });
    // Poids repassé au-dessus du départ : avancement à 0 ; départ sous le palier : pas de jauge
    expect(bmiView(89, 88, 178)!.step!.progress).toBe(0);
    expect(bmiView(86.7, 85, 178)!.step!.progress).toBeNull();
    expect(bmiView(86.7, null, 178)!.step!.progress).toBeNull();
  });

  it('ne vise plus rien en forme équilibrée et signale la maigreur', () => {
    expect(bmiView(70, 75, 178)).toMatchObject({ bmi: 22.1, category: 'corpulence normale', step: null, hold: true, low: false });
    expect(bmiView(57.5, 60, 178)).toMatchObject({ bmi: 18.1, category: 'maigreur', step: null, hold: true, low: true });
    expect(bmiView(86.7, 88, null)).toBeNull();
    expect(bmiView(null, 88, 178)).toBeNull();
  });
});
