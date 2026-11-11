import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireFighter } from '@/lib/auth';
import { displayName, loadBundle, revealedUntil, roundRecapFor, sideName } from '@/lib/battles';
import { resultLabel, trendLabel } from '@/lib/engine/recap';
import { addDays, now, prettyDate } from '@/lib/time';
import { ShareRound } from '@/components/ShareRound';
import { HpBar, Icon, Ribbon, TopBar } from '@/components/ui';

export const metadata: Metadata = { title: 'Bilan du round' };

export default async function RoundPage({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n: raw } = await params;
  const n = Number(raw);
  const user = await requireFighter(`/battles/${id}/round/${raw}`);
  const bundle = await loadBundle(id);
  if (!bundle) notFound();
  const b = bundle.battle;
  if (!bundle.members.some((m) => m.userId === user.id)) redirect(`/b/${b.code}`);
  const at = now();
  const r = roundRecapFor(bundle, user.id, n, at);
  if (!r) redirect(`/battles/${id}`);

  const until = revealedUntil(b, at)!;
  const label = resultLabel(r);
  const me = sideName(bundle, r.mySide), opp = sideName(bundle, r.oppSide);
  const lastDay = until < r.endDate ? until : r.endDate;
  const hasNext = n < b.rounds && until >= addDays(r.endDate, 1);
  const text = r.result === 'pending'
    ? `Round ${r.round} de « ${b.name} » : ${me} ${r.hp.me} PV, ${opp} ${r.hp.opp} PV. À suivre sur Battle du Bide !`
    : `Round ${r.round} de « ${b.name} » : ${me} ${r.hp.me} PV, ${opp} ${r.hp.opp} PV. Que le meilleur perde !`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <TopBar back={`/battles/${id}`} kicker={`Round ${r.round}/${r.rounds} · du ${prettyDate(r.startDate, false)} au ${prettyDate(r.endDate, false)}`} title="Bilan du round" />
      <section className="flex flex-col gap-4 px-4 py-5">
        <div className="card flex flex-col items-center gap-3 p-5 text-center">
          <Ribbon>{b.name.toUpperCase()}</Ribbon>
          <div className="font-sans text-[34px] font-black italic leading-none" style={{ color: label.color }}>{label.text}</div>
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <HpBar hp={r.hp.me} label={`${me} : ${r.hp.me} PV`} />
            <span className="font-display text-[15px] text-lilas">VS</span>
            <HpBar hp={r.hp.opp} reverse label={`${opp} : ${r.hp.opp} PV`} />
          </div>
          <div className="flex w-full items-baseline justify-between gap-2">
            <span className="min-w-0 truncate font-display text-[20px]">{me} <span className="text-soleil">{r.hp.me}</span></span>
            <span className="min-w-0 truncate text-right font-display text-[20px]"><span className="text-soleil">{r.hp.opp}</span> {opp}</span>
          </div>
          {r.result === 'pending' ? <p className="text-sm text-lilas">Round en cours : {r.days} soir{r.days > 1 ? 's' : ''} sur 7 joué{r.days > 1 ? 's' : ''}.</p> : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat k="Pesées à l'heure" v={`${r.weighIns}/${Math.max(r.days, r.weighIns)}`} />
          <Stat k="Meilleur coup" v={`${r.bestHit} PV`} />
          <Stat k="Série" v={`×${r.combo}`} />
          <Stat k="Dégâts infligés" v={`${r.damage.me} PV`} />
          <Stat k={r.crochets > 1 ? 'Crochets' : 'Crochet'} v={String(r.crochets)} />
          <Stat k="Tendance" v={trendLabel(r.lossPct)} good={r.lossPct !== null && r.lossPct > 0} />
        </div>
        {r.late || r.supers ? (
          <p className="text-[13px] text-lilas">
            {r.supers ? `Super déclenché ${r.supers > 1 ? `${r.supers} fois` : 'une fois'}. ` : ''}
            {r.late ? `${r.late} pesée${r.late > 1 ? 's' : ''} après la cloche : pas de coup ${r.late > 1 ? 'ces soirs-là' : 'ce soir-là'}, mais la série a tenu.` : ''}
          </p>
        ) : null}

        {r.rank !== null && r.ranked > 2 ? (
          <div className="card-line flex items-center gap-3 px-4 py-3">
            <Icon name="trophy" className="shrink-0 text-soleil" />
            <span className="text-[15px]">{r.complete ? 'À l’issue de ce round' : 'Pour l’instant'} : <b>{r.rank}{r.rank === 1 ? 'er' : 'e'}</b> sur {r.ranked} au classement.</span>
          </div>
        ) : null}
        {r.complete && r.nextOpponent ? (
          <div className="card-line flex items-center gap-3 px-4 py-3">
            <Icon name="glove" className="shrink-0 text-soleil" />
            <span className="text-[15px]">Prochain round : <b>{sideName(bundle, r.nextOpponent)}</b>. Les barres de vie repartent à 100 PV.</span>
          </div>
        ) : null}
        {r.complete && !r.nextOpponent ? (
          <Link href={`/battles/${id}`} className="card-line flex items-center gap-3 px-4 py-3">
            <Icon name="trophy" className="shrink-0 text-soleil" />
            <span className="text-[15px]">C'était le dernier round : <b className="text-soleil">découvre le champion</b>.</span>
          </Link>
        ) : null}

        <div className="card flex flex-col gap-3 p-4">
          <span className="font-display text-[20px] text-soleil">À partager</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/battles/${id}/round/${n}/carte`} alt={`Carte du round ${r.round} : ${me} ${r.hp.me} PV, ${opp} ${r.hp.opp} PV`} width={1080} height={1350}
            className="w-full rounded-2xl border-[3px] border-encre" loading="lazy" />
          <ShareRound imageUrl={`/battles/${id}/round/${n}/carte`} filename={`battle-du-bide-round-${r.round}.png`} text={text} />
          <p className="text-[13px] text-lilas">L'image montre les PV, ta série et ta tendance en % : jamais tes kilos.</p>
        </div>

        <Link href={`/battles/${id}/combat/${lastDay}`} className="btn btn-violet min-h-12 text-base"><Icon name="play" size={18} /> Revoir le dernier combat du round</Link>
        <nav className="flex items-center justify-between gap-2 text-sm font-bold" aria-label="Autres rounds">
          {n > 1 ? <Link className="btn btn-ghost min-h-11 px-3 text-sm" href={`/battles/${id}/round/${n - 1}`}>← Round {n - 1}</Link> : <span />}
          {hasNext ? <Link className="btn btn-ghost min-h-11 px-3 text-sm" href={`/battles/${id}/round/${n + 1}`}>Round {n + 1} →</Link> : <span />}
        </nav>
        <p className="text-center text-[12px] text-lilas">Bilan de {displayName(user)}</p>
      </section>
    </main>
  );
}

function Stat({ k, v, good = false }: { k: string; v: string; good?: boolean }) {
  return (
    <div className="card flex flex-col items-center gap-0.5 px-2 py-3 text-center">
      <span className={`font-sans text-[22px] font-black italic leading-none ${good ? 'text-neon' : 'text-soleil'}`}>{v}</span>
      <span className="text-[11px] leading-tight text-lilas">{k}</span>
    </div>
  );
}
