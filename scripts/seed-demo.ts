// Données de démonstration : npm run demo:seed
// Crée 4 combattants (e-mails @demo.local), un duel et un tournoi à 3 (avec le boss) commencés il y a deux semaines,
// et un historique de pesées. Relancer le script remet la démo à zéro.
import { inArray, like } from 'drizzle-orm';
import { db, pool } from '../src/lib/db';
import { runMigrations } from '../src/lib/db/migrate';
import { battleMembers, battles, feed, supers, users, weighIns } from '../src/lib/db/schema';
import { PRESETS } from '../src/lib/fighter/presets';
import { addDays, localDate, now, weekday, zonedInstant } from '../src/lib/time';

const TZ = process.env.DEFAULT_TIMEZONE || 'Europe/Paris';

const PEOPLE = [
  { email: 'marc@demo.local', name: 'Marc', preset: 'bulldozer', height: 178, start: 96.4, slope: -0.09, skip: [3, 11] },
  { email: 'julie@demo.local', name: 'Julie', preset: 'fusee', height: 165, start: 74.2, slope: -0.07, skip: [6] },
  { email: 'sam@demo.local', name: 'Sam', preset: 'groove', height: 182, start: 104.8, slope: -0.12, skip: [2, 9, 10] },
  { email: 'nadia@demo.local', name: 'Nadia', preset: 'reine', height: 170, start: 81.5, slope: -0.06, skip: [] as number[] }
];

/** Bruit pseudo-aléatoire reproductible (la balance fait du yo-yo). */
function noise(i: number, seed: number) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return ((x - Math.floor(x)) - 0.5) * 0.8;
}

async function main() {
  await runMigrations();
  await db.delete(users).where(like(users.email, '%@demo.local'));

  const today = localDate(now(), TZ);
  const thisMonday = addDays(today, -weekday(today));
  const start = addDays(thisMonday, -14 + (weekday(today) === 6 ? 7 : 0)); // il y a ~2 semaines
  const created = await db.insert(users).values(PEOPLE.map((p) => {
    const preset = PRESETS.find((x) => x.key === p.preset)!;
    return {
      email: p.email, name: p.name, nickname: preset.name.replace(/^(Le|La|El) /, ''), superMove: preset.move, entrance: 'Que le meilleur perde !',
      heightCm: p.height, presetKey: preset.key, fighter: preset.cfg, onboarded: true, timezone: TZ
    };
  })).returning();
  const id = (email: string) => created.find((u) => u.email === email)!.id;

  // Pesées : 4 jours d'échauffement, puis chaque matin jusqu'à aujourd'hui (quelques oublis)
  const rows: (typeof weighIns.$inferInsert)[] = [];
  PEOPLE.forEach((p, k) => {
    for (let d = -4; addDays(start, d) <= today; d++) {
      const date = addDays(start, d);
      if (p.skip.includes(d)) continue;
      const at = zonedInstant(date, d % 3 === 0 ? '08:10' : '07:25', TZ);
      if (at > now()) continue;
      rows.push({
        userId: id(p.email), date, weight: Math.round((p.start + p.slope * (d + 4) + noise(d, k)) * 10) / 10,
        createdAt: at, editableUntil: new Date(at.getTime() + 10 * 60_000)
      });
    }
  });
  await db.insert(weighIns).values(rows);

  const [duel] = await db.insert(battles).values({
    code: 'DEMODUEL', name: 'Marc vs Julie', format: 'duel', rounds: 8, startDate: start, fightTime: '21:00', timezone: TZ,
    stakeText: 'Le perdant paie le resto', privacy: 'pudique', tone: 'bon', maxPlayers: 2, createdBy: id('marc@demo.local')
  }).returning();
  const [tournoi] = await db.insert(battles).values({
    code: 'DEMOTOUR', name: 'Le tournoi du bureau', format: 'tournoi', rounds: 4, startDate: start, fightTime: '21:00', timezone: TZ,
    potAmount: 2000, potMode: 'objectif', potObjective: 4, privacy: 'transparent', tone: 'trash', maxPlayers: 4, createdBy: id('sam@demo.local')
  }).returning();
  await db.insert(battleMembers).values([
    { battleId: duel.id, userId: id('marc@demo.local'), joinedAt: zonedInstant(addDays(start, -6), '12:00', TZ) },
    { battleId: duel.id, userId: id('julie@demo.local'), joinedAt: zonedInstant(addDays(start, -6), '12:30', TZ) },
    { battleId: tournoi.id, userId: id('sam@demo.local'), joinedAt: zonedInstant(addDays(start, -5), '09:00', TZ) },
    { battleId: tournoi.id, userId: id('nadia@demo.local'), joinedAt: zonedInstant(addDays(start, -5), '10:00', TZ) },
    { battleId: tournoi.id, userId: id('marc@demo.local'), joinedAt: zonedInstant(addDays(start, -5), '11:00', TZ) }
  ]);
  const superDay = addDays(start, 9);
  if (superDay <= today) await db.insert(supers).values({ battleId: duel.id, userId: id('julie@demo.local'), date: superDay });
  await db.insert(feed).values([
    { battleId: duel.id, userId: id('julie@demo.local'), kind: 'taunt', text: 'La ceinture ? Je lui ai déjà fait une place.', createdAt: zonedInstant(addDays(start, 1), '08:00', TZ) },
    { battleId: duel.id, userId: id('marc@demo.local'), kind: 'taunt', text: 'Prépare la monnaie pour le resto.', createdAt: zonedInstant(addDays(start, 2), '07:40', TZ) },
    { battleId: tournoi.id, userId: id('sam@demo.local'), kind: 'taunt', text: 'Le Bide, je vais te sortir du ring.', createdAt: zonedInstant(addDays(start, 1), '09:00', TZ) }
  ]);

  const n = await db.select({ id: users.id }).from(users).where(inArray(users.email, PEOPLE.map((p) => p.email)));
  console.log(`Démo prête : ${n.length} combattants, ${rows.length} pesées, battles DEMODUEL et DEMOTOUR (début ${start}).`);
  console.log('Connecte-toi avec marc@demo.local (lien magique affiché à l’écran si SHOW_MAGIC_LINK=1).');
  await pool.end();
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });
