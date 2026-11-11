import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db } from './db';
import { weighIns } from './db/schema';
import { simulatePlayer } from './engine/battle';

export interface SeriesDay { date: string; weight: number | null; trend: number | null }

export interface PersonalSeries {
  /** Un point par jour, de la première pesée à aujourd'hui (weight = null les jours sans pesée). */
  days: SeriesDay[];
  /** Date et poids de la toute première pesée. */
  first: string | null;
  firstWeight: number | null;
  /** Tendance actuelle, et tendance du dernier jour précédent où elle existait. */
  trend: number | null;
  prevTrend: number | null;
  /** Dernière pesée saisie. */
  last: number | null;
  /** Nombre de pesées. */
  count: number;
}

/**
 * Courbe personnelle d'un joueur, toutes battles confondues : ses pesées et sa tendance lissée.
 * Elle existe dès la première pesée, donc aussi pendant l'échauffement.
 */
export async function personalSeries(userId: string, today: string): Promise<PersonalSeries> {
  const rows = await db.select().from(weighIns).where(eq(weighIns.userId, userId)).orderBy(asc(weighIns.date));
  if (!rows.length) return { days: [], first: null, firstWeight: null, trend: null, prevTrend: null, last: null, count: 0 };
  const first = rows[0].date;
  const until = today < first ? first : today;
  const sim = simulatePlayer(userId, { weighIns: rows.map((r) => ({ userId, date: r.date, weight: r.weight })), supers: [] }, first, until);
  const days = sim.days.map((d) => ({ date: d.date, weight: d.weight, trend: d.trend }));
  const trend = days[days.length - 1]?.trend ?? null;
  let prevTrend: number | null = null;
  for (let i = days.length - 2; i >= 0; i--) if (days[i].trend !== null) { prevTrend = days[i].trend; break; }
  return { days, first, firstWeight: rows[0].weight, trend, prevTrend, last: rows[rows.length - 1].weight, count: rows.length };
}

/** Tendance globale d'un joueur (toutes battles confondues), utilisée pour sa silhouette. */
export async function globalTrend(userId: string, today: string): Promise<{ trend: number | null; first: string | null; last: number | null; prevTrend: number | null }> {
  const { trend, first, last, prevTrend } = await personalSeries(userId, today);
  return { trend, first, last, prevTrend };
}
