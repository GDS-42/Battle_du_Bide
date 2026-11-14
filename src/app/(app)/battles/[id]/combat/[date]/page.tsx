import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireFighter } from '@/lib/auth';
import { bossFighter, computeState, displayName, fighterFor, loadBundle, reactionsFor, roundOf, sideMembers, sideName, type Bundle } from '@/lib/battles';
import { rewardsFor, type Reward } from '@/lib/career';
import { distinctPair, type LookStyle } from '@/lib/fighter/bd';
import { fighterStyle } from '@/lib/look';
import { commentaryParts } from '@/lib/engine/commentary';
import { BOSS_ID } from '@/lib/engine/rules';
import type { BattleState, PairingDay, SideAttack } from '@/lib/engine/types';
import { REACTIONS } from '@/lib/taunts';
import { addDays, dayName, now, prettyDate } from '@/lib/time';
import { CombatReplay, type Scene, type SideView } from './CombatReplay';
import { Empty, TopBar } from '@/components/ui';

export const metadata: Metadata = { title: 'Combat du soir' };

export default async function CombatPage({ params }: { params: Promise<{ id: string; date: string }> }) {
  const { id, date } = await params;
  const user = await requireFighter(`/battles/${id}/combat/${date}`);
  const style = await fighterStyle();
  const bundle = await loadBundle(id);
  if (!bundle) notFound();
  if (!bundle.members.some((m) => m.userId === user.id)) redirect(`/b/${bundle.battle.code}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const b = bundle.battle;
  const { state, until } = computeState(bundle, now());
  const fight = state.days.find((d) => d.date === date);

  if (!until || !fight) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
        <TopBar back={`/battles/${id}`} kicker={b.name} title="Combat du soir" />
        <div className="p-4"><Empty>Ce combat n'a pas encore eu lieu. Rendez-vous à {b.fightTime.replace(':', ' h ')} !</Empty></div>
      </main>
    );
  }

  const mySide = state.sides.find((s) => s.members.includes(user.id))?.id;
  const trendAt = (uid: string) => {
    const s = state.players[uid]?.series.find((x) => x.date === date);
    return s?.trend ?? state.players[uid]?.startWeight ?? null;
  };
  const rewards = await rewardsFor(bundle.members.map((m) => m.userId), now());
  const scenes: Scene[] = fight.pairings
    .map((p, i) => toScene(bundle, p, date, i, trendAt, fight.dayIndex === 6, rewards, style))
    .sort((x, y) => Number(y.a.id === mySide || y.b.id === mySide) - Number(x.a.id === mySide || x.b.id === mySide));
  for (const s of scenes) s.mine = s.a.id === mySide || s.b.id === mySide;

  const target = `fight:${date}`;
  const rx = (await reactionsFor(id)).filter((r) => r.target === target);
  const reactions = REACTIONS.map((r) => ({
    key: r.key, label: r.label, icon: r.icon,
    count: rx.filter((x) => x.emoji === r.key).length,
    mine: rx.some((x) => x.emoji === r.key && x.userId === user.id)
  }));
  const { round, day } = roundOf(b, date);
  // Bilan du round : proposé à la fin du replay quand le round de mon camp vient de se terminer (7e soir ou K.O.).
  const myRound = state.rounds[fight.roundIndex]?.pairings.find((p) => p.a === mySide || p.b === mySide);
  const recapHref = myRound?.complete && (day === 7 || myRound.koDate === date) ? `/battles/${id}/round/${round}` : null;
  const prev = date > b.startDate ? addDays(date, -1) : null;
  const next = date < until ? addDays(date, 1) : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <CombatReplay
        key={date}
        battleId={id}
        title={b.name}
        round={round}
        day={day}
        when={`${dayName(date).toUpperCase().slice(0, 3)}. · ${b.fightTime}`}
        dateLabel={prettyDate(date)}
        scenes={scenes}
        reactions={reactions}
        target={target}
        lastOfRound={day === 7}
        recapHref={recapHref}
        bd={style === 'bd'}
      />
      <nav className="flex items-center justify-between gap-2 px-4 pb-6 pt-2 text-sm font-bold">
        {prev ? <Link className="btn btn-ghost min-h-11 px-3 text-sm" href={`/battles/${id}/combat/${prev}`}>← Veille</Link> : <span />}
        <Link className="text-soleil underline" href={`/battles/${id}`}>Retour au ring</Link>
        {next ? <Link className="btn btn-ghost min-h-11 px-3 text-sm" href={`/battles/${id}/combat/${next}`}>Lendemain →</Link> : <span />}
      </nav>
    </main>
  );
}

function toScene(bundle: Bundle, p: PairingDay, date: string, i: number, trendAt: (uid: string) => number | null, lastDay: boolean, rewards: Map<string, Reward>, style: LookStyle): Scene {
  const names: Record<string, string> = { [p.a]: sideName(bundle, p.a), [p.b]: sideName(bundle, p.b) };
  const supers: Record<string, string | undefined> = {};
  for (const sid of [p.a, p.b]) {
    const ms = sideMembers(bundle, sid);
    const who = ms.find((m) => p.attacks[sid === p.a ? 'a' : 'b'].members[m.userId]?.super) ?? ms[0];
    supers[sid] = who?.user.superMove ?? undefined;
  }
  const parts = commentaryParts(p, names, bundle.battle.tone, `${bundle.battle.id}:${date}:${i}`, supers, { lastDay });
  const view = (sid: string, att: SideAttack, flip: boolean): SideView => {
    const ms = sideMembers(bundle, sid);
    const players = Object.values(att.members);
    return {
      id: sid,
      name: names[sid],
      sub: sid === BOSS_ID ? 'Le boss du ring' : sid.startsWith('team-') ? ms.map((m) => displayName(m.user)).join(' & ') : ms[0]?.user.nickname ? `« ${ms[0].user.nickname} »` : '',
      fighters: sid === BOSS_ID
        ? [{ key: 'boss', cfg: bossFighter({ flip, w: 150 }, style) }]
        : ms.slice(0, 2).map((m, j) => ({ key: m.userId, cfg: fighterFor(m.user, trendAt(m.userId), { flip, w: j ? 112 : 150 }, rewards.get(m.userId), style) })),
      attack: {
        total: att.total, jab: att.jab, crochet: att.crochet, super: att.super, teamBonus: att.teamBonus,
        weighed: sid === BOSS_ID || players.some((m) => m.weighed),
        late: players.some((m) => m.late),
        blocked: players.length > 0 && players.every((m) => !m.weighed || m.blocked) && att.crochet === 0,
        garde: players.some((m) => m.gardeUsed),
        combo: Math.max(0, ...players.map((m) => m.combo))
      },
      boss: sid === BOSS_ID,
      move: supers[sid] ?? null
    };
  };
  const a = view(p.a, p.attacks.a, false), b = view(p.b, p.attacks.b, true);
  // Deux combattants dessinés à l'allure identique seraient indiscernables : le camp de droite change de teinte.
  const la = a.fighters[0]?.cfg.sprite, lb = b.fighters[0]?.cfg.sprite;
  if (la && lb) b.fighters[0].cfg = { ...b.fighters[0].cfg, sprite: distinctPair(la, lb) };
  return {
    key: `${p.a}-${p.b}`,
    mine: false,
    idle: p.idle,
    a,
    b,
    hpBefore: p.hpBefore,
    hpAfter: p.hpAfter,
    ko: p.ko,
    lines: parts
  };
}
