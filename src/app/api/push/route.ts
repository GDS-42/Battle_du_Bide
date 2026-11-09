import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { isAllowedPushEndpoint, PUSH_KEY_RE } from '@/lib/push-endpoint';

// L'endpoint doit être un service push de navigateur (anti-SSRF), les clés en base64url.
const Sub = z.object({
  endpoint: z.string().refine(isAllowedPushEndpoint),
  keys: z.object({
    p256dh: z.string().min(10).max(200).regex(PUSH_KEY_RE),
    auth: z.string().min(4).max(100).regex(PUSH_KEY_RE)
  })
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'non connecté' }, { status: 401 });
  const parsed = Sub.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'abonnement invalide' }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  await db.insert(pushSubscriptions).values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'non connecté' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body?.endpoint === 'string') await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, body.endpoint));
  return NextResponse.json({ ok: true });
}
