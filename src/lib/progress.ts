import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from './db';
import { weighIns } from './db/schema';
import { simulatePlayer } from './engine/battle';

/** Tendance globale d'un joueur (toutes battles confondues), utilisée pour sa silhouette. */
export async function globalTrend(userId: string, today: string): Promise<{ trend: number | null; first: string | null; last: number | null; prevTrend: number | null }> {
  const rows = await db.select().from(weighIns).where(eq(weighIns.userId, userId)).orderBy(asc(weighIns.date));
  if (!rows.length) return { trend: null, first: null, last: null, prevTrend: null };
  const first = rows[0].date;
  const until = today < first ? first : today;
  const sim = simulatePlayer(userId, { weighIns: rows.map((r) => ({ userId, date: r.date, weight: r.weight })), supers: [] }, first, until);
  const days = sim.days;
  const trend = days[days.length - 1]?.trend ?? null;
  let prevTrend: number | null = null;
  for (let i = days.length - 2; i >= 0; i--) if (days[i].trend !== null) { prevTrend = days[i].trend; break; }
  return { trend, first, last: rows[rows.length - 1].weight, prevTrend };
}
