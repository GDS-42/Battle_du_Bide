import type { Metadata } from 'next';
import Link from 'next/link';
import { and, desc, eq, lt } from 'drizzle-orm';
import { requireFighter } from '@/lib/auth';
import { db } from '@/lib/db';
import { weighIns } from '@/lib/db/schema';
import { displayName, endDateOf, fightPending, loadBundle, roundOf, wordOfDay } from '@/lib/battles';
import { liveBattles } from '@/lib/weighin';
import { dayName, localDate, now, zonedInstant } from '@/lib/time';
import { Icon, TopBar } from '@/components/ui';
import { Countdown } from '@/components/Countdown';
import { WeighForm } from './WeighForm';

export const metadata: Metadata = { title: 'Pesée du matin' };

export default async function PeseePage() {
  const user = await requireFighter('/pesee');
  const at = now();
  const today = localDate(at, user.timezone);
  const [existing] = await db.select().from(weighIns).where(and(eq(weighIns.userId, user.id), eq(weighIns.date, today))).limit(1);
  const [prev] = await db.select().from(weighIns).where(and(eq(weighIns.userId, user.id), lt(weighIns.date, today))).orderBy(desc(weighIns.date)).limit(1);
  const live = await liveBattles(user.id);

  // Contexte des battles du jour : rivaux déjà pesés, heure du combat, photo demandée ?
  const rivals: string[] = [];
  const late: string[] = [];
  let photo = false;
  let ctx: { round: number; day: number; fightTime: string } | null = null;
  let nextFight: number | null = null; // prochain combat de ce soir encore à venir
  for (const b of live) {
    const inFight = today >= b.startDate && today <= endDateOf(b);
    if (b.photoProof) photo = true;
    if (!inFight) continue;
    if (!fightPending(b, today, at)) late.push(b.name);
    else nextFight = Math.min(nextFight ?? Infinity, zonedInstant(today, b.fightTime, b.timezone).getTime());
    const bundle = await loadBundle(b.id);
    if (!bundle) continue;
    ctx ??= { ...roundOf(b, today), fightTime: b.fightTime };
    for (const m of bundle.members) {
      if (m.userId !== user.id && bundle.weighIns.some((w) => w.userId === m.userId && w.date === today)) rivals.push(displayName(m.user));
    }
  }
  const editable = existing ? at < existing.editableUntil : true;
  const kicker = `${dayName(today).toUpperCase()}${ctx ? ` · ROUND ${ctx.round} · JOUR ${ctx.day}` : live.length ? ' · ÉCHAUFFEMENT' : ''}`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <TopBar kicker={kicker} title="Pesée du matin" right={<Link href="/aide#quand-se-peser" aria-label="Quand me peser ? Mode d'emploi" className="grid size-11 place-items-center rounded-xl border-2 border-prune text-soleil"><Icon name="help" size={22} /></Link>} />
      {nextFight !== null && !existing ? (
        <p className="flex items-center gap-2 px-4 pt-4 text-[15px]">
          <Icon name="clock" size={18} className="shrink-0 text-soleil" />
          <span><Countdown className="font-bold text-soleil" prefix="Combat dans" target={nextFight} serverNow={at.getTime()} done="C'est l'heure du combat !" /> : pèse-toi avant.</span>
        </p>
      ) : null}
      <WeighForm
        name={displayName(user)}
        initial={existing?.weight ?? prev?.weight ?? 75}
        last={prev?.weight ?? null}
        existing={existing ? { weight: existing.weight, editable } : null}
        rivals={[...new Set(rivals)]}
        fightTime={ctx?.fightTime ?? null}
        late={late}
        photoWord={photo ? wordOfDay(today) : null}
        noBattle={!live.length}
      />
    </main>
  );
}
