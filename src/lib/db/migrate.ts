import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index';

let done: Promise<void> | null = null;

/** Applique les migrations SQL du dossier ./drizzle (idempotent, une seule fois par processus). */
export function runMigrations(): Promise<void> {
  if (!done) {
    done = migrate(db, { migrationsFolder: path.join(/*turbopackIgnore: true*/ process.cwd(), 'drizzle') }).catch((e) => {
      done = null;
      throw e;
    });
  }
  return done;
}
