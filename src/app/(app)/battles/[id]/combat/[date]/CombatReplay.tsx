'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toggleReaction } from '@/app/actions/battle';
import { Fighter } from '@/components/Fighter';
import { Burst, HpBar, Icon, RingScene } from '@/components/ui';
import type { FighterRender } from '@/lib/fighter/types';
import { buzz, play, setSoundOn, soundOn, type SoundName } from '@/lib/sound';

export interface SideView {
  id: string;
  name: string;
  sub: string;
  boss: boolean;
  fighters: { key: string; cfg: FighterRender }[];
  attack: { total: number; jab: number; crochet: number; super: number; teamBonus: number; weighed: boolean; late: boolean; blocked: boolean; garde: boolean; combo: number };
}
export interface Scene {
  key: string;
  mine: boolean;
  idle: boolean;
  a: SideView;
  b: SideView;
  hpBefore: { a: number; b: number };
  hpAfter: { a: number; b: number };
  ko: 'a' | 'b' | 'both' | null;
  lines: { a: string[]; b: string[]; end: string | null };
}
interface Reaction { key: string; label: string; icon: string; count: number; mine: boolean }

// Étapes : 0 = prêt, 1 = A frappe, 2 = B réplique, 3 = bilan
const STEP_MS = [0, 1900, 1900, 0];
const r = (n: number) => Math.max(0, Math.round(n));

function hitOf(s: SideView): { text: string; sub?: string; sound: SoundName; color: string; big: boolean } {
  const a = s.attack;
  if (s.boss) return { text: 'BIDE!', sub: `${r(a.total)} PV`, sound: 'jab', color: '#B98BFF', big: false };
  if (!a.weighed) return { text: a.late ? 'TROP TARD' : 'ABSENT', sub: a.late ? 'pesée après la cloche' : 'pas de pesée', sound: 'bloque', color: '#CDB8F0', big: false };
  if (a.super > 0) return { text: 'SUPER!', sub: `${r(a.total)} PV`, sound: 'superCoup', color: '#2BFFB0', big: true };
  if (a.crochet > 0) return { text: 'CROCHET', sub: `${r(a.total)} PV`, sound: 'crochet', color: '#FFD23D', big: true };
  return { text: 'JAB', sub: `${r(a.total)} PV${a.blocked ? ' · crochet bloqué' : ''}`, sound: 'jab', color: '#FFF4E3', big: false };
}

