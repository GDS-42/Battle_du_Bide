import type { Metadata } from 'next';
import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { requireFighter } from '@/lib/auth';
import { db } from '@/lib/db';
import { weighIns } from '@/lib/db/schema';
import { displayName, endDateOf, fighterFor, fightPending, loadBundle, previewFor, superState } from '@/lib/battles';
import { armSuper } from '@/app/actions/battle';
import { BADGES } from '@/lib/engine/badges';
import { RULES } from '@/lib/engine/rules';
import { stageLabel, bmi } from '@/lib/engine/silhouette';
import { rewardsFor } from '@/lib/career';
import { personalSeries } from '@/lib/progress';
import { liveBattles } from '@/lib/weighin';
import { localDate, now, prettyDate, zonedInstant } from '@/lib/time';
import { Countdown } from '@/components/Countdown';
import { Fighter } from '@/components/Fighter';
import { WeightChart } from '@/components/WeightChart';
import { Burst, Gauge, Icon, RingScene, Ribbon, TopBar } from '@/components/ui';
import { CoupFx } from './CoupFx';

export const metadata: Metadata = { title: 'Coup chargé' };
const fmt = (n: number, d = 1) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const STAGE_K: Record<string, number> = { S1: 1, S2: 0.8, S3: 0.6, S4: 0.4, S5: 0.2, S6: 0 };

