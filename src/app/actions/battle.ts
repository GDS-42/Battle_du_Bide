'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, gte } from 'drizzle-orm';
import { requireFighter } from '@/lib/auth';
import { db } from '@/lib/db';
import { battleMembers, battles, feed, nudges, reactions, supers } from '@/lib/db/schema';
import {
  battleStatus, battleToday, computeState, displayName, endDateOf, fightPending, isMember, loadBundle, newCode, previewFor, superState
} from '@/lib/battles';
import { settleStakes } from '@/lib/engine/stakes';
import { sendPush } from '@/lib/push';
import { cleanTaunt, REACTIONS } from '@/lib/taunts';
import { addDays, nextMonday, now, weekday } from '@/lib/time';
import { TimeSchema } from '@/lib/validation';

const CreateSchema = z.object({
  name: z.string().trim().min(2, 'Donne un nom à ta battle').max(40),
  format: z.enum(['duel', 'tournoi', 'equipes']),
  rounds: z.coerce.number().refine((n) => [4, 8, 12].includes(n)),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fightTime: TimeSchema,
  stakeText: z.string().trim().max(120).optional().default(''),
  potEuros: z.coerce.number().min(0).max(1000).optional().default(0),
  potMode: z.enum(['winner', 'objectif']).optional().default('objectif'),
  potObjective: z.coerce.number().min(1).max(30).optional().default(5),
  privacy: z.enum(['pudique', 'transparent']),
  tone: z.enum(['bon', 'trash']),
  photoProof: z.coerce.boolean().optional().default(false),
  maxPlayers: z.coerce.number().int().min(2).max(8),
  team1: z.string().trim().max(24).optional().default(''),
  team2: z.string().trim().max(24).optional().default('')
});

export type CreateState = { error?: string };

export async function createBattle(_prev: CreateState, form: FormData): Promise<CreateState> {
  const user = await requireFighter('/battles/nouvelle');
  const raw = Object.fromEntries(form.entries());
  const parsed = CreateSchema.safeParse({ ...raw, photoProof: form.get('photoProof') === 'on' });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire incomplet' };
  const p = parsed.data;
  const today = battleToday({ timezone: user.timezone }, now());
  if (weekday(p.startDate) !== 0 || p.startDate < today) return { error: 'La battle démarre un lundi, aujourd’hui ou plus tard.' };
  const maxPlayers = p.format === 'duel' ? 2 : p.format === 'equipes' ? Math.max(4, p.maxPlayers - (p.maxPlayers % 2)) : Math.max(3, p.maxPlayers);
  const teamNames = p.format === 'equipes'
    ? Object.fromEntries(Array.from({ length: maxPlayers / 2 }, (_, i) => [String(i + 1), (i === 0 ? p.team1 : i === 1 ? p.team2 : '') || `Équipe ${i + 1}`]))
    : null;
  const [b] = await db.insert(battles).values({
    code: newCode(), name: p.name, format: p.format, rounds: p.rounds, startDate: p.startDate, fightTime: p.fightTime,
    timezone: user.timezone, stakeText: p.stakeText || null,
    potAmount: p.potEuros > 0 ? Math.round(p.potEuros * 100) : null, potMode: p.potEuros > 0 ? p.potMode : null, potObjective: p.potObjective,
    privacy: p.privacy, tone: p.tone, photoProof: p.photoProof, teamNames, maxPlayers, createdBy: user.id
  }).returning();
  await db.insert(battleMembers).values({ battleId: b.id, userId: user.id, team: p.format === 'equipes' ? 1 : null });
  await db.insert(feed).values({ battleId: b.id, userId: user.id, kind: 'join', text: `${displayName(user)} a ouvert le ring.` });
  redirect(`/battles/${b.id}?invite=1`);
}

