'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { requireUser, safeNext } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { BdLookSchema, FighterSchema, TimeSchema } from '@/lib/validation';
import { mergeLook, paletteFor } from '@/lib/fighter/bd';
import type { FighterConfig } from '@/lib/fighter/types';
import { recordWeighIn } from '@/lib/weighin';

const ProfileSchema = z.object({
  presetKey: z.string().max(40).optional(),
  // L'ancien studio envoie tout le réglage (`cfg`) ; le studio des combattants dessinés n'envoie que `look`.
  cfg: FighterSchema.optional(),
  look: BdLookSchema.optional(),
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
  let fighter: FighterConfig;
  let presetKey: string | null;
  if (p.look) {
    // Combattant dessiné : on ajoute son choix au réglage déjà enregistré, sans rien retirer ni réécrire d'autre.
    if (!paletteFor(p.look.bd).some(([c]) => c.toLowerCase() === p.look!.bdColor.toLowerCase())) return { ok: false, error: 'Couleur indisponible pour ce combattant' };
    fighter = mergeLook(user.fighter, user.presetKey, p.look);
    presetKey = user.presetKey ?? p.look.bd;
  } else if (p.cfg) {
    // Ancien studio : on garde le combattant dessiné que le joueur avait éventuellement choisi.
    const kept = user.fighter ?? {};
    fighter = { ...p.cfg, ...(p.cfg.bd === undefined && kept.bd ? { bd: kept.bd } : {}), ...(p.cfg.bdColor === undefined && kept.bdColor ? { bdColor: kept.bdColor } : {}) };
    presetKey = p.presetKey ?? null;
  } else {
    return { ok: false, error: 'Données invalides' };
  }
  await db.update(users).set({
    presetKey,
    fighter,
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
