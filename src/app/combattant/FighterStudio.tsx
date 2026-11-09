'use client';
import { useMemo, useState, useTransition } from 'react';
import { Fighter } from '@/components/Fighter';
import { RingScene, Ribbon } from '@/components/ui';
import { saveFighter } from '@/app/actions/fighter';
import { bmi, kFromBmi, stageLabel } from '@/lib/engine/silhouette';
import {
  ACC_OPTIONS, AGE_OPTIONS, BASE_OPTIONS, BEARD_OPTIONS, EYES_OPTIONS, HAIR_COLOR_OPTIONS, HAIR_STYLE_OPTIONS, LIPS_OPTIONS,
  MAIN_COLOR_OPTIONS, NOSE_OPTIONS, OUTFIT_OPTIONS, PRESETS, SKIN_OPTIONS
} from '@/lib/fighter/presets';
import type { FighterConfig } from '@/lib/fighter/types';

type Tab = 'peau' | 'visage' | 'coiffure' | 'barbe' | 'acc' | 'tenue' | 'age' | 'corps';
const TABS: [Tab, string][] = [['peau', 'Peau'], ['visage', 'Visage'], ['coiffure', 'Coiffure'], ['barbe', 'Barbe'], ['acc', 'Access.'], ['tenue', 'Tenue'], ['age', 'Âge'], ['corps', 'Corps']];

export interface StudioInitial {
  presetKey: string | null;
  cfg: FighterConfig | null;
  name: string;
  nickname: string;
  superMove: string;
  entrance: string;
  heightCm: number | null;
  weighTime: string;
  weight: number | null;
  firstTime: boolean;
}

