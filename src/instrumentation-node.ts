// Démarrage du serveur (runtime Node) : migrations SQL, puis horloge interne (une passe par minute)
// qui déclenche la tâche planifiée via sa route HTTP.
import { randomBytes } from 'node:crypto';

async function start() {
  if (process.env.SKIP_MIGRATIONS !== '1') {
    const { runMigrations } = await import('./lib/db/migrate');
    for (let attempt = 1; ; attempt++) {
      try {
        await runMigrations();
        console.info('[bdb] migrations à jour');
        break;
      } catch (e) {
        if (attempt >= 10) { console.error('[bdb] migrations impossibles', e); break; }
        console.warn(`[bdb] base indisponible, nouvel essai (${attempt}/10)…`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  if (process.env.INTERNAL_CLOCK === '0') return;
  // Secret partagé avec la route /api/cron/tick (généré si absent : même processus).
  process.env.CRON_SECRET ||= randomBytes(24).toString('hex');
  const port = process.env.PORT || '3000';
  const url = `http://127.0.0.1:${port}/api/cron/tick`;
  const g = globalThis as unknown as { __bdbClock?: ReturnType<typeof setInterval> };
  if (g.__bdbClock) return;
  let ok = false;
  const fire = () => {
    fetch(url, { method: 'POST', headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } })
      .then((r) => {
        if (!r.ok) console.warn('[bdb] tick', r.status);
        else if (!ok) { ok = true; console.info('[bdb] horloge interne active (une passe par minute)'); }
      })
      .catch((e) => console.warn('[bdb] tick injoignable', e?.cause?.code ?? e));
  };
  setTimeout(fire, 15_000);
  g.__bdbClock = setInterval(fire, 60_000);
}

await start();
