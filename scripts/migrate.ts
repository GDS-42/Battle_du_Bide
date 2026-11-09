import { runMigrations } from '../src/lib/db/migrate';
import { pool } from '../src/lib/db';

runMigrations()
  .then(() => { console.log('Migrations appliquées.'); return pool.end(); })
  .catch((e) => { console.error(e); process.exit(1); });