export function CombatReplay({ battleId, title, round, day, when, dateLabel, scenes, reactions, target, lastOfRound }: {
  battleId: string; title: string; round: number; day: number; when: string; dateLabel: string;
  scenes: Scene[]; reactions: Reaction[]; target: string; lastOfRound: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [sound, setSound] = useState(true);
  const [shake, setShake] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const s = scenes[idx];

  useEffect(() => { setSound(soundOn()); }, []);
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  useEffect(() => clear, []);

  const runStep = useCallback((n: number, sc: Scene) => {
    setStep(n);
    if (n === 1 || n === 2) {
      const h = hitOf(n === 1 ? sc.a : sc.b);
      play(h.sound);
      if (h.big) { setShake((x) => x + 1); buzz(h.text === 'SUPER!' ? [40, 60, 90] : 50); }
    }
    if (n === 3) {
      if (sc.ko) { play('ko'); buzz([80, 60, 160]); setShake((x) => x + 1); } else play('cloche');
      return;
    }
    timer.current = setTimeout(() => runStep(n + 1, sc), STEP_MS[n] || 1100);
  }, []);

  const start = (i = idx) => {
    clear();
    const sc = scenes[i];
    setIdx(i); setStarted(true); setStep(0);
    if (sc.idle) { setStep(3); return; }
    play('combat');
    timer.current = setTimeout(() => runStep(1, sc), 1100);
  };
  const skip = () => { clear(); setStarted(true); setStep(3); };
  const toggleSound = () => { const v = !sound; setSound(v); setSoundOn(v); if (v) play('cloche', true); };

  // PV affichés selon l'étape
  const hpA = step >= 2 ? s.hpAfter.a : s.hpBefore.a;
  const hpB = step >= 1 ? s.hpAfter.b : s.hpBefore.b;
  const lostA = step >= 2 ? s.hpBefore.a - s.hpAfter.a : 0;
  const lostB = step >= 1 ? s.hpBefore.b - s.hpAfter.b : 0;
  const poseA: FighterRender['pose'] = step === 1 ? 'punch' : step === 2 ? 'hurt' : step === 3 && (s.ko === 'a' || s.ko === 'both') ? 'hurt' : 'guard';
  const poseB: FighterRender['pose'] = step === 2 ? 'punch' : step === 1 ? 'hurt' : step === 3 && (s.ko === 'b' || s.ko === 'both') ? 'hurt' : 'guard';
  const hit = step === 1 ? hitOf(s.a) : step === 2 ? hitOf(s.b) : null;
  const shown = [
    ...(step >= 1 ? s.lines.a.map((t) => ({ t, c: 'a' })) : []),
    ...(step >= 2 ? s.lines.b.map((t) => ({ t, c: 'b' })) : []),
    ...(step >= 3 && s.lines.end ? [{ t: s.lines.end, c: 'end' }] : [])
  ];
  const progress = !started ? 0 : step === 0 ? 8 : step === 1 ? 40 : step === 2 ? 72 : 100;
  const actor = step === 1 ? s.a : s.b;
  const actorLabel = actor.boss ? 'LE BIDE FRAPPE' : !actor.attack.weighed ? `${actor.name.toUpperCase()} ${actor.attack.late ? 'EN RETARD' : 'A SÉCHÉ'}` : `${hit?.text.replace('!', '')} DE ${actor.name.toUpperCase()}${actor.attack.combo > 1 ? ` · COMBO ×${actor.attack.combo}` : ''}`;
  const banner = step === 0 ? `ROUND ${round} · JOUR ${day}` : hit ? actorLabel : s.ko ? 'K.O. !' : lastOfRound ? 'FIN DU ROUND' : 'FIN DU COMBAT';

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-2 bg-encre px-3.5 pb-3 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between text-[12px] font-bold tracking-[0.12em] text-lilas">
          <a href={`/battles/${battleId}`} className="flex min-h-11 items-center gap-1 text-creme" aria-label="Retour au ring"><Icon name="back" size={18} /> RING</a>
          <span className="truncate px-2">{title.toUpperCase()}</span>
          <button type="button" onClick={toggleSound} className="grid size-11 place-items-center text-creme" aria-label={sound ? 'Couper le son' : 'Activer le son'} aria-pressed={sound}>
            <Icon name={sound ? 'sound' : 'mute'} size={20} />
          </button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_58px_minmax(0,1fr)] items-center gap-2">
          <HpBar hp={hpA} ghost={lostA} label={`${s.a.name} : ${r(hpA)} PV`} />
          <div className="grid size-[58px] place-items-center rounded-full border-[3px] border-creme bg-rouge leading-none">
            <span className="font-display text-[12px]">ROUND</span>
            <span className="font-sans text-[26px] font-black italic text-soleil">{round}</span>
          </div>
          <HpBar hp={hpB} ghost={lostB} reverse label={`${s.b.name} : ${r(hpB)} PV`} />
        </div>
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-display text-[20px] leading-none">{s.a.name.toUpperCase()} <span className="text-soleil">{r(hpA)}</span></span>
            <span className="truncate text-[12px] text-lilas">{s.a.sub}</span>
          </div>
          <span className="shrink-0 px-2 pt-1 text-[12px] font-bold tracking-[0.12em] text-lilas">{when}</span>
          <div className="flex min-w-0 flex-col items-end">
            <span className="truncate font-display text-[20px] leading-none"><span className="text-soleil">{r(hpB)}</span> {s.b.name.toUpperCase()}</span>
            <span className="truncate text-[12px] text-lilas">{s.b.sub}</span>
          </div>
        </div>
      </header>

      <div key={shake} className={shake ? 'animate-shake' : ''}>
        <RingScene height={320}>
          <div className="absolute inset-x-0 top-3.5 z-20 flex justify-center">
            <div key={banner} className="animate-pop -skew-x-12 border-[3px] border-encre bg-rouge px-3 py-0.5 shadow-[4px_4px_0_#140A22]">
              <div className="skew-x-12 font-display text-[17px]">{banner}</div>
            </div>
          </div>
          <div className="absolute inset-x-3 bottom-10 z-10 flex items-end justify-between">
            <Corner side={s.a} pose={poseA} />
            <Corner side={s.b} pose={poseB} />
          </div>
          {hit ? (
            <div key={`${step}-${idx}`} className={`absolute top-[90px] z-20 animate-pop ${step === 1 ? 'right-[18%]' : 'left-[18%]'}`}>
              <Burst text={hit.text} sub={hit.sub} color={hit.color} />
            </div>
          ) : null}
          {step === 1 && s.a.attack.total > 0 ? <Float key={`fa-${idx}`} side="right" n={s.a.attack.total} /> : null}
          {step === 2 && s.b.attack.total > 0 ? <Float key={`fb-${idx}`} side="left" n={s.b.attack.total} /> : null}
          {step === 3 && s.ko ? (
            <div className="absolute inset-0 z-20 grid place-items-center bg-encre/30">
              <div className="animate-pop extrude text-[72px]">K.O.</div>
            </div>
          ) : null}
          {!started ? (
            <div className="absolute inset-0 z-30 grid place-items-center bg-encre/55 px-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="font-display text-[22px] text-soleil">{s.idle ? 'Ce duel est déjà plié' : 'Le combat est prêt'}</div>
                <button type="button" onClick={() => start()} className="btn btn-soleil min-h-14 px-6 text-[22px]">
                  <Icon name="play" size={22} /> {s.idle ? 'VOIR LE RÉSULTAT' : 'LANCER LE COMBAT'}
                </button>
                <span className="text-[13px] text-lilas">{dateLabel}</span>
              </div>
            </div>
          ) : null}
        </RingScene>
      </div>

      <div className="mx-3.5 mt-3 flex items-center gap-3">
        <button type="button" onClick={() => start()} className="grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-encre bg-soleil text-encre shadow-[0_4px_0_#140A22]" aria-label="Rejouer le combat">
          <Icon name="play" size={20} />
        </button>
        <div className="relative h-2 grow rounded bg-[#3A1F5E]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Avancement du combat">
          <div className="h-full rounded bg-soleil transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <button type="button" onClick={skip} className="min-h-11 px-2 text-[13px] font-bold text-lilas underline" disabled={step === 3}>Passer</button>
      </div>

      <section className="relative mx-3.5 mt-5 flex min-h-[132px] flex-col gap-2 rounded-2xl border-[3px] border-encre bg-violet px-4 pb-3.5 pt-5 shadow-[0_5px_0_#140A22]" aria-live="polite">
        <div className="absolute -top-3.5 left-3.5 -skew-x-12 border-[3px] border-encre bg-soleil px-3 py-px">
          <div className="flex skew-x-12 items-center gap-1.5 font-display text-[15px] text-encre"><Icon name="mic" size={16} /> AU MICRO</div>
        </div>
        {s.idle ? <p className="text-[15px] leading-snug text-lilas">Ce duel s'est terminé par K.O. plus tôt dans le round. Les deux camps récupèrent jusqu'au prochain round.</p> : null}
        {!s.idle && !shown.length ? <p className="text-[15px] leading-snug text-lilas">Le commentateur s'éclaircit la voix…</p> : null}
        {shown.map((l, i) => (
          <p key={i} className={`animate-pop text-[15px] leading-snug ${l.c === 'end' ? 'text-lilas' : ''}`}>
            <Marked text={l.t} marks={[{ name: s.a.name, cls: 'text-soleil' }, { name: s.b.name, cls: 'text-[#2BB5FF]' }]} />
          </p>
        ))}
      </section>

      {step === 3 ? (
        <section className="mx-3.5 mt-4 flex flex-col gap-2">
          <span className="label">Réagir au combat</span>
          <div className="flex flex-wrap gap-2">
            {reactions.map((x) => (
              <form key={x.key} action={toggleReaction}>
                <input type="hidden" name="battleId" value={battleId} />
                <input type="hidden" name="target" value={target} />
                <input type="hidden" name="emoji" value={x.key} />
                <button className="pill min-h-11 gap-1.5" aria-pressed={x.mine} aria-label={`${x.label} (${x.count})`}>
                  <Icon name={x.icon as Parameters<typeof Icon>[0]['name']} size={18} /> {x.count || ''}
                </button>
              </form>
            ))}
          </div>
        </section>
      ) : null}

      {scenes.length > 1 ? (
        <section className="mx-3.5 mt-5 flex flex-col gap-2">
          <span className="label">Les combats de la soirée</span>
          {scenes.map((sc, i) => (
            <button key={sc.key} type="button" onClick={() => start(i)}
              className={`flex min-h-12 items-center justify-between gap-2 rounded-2xl border-[3px] px-3 py-2 text-left ${i === idx ? 'border-soleil bg-violet' : 'border-encre bg-violet/60'}`}>
              <span className="min-w-0 truncate font-bold">{sc.a.name} <span className="text-lilas">vs</span> {sc.b.name}{sc.mine ? <span className="ml-2 text-[12px] text-soleil">TON DUEL</span> : null}</span>
              <span className="shrink-0 font-display text-soleil">{sc.idle ? 'K.O. avant' : `${r(sc.hpAfter.a)} – ${r(sc.hpAfter.b)}`}</span>
            </button>
          ))}
        </section>
      ) : null}
    </div>
  );
}