export async function joinBattle(form: FormData): Promise<void> {
  const code = String(form.get('code') ?? '').toUpperCase();
  const user = await requireFighter(`/b/${code}`);
  const [b] = await db.select().from(battles).where(eq(battles.code, code)).limit(1);
  if (!b) redirect('/battles');
  if (await isMember(b.id, user.id)) redirect(`/battles/${b.id}`);
  const bundle = (await loadBundle(b.id))!;
  const today = battleToday(b, now());
  if (today > addDays(b.startDate, 6)) redirect(`/b/${code}?erreur=ferme`);
  if (bundle.members.length >= b.maxPlayers) redirect(`/b/${code}?erreur=complet`);
  let team: number | null = null;
  if (b.format === 'equipes') {
    const wanted = Number(form.get('team') ?? 0);
    const counts = new Map<number, number>();
    for (const m of bundle.members) counts.set(m.team ?? 1, (counts.get(m.team ?? 1) ?? 0) + 1);
    const teams = Array.from({ length: b.maxPlayers / 2 }, (_, i) => i + 1);
    const free = teams.filter((t) => (counts.get(t) ?? 0) < 2);
    team = free.includes(wanted) ? wanted : free[0] ?? null;
    if (team === null) redirect(`/b/${code}?erreur=complet`);
  }
  await db.insert(battleMembers).values({ battleId: b.id, userId: user.id, team }).onConflictDoNothing();
  await db.insert(feed).values({ battleId: b.id, userId: user.id, kind: 'join', text: `${displayName(user)} relève le défi !` });
  await sendPush(bundle.members.map((m) => m.userId), { title: 'Nouveau challenger !', body: `${displayName(user)} relève le défi dans « ${b.name} ».`, url: `/battles/${b.id}`, tag: `join-${b.id}` });
  redirect(`/battles/${b.id}`);
}

export async function leaveBattle(form: FormData): Promise<void> {
  const id = String(form.get('battleId'));
  const user = await requireFighter(`/battles/${id}`);
  const bundle = await loadBundle(id);
  if (!bundle || battleStatus(bundle.battle, now()) !== 'warmup') redirect(`/battles/${id}`);
  if (bundle.battle.createdBy === user.id) {
    if (bundle.members.length <= 1) await db.delete(battles).where(eq(battles.id, id));
    else redirect(`/battles/${id}?erreur=createur`);
  } else {
    await db.delete(battleMembers).where(and(eq(battleMembers.battleId, id), eq(battleMembers.userId, user.id)));
    await db.insert(feed).values({ battleId: id, userId: user.id, kind: 'system', text: `${displayName(user)} s'est retiré du ring.` });
  }
  redirect('/battles');
}

async function memberContext(battleId: string) {
  const user = await requireFighter(`/battles/${battleId}`);
  const bundle = await loadBundle(battleId);
  if (!bundle || !bundle.members.some((m) => m.userId === user.id)) redirect('/battles');
  return { user, bundle };
}

export async function armSuper(form: FormData): Promise<void> {
  const id = String(form.get('battleId'));
  const { user, bundle } = await memberContext(id);
  const st = superState(bundle, user.id, now());
  if (st.ready) {
    const ins = await db.insert(supers).values({ battleId: id, userId: user.id, date: st.today }).onConflictDoNothing().returning();
    if (ins.length) await db.insert(feed).values({ battleId: id, userId: user.id, kind: 'super', text: `${displayName(user)} arme son super pour ce soir…` });
  }
  revalidatePath('/pesee/coup');
  revalidatePath(`/battles/${id}`);
}

export async function sendTaunt(form: FormData): Promise<void> {
  const id = String(form.get('battleId'));
  const { user } = await memberContext(id);
  const text = cleanTaunt(form.get('text'));
  if (text) {
    // Anti-rafale : 5 messages par minute et par joueur au maximum.
    const recent = await db.select({ id: feed.id }).from(feed)
      .where(and(eq(feed.battleId, id), eq(feed.userId, user.id), eq(feed.kind, 'taunt'), gte(feed.createdAt, new Date(Date.now() - 60_000))))
      .limit(5);
    if (recent.length < 5) await db.insert(feed).values({ battleId: id, userId: user.id, kind: 'taunt', text });
  }
  revalidatePath(`/battles/${id}`);
}

