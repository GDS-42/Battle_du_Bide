import Link from 'next/link';
import type { BmiView } from '@/lib/engine/silhouette';

const kg = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Palier à tracer sur la courbe du joueur (voir WeightChart). */
export function chartTarget(view: BmiView | null): { weight: number; label: string } | null {
  return view?.step ? { weight: view.step.weight, label: `IMC ${view.step.bmi}` } : null;
}

/**
 * IMC du joueur en clair, prochain palier et chemin parcouru depuis son poids de départ.
 * Réservé aux écrans que le joueur est seul à voir : ni l'IMC ni sa catégorie ne sont montrés aux rivaux.
 */
export function BmiTarget({ view, start }: { view: BmiView; start: number | null }) {
  const s = view.step;
  const pct = s?.progress !== null && s?.progress !== undefined ? Math.round(s.progress * 100) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex flex-wrap items-baseline gap-x-2 leading-snug">
        <b className="font-sans text-[19px] font-black italic text-creme">IMC {kg(view.bmi)}</b>
        <span className="text-[14px] text-lilas">{view.category}</span>
      </p>
      {s ? (
        <>
          <p className="text-[14px] leading-snug">Prochain palier : <b className="text-soleil">IMC {s.bmi}, à {kg(s.weight)}&nbsp;kg</b></p>
          {pct !== null && start !== null ? (
            <div role="img" aria-label={`Du départ, ${kg(start)} kg, au palier, ${kg(s.weight)} kg : ${pct} % du chemin parcouru`}>
              <div className="h-3 overflow-hidden rounded-full border-2 border-encre bg-violet-2">
                <div className="h-full rounded-full bg-soleil" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-lilas"><span>Départ {kg(start)}</span><span>Palier {kg(s.weight)}</span></div>
            </div>
          ) : null}
          <p className="text-[13px] text-lilas">Encore <b className="text-creme">{kg(s.left)}&nbsp;kg</b>.</p>
        </>
      ) : view.low ? (
        <p className="text-[14px] leading-snug">
          Ton IMC est sous 18,5. Le jeu ne remplace pas un médecin : parles-en à un professionnel de santé.
        </p>
      ) : (
        <p className="text-[14px] leading-snug"><b className="text-soleil">Forme équilibrée</b> : plus de palier à franchir, l'objectif est de tenir.</p>
      )}
      <Link href="/aide#imc" className="self-start text-[13px] font-bold text-soleil underline">C'est quoi, l'IMC ?</Link>
    </div>
  );
}
