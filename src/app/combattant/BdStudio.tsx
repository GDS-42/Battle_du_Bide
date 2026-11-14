'use client';
import { useState, useTransition } from 'react';
import { BdFace, BdFighter } from '@/components/BdFighter';
import { RingScene, Ribbon } from '@/components/ui';
import { saveFighter } from '@/app/actions/fighter';
import { bmi, stageLabel } from '@/lib/engine/silhouette';
import { BD_CAST, BD_KEYS, paletteFor } from '@/lib/fighter/bd';
import type { BdKey, SpriteLook } from '@/lib/fighter/types';
import type { StudioInitial } from './FighterStudio';

/**
 * Studio des combattants dessinés : on choisit son combattant masqué et sa couleur (masque, tenue et gants),
 * puis on remplit sa fiche de combat. L'enregistrement n'envoie que ce choix : le serveur l'ajoute au réglage
 * existant du joueur, sans rien effacer.
 */
export function BdStudio({ initial, look, next }: { initial: StudioInitial; look: { bd: BdKey; color: string }; next: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [bd, setBd] = useState<BdKey>(look.bd);
  const [color, setColor] = useState(look.color);
  const [name, setName] = useState(initial.name);
  const [nickname, setNickname] = useState(initial.nickname);
  const [superMove, setSuperMove] = useState(initial.superMove || BD_CAST[look.bd].move);
  const [entrance, setEntrance] = useState(initial.entrance);
  const [height, setHeight] = useState(initial.heightCm ? String(initial.heightCm) : '');
  const [weighTime, setWeighTime] = useState(initial.weighTime || '07:30');
  const [weight, setWeight] = useState(initial.weight ? String(initial.weight).replace('.', ',') : '');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const info = BD_CAST[bd];
  const palette = paletteFor(bd);
  const w = Number(weight.replace(',', '.')) || null;
  const h = Number(height) || null;
  const b = bmi(w, h);
  const same = (x: string, y: string) => x.toLowerCase() === y.toLowerCase();
  const shown: SpriteLook = { who: bd, color: same(color, info.color) ? null : color };

  const choose = (key: BdKey) => {
    // Le coup spécial proposé suit le combattant, tant que le joueur n'a pas écrit le sien.
    if (!initial.superMove && superMove === BD_CAST[bd].move) setSuperMove(BD_CAST[key].move);
    // La couleur du liseré d'un combattant n'est pas proposée pour lui : on revient alors à sa couleur d'origine.
    if (!paletteFor(key).some(([c]) => same(c, color))) setColor(BD_CAST[key].color);
    setBd(key);
  };

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await saveFighter({
        look: { bd, bdColor: color }, name, nickname, superMove, entrance, heightCm: h ?? 0, weighTime,
        weight: initial.firstTime && w ? w : undefined, next
      });
      if (res && !res.ok) setError(res.error);
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <header className="flex items-center gap-3 bg-encre px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="min-w-0 flex-1">
          <div className="label">Étape {step} sur 2</div>
          <h1 className="font-display text-[22px] leading-tight">{step === 1 ? 'Choisis ton combattant' : 'Ta fiche de combat'}</h1>
        </div>
        {step > 1 ? <button className="pill" onClick={() => setStep(1)}>Retour</button> : null}
      </header>

      <RingScene height={step === 1 ? 300 : 270} ropes={false} className="border-b-4 border-encre">
        <div className="absolute inset-x-0 bottom-[16px] flex justify-center"><BdFighter look={shown} pose="garde" w={200} title={`Aperçu : ${info.name}`} /></div>
        <div className="absolute left-3 top-3 rounded-xl bg-encre px-3 py-2">
          <div className="font-display text-[20px] leading-none text-soleil">{step === 1 ? info.name : nickname || info.name}</div>
          <div className="mt-1 text-xs">{b ? `IMC ${String(b).replace('.', ',')} · ${stageLabel(b)}` : info.tag}</div>
        </div>
        <div className="absolute right-3 top-3 overflow-hidden rounded-xl border-[3px] border-encre bg-violet-2">
          <BdFace look={shown} expr="defi" size={84} flip />
        </div>
      </RingScene>

      {step === 1 ? (
        <section className="flex flex-col gap-4 p-3">
          <div className="grid grid-cols-3 gap-2">
            {BD_KEYS.map((key) => (
              <button key={key} onClick={() => choose(key)} aria-pressed={key === bd}
                className={`flex flex-col overflow-hidden rounded-2xl border-[3px] text-left ${key === bd ? 'border-soleil bg-soleil text-encre' : 'border-encre bg-violet'}`}>
                <div className="sunset relative h-[104px] overflow-hidden">
                  <div className="absolute left-1/2 top-[6px] -ml-[52px]"><BdFighter look={{ who: key, color: null }} pose="garde" w={104} /></div>
                </div>
                <span className="px-2 pt-1.5 font-display text-[14px] leading-tight">{BD_CAST[key].name}</span>
                <span className={`px-2 pb-1.5 text-[11px] leading-tight ${key === bd ? 'text-encre' : 'text-lilas'}`}>{BD_CAST[key].tag}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 px-1">
            <span className="label">Sa couleur : masque, tenue et gants</span>
            <div className="flex flex-wrap gap-2.5">
              {palette.map(([c, l]) => (
                <button key={c} title={l} aria-label={l} aria-pressed={same(color, c)} onClick={() => setColor(c)}
                  className="size-11 rounded-full border-[3px] border-encre" style={{ background: c, boxShadow: same(color, c) ? '0 0 0 3px #FFD23D' : '0 0 0 1px rgba(205,184,240,.45)' }} />
              ))}
            </div>
          </div>
          <p className="px-1 text-sm text-lilas">Tous les combattants sont masqués : on se reconnaît à son masque et à sa couleur. Ta silhouette réelle, elle, se suit sur ta courbe et à chaque « Transformation ! ».</p>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="flex flex-col gap-4 p-4">
          <Field label="Ton prénom" value={name} onChange={setName} placeholder="Marc" autoComplete="given-name" />
          <Field label="Surnom de combat" value={nickname} onChange={setNickname} placeholder={info.name} />
          <Field label="Nom de ton coup spécial" value={superMove} onChange={setSuperMove} placeholder={info.move} />
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
        {step === 1 ? (
          <button className="btn btn-soleil w-full text-[22px]" onClick={() => setStep(2)}>C’EST MOI !</button>
        ) : (
          <button className="btn btn-soleil w-full text-[22px]" disabled={pending || !name || !height} onClick={submit}>{pending ? 'Enregistrement…' : 'MONTER SUR LE RING'}</button>
        )}
        {step === 1 ? <div className="mt-2 text-center"><Ribbon>3 COMBATTANTS MASQUÉS · 7 COULEURS</Ribbon></div> : null}
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