export async function nudge(form: FormData): Promise<void> {
  const id = String(form.get('battleId'));
  const to = String(form.get('to'));
  const { user, bundle } = await memberContext(id);
  const target = bundle.members.find((m) => m.userId === to);
  if (target && to !== user.id) {
    const date = battleToday(bundle.battle, now());
    const ins = await db.insert(nudges).values({ battleId: id, fromUser: user.id, toUser: to, date }).onConflictDoNothing().returning();
    if (ins.length) {
      await db.insert(feed).values({ battleId: id, userId: user.id, targetUserId: to, kind: 'nudge', text: `${displayName(user)} met un coup de coude à ${displayName(target.user)} !` });
      await sendPush([to], { title: 'Coup de coude !', body: `${displayName(user)} te secoue : pèse-toi avant ${bundle.battle.fightTime.replace(':', ' h ')} !`, url: '/pesee', tag: `nudge-${id}` });
    }
  }
  revalidatePath(`/battles/${id}`);
}

export async function toggleReaction(form: FormData): Promise<void> {
  const id = String(form.get('battleId'));
  const target = String(form.get('target')).slice(0, 60);
  const emoji = String(form.get('emoji'));
  const { user } = await memberContext(id);
  if (REACTIONS.some((r) => r.key === emoji)) {
    const del = await db.delete(reactions).where(and(eq(reactions.battleId, id), eq(reactions.userId, user.id), eq(reactions.target, target), eq(reactions.emoji, emoji))).returning();
    if (!del.length) await db.insert(reactions).values({ battleId: id, userId: user.id, target, emoji });
  }
  revalidatePath(`/battles/${id}`);
  revalidatePath(`/battles/${id}/combat/${target.replace('fight:', '')}`);
}

export async function rematch(form: FormData): Promise<void> {
  const id = String(form.get('battleId'));
  const { user, bundle } = await memberContext(id);
  const b = bundle.battle;
  const at = now();
  if (battleStatus(b, at) !== 'finished') redirect(`/battles/${id}`);
  let carry = 0;
  if (b.potAmount) {
    const { state } = computeState(bundle, at);
    const champ = state.champion ? state.sides.find((s) => s.id === state.champion)?.members ?? [] : [];
    const s = settleStakes({ mode: b.potMode ?? 'objectif', amount: b.potAmount, objectivePct: b.potObjective, players: Object.values(state.players).map((p) => ({ userId: p.userId, lossPct: p.lossPct })), championMembers: champ });
    if (s.carryOver) carry = b.carryOver + b.potAmount * bundle.members.length;
  }
  const [nb] = await db.insert(battles).values({
    code: newCode(), name: b.name.startsWith('Revanche · ') ? b.name : `Revanche · ${b.name}`.slice(0, 40), format: b.format, rounds: b.rounds,
    startDate: nextMonday(battleToday(b, at)), fightTime: b.fightTime, timezone: b.timezone, stakeText: b.stakeText, potAmount: b.potAmount,
    potMode: b.potMode, potObjective: b.potObjective, carryOver: carry, privacy: b.privacy, tone: b.tone, photoProof: b.photoProof,
    teamNames: b.teamNames, maxPlayers: b.maxPlayers, createdBy: user.id, rematchOf: b.id
  }).returning();
  await db.insert(battleMembers).values(bundle.members.map((m) => ({ battleId: nb.id, userId: m.userId, team: m.team })));
  await db.insert(feed).values({ battleId: nb.id, userId: user.id, kind: 'system', text: `${displayName(user)} lance la revanche ! Premier round le lundi.` });
  await sendPush(bundle.members.map((m) => m.userId).filter((u) => u !== user.id), { title: 'Revanche !', body: `${displayName(user)} remet ça : « ${nb.name} ».`, url: `/battles/${nb.id}` });
  redirect(`/battles/${nb.id}`);
}
