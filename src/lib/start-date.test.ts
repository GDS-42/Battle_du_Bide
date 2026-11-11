import { describe, expect, it } from 'vitest';
import { canStartTonight, START_MAX_DAYS, startDateError } from './start-date';
import { addDays } from './time';

const TZ = 'Europe/Paris';
// Mercredi 11 novembre 2026, 10 h à Paris (9 h UTC)
const MORNING = new Date('2026-11-11T09:00:00Z');
// Le même jour, 21 h 30 à Paris : le combat de 21 h est passé
const NIGHT = new Date('2026-11-11T20:30:00Z');

describe('startDateError', () => {
  it('accepte ce soir tant que l’heure du combat n’est pas passée', () => {
    expect(startDateError('2026-11-11', '21:00', TZ, MORNING)).toBeNull();
    expect(canStartTonight('21:00', TZ, MORNING)).toBe(true);
  });

  it('refuse ce soir une fois l’heure du combat passée', () => {
    expect(startDateError('2026-11-11', '21:00', TZ, NIGHT)).toMatch(/déjà passé/);
    expect(canStartTonight('21:00', TZ, NIGHT)).toBe(false);
    // … mais une battle dont le combat est à 23 h peut encore démarrer ce soir
    expect(startDateError('2026-11-11', '23:00', TZ, NIGHT)).toBeNull();
  });

  it('accepte n’importe quel jour de la semaine, de demain à la limite', () => {
    expect(startDateError('2026-11-12', '21:00', TZ, NIGHT)).toBeNull(); // jeudi
    expect(startDateError('2026-11-14', '21:00', TZ, MORNING)).toBeNull(); // samedi
    expect(startDateError('2026-11-16', '21:00', TZ, MORNING)).toBeNull(); // lundi
    expect(startDateError(addDays('2026-11-11', START_MAX_DAYS), '21:00', TZ, MORNING)).toBeNull();
  });

  it('refuse le passé et les dates trop lointaines', () => {
    expect(startDateError('2026-11-10', '21:00', TZ, MORNING)).toMatch(/déjà passée/);
    expect(startDateError(addDays('2026-11-11', START_MAX_DAYS + 1), '21:00', TZ, MORNING)).toMatch(/prochains jours/);
  });

  it('refuse les dates mal formées ou inexistantes', () => {
    for (const d of ['', 'demain', '11/11/2026', '2026-13-01', '2026-02-31', '2026-11-11T10:00']) {
      expect(startDateError(d, '21:00', TZ, MORNING)).toBe('Date de départ invalide.');
    }
  });

  it('raisonne dans le fuseau de la battle', () => {
    // 23 h 30 UTC le 11 = 0 h 30 le 12 à Paris : le 11 est déjà « hier »
    const late = new Date('2026-11-11T23:30:00Z');
    expect(startDateError('2026-11-11', '21:00', TZ, late)).toMatch(/déjà passée/);
    expect(startDateError('2026-11-12', '21:00', TZ, late)).toBeNull();
  });
});