/** Met en couleur le nom de chaque camp dans une phrase du commentateur (jaune à gauche, bleu à droite). */
function Marked({ text, marks }: { text: string; marks: { name: string; cls: string }[] }) {
  const names = marks.map((m) => m.name).filter(Boolean);
  if (!names.length) return <>{text}</>;
  const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${names.map(esc).sort((x, y) => y.length - x.length).join('|')})`, 'g'));
  return <>{parts.map((part, i) => {
    const m = marks.find((x) => x.name === part);
    return m ? <b key={i} className={m.cls}>{part}</b> : <span key={i}>{part}</span>;
  })}</>;
}

function Corner({ side, pose }: { side: SideView; pose: FighterRender['pose'] }) {
  const [main, second] = side.fighters;
  const flip = !!main?.cfg.flip;
  return (
    <div className={`relative flex items-end ${flip ? 'flex-row-reverse' : ''}`}>
      {second ? <div className={`${flip ? '-ml-10' : '-mr-10'} opacity-90`}><Fighter cfg={{ ...second.cfg, pose }} /></div> : null}
      {main ? <div className="relative"><Fighter cfg={{ ...main.cfg, pose }} title={side.name} /></div> : null}
    </div>
  );
}

function Float({ side, n }: { side: 'left' | 'right'; n: number }) {
  return (
    <div className={`pointer-events-none absolute top-[60px] z-20 animate-floatup font-sans text-[30px] font-black italic text-soleil stroke-text ${side === 'right' ? 'right-[12%]' : 'left-[12%]'}`} aria-hidden>
      −{Math.round(n)}
    </div>
  );
}
