import 'server-only';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { battleMembers, battles, feed, weighIns, type User, type WeighIn } from './db/schema';
import { battleStatus, displayName, endDateOf, wordOfDay } from './battles';
import { bmi, stageIndex } from './engine/silhouette';
import { globalTrend } from './progress';
import { localDate, now, zonedInstant } from './time';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const EDIT_MINUTES = 10;
const STAGES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

export type WeighResult =
  | { ok: true; weighIn: WeighIn; updated: boolean; transformation: { from: string; to: string } | null; lateFor: string[] }
  | { ok: false; error: string };

/** Battles en cours (ou en échauffement) du joueur. */
export async function liveBattles(userId: string) {
  const rows = await db.select({ b: battles }).from(battleMembers).innerJoin(battles, eq(battles.id, battleMembers.battleId))
    .where(eq(battleMembers.userId, userId));
  const at = now();
  return rows.map((r) => r.b).filter((b) => battleStatus(b, at) !== 'finished');
}

/**
 * Enregistre la pesée du jour. La première pesée compte ; elle reste corrigeable 10 minutes,
 * et jamais après l'heure d'un combat du jour (sinon le résultat déjà révélé changerait).
 */
export async function recordWeighIn(user: User, input: { weight: number; comment: string | null; photo: File | null }): Promise<WeighResult> {
  const at = now();
  const date = localDate(at, user.timezone);
  const live = await liveBattles(user.id);
  const fightsToday = live.filter((b) => date >= b.startDate && date <= endDateOf(b)).map((b) => ({ b, at: zonedInstant(date, b.fightTime, b.timezone) }));
  const lateFor = fightsToday.filter((f) => at >= f.at).map((f) => f.b.name);

  const before = await globalTrend(user.id, date);
  const [existing] = await db.select().from(weighIns).where(and(eq(weighIns.userId, user.id), eq(weighIns.date, date))).limit(1);
  let row: WeighIn;
  let updated = false;
  if (existing) {
    const lockedByFight = fightsToday.some((f) => at >= f.at && existing.createdAt < f.at);
    if (at > existing.editableUntil || lockedByFight) {
      return { ok: false, error: "Seule la première pesée du jour compte : la correction n'est possible que pendant 10 minutes." };
    }
    [row] = await db.update(weighIns).set({ weight: input.weight, comment: input.comment ?? existing.comment }).where(eq(weighIns.id, existing.id)).returning();
    updated = true;
  } else {
    [row] = await db.insert(weighIns).values({
      userId: user.id, date, weight: input.weight, comment: input.comment,
      createdAt: at, editableUntil: new Date(at.getTime() + EDIT_MINUTES * 60_000)
    }).returning();
  }

  if (input.photo && input.photo.size > 0) {
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(input.photo.type) || input.photo.size > 6 * 1024 * 1024) {
      return { ok: false, error: 'Photo refusée : JPEG, PNG ou WebP de 6 Mo maximum.' };
    }
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = input.photo.type.split('/')[1].replace('jpeg', 'jpg');
    const file = `${row.id}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, file), Buffer.from(await input.photo.arrayBuffer()));
    [row] = await db.update(weighIns).set({ photoPath: file, word: wordOfDay(date) }).where(eq(weighIns.id, row.id)).returning();
  }

  // « Transformation ! » : la silhouette clé change avec la nouvelle tendance.
  let transformation: { from: string; to: string } | null = null;
  const after = await globalTrend(user.id, date);
  const s0 = stageIndex(bmi(before.trend, user.heightCm)), s1 = stageIndex(bmi(after.trend, user.heightCm));
  if (s0 >= 0 && s1 >= 0 && s1 !== s0) {
    transformation = { from: STAGES[s0], to: STAGES[s1] };
    if (s1 > s0 && live.length) {
      await db.insert(feed).values(live.map((b) => ({
        battleId: b.id, userId: user.id, kind: 'transformation' as const,
        text: `${displayName(user)} se transforme : silhouette ${STAGES[s0]} → ${STAGES[s1]} !`
      })));
    }
  }
  if (input.comment && !updated && live.length) {
    await db.insert(feed).values(live.map((b) => ({ battleId: b.id, userId: user.id, kind: 'comment' as const, text: input.comment! })));
  }
  return { ok: true, weighIn: row, updated, transformation, lateFor };
}
