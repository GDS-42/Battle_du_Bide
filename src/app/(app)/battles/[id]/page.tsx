import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { appUrl, requireFighter } from '@/lib/auth';
import {
  bossFighter, battleStatus, computeState, displayName, endDateOf, fighterFor, fightPending, loadBundle, previewFor, recentFeed,
  roundOf, sideMembers, sideName, superState, warmupLabel
} from '@/lib/battles';
import { beltHeld, roundPairings } from '@/lib/engine/battle';
import { FLAME_DECOR, ringFlame } from '@/lib/engine/flame';
import { trendLabel } from '@/lib/engine/recap';
import { BOSS_ID } from '@/lib/engine/rules';
import { formatEuros, settleStakes } from '@/lib/engine/stakes';
import { rewardsFor } from '@/lib/career';
import { distinctPair } from '@/lib/fighter/bd';
import { fighterStyle } from '@/lib/look';
import { personalSeries } from '@/lib/progress';
import { canStartTonight, START_MAX_DAYS } from '@/lib/start-date';
import { TAUNTS } from '@/lib/taunts';
import { addDays, dayDiff, now, prettyDate, zonedInstant } from '@/lib/time';
import { armSuper, leaveBattle, nudge, rematch } from '@/app/actions/battle';
import { Fighter } from '@/components/Fighter';
import { Countdown } from '@/components/Countdown';
import { InviteBox } from '@/components/InviteBox';
import { StartDateBox } from '@/components/StartDateBox';
import { TauntBox } from '@/components/TauntBox';
import { WeightChart } from '@/components/WeightChart';
import { Empty, Gauge, HpBar, Icon, RingScene, Ribbon, TopBar } from '@/components/ui';

export const metadata: Metadata = { title: 'Le ring' };
const fmt = (n: number, d = 1) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

