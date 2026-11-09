import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const g = globalThis as unknown as { __bdbPool?: Pool };

function createPool(): Pool {
  const p = new Pool({
    connectionString: process.env.DATABASE_URL ?? 'postgres://postgres@127.0.0.1:5433/battle_du_bide',
    max: Number(process.env.DB_POOL_MAX ?? 10)
  });
  // Un client inactif du pool peut perdre sa connexion (redémarrage de PostgreSQL, coupure réseau).
  // Sans écouteur, cet événement « error » ferait planter tout le processus Node :
  // on le journalise, et le pool ouvre une nouvelle connexion à la requête suivante.
  p.on('error', (err) => console.error('[bdb] connexion PostgreSQL perdue (client inactif) :', err.message));
  return p;
}

export const pool = g.__bdbPool ?? createPool();
g.__bdbPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
