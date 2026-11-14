import type { Metadata } from 'next';
import Link from 'next/link';
import { Ribbon, TopBar } from '@/components/ui';

export const metadata: Metadata = { title: 'Pourquoi ces règles ?' };

type Level = 'solide' | 'plausible' | 'pari';
interface Source { label: string; doi?: string }
interface Lever { rule: string; why: string; level: Level; note?: string; sources: Source[] }

const LEVELS: Record<Level, { label: string; cls: string; meaning: string }> = {
  solide: { label: 'Solide', cls: 'bg-[#2E9E6B] text-creme', meaning: 'mesuré dans des essais, sur un comportement proche' },
  plausible: { label: 'Plausible', cls: 'bg-soleil text-encre', meaning: 'idée sérieuse, jamais testée dans un jeu comme celui-ci' },
  pari: { label: 'Pari', cls: 'bg-orange text-encre', meaning: 'une intuition de conception' }
};

// Version courte, pour les joueurs, de docs/05-moteurs-psychologiques.md : mêmes ressorts, mêmes sources, mêmes réserves.
// Si une règle du jeu change, les deux se mettent à jour ensemble.
const LEVERS: Lever[] = [
  {
    rule: 'Te peser chaque matin',
    why: 'Suivre régulièrement où on en est aide à tenir un objectif, surtout quand c’est noté et que d’autres le voient. C’est le geste le mieux étayé de tout le jeu. La tendance lissée, elle, évite de juger sur les caprices de la balance.',
    level: 'solide',
    sources: [{ label: 'Harkin et al., 2016', doi: '10.1037/bul0000025' }, { label: 'Steinberg et al., 2013', doi: '10.1002/oby.20396' }]
  },
  {
    rule: 'Le combat a lieu le soir même',
    why: 'On donne bien plus de poids à ce qui arrive tout de suite qu’à un bénéfice lointain. Maigrir paie dans trois mois ; ton coup, lui, part ce soir.',
    level: 'plausible',
    sources: [{ label: 'Ainslie, 1975', doi: '10.1037/h0076860' }]
  },
  {
    rule: 'Chaque semaine, un nouveau round',
    why: 'Les débuts (de semaine, de mois) redonnent de l’élan. Chaque round repart à 100 PV : une mauvaise semaine ne plombe pas la suivante.',
    level: 'plausible',
    sources: [{ label: 'Dai, Milkman & Riis, 2014', doi: '10.1287/mnsc.2014.1901' }]
  },
  {
    rule: 'Une barre de vie à défendre',
    why: 'Perdre pèse environ deux fois plus lourd que gagner. On te donne 100 PV, et tu te bats pour les garder.',
    level: 'plausible',
    sources: [{ label: 'Kahneman & Tversky, 1979', doi: '10.2307/1914185' }, { label: 'Patel et al., 2016', doi: '10.7326/M15-1635' }]
  },
  {
    rule: 'Ton heure de pesée, et son rappel',
    why: 'Décider d’avance « quand et où » augmente les chances de passer à l’action. Un rappel au bon moment fait le reste.',
    level: 'solide',
    sources: [{ label: 'Gollwitzer & Sheeran, 2006', doi: '10.1016/S0065-2601(06)38002-1' }]
  },
  {
    rule: 'La série, et la garde qui la sauve',
    why: 'Une habitude se forme en la répétant, en deux mois environ (c’est très variable d’une personne à l’autre). Et une série qu’on peut réparer tient mieux qu’une série qui casse au premier oubli.',
    level: 'plausible',
    sources: [{ label: 'Lally et al., 2010', doi: '10.1002/ejsp.674' }, { label: 'Silverman & Barasch, 2023', doi: '10.1093/jcr/ucac029' }]
  },
  {
    rule: 'Le duel entre potes, les équipes',
    why: 'Dans un grand essai, la compétition a fait bouger davantage que l’entraide ou le simple soutien, et c’est la seule dont l’effet a duré après l’arrêt. En équipe, on en fait plus quand le résultat dépend de soi.',
    level: 'solide',
    note: 'mesuré sur des pas, pas sur des kilos',
    sources: [{ label: 'Patel et al., 2019', doi: '10.1001/jamainternmed.2019.3505' }, { label: 'Hertel, Kerr & Messé, 2000', doi: '10.1037/0022-3514.79.4.580' }]
  },
  {
    rule: 'Le gage ou la cagnotte',
    why: 'S’engager devant les autres rend l’abandon plus coûteux. L’effet est réel, mais il s’arrête avec l’enjeu : d’où la ceinture à défendre et la revanche.',
    level: 'plausible',
    sources: [{ label: 'Bryan, Karlan & Nelson, 2010', doi: '10.1146/annurev.economics.102308.124324' }, { label: 'Kullgren et al., 2013', doi: '10.7326/0003-4819-158-7-201304020-00002' }]
  },
  {
    rule: 'Le rendez-vous du soir',
    why: 'Un moment partagé, à heure fixe, soude un groupe. Sur un téléphone, chacun de son côté, ce n’est qu’une analogie : on tente.',
    level: 'pari',
    sources: [{ label: 'Collins, 2004, Interaction Ritual Chains' }]
  },
  {
    rule: 'On chambre le joueur, jamais le corps',
    why: 'Se taquiner entre proches rapproche. Se moquer du poids fait du mal et ne fait pas maigrir : le jeu se l’interdit.',
    level: 'solide',
    sources: [{ label: 'Keltner et al., 2001', doi: '10.1037/0033-2909.127.2.229' }, { label: 'Puhl & Heuer, 2010', doi: '10.2105/AJPH.2009.159491' }]
  }
];