export default async function RingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ invite?: string; erreur?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireFighter(`/battles/${id}`);
  const style = await fighterStyle();
  const bundle = await loadBundle(id);
  if (!bundle) notFound();
  const b = bundle.battle;
  if (!bundle.members.some((m) => m.userId === user.id)) redirect(`/b/${b.code}`);

  const at = now();
  const { state, until, today, input } = computeState(bundle, at);
  // Flamme du ring : jours d'affilée où tous les joueurs se sont pesés. Elle embellit le décor par paliers.
  const flame = ringFlame(input, today);
  const status = battleStatus(b, at);
  const end = endDateOf(b);
  const pudique = b.privacy === 'pudique';
  const mySide = state.sides.find((s) => s.members.includes(user.id));
  const fightAtToday = fightPending(b, today, at);
  const inBattle = today >= b.startDate && today <= end;
  const roundIdx = Math.max(0, Math.min(b.rounds - 1, Math.floor(dayDiff(b.startDate, today) / 7)));
  const roundRes = state.rounds[roundIdx];
  const pairsNow = roundRes?.pairings ?? roundPairings(state.sides.map((s) => s.id), roundIdx).map(([a, c]) => ({ a, b: c, hp: { a: 100, b: 100 }, winner: null, ko: false, koDate: null, weighIns: { a: 0, b: 0 }, damage: { a: 0, b: 0 }, complete: false }));
  const myPair = pairsNow.find((p) => p.a === mySide?.id || p.b === mySide?.id);
  const lastFight = until ? state.days.find((d) => d.date === until) : undefined;
  const lastMyPair = lastFight?.pairings.find((p) => p.a === mySide?.id || p.b === mySide?.id);
  const weighedToday = (uid: string) => bundle.weighIns.some((w) => w.userId === uid && w.date === today);
  const me = state.players[user.id];
  const preview = inBattle ? previewFor(bundle, user.id, today) : null;
  const yesterday = inBattle ? previewFor(bundle, user.id, addDays(today, -1)) : null;
  const { armed: superArmed, ready: superReady } = superState(bundle, user.id, at);
  const trendOf = (uid: string) => state.players[uid]?.trend ?? bundle.weighIns.filter((w) => w.userId === uid).at(-1)?.weight ?? null;
  // Récompenses portées par les combattants : gants dorés (série de 21 jours), ceinture de champion
  const rewards = await rewardsFor(bundle.members.map((m) => m.userId), at);
  const fighterOfSide = (sideId: string, flip: boolean, w: number) => {
    if (sideId === BOSS_ID) return [{ key: 'boss', cfg: bossFighter({ flip, w }, style) }];
    return sideMembers(bundle, sideId).slice(0, 2).map((m, i) => ({ key: m.userId, cfg: fighterFor(m.user, trendOf(m.userId), { flip, w: i ? Math.round(w * 0.8) : w }, rewards.get(m.userId), style) }));
  };
  // Face-à-face : deux combattants dessinés à l'allure identique seraient indiscernables, le camp d'en face change de teinte.
  const faceOff = (mine: string, theirs: string) => {
    const a = fighterOfSide(mine, false, 130), b = fighterOfSide(theirs, true, 130);
    if (a[0]?.cfg.sprite && b[0]?.cfg.sprite) b[0].cfg = { ...b[0].cfg, sprite: distinctPair(a[0].cfg.sprite, b[0].cfg.sprite) };
    return { a, b };
  };
  // Photo de balance (mode transparent) : la dernière déjà révélée
  const photoOf = (uid: string) => !pudique && b.photoProof
    ? bundle.weighIns.filter((w) => w.userId === uid && w.photoPath && (uid === user.id || w.date < today || !fightAtToday)).at(-1)?.id ?? null
    : null;
  const personal = await personalSeries(user.id, today);
  // Le % perdu n'a de sens qu'une fois la battle commencée (poids de départ fixé)
  const showLoss = !!me?.startWeight && today >= b.startDate;
  const feedRows = await recentFeed(id, 30);
  const { round: rNum, day: dNum } = roundOf(b, inBattle ? today : until ?? b.startDate);
  const inviteUrl = `${appUrl()}/b/${b.code}`;
  const showInvite = bundle.members.length < b.maxPlayers && status === 'warmup';

  // Fin de battle
  let finale: React.ReactNode = null;
  if (status === 'finished') {
    const champ = state.champion;
    const champMembers = champ ? state.sides.find((s) => s.id === champ)?.members ?? [] : [];
    const settle = b.potAmount ? settleStakes({
      mode: b.potMode ?? 'objectif', amount: b.potAmount, objectivePct: b.potObjective,
      players: Object.values(state.players).map((p) => ({ userId: p.userId, lossPct: p.lossPct })), championMembers: champMembers
    }) : null;
    const nameOf = (uid: string) => displayName(bundle.members.find((m) => m.userId === uid)!.user);
    const belt = champMembers.length === 1 ? beltHeld(champMembers[0], { battle: { format: b.format, startDate: b.startDate, rounds: b.rounds, members: bundle.members.map((m) => ({ userId: m.userId, team: m.team })) }, weighIns: bundle.weighIns.map((w) => ({ userId: w.userId, date: w.date, weight: w.weight })), supers: [] }, today) : null;
    finale = (
      <section className="flex flex-col gap-3">
        <div className="card flex flex-col items-center gap-2 p-5 text-center">
          <Ribbon>FIN DE LA BATTLE</Ribbon>
          <Icon name="trophy" size={44} className="mt-2 text-soleil" />
          <div className="font-display text-[28px] leading-tight text-soleil">{champ ? `${sideName(bundle, champ, true)} remporte la ceinture !` : 'Match nul : personne ne repart avec la ceinture.'}</div>
          {belt !== null ? <p className="text-sm text-lilas">{belt ? 'Ceinture défendue : tendance stable et pesées régulières.' : 'Ceinture vacante : la défense a lâché (tendance ou pesées).'}</p> : null}
        </div>
        {b.stakeText ? <div className="card-line px-4 py-3"><span className="label">Gage</span><p className="font-display text-[19px]">{b.stakeText}</p></div> : null}
        {settle ? (
          <div className="card-line flex flex-col gap-2 px-4 py-3">
            <span className="label">Cagnotte · {formatEuros(b.potAmount!)} chacun</span>
            {settle.carryOver ? <p>Personne n'a atteint l'objectif : la cagnotte est reportée sur la revanche.</p>
              : settle.transfers.length === 0 ? <p>Tout le monde a gagné : personne ne paie !</p>
              : settle.transfers.map((t, i) => <p key={i}><b>{nameOf(t.from)}</b> doit <b className="text-soleil">{formatEuros(t.amount)}</b> à <b>{nameOf(t.to)}</b></p>)}
          </div>
        ) : null}
        <form action={rematch}><input type="hidden" name="battleId" value={id} />
          <button className="btn btn-soleil w-full text-[24px]">REVANCHE ?</button></form>
      </section>
    );
  }

  return (
    <>
      <TopBar back="/battles" kicker={status === 'warmup' ? warmupLabel(b, at) : status === 'finished' ? 'Battle terminée' : `Round ${rNum}/${b.rounds} · jour ${dNum}`} title={b.name} />
      <main className="flex flex-col gap-5 pb-6">
        {/* Face-à-face du round */}
        {mySide && myPair ? (() => {
          const meIsA = myPair.a === mySide.id;
          const oppId = meIsA ? myPair.b : myPair.a;
          const myHp = meIsA ? myPair.hp.a : myPair.hp.b, oppHp = meIsA ? myPair.hp.b : myPair.hp.a;
          const lastDmgMe = lastMyPair && roundRes && lastFight?.roundIndex === roundIdx ? (meIsA ? lastMyPair.attacks.b.total : lastMyPair.attacks.a.total) : 0;
          const lastDmgOpp = lastMyPair && roundRes && lastFight?.roundIndex === roundIdx ? (meIsA ? lastMyPair.attacks.a.total : lastMyPair.attacks.b.total) : 0;
          return (
            <section aria-label="Face-à-face du round">
              <div className="bg-encre px-3 pb-3 pt-2">
                <div className="grid grid-cols-[1fr_52px_1fr] items-center gap-2">
                  <HpBar hp={myHp} ghost={lastDmgMe} label={`${sideName(bundle, mySide.id)} : ${Math.round(Math.max(0, myHp))} PV`} />
                  <div className="grid size-[52px] place-items-center rounded-full border-[3px] border-creme bg-rouge leading-none">
                    <span className="font-display text-[11px]">ROUND</span><span className="font-sans text-[22px] font-black italic text-soleil">{rNum}</span>
                  </div>
                  <HpBar hp={oppHp} ghost={lastDmgOpp} reverse label={`${sideName(bundle, oppId)} : ${Math.round(Math.max(0, oppHp))} PV`} />
                </div>
                <div className="mt-1 flex justify-between font-display text-[18px]">
                  <span>{sideName(bundle, mySide.id)} <span className="text-soleil">{Math.round(Math.max(0, myHp))}</span></span>
                  <span><span className="text-soleil">{Math.round(Math.max(0, oppHp))}</span> {sideName(bundle, oppId)}</span>
                </div>
              </div>
              <RingScene height={250} flame={flame.level} className="border-b-[5px] border-encre">
                {(() => {
                  const duo = faceOff(mySide.id, oppId);
                  return (
                    <div className="absolute inset-x-3 bottom-[30px] flex items-end justify-between">
                      <div className="flex items-end">{duo.a.map((f) => <Fighter key={f.key} cfg={f.cfg} />)}</div>
                      <div className="flex items-end">{duo.b.map((f) => <Fighter key={f.key} cfg={f.cfg} />)}</div>
                    </div>
                  );
                })()}
                {myPair.ko ? <div className="absolute left-1/2 top-6 -translate-x-1/2"><Ribbon>K.O. · ROUND TERMINÉ</Ribbon></div> : null}
              </RingScene>
            </section>
          );
        })() : null}

        <div className="flex flex-col gap-5 px-4">
          {sp.erreur === 'createur' ? <p role="alert" className="text-sm text-[#FF8FA3]">Tu as ouvert ce ring : tu ne peux pas le quitter tant que d'autres joueurs y sont.</p> : null}
          {(sp.invite || status === 'warmup') && showInvite ? <InviteBox url={inviteUrl} name={b.name} note="Inscriptions ouvertes jusqu'au premier combat. Sans adversaire, le départ est reporté au soir suivant." /> : null}
          {status === 'warmup' && b.createdBy === user.id ? (
            <StartDateBox battleId={id} startDate={b.startDate} fightTime={b.fightTime} today={today} tomorrow={addDays(today, 1)}
              maxDate={addDays(today, START_MAX_DAYS)} tonightOk={canStartTonight(b.fightTime, b.timezone, at)} error={sp.erreur === 'date'} />
          ) : null}

          {/* Combat du soir */}
          {status !== 'warmup' && until ? (
            <Link href={`/battles/${id}/combat/${until}`} className="card flex items-center gap-3 bg-soleil p-4 text-encre">
              <div className="grid size-12 shrink-0 place-items-center rounded-full border-[3px] border-encre bg-magenta text-white"><Icon name="play" /></div>
              <div className="flex-1">
                <div className="font-display text-[20px] leading-tight">{until === today ? 'Le combat de ce soir est prêt !' : `Revoir le combat du ${prettyDate(until)}`}</div>
                <div className="text-sm">Replay avec commentateur, réactions, chambrage.</div>
              </div>
            </Link>
          ) : null}

          {/* Mon statut */}
          {status !== 'finished' ? (
            <section className="card flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[20px]">Ton coup du jour</h2>
                <span className="text-sm text-lilas">
                  {inBattle
                    ? (fightAtToday ? <Countdown prefix="combat dans" target={zonedInstant(today, b.fightTime, b.timezone).getTime()} serverNow={at.getTime()} /> : 'combat joué')
                    : <Countdown prefix="1er combat dans" target={zonedInstant(b.startDate, b.fightTime, b.timezone).getTime()} serverNow={at.getTime()} />}
                </span>
              </div>
              {weighedToday(user.id) ? (
                preview ? (
                  <p className="text-[15px]">
                    {preview.attack.weighed ? <>Chargé : <b className="text-soleil">{fmt(preview.attack.total, 0)} PV</b> (jab {preview.attack.jab}{preview.attack.crochet ? `, crochet ${fmt(preview.attack.crochet, 0)}` : ', crochet bloqué'}{preview.attack.super ? ', super 15' : ''}).</> : 'Pesée après l’heure du combat : pas de coup ce soir, mais ta série continue.'}
                  </p>
                ) : <p className="text-[15px]">Pesée enregistrée : elle sert à fixer ton poids de départ.</p>
              ) : (
                <Link href="/pesee" className="btn btn-soleil w-full">JE ME PÈSE</Link>
              )}
              {inBattle ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <Gauge value={preview?.gauge ?? yesterday?.gauge ?? 0} />
                    <span className="text-[13px] text-lilas">Combo ×{preview?.combo ?? me?.combo ?? 0} · Gardes {preview?.garde ?? me?.garde ?? 0}</span>
                  </div>
                  {superArmed ? <Ribbon color="#E8287C">SUPER ARMÉ</Ribbon> : superReady ? (
                    <form action={armSuper}><input type="hidden" name="battleId" value={id} />
                      <button className="btn btn-magenta min-h-11 px-3 text-base">SUPER CE SOIR</button></form>
                  ) : null}
                </div>
              ) : null}
              {personal.count ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2"><span className="label">Ta courbe</span>
                    <span className="text-right text-sm">
                      {showLoss ? <b className="text-soleil">{trendLabel(me.lossPct)}</b> : null}
                      {personal.trend !== null ? <span className="text-lilas">{showLoss ? ' · ' : ''}{fmt(personal.trend, 1)} kg{pudique ? ' (visible par toi seul)' : ''}</span> : null}
                    </span></div>
                  <WeightChart days={personal.days} range={30} marker={{ date: b.startDate, label: 'Début' }} label="Courbe de tes pesées" />
                </div>
              ) : null}
            </section>
          ) : finale}

          {/* Les combattants aujourd'hui */}
          <section className="flex flex-col gap-2">
            <h2 className="label">{status === 'warmup' ? 'Sur le ring' : status === 'finished' ? 'Les combattants' : "Aujourd'hui"}</h2>
            {today >= b.startDate ? (
              <div className="card-line flex items-center gap-3 px-3 py-2.5">
                <span className={`grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-encre ${flame.days > 0 && status !== 'finished' ? 'bg-orange text-encre' : 'bg-violet-2 text-lilas'}`}>
                  <Icon name="fire" size={24} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 font-display text-[17px]">
                    <span>Flamme du ring</span>
                    {status === 'finished' ? <span className="text-soleil">record : {plural(flame.best, 'jour')}</span>
                      : flame.days > 0 ? <span className="text-soleil">{plural(flame.days, 'jour')}</span>
                      : <span className="text-lilas">éteinte</span>}
                  </div>
                  <p className="text-[13px] leading-snug text-lilas">
                    {status === 'finished' ? 'La plus longue suite de jours où tout le ring s’est pesé.'
                      : flame.missing === 0 ? 'Tout le ring s’est pesé aujourd’hui.'
                      : flame.days > 0 ? `Encore ${plural(flame.missing, 'pesée')} aujourd’hui pour l’entretenir.`
                      : `Elle ${flame.best > 0 ? 'se rallume' : 's’allume'} quand tout le ring se pèse le même jour : encore ${plural(flame.missing, 'pesée')} aujourd’hui.`}
                    {status === 'finished' ? null
                      : flame.next ? ` Prochain décor à ${flame.next} jours : ${FLAME_DECOR[flame.level]}.`
                      : ' Le ring a tous ses décors.'}
                  </p>
                </div>
              </div>
            ) : null}
            {bundle.members.map((m) => {
              const p = state.players[m.userId];
              const done = weighedToday(m.userId);
              return (
                <div key={m.userId} className="card-line flex items-center gap-3 px-3 py-2">
                  <div className="relative h-[60px] w-[54px] shrink-0 overflow-hidden rounded-xl bg-violet-2">
                    <div className="absolute left-1/2 top-0 -ml-[40px]"><Fighter cfg={fighterFor(m.user, trendOf(m.userId), { w: 80 }, rewards.get(m.userId), style)} /></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[17px]">{displayName(m.user)}{m.user.nickname ? <span className="text-lilas"> « {m.user.nickname} »</span> : null}</div>
                    <div className="text-[13px] text-lilas">
                      {p?.startWeight ? <>{trendLabel(p.lossPct)}{!pudique && p.trend ? ` · ${fmt(p.trend)} kg` : ''}{status === 'finished' ? ` · meilleur combo ×${p.bestCombo}` : ` · combo ×${p.combo}`}</> : 'pas encore de pesée'}
                      {b.format === 'equipes' ? ` · ${b.teamNames?.[String(m.team ?? 1)] ?? `Équipe ${m.team}`}` : ''}
                    </div>
                  </div>
                  {photoOf(m.userId) ? <a href={`/api/photos/${photoOf(m.userId)}`} target="_blank" rel="noopener" className="grid size-11 shrink-0 place-items-center text-lilas" aria-label={`Photo de la balance de ${displayName(m.user)}`}><Icon name="camera" size={20} /></a> : null}
                  {status === 'finished' ? null : done ? <span className="flex items-center gap-1 text-sm font-bold text-soleil"><Icon name="check" size={18} />pesé</span>
                    : m.userId !== user.id && inBattle && fightAtToday ? (
                      <form action={nudge}><input type="hidden" name="battleId" value={id} /><input type="hidden" name="to" value={m.userId} />
                        <button className="pill" aria-label={`Coup de coude à ${displayName(m.user)}`}>Coup de coude</button></form>
                    ) : <span className="text-sm text-lilas">pas pesé</span>}
                </div>
              );
            })}
            {inBattle && fightAtToday ? <p className="flex items-center gap-2 text-[13px] text-lilas"><Icon name="lock" size={16} />Les résultats restent secrets jusqu'à {b.fightTime.replace(':', ' h ')}.</p> : null}
          </section>

          {/* Classement / rounds */}
          {state.rounds.length ? (
            <section className="flex flex-col gap-2">
              <h2 className="label">{b.format === 'duel' ? 'Les rounds' : 'Classement'}</h2>
              {b.format !== 'duel' ? (
                <div className="card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-encre text-lilas"><tr><th className="px-3 py-2">#</th><th className="py-2">Camp</th><th className="py-2 text-center">V</th><th className="py-2 text-center">D</th><th className="py-2 text-center">N</th><th className="py-2 pr-3 text-right">PV infligés</th></tr></thead>
                    <tbody>
                      {state.standings.map((s, i) => (
                        <tr key={s.sideId} className={`border-t-2 border-nuit ${s.sideId === mySide?.id ? 'text-soleil' : ''}`}>
                          <td className="px-3 py-2 font-display">{i + 1}</td><td className="py-2 font-bold">{sideName(bundle, s.sideId)}</td>
                          <td className="py-2 text-center">{s.wins}</td><td className="py-2 text-center">{s.losses}</td><td className="py-2 text-center">{s.draws}</td><td className="py-2 pr-3 text-right">{Math.round(s.damageDealt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <div className="grid grid-cols-4 gap-2">
                {state.rounds.map((r) => {
                  const p = r.pairings.find((x) => x.a === mySide?.id || x.b === mySide?.id) ?? r.pairings[0];
                  const won = p?.winner && p.winner === mySide?.id, lost = p?.winner && p.winner !== mySide?.id;
                  return (
                    <Link key={r.index} href={`/battles/${id}/round/${r.index + 1}`} aria-label={`Bilan du round ${r.index + 1}`}
                      className={`rounded-xl border-2 px-2 py-2 text-center ${won ? 'border-encre bg-soleil text-encre' : lost ? 'border-prune bg-violet' : 'border-prune'}`}>
                      <div className="font-display text-[15px]">R{r.index + 1}</div>
                      <div className="text-[11px]">{!p?.complete ? 'en cours' : won ? (p.ko ? 'K.O. !' : 'gagné') : lost ? 'perdu' : 'nul'}</div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* Combats récents */}
          {state.days.length ? (
            <section className="flex flex-col gap-2">
              <h2 className="label">Combats du soir</h2>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[...state.days].reverse().slice(0, 14).map((d) => (
                  <Link key={d.date} href={`/battles/${id}/combat/${d.date}`} className="flex min-w-[78px] flex-col items-center rounded-xl border-2 border-prune px-2 py-2 text-center">
                    <span className="font-display text-[14px] text-soleil">R{d.roundIndex + 1} · J{d.dayIndex + 1}</span>
                    <span className="text-[11px] text-lilas">{prettyDate(d.date, false)}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* Fil et chambrage */}
          <section className="flex flex-col gap-2">
            <h2 className="label">Le fil du ring</h2>
            {status !== 'finished' ? (
              <TauntBox battleId={id} suggestions={TAUNTS[b.tone]} />
            ) : null}
            {feedRows.length ? feedRows.map(({ f, u }) => (
              <div key={f.id} className="card-line px-3 py-2 text-[14px]">
                {f.kind === 'taunt' || f.kind === 'comment' ? <><b className="text-soleil">{u ? displayName(u) : '?'}</b> : « {f.text} »</> : f.text}
                <span className="ml-2 text-[11px] text-lilas">{f.createdAt.toLocaleString('fr-FR', { timeZone: b.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )) : <Empty>Rien encore. Écris le premier message !</Empty>}
          </section>

          {status === 'warmup' ? (
            <form action={leaveBattle} className="pt-2"><input type="hidden" name="battleId" value={id} />
              <button className="btn btn-ghost w-full text-base">{b.createdBy === user.id ? 'Supprimer ce ring' : 'Quitter ce ring'}</button></form>
          ) : null}
        </div>
      </main>
    </>
  );
}
