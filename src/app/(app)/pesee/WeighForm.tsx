'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { submitWeighIn, type WeighState } from '@/app/actions/weigh';
import { Icon } from '@/components/ui';
import { play } from '@/lib/sound';

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const clamp = (n: number) => Math.min(350, Math.max(25, Math.round(n * 10) / 10));

export function WeighForm({ name, initial, last, existing, rivals, fightTime, late, photoWord, noBattle }: {
  name: string;
  initial: number;
  last: number | null;
  existing: { weight: number; editable: boolean } | null;
  rivals: string[];
  fightTime: string | null;
  late: string[];
  photoWord: string | null;
  noBattle: boolean;
}) {
  const [state, action, pending] = useActionState<WeighState, FormData>(submitWeighIn, {});
  const [w, setW] = useState(clamp(initial));
  const [text, setText] = useState(fmt(clamp(initial)));
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState(false);
  const set = (n: number) => { const v = clamp(n); setW(v); setText(fmt(v)); };
  const diff = last !== null ? Math.round((w - last) * 10) / 10 : null;

  if (existing && !existing.editable) {
    return (
      <section className="flex flex-col gap-4 px-4 py-5">
        <div className="card flex flex-col items-center gap-2 p-6 text-center">
          <Icon name="check" size={40} className="text-neon" />
          <div className="font-display text-[24px] text-soleil">Pesée du jour enregistrée</div>
          <div className="font-sans text-[44px] font-black italic leading-none">{fmt(existing.weight)} <span className="text-[22px]">kg</span></div>
          <p className="text-sm text-lilas">Seule la première pesée du jour compte. Reviens demain matin !</p>
        </div>
        <Link href="/pesee/coup" className="btn btn-soleil w-full text-[22px]">VOIR MON COUP</Link>
      </section>
    );
  }

  return (
    <form action={action} onSubmit={() => play('pesee')} className="flex flex-col gap-5 px-4 py-5">
      <h1 className="font-display text-[26px] leading-tight">{existing ? 'Tu corriges ta pesée,' : 'Ton coup t\'attend,'} <span className="text-soleil">{name}</span>.</h1>

      <div className="card flex flex-col items-center gap-3 p-5">
        <span className="label">Ta pesée du matin</span>
        <div className="flex w-full items-center justify-between gap-2">
          <button type="button" onClick={() => set(w - 0.1)} className="grid size-14 shrink-0 place-items-center rounded-full border-[3px] border-encre bg-violet-2 font-sans text-[30px] font-black shadow-[0_4px_0_#140A22]" aria-label="Retirer 100 grammes">−</button>
          {editing ? (
            <input
              autoFocus
              inputMode="decimal"
              className="w-[170px] rounded-xl border-[3px] border-soleil bg-encre text-center font-sans text-[52px] font-black italic leading-none text-creme"
              value={text}
              aria-label="Poids en kilos"
              onChange={(e) => { setText(e.target.value); const n = Number(e.target.value.replace(',', '.')); if (Number.isFinite(n) && n > 0) setW(clamp(n)); }}
              onBlur={() => { setEditing(false); setText(fmt(w)); }}
            />
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="font-sans text-[64px] font-black italic leading-none text-creme" aria-label={`${fmt(w)} kilos, toucher pour saisir`}>
              {fmt(w)}<span className="ml-1 text-[24px] not-italic text-lilas">kg</span>
            </button>
          )}
          <button type="button" onClick={() => set(w + 0.1)} className="grid size-14 shrink-0 place-items-center rounded-full border-[3px] border-encre bg-violet-2 font-sans text-[30px] font-black shadow-[0_4px_0_#140A22]" aria-label="Ajouter 100 grammes">+</button>
        </div>
        <input type="range" min={clamp(initial - 4)} max={clamp(initial + 4)} step={0.1} value={w} onChange={(e) => set(Number(e.target.value))}
          className="w-full accent-[#FFD23D]" aria-label="Ajuster le poids" />
        <p className="text-[13px] text-lilas">
          {last !== null ? <>Dernière pesée : <b className="text-creme">{fmt(last)} kg</b>{diff ? ` (${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff))})` : ''} · </> : null}
          glisse ou ajuste au gramme près
        </p>
        <input type="hidden" name="weight" value={String(w)} />
      </div>

      {rivals.length ? (
        <div className="card-line flex items-center gap-3 px-4 py-3">
          <Icon name="lock" className="shrink-0 text-soleil" />
          <div className="text-sm"><b>{rivals.join(', ')}</b> {rivals.length > 1 ? 'se sont déjà pesés' : "s'est déjà pesé(e)"}.<br />
            <span className="text-lilas">{fightTime ? `Résultat secret jusqu'à ${fightTime}.` : 'Résultat secret jusqu’au combat.'}</span></div>
        </div>
      ) : null}

      {late.length ? (
        <p role="note" className="rounded-xl border-2 border-orange bg-encre px-3 py-2 text-sm">
          Le combat du soir est déjà passé pour {late.join(', ')} : cette pesée comptera pour ta tendance et le combat de demain.
        </p>
      ) : null}
      {noBattle ? <p className="text-sm text-lilas">Tu n'as pas de battle en cours : ta pesée sert à suivre ta tendance et ta silhouette.</p> : null}

      <label className="flex flex-col gap-2">
        <span className="label">Un mot pour tes rivaux (facultatif)</span>
        <input className="field" name="comment" maxLength={140} placeholder="Ce soir, ça va cogner." />
      </label>

      {photoWord ? (
        <label className="flex flex-col gap-2">
          <span className="label">Photo de la balance (facultative)</span>
          <span className="text-[13px] text-lilas">Écris <b className="text-soleil">{photoWord}</b> sur un papier posé à côté de la balance.</span>
          <span className="btn btn-violet min-h-12 cursor-pointer text-base"><Icon name={photo ? 'check' : 'camera'} size={18} /> {photo ? 'Photo prête' : 'Prendre la photo'}
            <input type="file" name="photo" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(!!e.target.files?.length)} />
          </span>
        </label>
      ) : null}

      {state.error ? <p role="alert" className="text-sm text-[#FF8FA3]">{state.error}</p> : null}
      <button className="btn btn-soleil w-full text-[24px]" disabled={pending}>{pending ? 'Pesée…' : existing ? 'CORRIGER MA PESÉE' : 'VALIDER MA PESÉE'}</button>
      <p className="text-center text-[13px] text-lilas">Seule la première pesée du jour compte. Correction possible pendant 10 min.</p>
    </form>
  );
}
