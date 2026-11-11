import type { Metadata } from 'next';
import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { requireFighter } from '@/lib/auth';
import { db } from '@/lib/db';
import { weighIns } from '@/lib/db/schema';
import { battleStatus, computeState, loadBundle, roundOf, sideName, userBattles, warmupLabel } from '@/lib/battles';
import { Icon, Ribbon, TopBar } from '@/components/ui';
import { localDate, now } from '@/lib/time';

export const metadata: Metadata = { title: 'Mes battles' };
const FORMAT = { duel: 'Duel', tournoi: 'Tournoi', equipes: 'Équipes' } as const;

export default async function BattlesPage() {
  const user = await requireFighter('/battles');
  const at = now();
  const list = await userBattles(user.id);
  const today = localDate(at, user.timezone);
  const [weighed] = await db.select().from(weighIns).where(and(eq(weighIns.userId, user.id), eq(weighIns.date, today))).limit(1);

  const cards = await Promise.all(list.map(async (b) => {
    const status = battleStatus(b, at);
    let line = '';
    if (status === 'warmup') line = warmupLabel(b, at);
    else {
      const bundle = await loadBundle(b.id);
      if (!bundle) return null;
      const { state, until } = computeState(bundle, at);
      if (status === 'finished') {
        line = state.champion ? `Terminée · ${sideName(bundle, state.champion)} champion` : 'Terminée · match nul';
      } else if (until) {
        const { round } = roundOf(b, until);
        const mySide = state.sides.find((s) => s.members.includes(user.id))?.id;
        const rank = state.standings.findIndex((s) => s.sideId === mySide) + 1;
        line = `Round ${round}/${b.rounds}${rank ? ` · ${rank}${rank === 1 ? 'er' : 'e'} au classement` : ''}`;
      }
    }
    return { b, status, line };
  }));
  const groups = [
    { key: 'active', title: 'En cours', items: cards.filter((c) => c?.status === 'active') },
    { key: 'warmup', title: 'Échauffement', items: cards.filter((c) => c?.status === 'warmup') },
    { key: 'finished', title: 'Terminées', items: cards.filter((c) => c?.status === 'finished') }
  ];

  return (
    <>
      <TopBar kicker={`Salut ${user.name ?? ''}`} title="Mes battles" right={<div className="flex items-center gap-2"><Link href="/aide" aria-label="Comment ça marche ?" className="grid size-11 place-items-center rounded-xl border-2 border-prune text-soleil"><Icon name="help" size={22} /></Link><Link href="/battles/nouvelle" className="btn btn-soleil min-h-11 px-3 text-base"><Icon name="plus" size={18} />Nouvelle</Link></div>} />
      <main className="flex flex-col gap-5 px-4 py-4">
        {!weighed ? (
          <Link href="/pesee" className="card flex items-center gap-3 bg-magenta p-4 text-white">
            <Icon name="scale" size={32} />
            <div className="flex-1"><div className="font-display text-[20px] leading-tight">Ton coup t'attend</div><div className="text-sm">Pèse-toi pour charger tes coups de ce soir.</div></div>
          </Link>
        ) : null}
        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Ribbon>LE RING EST VIDE</Ribbon>
            <p className="text-[15px] text-lilas">Lance une battle et envoie le lien à tes adversaires. Ou ouvre le lien qu'on t'a envoyé.</p>
            <Link href="/battles/nouvelle" className="btn btn-soleil">LANCER UNE BATTLE</Link>
          </div>
        ) : null}
        {groups.map((g) => g.items.length ? (
          <section key={g.key} className="flex flex-col gap-2">
            <h2 className="label">{g.title}</h2>
            {g.items.map((c) => c && (
              <Link key={c.b.id} href={`/battles/${c.b.id}`} className="card flex items-center gap-3 p-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl border-2 border-encre bg-soleil text-encre"><Icon name={c.status === 'finished' ? 'trophy' : 'ring'} size={26} /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[19px]">{c.b.name}</div>
                  <div className="text-[13px] text-lilas">{FORMAT[c.b.format]} · {c.line}</div>
                </div>
              </Link>
            ))}
          </section>
        ) : null)}
      </main>
    </>
  );
}
