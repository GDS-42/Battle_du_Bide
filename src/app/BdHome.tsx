import Link from 'next/link';
import { BdFighter } from '@/components/BdFighter';
import { Logo, Ribbon } from '@/components/ui';
import { BOSS_LOOK } from '@/lib/fighter/bd';
import type { SpriteLook } from '@/lib/fighter/types';

const look = (who: SpriteLook['who']): SpriteLook => ({ who, color: null });

/**
 * Accueil du look « BD », composé comme une affiche de combat : le ring peint au coucher du soleil, deux catcheurs
 * masqués qui se toisent, Le Bide qui ricane derrière eux et la devise en bandeau. Puis une phrase et les boutons :
 * les explications sont dans « Comment ça marche ? ». Tout est rendu par le serveur, sans script.
 */
export function BdHome() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <header className="bdh-hero">
        <div className="absolute left-4 right-4 top-[max(20px,env(safe-area-inset-top))] z-10">
          <Ribbon>SAISON 1 · LE RING S'ALLUME</Ribbon>
          <div className="mt-4"><Logo size={62} /></div>
        </div>
        {/* Au fond, l'adversaire de tout le monde. Devant, deux potes qui vont en découdre. */}
        <div className="bdh-boss" aria-hidden><div className="bdx-idle"><BdFighter look={BOSS_LOOK} pose="victoire" w={170} /></div></div>
        <div className="bdh-rival left" aria-hidden><div className="bdx-idle"><BdFighter look={look('bulldozer')} pose="elan" w={172} /></div></div>
        <div className="bdh-rival right" aria-hidden><div className="bdx-idle"><BdFighter look={look('tornado')} pose="garde" w={172} flip /></div></div>
        {/* La devise, en bandeau au pied du ring, comme l'annonce d'un coup spécial. */}
        <p className="bdh-motto"><span className="stroke-text">QUE LE MEILLEUR PERDE !</span></p>
      </header>

      <section className="flex flex-1 flex-col gap-5 px-5 pb-10 pt-6">
        <p className="text-[17px] leading-relaxed">
          Une battle entre amis pour perdre du poids. <b className="text-soleil">Tes kilos en moins deviennent des coups contre tes potes.</b>
        </p>
        <div className="grid gap-3">
          <Link href="/connexion?next=/battles/nouvelle" className="btn btn-soleil w-full text-[24px]">LANCER UNE BATTLE</Link>
          <Link href="/connexion" className="btn btn-violet w-full">J'ai déjà un compte</Link>
          <Link href="/aide" className="text-center text-[15px] font-bold text-lilas underline">Comment ça marche ?</Link>
        </div>
      </section>
    </main>
  );
}
