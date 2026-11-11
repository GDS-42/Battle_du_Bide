import type { Metadata } from 'next';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { requireFighter } from '@/lib/auth';
import { db } from '@/lib/db';
import { pushSubscriptions, weighIns } from '@/lib/db/schema';
import { battleStatus, computeState, displayName, fighterFor, loadBundle, userBattles } from '@/lib/battles';
import { bmi, stageLabel } from '@/lib/engine/silhouette';
import { personalSeries } from '@/lib/progress';
import { vapidPublicKey } from '@/lib/push';
import { localDate, now, prettyDate } from '@/lib/time';
import { logout } from '@/app/actions/auth';
import { deleteAccount } from '@/app/actions/profile';
import { Fighter } from '@/components/Fighter';
import { WeightChart } from '@/components/WeightChart';
import { InstallCard } from '@/components/InstallPrompt';
import { Icon, RingScene, Ribbon } from '@/components/ui';
import { SettingsForm } from './SettingsForm';

export const metadata: Metadata = { title: 'Profil' };

const PERIODS = [['30', '30 jours'], ['90', '90 jours'], ['tout', 'Tout']] as const;

export default async function ProfilPage({ searchParams }: { searchParams: Promise<{ erreur?: string; periode?: string }> }) {
  const { erreur, periode } = await searchParams;
  const user = await requireFighter('/profil');
  const at = now();
  const today = localDate(at, user.timezone);
  const g = await personalSeries(user.id, today);
  const period = PERIODS.some(([k]) => k === periode) ? periode! : '30';
  const range = period === 'tout' ? null : Number(period);
  const lost = g.firstWeight !== null && g.trend !== null ? g.firstWeight - g.trend : null;
  const count = (await db.select({ d: weighIns.date }).from(weighIns).where(eq(weighIns.userId, user.id))).length;
  const subs = (await db.select({ id: pushSubscriptions.id }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id))).length;
  const list = await userBattles(user.id);
  let titles = 0, finished = 0;
  for (const b of list) {
    if (battleStatus(b, at) !== 'finished') continue;
    finished++;
    const bundle = await loadBundle(b.id);
    if (!bundle) continue;
    const { state } = computeState(bundle, at);
    if (state.champion && state.sides.find((s) => s.id === state.champion)?.members.includes(user.id)) titles++;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <RingScene height={300} className="border-b-[5px] border-encre">
        <div className="absolute left-4 top-[max(16px,env(safe-area-inset-top))]"><Ribbon>TON COMBATTANT</Ribbon></div>
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2"><Fighter cfg={fighterFor(user, g.trend ?? g.last, { w: 170 })} title={displayName(user)} /></div>
        <div className="absolute right-4 top-16 flex flex-col items-end text-right">
          <span className="extrude text-[30px] leading-none">{displayName(user).toUpperCase()}</span>
          {user.nickname ? <span className="font-display text-[16px] text-soleil">« {user.nickname} »</span> : null}
          <span className="mt-1 text-[12px] text-creme">{stageLabel(bmi(g.trend ?? g.last, user.heightCm))}</span>
        </div>
      </RingScene>

      <section className="flex flex-col gap-4 px-4 py-5">
        <div className="grid grid-cols-3 gap-2">
          <Stat k="Pesées" v={String(count)} />
          <Stat k={finished ? `Battles · ${finished} finie${finished > 1 ? 's' : ''}` : 'Battles'} v={String(list.length)} />
          <Stat k="Ceintures" v={String(titles)} />
        </div>
        <div id="courbe" className="card flex scroll-mt-4 flex-col gap-3 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-[20px] text-soleil">Ma courbe</h2>
            <span className="text-[12px] text-lilas">visible par toi seul</span>
          </div>
          {g.count ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Fact k={`Départ · ${prettyDate(g.first!, false)}`} v={`${fmt(g.firstWeight!)} kg`} />
                <Fact k="Tendance" v={g.trend !== null ? `${fmt(g.trend)} kg` : '—'} />
                <Fact k="Évolution" v={lost !== null ? `${lost >= 0 ? '−' : '+'}${fmt(Math.abs(lost))} kg` : '—'} strong={lost !== null && lost > 0} />
              </div>
              <WeightChart days={g.days} range={range} label="Courbe de toutes tes pesées" />
              {g.days.length > 30 ? (
                <nav className="flex flex-wrap gap-1.5" aria-label="Période affichée">
                  {PERIODS.map(([k, l]) => (
                    <Link key={k} href={`/profil?periode=${k}#courbe`} scroll={false} className="pill grid place-items-center" aria-current={period === k ? 'true' : undefined}>{l}</Link>
                  ))}
                </nav>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-lilas">Ta courbe démarre à ta première pesée. <Link href="/pesee" className="font-bold text-soleil underline">Je me pèse</Link></p>
          )}
        </div>
        {user.superMove || user.entrance ? (
          <div className="card flex flex-col gap-1 p-4">
            {user.superMove ? <div className="text-[15px]"><span className="label mr-2">Super</span>« {user.superMove} »</div> : null}
            {user.entrance ? <div className="text-[15px] italic text-lilas">« {user.entrance} »</div> : null}
          </div>
        ) : null}
        <Link href="/combattant?next=/profil" className="btn btn-soleil w-full text-[19px]">RETOUCHER MON COMBATTANT</Link>
        <Link href="/aide" className="btn btn-ghost min-h-12 w-full text-base"><Icon name="help" size={18} /> Comment ça marche ?</Link>

        <InstallCard />

        <SettingsForm weighTime={user.weighTime} notifyOn={user.notifyOn} timezone={user.timezone} vapidKey={vapidPublicKey()} pushDevices={subs} />

        <div className="card flex flex-col gap-3 p-4">
          <span className="font-display text-[20px] text-soleil">Mes données</span>
          <p className="text-sm text-lilas">Tes pesées t'appartiennent : télécharge-les quand tu veux.</p>
          <div className="grid grid-cols-2 gap-2">
            <a className="btn btn-violet min-h-12 text-base" href="/api/export?format=csv" download>Pesées (CSV)</a>
            <a className="btn btn-violet min-h-12 text-base" href="/api/export" download>Tout (JSON)</a>
          </div>
        </div>

        <form action={logout}>
          <button className="btn btn-ghost w-full min-h-12 text-base"><Icon name="logout" size={18} /> Me déconnecter</button>
        </form>

        <details className="card-line px-4 py-3">
          <summary className="cursor-pointer text-sm font-bold text-lilas">Supprimer mon compte</summary>
          <form action={deleteAccount} className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-lilas">Tes pesées, photos et ton combattant seront effacés. Les battles que tu as créées passent à un autre membre.</p>
            <label className="flex flex-col gap-1"><span className="label">Tape SUPPRIMER pour confirmer</span>
              <input className="field" name="confirm" autoComplete="off" /></label>
            {erreur === 'confirmation' ? <p role="alert" className="text-sm text-[#FF8FA3]">Confirmation incorrecte.</p> : null}
            <button className="btn min-h-12 border-[3px] border-encre bg-rouge text-base text-creme">Supprimer définitivement</button>
          </form>
        </details>
      </section>
    </main>
  );
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Fact({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`font-sans text-[19px] font-black italic leading-none ${strong ? 'text-neon' : 'text-creme'}`}>{v}</span>
      <span className="text-[11px] leading-tight text-lilas">{k}</span>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="card flex flex-col items-center gap-0.5 px-2 py-3">
      <span className="font-sans text-[26px] font-black italic leading-none text-soleil">{v}</span>
      <span className="text-[12px] text-lilas">{k}</span>
    </div>
  );
}
