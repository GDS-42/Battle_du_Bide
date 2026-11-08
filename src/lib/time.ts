// Outils de date « locale » (fuseau de la battle) sans dépendance externe.
// Une date locale est une chaîne 'YYYY-MM-DD', une heure locale 'HH:MM'.

export const DEFAULT_TZ = process.env.DEFAULT_TIMEZONE || 'Europe/Paris';

/** Horloge de l'app. En dev / démo, BDB_FAKE_NOW (ISO) permet de voyager dans le temps. */
export function now(): Date {
  const fake = process.env.BDB_FAKE_NOW;
  if (fake && (process.env.NODE_ENV !== 'production' || process.env.ALLOW_FAKE_NOW === '1')) {
    const d = new Date(fake);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function parts(instant: Date, tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    fmtCache.set(tz, f);
  }
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(instant)) o[p.type] = p.value;
  return o;
}

export function localDate(instant: Date, tz: string = DEFAULT_TZ): string {
  const p = parts(instant, tz);
  return `${p.year}-${p.month}-${p.day}`;
}

export function localTime(instant: Date, tz: string = DEFAULT_TZ): string {
  const p = parts(instant, tz);
  return `${p.hour}:${p.minute}`;
}

function toUtcMs(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(date: string, n: number): string {
  const t = new Date(toUtcMs(date) + n * 86400000);
  return t.toISOString().slice(0, 10);
}

export function dayDiff(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / 86400000);
}

/** 0 = lundi … 6 = dimanche. */
export function weekday(date: string): number {
  return (new Date(toUtcMs(date)).getUTCDay() + 6) % 7;
}

export function nextMonday(date: string): string {
  const wd = weekday(date);
  return addDays(date, wd === 0 ? 7 : 7 - wd);
}

/** Instant UTC correspondant à `date` `time` dans le fuseau `tz`. */
export function zonedInstant(date: string, time: string, tz: string = DEFAULT_TZ): Date {
  const [h, mi] = time.split(':').map(Number);
  const target = toUtcMs(date) + (h * 60 + mi) * 60000;
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const p = parts(new Date(guess), tz);
    const seen = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
    guess += target - seen;
  }
  return new Date(guess);
}

export function compareTime(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export function dayName(date: string): string {
  return JOURS[weekday(date)];
}

export function prettyDate(date: string, withDay = true): string {
  const [, m, d] = date.split('-').map(Number);
  const s = `${d === 1 ? '1er' : d} ${MOIS[m - 1]}`;
  return withDay ? `${dayName(date)} ${s}` : s;
}