export default async function CoupPage({ searchParams }: { searchParams: Promise<{ transfo?: string; corrige?: string; badges?: string }> }) {
  const sp = await searchParams;
  const user = await requireFighter('/pesee/coup');
  const at = now();
  const today = localDate(at, user.timezone);
  const [wi] = await db.select().from(weighIns).where(and(eq(weighIns.userId, user.id), eq(weighIns.date, today))).limit(1);
  if (!wi) redirect('/pesee');
  const g = await personalSeries(user.id, today);
  const reward = (await rewardsFor([user.id], at)).get(user.id);
  const live = await liveBattles(user.id);
  const [from, to] = (sp.transfo ?? '').split('-');
  const transfo = STAGE_K[from] !== undefined && STAGE_K[to] !== undefined ? { from, to } : null;
  const newBadges = (sp.badges ?? '').split(',').map((k) => BADGES.find((x) => x.key === k)).filter((x) => !!x);
  const delta = g.trend !== null && g.prevTrend !== null ? g.trend - g.prevTrend : null;

  const cards = [];
  for (const b of live) {
    const bundle = await loadBundle(b.id);
    if (!bundle) continue;
    const inFight = today >= b.startDate && today <= endDateOf(b);
    const p = inFight ? previewFor(bundle, user.id, today) : null;
    const sup = superState(bundle, user.id, at);
    const rivals = bundle.members.filter((m) => m.userId !== user.id);
    const rivalsDone = rivals.filter((m) => bundle.weighIns.some((w) => w.userId === m.userId && w.date === today)).map((m) => displayName(m.user));
    cards.push({ b, p, sup, rivals, rivalsDone });
  }
  const first = cards.find((c) => c.p?.attack.weighed);
  const total = first?.p?.attack.total ?? 0;
  const big = !!first?.p && (first.p.attack.crochet > 0 || first.p.attack.super > 0);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <TopBar back="/pesee" kicker={sp.corrige ? 'PESÉE CORRIGÉE' : 'PESÉE ENREGISTRÉE'} title="Coup chargé" />
      <CoupFx big={big} />

      <RingScene height={300} className="border-b-[5px] border-encre">
        <div className="absolute left-4 top-4"><Ribbon>{transfo ? 'TRANSFORMATION !' : first?.p ? 'COUP CHARGÉ !' : live.length ? 'ÉCHAUFFEMENT' : 'PESÉE OK'}</Ribbon></div>
        {transfo ? (
          <div className="absolute inset-x-4 bottom-10 flex items-end justify-center gap-2">
            <div className="opacity-60"><Fighter cfg={{ ...fighterFor(user, null), k: STAGE_K[from], w: 120, ghost: true }} /></div>
            <Icon name="zap" size={36} className="mb-24 text-soleil" />
            <Fighter cfg={{ ...fighterFor(user, null), k: STAGE_K[to], w: 150, pose: 'punch' }} title={`Silhouette ${to}`} />
          </div>
        ) : (
          <>
            <div className="absolute bottom-10 left-6"><Fighter cfg={fighterFor(user, g.trend ?? wi.weight, { w: 160, pose: first?.p?.attack.total ? 'punch' : 'guard' }, reward)} title={displayName(user)} /></div>
            {first?.p ? (
              <div className="absolute right-3 top-16 animate-pop"><Burst text={`${Math.round(total)} PV`} sub="CHARGÉS" color={big ? '#FFD23D' : '#FFF4E3'} /></div>
            ) : null}
          </>
        )}
      </RingScene>

      <section className="flex flex-col gap-4 px-4 py-5">
        {newBadges.map((bd) => (
          <Link key={bd.key} href="/profil#badges" className="card flex items-center gap-3 bg-soleil p-4 text-encre">
            <span className="grid size-12 shrink-0 place-items-center rounded-full border-[3px] border-encre bg-creme"><Icon name={bd.icon} size={26} /></span>
            <span className="min-w-0">
              <span className="block text-[12px] font-bold uppercase tracking-[.14em]">Nouveau badge</span>
              <span className="block font-display text-[22px] leading-tight">{bd.name}</span>
              <span className="block text-[13px]">{bd.how}</span>
            </span>
          </Link>
        ))}
        {transfo ? (
          <div className="card flex flex-col gap-1 p-4">
            <div className="font-display text-[22px] text-soleil">Silhouette {from} → {to} !</div>
            <p className="text-sm text-lilas">Ton combattant suit ta tendance réelle. Tes rivaux viennent d'être prévenus.</p>
          </div>
        ) : null}

        {cards.map(({ b, p, sup, rivals, rivalsDone }) => (
          <div key={b.id} className="card flex flex-col gap-3 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-display text-[20px]">{b.name}</span>
              <span className="shrink-0 text-[13px] text-lilas">
                {today < b.startDate ? `début ${prettyDate(b.startDate, false)}`
                  : fightPending(b, today, at) ? <Countdown prefix="verdict dans" target={zonedInstant(today, b.fightTime, b.timezone).getTime()} serverNow={at.getTime()} />
                  : 'combat joué'}
              </span>
            </div>
            {!p || !p.attack.weighed ? (
              <p className="text-sm text-lilas">
                {today < b.startDate
                  ? `Échauffement : tes pesées d'ici le ${prettyDate(b.startDate)} fixent ton poids de départ.`
                  : `Pesée après l'heure du combat (${b.fightTime}) : pas de coup ce soir, mais ta série continue${p && p.combo > 1 ? ` (combo ×${p.combo})` : ''} et ta tendance est à jour. Demain, pèse-toi avant ${b.fightTime} !`}
              </p>
            ) : (
              <>
                <Line k="JAB" d={`Pesée du jour · combo ×${p.combo}`} v={p.attack.jab} />
                <Line k="CROCHET" d={p.attack.crochet > 0 ? `Tendance −${fmt(p.attack.crochetPct, 2)} %, nouveau plus bas du round` : p.attack.flagged ? 'Pesée inhabituelle : à confirmer demain' : 'Bloqué : la tendance n’a pas battu ton plus bas du round'} v={p.attack.crochet} dim={p.attack.crochet === 0} />
                {p.attack.super > 0 ? <Line k="SUPER" d={`« ${user.superMove || 'Le Super Coup'} »`} v={p.attack.super} /> : null}
                <div className="flex items-center justify-between gap-3 border-t-2 border-prune pt-3">
                  <div className="flex flex-col gap-1">
                    <span className="label">Jauge de super</span>
                    <Gauge value={Math.min(RULES.SUPER_MAX, p.gauge)} />
                  </div>
                  <div className="text-right text-[13px] text-lilas">Garde : <b className="text-creme">{p.garde}</b>{p.attack.gardeUsed ? <><br />utilisée hier</> : null}</div>
                </div>
                {sup.armed ? <Ribbon color="#E8287C">SUPER ARMÉ POUR CE SOIR</Ribbon> : sup.ready ? (
                  <form action={armSuper}>
                    <input type="hidden" name="battleId" value={b.id} />
                    <button className="btn btn-magenta w-full flex-col gap-0 py-2 text-[20px]">DÉCLENCHER MON SUPER CE SOIR
                      <span className="font-sans text-[13px] font-bold normal-case">« {user.superMove || 'Le Super Coup'} » · +{RULES.SUPER_DAMAGE} PV</span>
                    </button>
                  </form>
                ) : null}
              </>
            )}
            <p className="text-sm">
              {rivalsDone.length ? <><b>{rivalsDone.join(', ')}</b> {p ? `${rivalsDone.length > 1 ? 'ont' : 'a'} chargé ${rivalsDone.length > 1 ? 'leur' : 'son'} coup.` : `${rivalsDone.length > 1 ? 'se sont' : "s'est"} pesé ce matin.`}</> : rivals.length ? <span className="text-lilas">Tes rivaux ne se sont pas encore pesés.</span> : <span className="text-lilas">En attente d'adversaires : partage le lien d'invitation.</span>}
            </p>
            <Link href={`/battles/${b.id}`} className="btn btn-violet min-h-12 text-base">VOIR LE RING</Link>
          </div>
        ))}

        <div className="card-line flex flex-col gap-1 px-4 py-3">
          <span className="label">Ta tendance</span>
          <div className="font-sans text-[28px] font-black italic">{g.trend !== null ? `${fmt(g.trend, 2)} kg` : '—'}
            {delta !== null ? <span className="ml-2 text-[15px] not-italic text-lilas">{delta <= 0 ? '−' : '+'}{fmt(Math.abs(delta), 2)} kg</span> : null}</div>
          <WeightChart days={g.days} range={30} />
          <p className="text-[13px] text-lilas">La balance fait du yo-yo ; ta tendance lisse les écarts. {stageLabel(bmi(g.trend, user.heightCm))}.</p>
          <Link href="/profil#courbe" className="text-[13px] font-bold text-soleil underline">Voir toute ma courbe</Link>
        </div>
        {!live.length ? <Link href="/battles/nouvelle" className="btn btn-soleil w-full text-[22px]">LANCER UNE BATTLE</Link> : null}
      </section>
    </main>
  );
}

function Line({ k, d, v, dim = false }: { k: string; d: string; v: number; dim?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${dim ? 'opacity-60' : ''}`}>
      <div className="flex min-w-0 flex-col">
        <span className="font-display text-[18px] text-soleil">{k}</span>
        <span className="text-[13px] text-lilas">{d}</span>
      </div>
      <span className="shrink-0 font-sans text-[24px] font-black italic">{Math.round(v)} PV</span>
    </div>
  );
}
