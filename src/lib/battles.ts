import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, asc, desc, eq, gte, inArray } from 'drizzle-orm';
import { db } from './db';
import { battleMembers, battles, feed, reactions, supers, users, weighIns, type Battle, type User } from './db/schema';
import { battleEndDate, buildSides, playerDayPreview, simulateBattle } from './engine/battle';
import { roundRecap, type RoundRecap } from './engine/recap';
import { BOSS_ID, BOSS_NAME } from './engine/rules';
import { bmi, kFromBmi } from './engine/silhouette';
import type { BattleState, EngineInput } from './engine/types';
import type { FighterConfig, FighterRender } from './fighter/types';
import { PRESETS } from './fighter/presets';
import { sendOnce } from './push';
import { addDays, dayDiff, localDate, localTime, now, prettyDate, zonedInstant } from './time';

export type BattleStatus = 'warmup' | 'active' | 'finished';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newCode(): string {
  const b = randomBytes(8);
  return Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join('');
}

export function endDateOf(b: Pick<Battle, 'startDate' | 'rounds'>): string {
  return battleEndDate(b);
}

export function battleToday(b: Pick<Battle, 'timezone'>, at: Date): string {
  return localDate(at, b.timezone);
}

/** Dernière soirée dont le combat est révélé (21 h passée), ou null avant le premier combat. */
export function revealedUntil(b: Pick<Battle, 'timezone' | 'fightTime' | 'startDate' | 'rounds'>, at: Date): string | null {
  const today = localDate(at, b.timezone);
  const r = localTime(at, b.timezone) >= b.fightTime ? today : addDays(today, -1);
  if (r < b.startDate) return null;
  const end = battleEndDate(b);
  return r > end ? end : r;
}

export function battleStatus(b: Battle, at: Date): BattleStatus {
  const r = revealedUntil(b, at);
  if (!r) return 'warmup';
  return r >= battleEndDate(b) ? 'finished' : 'active';
}

/** Le combat de ce jour est-il encore à venir (pesée et super encore possibles) ? */
export function fightPending(b: Battle, date: string, at: Date): boolean {
  return at.getTime() < zonedInstant(date, b.fightTime, b.timezone).getTime();
}

export interface MemberRow { userId: string; team: number | null; joinedAt: Date; user: User }

export interface Bundle {
  battle: Battle;
  members: MemberRow[];
  weighIns: (typeof weighIns.$inferSelect)[];
  supers: (typeof supers.$inferSelect)[];
}

/**
 * Au moment du premier combat, la battle démarre pour de bon s'il y a au moins deux camps.
 * Sinon (organisateur seul sur le ring), le départ est reporté au prochain soir : personne
 * n'affronte Le Bide faute d'adversaire, et aucun combat joué n'est réécrit quand un rival arrive.
 * Renvoie la battle à jour. Idempotent ; appelé à chaque chargement d'une battle.
 */
export async function settleStart(battle: Battle, members?: { userId: string; team: number | null }[]): Promise<Battle> {
  if (battle.started) return battle;
  const at = now();
  if (at.getTime() < zonedInstant(battle.startDate, battle.fightTime, battle.timezone).getTime()) return battle;
  members ??= await db.select({ userId: battleMembers.userId, team: battleMembers.team }).from(battleMembers).where(eq(battleMembers.battleId, battle.id));
  const camps = buildSides({ format: battle.format, startDate: battle.startDate, rounds: battle.rounds, members }).filter((s) => !s.isBoss).length;
  if (camps >= 2) {
    await db.update(battles).set({ started: true }).where(eq(battles.id, battle.id));
    return { ...battle, started: true };
  }
  const today = localDate(at, battle.timezone);
  const next = at.getTime() < zonedInstant(today, battle.fightTime, battle.timezone).getTime() ? today : addDays(today, 1);
  await db.update(battles).set({ startDate: next }).where(and(eq(battles.id, battle.id), eq(battles.started, false)));
  // Un seul message dans le fil et une seule notification, même si le report se répète chaque soir.
  const text = 'Pas encore d’adversaire : le premier combat est reporté tant que personne n’a relevé le défi.';
  const [already] = await db.select({ id: feed.id }).from(feed).where(and(eq(feed.battleId, battle.id), eq(feed.text, text))).limit(1);
  if (!already) await db.insert(feed).values({ battleId: battle.id, kind: 'system', text });
  await sendOnce(battle.createdBy, `report:${battle.id}`, {
    title: `🥊 ${battle.name}`, body: 'Personne en face : le combat est reporté. Envoie ton lien d’invitation !', url: `/battles/${battle.id}`, tag: `start-${battle.id}`
  });
  return { ...battle, startDate: next };
}

