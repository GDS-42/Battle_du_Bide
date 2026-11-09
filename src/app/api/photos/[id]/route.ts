import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { and, eq, inArray } from 'drizzle-orm';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { battleMembers, battles, weighIns } from '@/lib/db/schema';
import { UPLOAD_DIR } from '@/lib/weighin';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif' };

/** Photo de balance : visible par son auteur et par les membres d'une battle commune en mode transparent (la photo montre les kilos). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return new Response('Non connecté', { status: 401 });
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Introuvable', { status: 404 });
  const [w] = await db.select().from(weighIns).where(eq(weighIns.id, id)).limit(1);
  if (!w?.photoPath) return new Response('Introuvable', { status: 404 });
  if (w.userId !== user.id) {
    const mine = (await db.select({ b: battleMembers.battleId }).from(battleMembers).where(eq(battleMembers.userId, user.id))).map((r) => r.b);
    const shared = mine.length
      ? await db.select({ id: battles.id }).from(battleMembers).innerJoin(battles, eq(battles.id, battleMembers.battleId))
        .where(and(eq(battleMembers.userId, w.userId), inArray(battleMembers.battleId, mine), eq(battles.privacy, 'transparent'))).limit(1)
      : [];
    if (!shared.length) return new Response('Interdit', { status: 403 });
  }
  const file = path.basename(w.photoPath);
  try {
    const buf = await readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, file));
    return new Response(new Uint8Array(buf), { headers: { 'content-type': TYPES[file.split('.').pop() ?? ''] ?? 'application/octet-stream', 'cache-control': 'private, max-age=86400' } });
  } catch {
    return new Response('Introuvable', { status: 404 });
  }
}
