import 'server-only';
import { and, eq, gte, inArray } from 'drizzle-orm';
import { db } from './db';
import { battleMembers, battles, weighIns, type User } from './db/schema';
import { battleStatus, computeState, endDateOf, engineInput, loadBundle, settleStart, userBattles } from './battles';
import { badgeStates, career, GOLD_STREAK, streaks, type BadgeState, type Career } from './engine/badges';
import { beltHeld } from './engine/battle';
import { personalSeries, type PersonalSeries } from './progress';
import { addDays, dayDiff, localDate } from './time';

/** Palmarès et badges d'un joueur, toutes battles confondues. */
export async function careerFor(user: Pick<User, 'id' | 'timezone'>, at: Date): Promise<{ career: Career; badges: BadgeState[]; personal: PersonalSeries }> {
  const personal = await personalSeries(user.id, localDate(at, user.timezone));
  const list = await userBattles(user.id);
  const states = [];
  for (const b of list) {
    const bundle = await loadBundle(b.id);
    if (!bundle) continue;
    states.push({ state: computeState(bundle, at).state, finished: battleStatus(bundle.battle, at) === 'finished' });
  }
  const c = career({ days: personal.days, battles: states }, user.id);
  return { career: c, badges: badgeStates(c), personal };
}

export interface Reward {
  /** Gants dorés : série en cours d'au moins 21 jours. */
  gold: boolean;
  /** Ceinture de champion : vainqueur de sa dernière battle terminée, tant que la défense tient. */
  belt: boolean;
}

const NONE: Reward = { gold: false, belt: false };

/**
 * Récompenses visibles sur le combattant de chaque joueur. Calculées, jamais stockées :
 * elles se perdent d'elles-mêmes (série cassée, ceinture non défendue, battle suivante perdue).
 */
export async function rewardsFor(userIds: string[], at: Date): Promise<Map<string, Reward>> {
  const out = new Map<string, Reward>(userIds.map((u) => [u, { ...NONE }]));
  if (!userIds.length) return out;
  const today = localDate(at);

  // Gants dorés : pesées des GOLD_STREAK + 1 derniers jours (aujourd'hui peut encore manquer)
  const from = addDays(today, -(GOLD_STREAK + 1));
  const rows = await db.select({ userId: weighIns.userId, date: weighIns.date }).from(weighIns)
    .where(and(inArray(weighIns.userId, userIds), gte(weighIns.date, from)));
  for (const uid of userIds) {
    const dates = new Set(rows.filter((r) => r.userId === uid).map((r) => r.date));
    const days = Array.from({ length: dayDiff(from, today) + 1 }, (_, i) => ({ weight: dates.has(addDays(from, i)) ? 1 : null }));
    if (streaks(days).current >= GOLD_STREAK) out.get(uid)!.gold = true;
  }

  // Ceinture : la dernière battle terminée de chaque joueur
  const mine = await db.select({ userId: battleMembers.userId, b: battles }).from(battleMembers)
    .innerJoin(battles, eq(battles.id, battleMembers.battleId)).where(inArray(battleMembers.userId, userIds));
  const lastOf = new Map<string, string>(); // joueur → id de sa dernière battle terminée
  const ends = new Map<string, string>();
  for (const { userId, b: raw } of mine) {
    const b = await settleStart(raw);
    if (battleStatus(b, at) !== 'finished') continue;
    const end = endDateOf(b), prev = lastOf.get(userId);
    if (!prev || end > ends.get(prev)!) { lastOf.set(userId, b.id); ends.set(b.id, end); }
  }
  for (const battleId of new Set(lastOf.values())) {
    const bundle = await loadBundle(battleId);
    if (!bundle) continue;
    const { state } = computeState(bundle, at);
    const champions = state.sides.find((s) => s.id === state.champion)?.members ?? [];
    for (const uid of champions) {
      if (lastOf.get(uid) !== battleId || !out.has(uid)) continue;
      // Champion en solo : la ceinture se défend (tendance stable, pesées régulières). En équipe, elle est acquise.
      const raw = { ...engineInput(bundle), weighIns: bundle.weighIns.map((w) => ({ userId: w.userId, date: w.date, weight: w.weight })), supers: [] };
      out.get(uid)!.belt = champions.length > 1 || beltHeld(uid, raw, localDate(at, bundle.battle.timezone));
    }
  }
  return out;
}
