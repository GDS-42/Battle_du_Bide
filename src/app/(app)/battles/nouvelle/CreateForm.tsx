'use client';
import { useActionState, useState } from 'react';
import { createBattle, type CreateState } from '@/app/actions/battle';
import { prettyDate } from '@/lib/time';

const FORMATS = [
  { v: 'duel', t: 'Duel', d: 'Un contre un, le format roi.' },
  { v: 'tournoi', t: 'Tournoi', d: '3 à 8 joueurs, un adversaire par semaine.' },
  { v: 'equipes', t: 'Équipes', d: 'Binômes : couples contre couples, potes contre potes.' }
] as const;

export function CreateForm({ mondays, defaultName }: { mondays: string[]; defaultName: string }) {
  const [state, action, pending] = useActionState<CreateState, FormData>(createBattle, {});
  const [format, setFormat] = useState<'duel' | 'tournoi' | 'equipes'>('duel');
  const [stake, setStake] = useState<'gage' | 'cagnotte' | 'aucun'>('gage');
  return (
    <form action={action} className="flex flex-col gap-6 px-4 py-4">
      <Section title="Nom de la battle">
        <input className="field" name="name" defaultValue={defaultName} maxLength={40} required />
      </Section>

      <Section title="Format">
        <div className="grid gap-2">
          {FORMATS.map((f) => (
            <label key={f.v} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-[3px] p-3 ${format === f.v ? 'border-soleil bg-soleil text-encre' : 'border-encre bg-violet'}`}>
              <input type="radio" name="format" value={f.v} checked={format === f.v} onChange={() => setFormat(f.v)} className="sr-only" />
              <span className="font-display text-[20px]">{f.t}</span><span className="text-sm">{f.d}</span>
            </label>
          ))}
        </div>
        {format === 'tournoi' ? (
          <Select name="maxPlayers" label="Joueurs maximum" options={[3, 4, 5, 6, 7, 8].map((n) => [String(n), `${n} joueurs`])} defaultValue="8" />
        ) : format === 'equipes' ? (
          <>
            <Select name="maxPlayers" label="Nombre d'équipes de 2" options={[['4', '2 équipes'], ['6', '3 équipes'], ['8', '4 équipes']]} defaultValue="4" />
            <div className="grid grid-cols-2 gap-2">
              <input className="field" name="team1" placeholder="Équipe 1 (ton équipe)" maxLength={24} />
              <input className="field" name="team2" placeholder="Équipe 2" maxLength={24} />
            </div>
          </>
        ) : <input type="hidden" name="maxPlayers" value="2" />}
      </Section>

      <Section title="Durée et horaires">
        <Select name="rounds" label="Durée" options={[['4', '4 semaines'], ['8', '8 semaines (conseillé)'], ['12', '12 semaines']]} defaultValue="8" />
        <Select name="startDate" label="Premier round" options={mondays.map((d) => [d, prettyDate(d)])} defaultValue={mondays[mondays.length > 1 ? 1 : 0]} />
        <label className="flex flex-col gap-2"><span className="label">Heure du combat du soir</span>
          <input className="field" type="time" name="fightTime" defaultValue="21:00" required /></label>
        <p className="text-[13px] text-lilas">D'ici le premier lundi, c'est l'échauffement : les pesées servent à fixer ton poids de départ.</p>
      </Section>

      <Section title="Enjeu">
        <div className="flex flex-wrap gap-1.5">
          {([['gage', 'Un gage'], ['cagnotte', 'Une cagnotte'], ['aucun', "Pour l'honneur"]] as const).map(([v, l]) => (
            <button type="button" key={v} className="pill" aria-pressed={stake === v} onClick={() => setStake(v)}>{l}</button>
          ))}
        </div>
        {stake === 'gage' ? <input className="field" name="stakeText" placeholder="Le perdant paie le resto" maxLength={120} /> : null}
        {stake === 'cagnotte' ? (
          <div className="grid gap-3">
            <label className="flex flex-col gap-2"><span className="label">Mise par joueur (€)</span>
              <input className="field" name="potEuros" type="number" min={1} max={1000} step={1} defaultValue={20} /></label>
            <Select name="potMode" label="Qui gagne la cagnotte ?" options={[['objectif', 'Ceux qui atteignent l’objectif (conseillé)'], ['winner', 'Le vainqueur rafle tout']]} defaultValue="objectif" />
            <label className="flex flex-col gap-2"><span className="label">Objectif commun (% du poids de départ)</span>
              <input className="field" name="potObjective" type="number" min={1} max={30} step={0.5} defaultValue={5} /></label>
            <p className="text-[13px] text-lilas">L'app note les mises et calcule qui doit quoi à qui. Vous vous payez entre vous (Lydia, Wero, espèces).</p>
          </div>
        ) : null}
      </Section>

      <Section title="Ambiance">
        <Select name="privacy" label="Confidentialité" options={[['pudique', 'Pudique : on voit des %, jamais de kilos'], ['transparent', 'Transparent : les kilos sont visibles']]} defaultValue="pudique" />
        <Select name="tone" label="Ton du commentateur" options={[['bon', 'Bon enfant'], ['trash', 'Trash talk (entre potes)']]} defaultValue="bon" />
        <label className="flex items-center gap-3 text-[15px]">
          <input type="checkbox" name="photoProof" className="size-5 accent-[#FFD23D]" /> Photo de la balance en option, avec le « mot du jour »
        </label>
      </Section>

      {state.error ? <p role="alert" className="text-sm text-[#FF8FA3]">{state.error}</p> : null}
      <button className="btn btn-soleil w-full text-[24px]" disabled={pending}>{pending ? 'Ouverture…' : 'OUVRIR LE RING'}</button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="flex flex-col gap-3"><legend className="mb-1 font-display text-[20px] text-soleil">{title}</legend>{children}</fieldset>;
}

function Select({ name, label, options, defaultValue }: { name: string; label: string; options: (readonly [string, string])[]; defaultValue?: string }) {
  return (
    <label className="flex flex-col gap-2"><span className="label">{label}</span>
      <select className="field" name={name} defaultValue={defaultValue}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
