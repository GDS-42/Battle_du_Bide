'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { requireUser, safeNext } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { FighterSchema, TimeSchema } from '@/lib/validation';
import { recordWeighIn } from '@/lib/weighin';

const ProfileSchema = z.object({
  presetKey: z.string().max(40).optional(),
  cfg: FighterSchema,
  name: z.string().trim().min(1, 'Ton prénom ?').max(30),
  nickname: z.string().trim().max(30).optional().default(''),
  superMove: z.string().trim().max(40).optional().default(''),
  entrance: z.string().trim().max(80).optional().default(''),
  heightCm: z.coerce.number().int().min(120, 'Taille en cm, entre 120 et 230').max(230, 'Taille en cm, entre 120 et 230'),
  weighTime: TimeSchema,
  weight: z.coerce.number().min(30).max(300).optional(),
  next: z.string().optional()
});

export type SaveFighterResult = { ok: false; error: string } | undefined;

export async function saveFighter(input: unknown): Promise<SaveFighterResult> {
  const user = await requireUser('/combattant');
  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' };
  const p = parsed.data;
  await db.update(users).set({
    presetKey: p.presetKey ?? null,
    fighter: p.cfg,
    name: p.name,
    nickname: p.nickname || null,
    superMove: p.superMove || null,
    entrance: p.entrance || null,
    heightCm: p.heightCm,
    weighTime: p.weighTime,
    onboarded: true
  }).where(eq(users.id, user.id));
  if (p.weight && !user.onboarded) {
    await recordWeighIn({ ...user, onboarded: true }, { weight: p.weight, comment: null, photo: null });
  }
  redirect(safeNext(p.next) ?? '/battles');
}
