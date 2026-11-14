import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon, Ribbon, TopBar } from '@/components/ui';

export const metadata: Metadata = { title: 'Pourquoi ça marche ?' };

type IconName = Parameters<typeof Icon>[0]['name'];
type Level = 'solide' | 'plausible' | 'pari';
interface Source { label: string; doi?: string }
interface Lever { icon: IconName; rule: string; why: string; level: Level; note?: string; sources: Source[] }

const LEVELS: Record<Level, { label: string; cls: string; meaning: string }> = {
  solide: { label: 'Solide', cls: 'bg-[#2E9E6B] text-creme', meaning: 'mesuré dans des essais' },
  plausible: { label: 'Plausible', cls: 'bg-soleil text-encre', meaning: 'idée sérieuse, pas encore testée dans un jeu' },
  pari: { label: 'Pari', cls: 'bg-orange text-encre', meaning: 'notre intuition' }
};

// Version courte, pour les joueurs, de docs/05-moteurs-psychologiques.md : mêmes ressorts, mêmes sources, mêmes réserves.
// Si une règle du jeu change, les deux se mettent à jour ensemble.
const LEVERS: Lever[] = [
  {
    icon: 'scale', rule: 'Te peser chaque matin', level: 'solide',
    why: 'Mesurer régulièrement où on en est aide à tenir un objectif, surtout quand d’autres le voient. C’est le geste le mieux prouvé de tout le jeu. Et la tendance lissée t’évite de paniquer pour 300 g d’eau.',
    sources: [{ label: 'Harkin et al., 2016', doi: '10.1037/bul0000025' }, { label: 'Steinberg et al., 2013', doi: '10.1002/oby.20396' }]
  },
  {
    icon: 'clock', rule: 'Le combat, le soir même', level: 'plausible',
    why: 'On préfère ce qui arrive tout de suite. Maigrir paie dans trois mois ; ton coup, lui, part ce soir.',
    sources: [{ label: 'Ainslie, 1975', doi: '10.1037/h0076860' }]
  },
  {
    icon: 'calendar', rule: 'Chaque semaine, un nouveau round', level: 'plausible',
    why: 'Un début de semaine redonne de l’élan. Chaque round repart à 100 PV : une mauvaise semaine ne plombe pas la suivante.',
    sources: [{ label: 'Dai, Milkman & Riis, 2014', doi: '10.1287/mnsc.2014.1901' }]
  },
  {
    icon: 'glove', rule: 'Une barre de vie à défendre', level: 'plausible',
    why: 'Perdre fait environ deux fois plus mal que gagner ne fait plaisir. On te donne 100 PV : à toi de les garder.',
    sources: [{ label: 'Kahneman & Tversky, 1979', doi: '10.2307/1914185' }, { label: 'Patel et al., 2016', doi: '10.7326/M15-1635' }]
  },
  {
    icon: 'bell', rule: 'Ton heure de pesée, et son rappel', level: 'solide',
    why: 'Décider d’avance « quand et où » augmente nettement les chances de le faire. Le rappel fait le reste.',
    sources: [{ label: 'Gollwitzer & Sheeran, 2006', doi: '10.1016/S0065-2601(06)38002-1' }]
  },
  {
    icon: 'fire', rule: 'La série, et la garde qui la sauve', level: 'plausible',
    why: 'Une habitude s’installe en la répétant, en deux mois environ. Et une série qu’on peut réparer tient mieux qu’une série qui casse au premier oubli.',
    sources: [{ label: 'Lally et al., 2010', doi: '10.1002/ejsp.674' }, { label: 'Silverman & Barasch, 2023', doi: '10.1093/jcr/ucac029' }]
  },
  {
    icon: 'user', rule: 'Le duel entre potes, les équipes', level: 'solide', note: 'mesuré sur des pas, pas sur des kilos',
    why: 'Dans un grand essai, la compétition a fait bouger plus que l’entraide, et son effet a duré après l’arrêt. En équipe, on se donne plus quand l’autre compte sur nous.',
    sources: [{ label: 'Patel et al., 2019', doi: '10.1001/jamainternmed.2019.3505' }, { label: 'Hertel, Kerr & Messé, 2000', doi: '10.1037/0022-3514.79.4.580' }]
  },
  {
    icon: 'coins', rule: 'Le gage ou la cagnotte', level: 'plausible',
    why: 'S’engager devant ses potes rend l’abandon plus coûteux. L’effet s’arrête avec l’enjeu : d’où la ceinture à défendre, et la revanche.',
    sources: [{ label: 'Bryan, Karlan & Nelson, 2010', doi: '10.1146/annurev.economics.102308.124324' }, { label: 'Kullgren et al., 2013', doi: '10.7326/0003-4819-158-7-201304020-00002' }]
  },
  {
    icon: 'ring', rule: 'Le rendez-vous du soir', level: 'pari',
    why: 'Un moment partagé à heure fixe soude un groupe. Chacun sur son téléphone, c’est moins sûr : on tente.',
    sources: [{ label: 'Collins, 2004, Interaction Ritual Chains' }]
  },
  {
    icon: 'laugh', rule: 'On chambre le joueur, jamais le corps', level: 'solide',
    why: 'Se chambrer entre proches rapproche. Se moquer du poids fait du mal et ne fait pas maigrir : le jeu se l’interdit.',
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
      <TopBar back="/aide" kicker="MODE D'EMPLOI" title="Pourquoi ça marche ?" />

      <section className="flex flex-col gap-4 px-4 pb-[calc(env(safe-area-inset-bottom)+32px)] pt-5">
        <div className="card flex flex-col gap-3 p-4">
          <Ribbon className="self-start">EN BREF</Ribbon>
          <p className="font-display text-[22px] leading-tight">Le jeu n’a rien inventé.</p>
          <p className="text-[15px] leading-snug">
            Chaque règle reprend un ressort de motivation étudié par des chercheurs. En voici dix, en deux lignes chacun, avec leur source.
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] leading-snug text-lilas">
            {(Object.keys(LEVELS) as Level[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5"><Chip level={k} />{LEVELS[k].meaning}</span>
            ))}
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {LEVERS.map((l) => (
            <li key={l.rule} className="card-line flex gap-3 px-3.5 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-encre text-soleil"><Icon name={l.icon} size={21} /></span>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h2 className="font-display text-[18px] leading-tight text-soleil">{l.rule}</h2>
                  <Chip level={l.level} />
                </div>
                <p className="text-[15px] leading-snug">{l.why}</p>
                <p className="text-[12px] leading-snug text-lilas">
                  {l.note ? <>{l.note[0].toUpperCase() + l.note.slice(1)}. </> : null}
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
