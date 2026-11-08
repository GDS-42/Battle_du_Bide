import { timingSafeEqual } from 'node:crypto';
import { tick } from '@/lib/notify';
import { now } from '@/lib/time';

export const dynamic = 'force-dynamic';

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '');
  const want = Buffer.from(secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

/** Tâche planifiée : à appeler chaque minute (horloge interne, ou cron externe avec CRON_SECRET). */
export async function POST(req: Request) {
  if (!authorized(req)) return new Response('Interdit', { status: 401 });
  const res = await tick(now());
  return Response.json(res);
}
