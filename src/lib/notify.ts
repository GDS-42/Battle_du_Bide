import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import { db, pool } from './db';
import { battleMembers, battles, users, weighIns } from './db/schema';
import { displayName, endDateOf, loadBundle, previewFor, roundOf } from './battles';
import { sendOnce } from './push';
import { addDays, localDate, localTime, zonedInstant } from './time';

const LOCK_ID = 4242_2026;
const FIGHT_WINDOW_MS = 3 * 3600_000; // on ne prévient plus d'un combat révélé il y a plus de 3 h
const minutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/**
 * Passe de la tâche planifiée (toutes les minutes) : rappel du matin, combat prêt, série en danger.
 * Idempotent : chaque notification a une clé unique dans notif_log.
 */
export async function tick(at: Date): Promise<{ skipped?: boolean; sent: number }> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ ok: boolean }>('select pg_try_advisory_lock($1) as ok', [LOCK_ID]);
    if (!rows[0]?.ok) return { skipped: true, sent: 0 };
    try {
      return { sent: await run(at) };
    } finally {
      await client.query('select pg_advisory_unlock($1)', [LOCK_ID]);
    }
  } finally {
    client.release();
  }
}

async function run(at: Date): Promise<number> {
  let sent = 0;
  const all = await db.select().from(battles);
  // battles en échauffement ou en cours (le rappel du matin sert aussi pendant l'échauffement)
  const live = all.filter((b) => localDate(at, b.timezone) <= endDateOf(b));

  // 1) Combat prêt et 3) série en danger, battle par battle
  const remindedToday = new Set<string>();
  for (const row of live) {
    const today = localDate(at, row.timezone);
    if (today < row.startDate || today > endDateOf(row)) continue;
    const fightAt = zonedInstant(today, row.fightTime, row.timezone).getTime();
    // loadBundle applique settleStart : sans adversaire, le départ vient d'être reporté et il n'y a pas de combat ce soir.
    const bundle = await loadBundle(row.id);
    if (!bundle) continue;
    const b = bundle.battle;
    if (today < b.startDate || today > endDateOf(b)) continue;
    const { day } = roundOf(b, today);
    const last = today === endDateOf(b);

    if (at.getTime() >= fightAt && at.getTime() - fightAt < FIGHT_WINDOW_MS) {
      const body = last ? 'Finale : qui repart avec la ceinture ?' : day === 7 ? 'Dernier combat du round : verdict !' : 'Le combat de ce soir est prêt. Qui a frappé le plus fort ?';
      for (const m of bundle.members) {
        if (await sendOnce(m.userId, `combat:${b.id}:${today}`, { title: `🥊 ${b.name}`, body, url: `/battles/${b.id}/combat/${today}`, tag: `combat-${b.id}` })) sent++;
      }
    }

    const mins = minutes(localTime(at, b.timezone));
    const f = minutes(b.fightTime);
    if (mins >= f - 60 && mins < f) {
      for (const m of bundle.members) {
        const weighed = bundle.weighIns.some((w) => w.userId === m.userId && w.date === today);
        if (weighed) continue;
        const prev = previewFor(bundle, m.userId, addDays(today, -1));
        if ((prev?.combo ?? 0) < 3) continue;
        if (await sendOnce(m.userId, `serie:${today}`, { title: 'Série en danger !', body: `Ton combo ×${prev!.combo} saute si tu ne te pèses pas avant ${b.fightTime}.`, url: '/pesee', tag: 'serie' })) sent++;
        remindedToday.add(m.userId);
      }
    }
  }

  // 2) Rappel du matin à l'heure de pesée choisie, si pas encore pesé
  const liveIds = live.map((b) => b.id);
  if (!liveIds.length) return sent;
  const members = await db.select({ u: users, battleId: battleMembers.battleId }).from(battleMembers)
    .innerJoin(users, eq(users.id, battleMembers.userId)).where(inArray(battleMembers.battleId, liveIds));
  const seen = new Set<string>();
  for (const { u, battleId } of members) {
    if (seen.has(u.id) || !u.notifyOn || remindedToday.has(u.id)) continue;
    seen.add(u.id);
    const today = localDate(at, u.timezone);
    const t = minutes(localTime(at, u.timezone));
    if (t < minutes(u.weighTime) || t > minutes(u.weighTime) + 180) continue;
    const [done] = await db.select({ id: weighIns.id }).from(weighIns).where(and(eq(weighIns.userId, u.id), eq(weighIns.date, today))).limit(1);
    if (done) continue;
    const rivals = members.filter((x) => x.battleId === battleId && x.u.id !== u.id).map((x) => x.u);
    const rivalIds = rivals.map((r) => r.id);
    const doneRivals = rivalIds.length
      ? await db.select({ userId: weighIns.userId }).from(weighIns).where(and(inArray(weighIns.userId, rivalIds), eq(weighIns.date, today)))
      : [];
    const first = rivals.find((r) => doneRivals.some((d) => d.userId === r.id));
    const body = first ? `${displayName(first)} s'est déjà pesé(e). À toi de charger ton coup !` : 'Ton coup du jour t’attend : monte sur la balance.';
    if (await sendOnce(u.id, `rappel:${today}`, { title: 'Pesée du matin', body, url: '/pesee', tag: 'rappel' })) sent++;
  }
  return sent;
}