export async function loadBundle(battleId: string): Promise<Bundle | null> {
  const [row] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!row) return null;
  const rows = await db.select({ m: battleMembers, u: users }).from(battleMembers)
    .innerJoin(users, eq(users.id, battleMembers.userId))
    .where(eq(battleMembers.battleId, battleId))
    .orderBy(asc(battleMembers.joinedAt));
  const members = rows.map((r) => ({ userId: r.u.id, team: r.m.team, joinedAt: r.m.joinedAt, user: r.u }));
  const battle = await settleStart(row, members);
  const ids = members.map((m) => m.userId);
  const wi = ids.length
    ? await db.select().from(weighIns).where(and(inArray(weighIns.userId, ids), gte(weighIns.date, addDays(battle.startDate, -21)))).orderBy(asc(weighIns.date))
    : [];
  const sp = await db.select().from(supers).where(eq(supers.battleId, battleId));
  return { battle, members, weighIns: wi, supers: sp };
}

/**
 * Entrée du moteur. Une pesée faite après l'heure du combat est marquée « tardive » : elle ne donne
 * pas de coup ce soir-là (le combat déjà révélé ne change pas), mais compte pour la série et la tendance.
 */
export function engineInput(bundle: Bundle): EngineInput {
  const b = bundle.battle;
  const end = battleEndDate(b);
  return {
    battle: { format: b.format, startDate: b.startDate, rounds: b.rounds, members: bundle.members.map((m) => ({ userId: m.userId, team: m.team })) },
    weighIns: bundle.weighIns.map((w) => ({
      userId: w.userId, date: w.date, weight: w.weight,
      late: w.date >= b.startDate && w.date <= end && w.createdAt.getTime() >= zonedInstant(w.date, b.fightTime, b.timezone).getTime()
    })),
    supers: bundle.supers.map((s) => ({ userId: s.userId, date: s.date }))
  };
}

export function computeState(bundle: Bundle, at: Date): { state: BattleState; until: string | null; today: string; input: EngineInput } {
  const input = engineInput(bundle);
  const until = revealedUntil(bundle.battle, at);
  return { state: simulateBattle(input, until), until, today: battleToday(bundle.battle, at), input };
}

export function previewFor(bundle: Bundle, userId: string, date: string) {
  return playerDayPreview(engineInput(bundle), userId, date);
}

export function displayName(u: Pick<User, 'name' | 'email'>): string {
  return u.name?.trim() || u.email.split('@')[0];
}

export function sideName(bundle: Bundle, sideId: string, long = false): string {
  if (sideId === BOSS_ID) return BOSS_NAME;
  if (sideId.startsWith('team-')) {
    const t = sideId.slice(5);
    return bundle.battle.teamNames?.[t] || `Équipe ${t}`;
  }
  const m = bundle.members.find((x) => x.userId === sideId);
  if (!m) return '?';
  const n = displayName(m.user);
  return long && m.user.nickname ? `${n} « ${m.user.nickname} »` : n;
}

export function sideMembers(bundle: Bundle, sideId: string): MemberRow[] {
  if (sideId === BOSS_ID) return [];
  if (sideId.startsWith('team-')) return bundle.members.filter((m) => String(m.team ?? 1) === sideId.slice(5));
  return bundle.members.filter((m) => m.userId === sideId);
}

export const BOSS_FIGHTER: FighterRender = { k: 1, base: 'A', skin: 'cacao', outfit: 'catch', mask: true, main: '#5A2A7A', trim: '#FFD23D' };

/** Couleur des gants dorés (série de 21 jours). */
export const GOLD_GLOVE = '#FFC61A';

/**
 * Paramètres de dessin du combattant d'un joueur : son apparence, sa corpulence (IMC réel) et,
 * s'il en a, ses récompenses (gants dorés, ceinture de champion).
 */
