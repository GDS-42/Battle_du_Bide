'use server';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { and, asc, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser, endSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { battleMembers, battles, pushSubscriptions, users, weighIns } from '@/lib/db/schema';
import { TimeSchema } from '@/lib/validation';
import { UPLOAD_DIR } from '@/lib/weighin';

export type SettingsState = { ok?: boolean; error?: string };

export async function updateSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const user = await requireUser('/profil');
  const weighTime = TimeSchema.safeParse(form.get('weighTime'));
  if (!weighTime.success) return { error: 'Heure de pesée invalide.' };
  const tz = String(form.get('timezone') ?? user.timezone);
  let timezone = user.timezone;
  try { new Intl.DateTimeFormat('fr-FR', { timeZone: tz }); timezone = tz; } catch {}
  await db.update(users).set({ weighTime: weighTime.data, notifyOn: form.get('notifyOn') === 'on', timezone }).where(eq(users.id, user.id));
  revalidatePath('/profil');
  return { ok: true };
}

/** Supprime le compte, ses pesées et photos. Les battles créées passent au plus ancien autre membre. */
export async function deleteAccount(form: FormData): Promise<void> {
  const user = await requireUser('/profil');
  if (String(form.get('confirm') ?? '').trim().toUpperCase() !== 'SUPPRIMER') redirect('/profil?erreur=confirmation');
  const owned = await db.select().from(battles).where(eq(battles.createdBy, user.id));
  for (const b of owned) {
    const [heir] = await db.select().from(battleMembers).where(and(eq(battleMembers.battleId, b.id), ne(battleMembers.userId, user.id))).orderBy(asc(battleMembers.joinedAt)).limit(1);
    if (heir) await db.update(battles).set({ createdBy: heir.userId }).where(eq(battles.id, b.id));
  }
  const photos = await db.select({ p: weighIns.photoPath }).from(weighIns).where(eq(weighIns.userId, user.id));
  for (const { p } of photos) if (p) await rm(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, path.basename(p)), { force: true });
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id));
  await endSession();
  await db.delete(users).where(eq(users.id, user.id));
  redirect('/?au-revoir=1');
}
