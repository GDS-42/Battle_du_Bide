import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon, Ribbon, TopBar } from '@/components/ui';

export const metadata: Metadata = { title: 'Pourquoi ça marche ?' };

type IconName = Parameters<typeof Icon>[0]['name'];
interface Source { label: string; doi?: string }
interface Lever { icon: IconName; question: string; answer: string; sources: Source[] }

// Version courte, pour les joueurs, de docs/05-moteurs-psychologiques.md : mêmes ressorts, mêmes sources, mêmes réserves.
// Le document garde le détail (niveaux de preuve, limites) ; ici, une question et une réponse en deux phrases.
// Si une règle du jeu change, les deux se mettent à jour ensemble.
const LEVERS: Lever[] = [
  {
    icon: 'scale', question: 'Pourquoi te peser tous les matins ?',
    answer: 'Parce que suivre régulièrement où on en est aide à tenir un objectif, surtout quand d’autres le voient. De tout le jeu, c’est le geste le mieux prouvé. Et la tendance lissée t’évite de paniquer pour 300 g d’eau.',
    sources: [{ label: 'Harkin et al., 2016', doi: '10.1037/bul0000025' }, { label: 'Steinberg et al., 2013', doi: '10.1002/oby.20396' }]
  },
  {
    icon: 'clock', question: 'Pourquoi le combat a lieu le soir même ?',
    answer: 'Parce qu’on préfère ce qui arrive tout de suite. Maigrir paie dans trois mois ; ton coup, lui, part ce soir.',
    sources: [{ label: 'Ainslie, 1975', doi: '10.1037/h0076860' }]
  },
  {
    icon: 'calendar', question: 'Pourquoi repartir à 100 PV chaque semaine ?',
    answer: 'Parce qu’un nouveau départ redonne de l’élan. Une mauvaise semaine ne plombe pas la suivante.',
    sources: [{ label: 'Dai, Milkman & Riis, 2014', doi: '10.1287/mnsc.2014.1901' }]
  },
  {
    icon: 'glove', question: 'Pourquoi une barre de vie plutôt qu’un score ?',
    answer: 'Parce que perdre fait environ deux fois plus mal que gagner ne fait plaisir. On te donne 100 PV : à toi de les garder.',
    sources: [{ label: 'Kahneman & Tversky, 1979', doi: '10.2307/1914185' }, { label: 'Patel et al., 2016', doi: '10.7326/M15-1635' }]
  },
  {
    icon: 'bell', question: 'Pourquoi choisir ton heure de pesée ?',
    answer: 'Parce que décider d’avance « quand et où » augmente nettement les chances de le faire. Le rappel fait le reste.',
    sources: [{ label: 'Gollwitzer & Sheeran, 2006', doi: '10.1016/S0065-2601(06)38002-1' }]
  },
  {
    icon: 'fire', question: 'Pourquoi une garde qui sauve ta série ?',
    answer: 'Parce qu’une habitude s’installe en la répétant, en deux mois environ, et qu’une série réparable tient mieux qu’une série qui casse au premier oubli.',
    sources: [{ label: 'Lally et al., 2010', doi: '10.1002/ejsp.674' }, { label: 'Silverman & Barasch, 2023', doi: '10.1093/jcr/ucac029' }]
  },
  {
    icon: 'user', question: 'Pourquoi te battre contre tes potes ?',
    answer: 'Parce que dans un grand essai sur la marche, la compétition a fait bouger plus que l’entraide, et son effet a duré après l’arrêt. En équipe, on se donne plus quand l’autre compte sur nous.',
    sources: [{ label: 'Patel et al., 2019', doi: '10.1001/jamainternmed.2019.3505' }, { label: 'Hertel, Kerr & Messé, 2000', doi: '10.1037/0022-3514.79.4.580' }]
  },
  {
    icon: 'coins', question: 'Pourquoi un gage ou une cagnotte ?',
    answer: 'Parce que s’engager devant ses potes rend l’abandon plus coûteux. L’effet s’arrête avec l’enjeu : d’où la ceinture à défendre, et la revanche.',
    sources: [{ label: 'Bryan, Karlan & Nelson, 2010', doi: '10.1146/annurev.economics.102308.124324' }, { label: 'Kullgren et al., 2013', doi: '10.7326/0003-4819-158-7-201304020-00002' }]
  },
  {
    icon: 'ring', question: 'Pourquoi un rendez-vous à heure fixe ?',
    answer: 'Parce qu’un moment partagé soude un groupe. Chacun sur son téléphone, c’est moins sûr : là, on tente.',
    sources: [{ label: 'Collins, 2004, Interaction Ritual Chains' }]
  },
  {
    icon: 'laugh', question: 'Pourquoi on ne se moque jamais du corps ?',
    answer: 'Parce que se chambrer entre proches rapproche, alors que se moquer du poids fait du mal et ne fait pas maigrir.',
    sources: [{ label: 'Keltner et al., 2001', doi: '10.1037/0033-2909.127.2.229' }, { label: 'Puhl & Heuer, 2010', doi: '10.2105/AJPH.2009.159491' }]
  }
];

/** Espaces insécables de la typographie française : un « ? » ou un « : » ne passe jamais seul à la ligne. */
const nb = (text: string) => text.replace(/ ([?!:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');

/** Les ressorts de motivation derrière les règles, en dix questions : public, comme le mode d'emploi. */
export default function RessortsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <TopBar back="/aide" kicker="MODE D'EMPLOI" title="Pourquoi ça marche ?" />

      <section className="flex flex-col gap-4 px-4 pb-[calc(env(safe-area-inset-bottom)+32px)] pt-5">
        <div className="card flex flex-col gap-3 p-4">
          <Ribbon className="self-start">EN BREF</Ribbon>
          <p className="font-display text-[22px] leading-tight">Le jeu n’a rien inventé.</p>
          <p className="text-[15px] leading-snug">
            Chaque règle reprend une idée que des chercheurs ont étudiée. Dix questions, dix réponses courtes, et la source pour les curieux.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {LEVERS.map((l) => (
            <li key={l.question} className="card-line flex gap-3 px-3.5 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-encre text-soleil"><Icon name={l.icon} size={21} /></span>
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="font-display text-[18px] leading-tight text-soleil">{nb(l.question)}</h2>
                <p className="text-[15px] leading-snug">{nb(l.answer)}</p>
                <p className="text-[12px] leading-snug text-lilas">
                  {l.sources.map((s, i) => (
                    <span key={s.label}>
                      {i ? ' · ' : ''}
                      {s.doi ? <a className="underline" href={`https://doi.org/${s.doi}`} target="_blank" rel="noreferrer">{s.label}</a> : s.label}
                    </span>
                  ))}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="card flex flex-col gap-2 p-4">
          <h2 className="font-display text-[20px] leading-tight">En toute honnêteté</h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-snug">
            <li>
              Un jeu ne fait pas maigrir à lui seul (
              <a className="underline" href="https://doi.org/10.1007/s11606-018-4552-1" target="_blank" rel="noreferrer">Kurtzman et al., 2018</a>).
              Le nôtre vise plus simple : t’aider à tenir la pesée du matin.
            </li>
            <li>Ces règles s’inspirent de la recherche ; elles n’ont pas été testées dans ce jeu.</li>
            <li>Le jeu ne remplace pas un médecin. Si ton poids t’inquiète, parles-en à un professionnel de santé.</li>
          </ul>
        </div>

        <Link href="/aide" className="text-center text-[15px] font-bold text-lilas underline">Retour au mode d’emploi</Link>
      </section>
    </main>
  );
}
