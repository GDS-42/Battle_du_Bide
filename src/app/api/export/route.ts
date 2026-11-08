import { asc, eq } from 'drizzle-orm';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { battleMembers, battles, weighIns } from '@/lib/db/schema';

/** Export des données personnelles : JSON complet, ou CSV des pesées (?format=csv). */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return new Response('Non connecté', { status: 401 });
  const rows = await db.select().from(weighIns).where(eq(weighIns.userId, user.id)).orderBy(asc(weighIns.date));
  const stamp = new Date().toISOString().slice(0, 10);
  if (new URL(req.url).searchParams.get('format') === 'csv') {
    const esc = (s: string | null) => (s ? `"${s.replace(/"/g, '""')}"` : '');
    const csv = ['date;poids_kg;commentaire;heure_saisie', ...rows.map((r) => `${r.date};${String(r.weight).replace('.', ',')};${esc(r.comment)};${r.createdAt.toISOString()}`)].join('\n');
    return new Response('﻿' + csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="battle-du-bide-pesees-${stamp}.csv"` } });
  }
  const mine = await db.select({ b: battles, team: battleMembers.team, joinedAt: battleMembers.joinedAt }).from(battleMembers)
    .innerJoin(battles, eq(battles.id, battleMembers.battleId)).where(eq(battleMembers.userId, user.id));
  const body = {
    exportedAt: new Date().toISOString(),
    profile: {
      email: user.email, name: user.name, nickname: user.nickname, superMove: user.superMove, entrance: user.entrance,
      heightCm: user.heightCm, weighTime: user.weighTime, timezone: user.timezone, fighter: user.fighter, presetKey: user.presetKey, createdAt: user.createdAt
    },
    weighIns: rows.map((r) => ({ date: r.date, weight: r.weight, comment: r.comment, photo: !!r.photoPath, createdAt: r.createdAt })),
    battles: mine.map((m) => ({ name: m.b.name, format: m.b.format, startDate: m.b.startDate, rounds: m.b.rounds, team: m.team, joinedAt: m.joinedAt }))
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': `attachment; filename="battle-du-bide-${stamp}.json"` } });
}
