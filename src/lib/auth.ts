import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { db } from './db';
import { loginTokens, sessions, users, type User } from './db/schema';
import { now } from './time';

export const SESSION_COOKIE = 'bdb_session';
const SESSION_DAYS = 90;
const TOKEN_MINUTES = 20;

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const token = () => randomBytes(32).toString('base64url');

export function appUrl(): string {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/** Ne garde que les redirections internes. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}

export async function createLoginLink(email: string, redirectTo: string | null): Promise<{ link: string; throttled: boolean }> {
  const recent = await db.select().from(loginTokens)
    .where(and(eq(loginTokens.email, email), gt(loginTokens.createdAt, new Date(Date.now() - 20_000))))
    .orderBy(desc(loginTokens.createdAt)).limit(1);
  const t = token();
  await db.insert(loginTokens).values({
    tokenHash: sha(t), email, redirect: safeNext(redirectTo),
    expiresAt: new Date(Date.now() + TOKEN_MINUTES * 60_000)
  });
  return { link: `${appUrl()}/auth/verifier?token=${encodeURIComponent(t)}`, throttled: recent.length > 0 };
}

/** Consomme un lien magique : crée le compte au besoin et ouvre une session. */
export async function consumeLoginToken(raw: string): Promise<{ user: User; redirect: string | null } | null> {
  const hash = sha(raw);
  const [row] = await db.update(loginTokens).set({ usedAt: new Date() })
    .where(and(eq(loginTokens.tokenHash, hash), isNull(loginTokens.usedAt), gt(loginTokens.expiresAt, new Date())))
    .returning();
  if (!row) return null;
  let [user] = await db.select().from(users).where(eq(users.email, row.email)).limit(1);
  if (!user) [user] = await db.insert(users).values({ email: row.email, timezone: process.env.DEFAULT_TIMEZONE || 'Europe/Paris' }).returning();
  await startSession(user.id);
  return { user, redirect: row.redirect };
}

export async function startSession(userId: string): Promise<void> {
  const t = token();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ tokenHash: sha(t), userId, expiresAt: expires });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, t, {
    httpOnly: true, sameSite: 'lax', path: '/', expires,
    secure: process.env.NODE_ENV === 'production' && appUrl().startsWith('https')
  });
}

export const currentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const t = jar.get(SESSION_COOKIE)?.value;
  if (!t) return null;
  const [row] = await db.select({ user: users }).from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha(t)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row?.user ?? null;
});

/** Exige une session ; sinon renvoie vers la connexion (puis revient ici). */
export async function requireUser(here: string): Promise<User> {
  const u = await currentUser();
  if (!u) redirect(`/connexion?next=${encodeURIComponent(here)}`);
  return u;
}

/** Exige un combattant créé. */
export async function requireFighter(here: string): Promise<User> {
  const u = await requireUser(here);
  if (!u.onboarded) redirect(`/combattant?next=${encodeURIComponent(here)}`);
  return u;
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const t = jar.get(SESSION_COOKIE)?.value;
  if (t) await db.delete(sessions).where(eq(sessions.tokenHash, sha(t)));
  jar.delete(SESSION_COOKIE);
}

export { now };