function Chip({ level }: { level: Level }) {
  const l = LEVELS[level];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[.08em] ${l.cls}`}>{l.label}</span>;
}

/** Les ressorts de motivation derrière les règles, en deux lignes chacun : public, comme le mode d'emploi. */
export default function RessortsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <TopBar back="/aide" kicker="MODE D'EMPLOI" title="Pourquoi ces règles ?" />

      <section className="flex flex-col gap-4 px-4 pb-[calc(env(safe-area-inset-bottom)+32px)] pt-5">
        <div className="card flex flex-col gap-3 p-4">
          <Ribbon className="self-start">EN BREF</Ribbon>
          <p className="text-[16px] leading-snug">
            Le jeu n’a rien inventé. Chaque règle s’appuie sur un ressort de motivation que des chercheurs ont étudié. Voici les principaux, avec leur source.
          </p>
          <ul className="flex flex-col gap-1.5 text-[14px] leading-snug text-lilas">
            {(Object.keys(LEVELS) as Level[]).map((k) => (
              <li key={k} className="flex items-baseline gap-2"><Chip level={k} /><span>{LEVELS[k].meaning}.</span></li>
            ))}
          </ul>
        </div>

        <ol className="flex flex-col gap-3">
          {LEVERS.map((l) => (
            <li key={l.rule} className="card-line flex flex-col gap-1.5 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-[19px] leading-tight text-soleil">{l.rule}</h2>
                <Chip level={l.level} />
              </div>
              <p className="text-[15px] leading-snug">{l.why}</p>
              <p className="text-[12px] leading-snug text-lilas">
                {l.note ? <>{l.note[0].toUpperCase() + l.note.slice(1)}. </> : null}
                {l.sources.length > 1 ? 'Sources : ' : 'Source : '}
                {l.sources.map((s, i) => (
                  <span key={s.label}>
                    {i ? ' · ' : ''}
                    {s.doi ? <a className="underline" href={`https://doi.org/${s.doi}`} target="_blank" rel="noreferrer">{s.label}</a> : s.label}
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ol>

        <div className="card flex flex-col gap-2 p-4">
          <h2 className="font-display text-[20px] leading-tight">Ce que ça ne promet pas</h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-snug">
            <li>
              Un jeu ne fait pas maigrir à lui seul. Dans un essai, ajouter des points et des niveaux à la pesée n’a pas fait perdre plus de poids que la pesée seule (
              <a className="underline" href="https://doi.org/10.1007/s11606-018-4552-1" target="_blank" rel="noreferrer">Kurtzman et al., 2018</a>).
              Notre pari est plus modeste : t’aider à tenir la pesée du matin.
            </li>
            <li>Aucune de ces règles n’a été testée dans ce jeu : elles s’inspirent de la recherche, elles n’en sont pas la preuve.</li>
            <li>Le jeu ne remplace pas un médecin. Si ton poids t’inquiète, parles-en à un professionnel de santé.</li>
          </ul>
        </div>

        <Link href="/aide" className="text-center text-[15px] font-bold text-lilas underline">Retour au mode d’emploi</Link>
      </section>
    </main>
  );
}