export function fighterFor(
  u: Pick<User, 'fighter' | 'presetKey' | 'heightCm'>,
  weight: number | null | undefined,
  extra: Partial<FighterRender> = {},
  reward?: { gold: boolean; belt: boolean } | null
): FighterRender {
  const cfg: FighterConfig = u.fighter ?? PRESETS.find((p) => p.key === u.presetKey)?.cfg ?? PRESETS[0].cfg;
  return { ...cfg, k: kFromBmi(bmi(weight, u.heightCm)), ...(reward?.gold ? { glove: GOLD_GLOVE } : {}), ...(reward?.belt ? { champ: true } : {}), ...extra };
}

export async function userBattles(userId: string) {
  const rows = await db.select({ b: battles }).from(battleMembers)
    .innerJoin(battles, eq(battles.id, battleMembers.battleId))
    .where(eq(battleMembers.userId, userId))
    .orderBy(desc(battles.startDate));
  return Promise.all(rows.map((r) => settleStart(r.b)));
}

export async function isMember(battleId: string, userId: string): Promise<boolean> {
  const [m] = await db.select().from(battleMembers).where(and(eq(battleMembers.battleId, battleId), eq(battleMembers.userId, userId))).limit(1);
  return !!m;
}

export async function recentFeed(battleId: string, limit = 40) {
  return db.select({ f: feed, u: users }).from(feed).leftJoin(users, eq(users.id, feed.userId))
    .where(eq(feed.battleId, battleId)).orderBy(desc(feed.createdAt)).limit(limit);
}

export async function reactionsFor(battleId: string) {
  return db.select().from(reactions).where(eq(reactions.battleId, battleId));
}

export function roundOf(b: Pick<Battle, 'startDate'>, date: string): { round: number; day: number } {
  const d = dayDiff(b.startDate, date);
  return { round: Math.floor(d / 7) + 1, day: (d % 7) + 1 };
}

export function wordOfDay(date: string): string {
  const WORDS = ['CROCHET', 'UPPERCUT', 'RING', 'CEINTURE', 'KO', 'GANT', 'ESQUIVE', 'ROUND', 'COMBO', 'GARDE', 'SUPER', 'CLOCHE', 'JAB', 'DIRECT'];
  let h = 0;
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `${WORDS[h % WORDS.length]}-${(h % 90) + 10}`;
}

/** Le super peut-il être armé pour le combat de ce soir ? (jauge pleine, ou pleine dès la pesée du jour) */
export function superState(bundle: Bundle, userId: string, at: Date): { inBattle: boolean; armed: boolean; ready: boolean; today: string } {
  const b = bundle.battle;
  const today = battleToday(b, at);
  const inBattle = today >= b.startDate && today <= battleEndDate(b);
  const armed = bundle.supers.some((s) => s.userId === userId && s.date === today);
  if (!inBattle || !fightPending(b, today, at) || armed) return { inBattle, armed, ready: false, today };
  const cur = previewFor(bundle, userId, today);
  const prev = previewFor(bundle, userId, addDays(today, -1));
  const ready = !!((cur?.attack.weighed && (cur.gauge >= 7 || cur.attack.super > 0)) || (!cur?.attack.weighed && (prev?.gauge ?? 0) >= 6));
  return { inBattle, armed, ready, today };
}

/** Libellé d'une battle avant son premier combat : échauffement, ou premier combat le soir même. */
export function warmupLabel(b: Pick<Battle, 'startDate' | 'fightTime' | 'timezone'>, at: Date): string {
  return b.startDate <= battleToday(b, at)
    ? `Premier combat ce soir à ${b.fightTime.replace(':', ' h ')}`
    : `Échauffement · début ${prettyDate(b.startDate)}`;
}

/** Bilan du round `n` (1 = premier) pour un joueur, ou null si ce round n'a pas encore commencé. */
export function roundRecapFor(bundle: Bundle, userId: string, n: number, at: Date): RoundRecap | null {
  const b = bundle.battle;
  if (!Number.isInteger(n) || n < 1 || n > b.rounds) return null;
  const until = revealedUntil(b, at);
  const start = addDays(b.startDate, (n - 1) * 7), end = addDays(start, 6);
  if (!until || until < start) return null;
  // Simulé jusqu'à la fin du round seulement : le classement est celui « à l'issue du round ».
  return roundRecap(simulateBattle(engineInput(bundle), until < end ? until : end), userId, n - 1, b.rounds);
}