export function FighterStudio({ initial, next }: { initial: StudioInitial; next: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(initial.cfg ? 2 : 1);
  const [presetKey, setPresetKey] = useState(initial.presetKey ?? PRESETS[0].key);
  const preset = PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0];
  const [cfg, setCfg] = useState<FighterConfig>(initial.cfg ?? preset.cfg);
  const [tab, setTab] = useState<Tab>('coiffure');
  const [name, setName] = useState(initial.name);
  const [nickname, setNickname] = useState(initial.nickname);
  const [superMove, setSuperMove] = useState(initial.superMove || preset.move);
  const [entrance, setEntrance] = useState(initial.entrance);
  const [height, setHeight] = useState(initial.heightCm ? String(initial.heightCm) : '');
  const [weighTime, setWeighTime] = useState(initial.weighTime || '07:30');
  const [weight, setWeight] = useState(initial.weight ? String(initial.weight).replace('.', ',') : '');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const w = Number(weight.replace(',', '.')) || null;
  const h = Number(height) || null;
  const b = bmi(w, h);
  const k = b ? kFromBmi(b) : preset.k;
  const live = useMemo(() => ({ ...cfg, k, w: 200 }), [cfg, k]);

  const set = (patch: Partial<FighterConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const choosePreset = (key: string) => {
    const p = PRESETS.find((x) => x.key === key)!;
    setPresetKey(key);
    setCfg(p.cfg);
    if (!initial.superMove) setSuperMove(p.move);
  };
  const toggleAcc = (a: string) => setCfg((c) => {
    let cur = [...(c.acc ?? [])] as string[];
    if (cur.includes(a)) cur = cur.filter((x) => x !== a);
    else {
      const excl: Record<string, string> = { glassesRound: 'glassesSquare', glassesSquare: 'glassesRound', headband: 'bandana', bandana: 'headband' };
      cur = cur.filter((x) => x !== excl[a]);
      cur.push(a);
    }
    return { ...c, acc: cur as FighterConfig['acc'] };
  });

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await saveFighter({
        presetKey, cfg, name, nickname, superMove, entrance, heightCm: h ?? 0, weighTime,
        weight: initial.firstTime && w ? w : undefined, next
      });
      if (res && !res.ok) setError(res.error);
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <header className="flex items-center gap-3 bg-encre px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="min-w-0 flex-1">
          <div className="label">Étape {step} sur 3</div>
          <h1 className="font-display text-[22px] leading-tight">{step === 1 ? 'Choisis ton combattant' : step === 2 ? 'Retouche-le à ton image' : 'Ta fiche de combat'}</h1>
        </div>
        {step > 1 ? <button className="pill" onClick={() => setStep((s) => (s - 1) as 1 | 2)}>Retour</button> : null}
      </header>

      <RingScene height={step === 1 ? 300 : 270} ropes={false} className="border-b-4 border-encre">
        <div className="absolute inset-x-0 bottom-[16px] flex justify-center"><Fighter cfg={live} title={`Aperçu : ${preset.name}`} /></div>
        <div className="absolute left-3 top-3 rounded-xl bg-encre px-3 py-2">
          <div className="font-display text-[20px] leading-none text-soleil">{step === 1 ? preset.name : nickname || preset.name}</div>
          <div className="mt-1 text-xs">{b ? `IMC ${String(b).replace('.', ',')} · ${stageLabel(b)}` : step === 1 ? preset.tag : 'Ta silhouette suivra ton IMC réel'}</div>
        </div>
      </RingScene>

      {step === 1 ? (
        <section className="grid grid-cols-3 gap-2 p-3">
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => choosePreset(p.key)} aria-pressed={p.key === presetKey}
              className={`flex flex-col overflow-hidden rounded-2xl border-[3px] text-left ${p.key === presetKey ? 'border-soleil bg-soleil text-encre' : 'border-encre bg-violet'}`}>
              <div className="sunset relative h-[92px] overflow-hidden">
                <div className="absolute left-1/2 top-[-2px] -ml-[52px]"><Fighter cfg={{ ...p.cfg, k: p.k, w: 104 }} /></div>
              </div>
              <span className="px-2 py-1.5 font-display text-[13px] leading-tight">{p.name}</span>
            </button>
          ))}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="flex flex-col gap-3 p-3">
          <nav className="grid grid-cols-4 gap-1.5" aria-label="Catégories">
            {TABS.map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t}
                className={`min-h-10 rounded-[10px] border-2 font-display text-[15px] ${tab === t ? 'border-encre bg-soleil text-encre' : 'border-prune bg-violet'}`}>{l}</button>
            ))}
          </nav>
          <div className="flex flex-col gap-4 px-1 pb-2">
            {tab === 'peau' && <Swatches title="Teinte de peau" opts={SKIN_OPTIONS} value={cfg.skin} onPick={(v) => set({ skin: v })} />}
            {tab === 'visage' && (<>
              <Pills title="Yeux" opts={EYES_OPTIONS} value={cfg.eyes ?? 'amande'} onPick={(v) => set({ eyes: v as FighterConfig['eyes'] })} />
              <Pills title="Nez" opts={NOSE_OPTIONS} value={cfg.nose ?? 'fin'} onPick={(v) => set({ nose: v as FighterConfig['nose'] })} />
              <Pills title="Lèvres" opts={LIPS_OPTIONS} value={cfg.lips ?? 'fines'} onPick={(v) => set({ lips: v as FighterConfig['lips'] })} />
            </>)}
            {tab === 'coiffure' && (<>
              <Pills title="Coupe" opts={HAIR_STYLE_OPTIONS} value={cfg.hairStyle ?? 'spiky'} onPick={(v) => set({ hairStyle: v as FighterConfig['hairStyle'] })} />
              <Swatches title="Couleur" opts={HAIR_COLOR_OPTIONS} value={cfg.hairColor} onPick={(v) => set({ hairColor: v })} />
            </>)}
            {tab === 'barbe' && <Pills title="Barbe et moustache" opts={BEARD_OPTIONS} value={cfg.beard ?? 'none'} onPick={(v) => set({ beard: v as FighterConfig['beard'] })} />}
            {tab === 'acc' && (
              <div className="flex flex-col gap-2"><span className="label">Accessoires (cumulables)</span>
                <div className="flex flex-wrap gap-1.5">{ACC_OPTIONS.map(([v, l]) => (
                  <button key={v} className="pill" aria-pressed={(cfg.acc ?? []).includes(v as never)} onClick={() => toggleAcc(v)}>{l}</button>
                ))}</div>
              </div>
            )}
            {tab === 'tenue' && (<>
              <Pills title="Style de combat" opts={OUTFIT_OPTIONS} value={cfg.outfit ?? 'boxe'}
                onPick={(v) => set({ outfit: v as FighterConfig['outfit'], main: undefined, top: undefined, bottom: undefined, glove: undefined, boot: undefined, trim: undefined })} />
              <Swatches title="Couleur principale" opts={MAIN_COLOR_OPTIONS.map(([c, l]) => [c, l, c])} value={cfg.main} onPick={(v) => set({ main: v, top: undefined, bottom: undefined, glove: undefined })} />
              {cfg.outfit === 'catch' ? <Pills title="Masque" opts={[['non', 'Sans masque'], ['oui', 'Masque de catch']]} value={cfg.mask ? 'oui' : 'non'} onPick={(v) => set({ mask: v === 'oui' })} /> : null}
              {(cfg.outfit ?? 'boxe') === 'boxe' && cfg.base !== 'B' ? <Pills title="Haut" opts={[['non', 'Torse nu'], ['oui', 'Débardeur']]} value={cfg.tank ? 'oui' : 'non'} onPick={(v) => set({ tank: v === 'oui' })} /> : null}
            </>)}
            {tab === 'age' && <Pills title="Âge" opts={AGE_OPTIONS} value={cfg.age ?? 'adulte'} onPick={(v) => set({ age: v as FighterConfig['age'] })} />}
            {tab === 'corps' && (<>
              <Pills title="Silhouette de base" opts={BASE_OPTIONS} value={cfg.base ?? 'A'} onPick={(v) => set({ base: v as 'A' | 'B' })} />
              <p className="text-sm text-lilas">La corpulence ne se choisit pas : elle suit ton IMC réel et s'affine quand ta tendance baisse.</p>
            </>)}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="flex flex-col gap-4 p-4">
          <Field label="Ton prénom" value={name} onChange={setName} placeholder="Marc" autoComplete="given-name" />
          <Field label="Surnom de combat" value={nickname} onChange={setNickname} placeholder="Le Bulldozer" />
          <Field label="Nom de ton coup spécial" value={superMove} onChange={setSuperMove} placeholder="La Raclette Volante" />
          <Field label="Phrase d'entrée sur le ring (facultatif)" value={entrance} onChange={setEntrance} placeholder="Ce soir, je mange léger… et toi aussi !" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Taille (cm)" value={height} onChange={setHeight} inputMode="numeric" placeholder="175" />
            <Field label="Heure de pesée" value={weighTime} onChange={setWeighTime} type="time" />
          </div>
          {initial.firstTime ? (
            <Field label="Ton poids ce matin (kg) : ta première pesée" value={weight} onChange={setWeight} inputMode="decimal" placeholder="82,4" />
          ) : null}
          <p className="text-[13px] text-lilas">Taille et poids ne sont jamais montrés aux autres en mode pudique : ils voient des %, des PV et ta silhouette.</p>
          {error ? <p role="alert" className="text-sm text-[#FF8FA3]">{error}</p> : null}
        </section>
      ) : null}

      <div className="sticky bottom-0 mt-auto border-t-2 border-violet bg-nuit px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        {step < 3 ? (
          <button className="btn btn-soleil w-full text-[22px]" onClick={() => setStep((s) => (s + 1) as 2 | 3)}>{step === 1 ? 'CHOISIR ET RETOUCHER' : 'C’EST MOI !'}</button>
        ) : (
          <button className="btn btn-soleil w-full text-[22px]" disabled={pending || !name || !height} onClick={submit}>{pending ? 'Enregistrement…' : 'MONTER SUR LE RING'}</button>
        )}
        {step === 1 ? <div className="mt-2 text-center"><Ribbon>12 PERSONNAGES · À RETOUCHER ENSUITE</Ribbon></div> : null}
      </div>
    </div>
  );
}

function Pills({ title, opts, value, onPick }: { title: string; opts: [string, string][]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label">{title}</span>
      <div className="flex flex-wrap gap-1.5">
        {opts.map(([v, l]) => <button key={v} className="pill" aria-pressed={value === v} onClick={() => onPick(v)}>{l}</button>)}
      </div>
    </div>
  );
}

function Swatches({ title, opts, value, onPick }: { title: string; opts: [string, string, string][]; value?: string; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label">{title}</span>
      <div className="flex flex-wrap gap-2.5">
        {opts.map(([v, l, c]) => (
          <button key={v} title={l} aria-label={l} aria-pressed={value === v} onClick={() => onPick(v)}
            className="size-11 rounded-full border-[3px] border-encre" style={{ background: c, boxShadow: value === v ? '0 0 0 3px #FFD23D' : 'none' }} />
        ))}
      </div>
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: 'numeric' | 'decimal'; autoComplete?: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label">{props.label}</span>
      <input className="field" value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder}
        type={props.type ?? 'text'} inputMode={props.inputMode} autoComplete={props.autoComplete} />
    </label>
  );
}
