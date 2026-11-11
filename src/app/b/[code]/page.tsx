import type { Metadata } from 'next';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { battles } from '@/lib/db/schema';
import { battleStatus, displayName, fighterFor, loadBundle } from '@/lib/battles';
import { joinBattle } from '@/app/actions/battle';
import { Fighter } from '@/components/Fighter';
import { Icon, Logo, RingScene, Ribbon } from '@/components/ui';
import { formatEuros } from '@/lib/engine/stakes';
import { now, prettyDate } from '@/lib/time';

const FORMAT = { duel: 'Duel', tournoi: 'Tournoi', equipes: 'Équipes' } as const;

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const [b] = await db.select().from(battles).where(eq(battles.code, code.toUpperCase())).limit(1);
  return { title: b ? `Défi : ${b.name}` : 'Invitation', description: 'Tu es défié sur Battle du Bide. Que le meilleur perde !' };
}

export default async function InvitePage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ erreur?: string }> }) {
  const { code } = await params;
  const { erreur } = await searchParams;
  const [row] = await db.select().from(battles).where(eq(battles.code, code.toUpperCase())).limit(1);
  if (!row) notFound();
  const bundle = (await loadBundle(row.id))!;
  const b = bundle.battle;
  const closed = battleStatus(b, now()) !== 'warmup';
  const host = bundle.members.find((m) => m.userId === b.createdBy) ?? bundle.members[0];
  const user = await currentUser();
  const member = user && bundle.members.some((m) => m.userId === user.id);
  const full = bundle.members.length >= b.maxPlayers;
  const counts = new Map<number, number>();
  for (const m of bundle.members) counts.set(m.team ?? 1, (counts.get(m.team ?? 1) ?? 0) + 1);
  const teams = b.format === 'equipes' ? Array.from({ length: b.maxPlayers / 2 }, (_, i) => i + 1) : [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <RingScene height={400} className="border-b-[5px] border-encre">
        <div className="absolute left-4 top-[max(20px,env(safe-area-inset-top))]"><Ribbon>INVITATION AU RING</Ribbon></div>
        <div className="absolute left-5 top-[70px] -skew-x-[8deg]">
          <div className="extrude text-[46px]">{host ? displayName(host.user).toUpperCase() : 'ON'}<br />TE DÉFIE !</div>
        </div>
        <div className="absolute inset-x-4 bottom-[34px] flex items-end justify-between">
          {host ? <Fighter cfg={fighterFor(host.user, null, { w: 130 })} /> : <span />}
          <div className="mb-24 grid size-14 place-items-center rounded-full border-[3px] border-encre bg-soleil font-sans text-[26px] font-black italic text-magenta">VS</div>
          <div className="relative">
            <Fighter cfg={{ k: 0.42, ghost: true, flip: true, w: 130 }} />
            <span className="stroke-text absolute left-1/2 top-2 -translate-x-1/2 font-sans text-[54px] font-black italic text-soleil">?</span>
          </div>
        </div>
      </RingScene>

      <section className="flex flex-col gap-4 px-4 py-5">
        <div className="card flex flex-col gap-3 p-4">
          <h1 className="font-display text-[22px] leading-tight">« {b.name} »</h1>
          <Info icon="ring" k="Format" v={`${FORMAT[b.format]} · ${b.rounds} rounds`} />
          <Info icon="calendar" k="Début" v={prettyDate(b.startDate)} />
          <Info icon="clock" k="Combats" v={`Chaque soir à ${b.fightTime.replace(':', ' h ')}`} />
          {b.stakeText ? <Info icon="trophy" k="Gage" v={b.stakeText} /> : null}
          {b.potAmount ? <Info icon="coins" k="Cagnotte" v={`${formatEuros(b.potAmount)} chacun${b.potMode === 'objectif' ? ` · objectif −${String(b.potObjective).replace('.', ',')} %` : ' · le vainqueur rafle tout'}`} /> : null}
          <Info icon="user" k="Joueurs" v={`${bundle.members.length} / ${b.maxPlayers} : ${bundle.members.map((m) => displayName(m.user)).join(', ')}`} />
        </div>

        {erreur === 'complet' ? <p role="alert" className="text-sm text-[#FF8FA3]">Le ring est complet.</p> : null}
        {erreur === 'ferme' ? <p role="alert" className="text-sm text-[#FF8FA3]">Les inscriptions sont closes : le premier combat a eu lieu.</p> : null}

        {member ? (
          <Link href={`/battles/${b.id}`} className="btn btn-soleil w-full text-[24px]">ENTRER SUR LE RING</Link>
        ) : closed ? (
          erreur === 'ferme' ? null : <p role="status" className="text-sm text-lilas">Les inscriptions sont closes : le premier combat a eu lieu. Demande une revanche pour la prochaine !</p>
        ) : full ? null : (
          <form action={joinBattle} className="flex flex-col gap-3">
            <input type="hidden" name="code" value={b.code} />
            {teams.length ? (
              <label className="flex flex-col gap-2"><span className="label">Ton équipe</span>
                <select className="field" name="team">
                  {teams.map((t) => <option key={t} value={t} disabled={(counts.get(t) ?? 0) >= 2}>{b.teamNames?.[String(t)] ?? `Équipe ${t}`} ({counts.get(t) ?? 0}/2)</option>)}
                </select>
              </label>
            ) : null}
            <button className="btn btn-soleil w-full text-[24px]">RELEVER LE DÉFI</button>
            {!user ? <p className="text-center text-[13px] text-lilas">On te demandera ton e-mail, puis tu créeras ton combattant.</p> : null}
          </form>
        )}
        <div className="flex justify-center pt-2"><Logo size={26} /></div>
      </section>
    </main>
  );
}

function Info({ icon, k, v }: { icon: Parameters<typeof Icon>[0]['name']; k: string; v: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon name={icon} className="shrink-0 text-soleil" />
      <span className="w-20 shrink-0 text-[13px] text-lilas">{k}</span>
      <span className="text-[15px] font-bold">{v}</span>
    </div>
  );
}
