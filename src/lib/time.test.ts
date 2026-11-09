import { describe, expect, it } from 'vitest';
import { addDays, dayDiff, localDate, localTime, nextMonday, prettyDate, weekday, zonedInstant } from './time';

describe('dates locales', () => {
  it('jours de la semaine et prochain lundi', () => {
    expect(weekday('2026-11-16')).toBe(0);
    expect(weekday('2026-11-22')).toBe(6);
    expect(nextMonday('2026-11-08')).toBe('2026-11-09');
    expect(nextMonday('2026-11-09')).toBe('2026-11-16');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(dayDiff('2026-11-16', '2026-11-23')).toBe(7);
  });

  it('convertit une heure locale de Paris en instant UTC, y compris au changement d’heure', () => {
    expect(zonedInstant('2026-11-18', '21:00', 'Europe/Paris').toISOString()).toBe('2026-11-18T20:00:00.000Z');
    expect(zonedInstant('2026-07-01', '21:00', 'Europe/Paris').toISOString()).toBe('2026-07-01T19:00:00.000Z');
    expect(zonedInstant('2027-03-28', '21:00', 'Europe/Paris').toISOString()).toBe('2027-03-28T19:00:00.000Z');
  });

  it('date et heure locales d’un instant', () => {
    const t = new Date('2026-11-18T23:30:00Z');
    expect(localDate(t, 'Europe/Paris')).toBe('2026-11-19');
    expect(localTime(t, 'Europe/Paris')).toBe('00:30');
  });

  it('formate en français', () => {
    expect(prettyDate('2026-11-16')).toBe('lundi 16 novembre');
    expect(prettyDate('2026-12-01', false)).toBe('1er décembre');
  });
});
