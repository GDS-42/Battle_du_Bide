import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const g = globalThis as unknown as { __bdbPool?: Pool };

export const pool =
  g.__bdbPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL ?? 'postgres://postgres@127.0.0.1:5433/battle_du_bide',
    max: Number(process.env.DB_POOL_MAX ?? 10)
  });
g.__bdbPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
