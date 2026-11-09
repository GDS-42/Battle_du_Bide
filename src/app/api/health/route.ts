import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Sonde de santé pour Coolify / Docker : l'app répond et la base est joignable. */
export async function GET() {
  try {
    await pool.query('select 1');
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'database' }, { status: 503 });
  }
}
