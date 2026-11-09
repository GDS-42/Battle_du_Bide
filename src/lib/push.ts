import 'server-only';
import webpush from 'web-push';
import { eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { notifLog, pushSubscriptions, users } from './db/schema';
import { isAllowedPushEndpoint } from './push-endpoint';

let configured: boolean | null = null;
function setup(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  configured = !!(pub && priv);
  if (configured) webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:ring@localhost', pub!, priv!);
  return configured;
}

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Envoie une notification à des joueurs (abonnés et notifications activées). Ne lève jamais d'erreur. */
export async function sendPush(userIds: string[], payload: PushPayload): Promise<number> {
  if (!userIds.length || !setup()) return 0;
  const subs = await db.select({ s: pushSubscriptions, notify: users.notifyOn }).from(pushSubscriptions)
    .innerJoin(users, eq(users.id, pushSubscriptions.userId))
    .where(inArray(pushSubscriptions.userId, userIds));
  let sent = 0;
  // Abonnements enregistrés avant le contrôle anti-SSRF : on n'y envoie rien et on les supprime.
  for (const { s } of subs) {
    if (!isAllowedPushEndpoint(s.endpoint)) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id));
  }
  await Promise.all(subs.filter((x) => x.notify && isAllowedPushEndpoint(x.s.endpoint)).map(async ({ s }) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 6 * 3600 });
      sent++;
    } catch (e: unknown) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id));
      else console.warn('[push] échec', code ?? e);
    }
  }));
  return sent;
}

/** Envoi unique par clé (évite les doublons quand la tâche planifiée repasse). */
export async function sendOnce(userId: string, key: string, payload: PushPayload): Promise<boolean> {
  const inserted = await db.insert(notifLog).values({ userId, key }).onConflictDoNothing().returning();
  if (!inserted.length) return false;
  await sendPush([userId], payload);
  return true;
}
