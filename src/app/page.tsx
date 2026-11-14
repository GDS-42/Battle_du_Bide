import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { Fighter } from '@/components/Fighter';
import { Logo, RingScene, Ribbon } from '@/components/ui';
import { PRESETS } from '@/lib/fighter/presets';
import { fighterStyle } from '@/lib/look';
import { BdHome } from './BdHome';

export default async function Home() {
  const user = await currentUser();
  if (user) redirect(user.onboarded ? '/battles' : '/combattant');
  // Look « BD » : l'accueil a sa propre mise en scène (ring peint, catcheurs masqués). L'accueil d'origine, ci-dessous, reste le repli.
  if ((await fighterStyle()) === 'bd') return <BdHome />;
  const duo = [PRESETS[0], PRESETS[2], PRESETS[4], PRESETS[5]];
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <RingScene height={460} className="border-b-[5px] border-encre">
        <div className="absolute left-4 top-[max(20px,env(safe-area-inset-top))]">
          <Ribbon>SAISON 1 · LE RING S'ALLUME</Ribbon>
          <div className="mt-4"><Logo size={62} /></div>
          <p className="stroke-text mt-4 font-display text-[30px] leading-none text-soleil" style={{ textShadow: '3px 3px 0 #140A22' }}>QUE LE MEILLEUR PERDE !</p>
        </div>
        <div className="absolute inset-x-0 bottom-[30px] flex justify-center gap-0">
          {duo.map((p, i) => (
            <Fighter key={p.key} cfg={{ ...p.cfg, k: p.k, w: 118, flip: i >= 2 }} />
          ))}
        </div>
      </RingScene>
      <section className="flex flex-1 flex-col gap-5 px-5 pb-10 pt-6">
        <p className="text-[17px] leading-relaxed">
          Une battle entre amis pour perdre du poids. <b className="text-soleil">Chaque matin, ta pesée charge ton coup</b>.
          Chaque soir à 21 h, les combattants s'affrontent. Chaque semaine est un round.
        </p>
        <ul className="grid gap-3 text-[15px]">
          <li className="card-line px-4 py-3"><b className="font-display text-lg text-soleil">Équitable.</b> On compte en % de ton poids de départ, sur une courbe lissée.</li>
          <li className="card-line px-4 py-3"><b className="font-display text-lg text-soleil">Ton combattant te ressemble.</b> Sa silhouette suit ta vraie corpulence et s'affine avec toi.</li>
          <li className="card-line px-4 py-3"><b className="font-display text-lg text-soleil">Entre potes.</b> Duel, tournoi ou équipes, un gage ou une cagnotte, et du chambrage.</li>
        </ul>
        <div className="mt-auto grid gap-3 pt-2">
          <Link href="/connexion?next=/battles/nouvelle" className="btn btn-soleil w-full text-[24px]">LANCER UNE BATTLE</Link>
          <Link href="/connexion" className="btn btn-violet w-full">J'ai déjà un compte</Link>
          <Link href="/aide" className="text-center text-[15px] font-bold text-lilas underline">Comment ça marche ?</Link>
        </div>
      </section>
    </main>
  );
}
