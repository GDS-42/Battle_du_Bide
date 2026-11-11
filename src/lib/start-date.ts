// Date de départ d'une battle : choisie par l'organisateur, d'aujourd'hui à dans 60 jours.
// Un round dure 7 jours à partir de cette date, quel que soit le jour de la semaine.
import { addDays, localDate, zonedInstant } from './time';

/** Nombre de jours maximum entre aujourd'hui et le premier combat. */
export const START_MAX_DAYS = 60;

/** Le premier combat peut-il avoir lieu ce soir ? (l'heure du combat n'est pas encore passée) */
export function canStartTonight(fightTime: string, tz: string, at: Date): boolean {
  return at.getTime() < zonedInstant(localDate(at, tz), fightTime, tz).getTime();
}

/** Renvoie un message d'erreur si la date de départ n'est pas acceptable, sinon null. */
export function startDateError(startDate: string, fightTime: string, tz: string, at: Date): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return 'Date de départ invalide.';
  let real = false;
  try { real = addDays(startDate, 0) === startDate; } catch {}
  if (!real) return 'Date de départ invalide.';
  const today = localDate(at, tz);
  if (startDate < today) return 'La date de départ est déjà passée.';
  if (startDate === today && !canStartTonight(fightTime, tz, at)) {
    return `Le combat de ce soir (${fightTime}) est déjà passé : choisis demain ou plus tard.`;
  }
  if (startDate > addDays(today, START_MAX_DAYS)) return `Choisis une date dans les ${START_MAX_DAYS} prochains jours.`;
  return null;
}
