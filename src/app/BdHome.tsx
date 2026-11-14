import Link from 'next/link';
import { BdFighter, TintLayer } from '@/components/BdFighter';
import { Logo, Ribbon } from '@/components/ui';
import { BD_CAST, BD_KEYS, BOSS_LOOK, faceFor, faceUrl, paletteFor, tintHex } from '@/lib/fighter/bd';
import type { SpriteLook } from '@/lib/fighter/types';

const look = (who: SpriteLook['who']): SpriteLook => ({ who, color: null });

/**
 * Accueil du look « BD » : le ring peint au coucher du soleil, deux catcheurs masqués qui se toisent et Le Bide
 * qui ricane derrière eux, puis le jeu raconté en trois cases de bande dessinée. Tout est rendu par le serveur,
 * sans script ; les dessins sont ceux du jeu (public/bd/v1).
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

      <section className="flex flex-1 flex-col gap-7 px-5 pb-10 pt-6">
        <div className="flex flex-col gap-4">
          <p className="text-[17px] leading-relaxed">
            Une battle entre amis pour perdre du poids. <b className="text-soleil">Tes kilos en moins deviennent des coups contre tes potes.</b>
          </p>
          <Link href="/connexion?next=/battles/nouvelle" className="btn btn-soleil w-full text-[24px]">LANCER UNE BATTLE</Link>
        </div>

        {/* Le jeu en trois cases */}
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-[24px] leading-none">Chaque jour, un combat</h2>
          <ol className="grid grid-cols-3 gap-2.5">
            <Strip k="LE MATIN" text="Ta pesée charge ton coup." c1="#F7893B" c2="#D22B3A">
              <Face who="bulldozer" expr="rage" />
            </Strip>
            <Strip k="LE SOIR" text="À 21 h, ça cogne." c1="#FFF4E3" c2="#FFD23D" shout="PAF!">
              <Face who="tornado" expr="impact" glove={BD_CAST.bulldozer.color} />
            </Strip>
            <Strip k="LA SEMAINE" text="Un round à gagner." c1="#FFD23D" c2="#F7893B">
              <Face who="bulldozer" expr="rire" />
            </Strip>
          </ol>
        </div>

        {/* Les trois combattants */}
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-[24px] leading-none">Choisis ton catcheur</h2>
          <ul className="grid grid-cols-3 gap-2.5">
            {BD_KEYS.map((who, i) => (
              <li key={who} className="bdh-card">
                <div className="bdh-card-pic"><BdFighter look={look(who)} pose={i === 1 ? 'victoire' : 'garde'} w={92} title={BD_CAST[who].name} /></div>
                <div className="flex flex-col px-2 pb-2 pt-1.5">
                  <span className="font-display text-[15px] leading-tight text-soleil">{BD_CAST[who].name}</span>
                  <span className="text-[12px] leading-tight text-lilas">{BD_CAST[who].tag}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] text-lilas">
            <span className="flex gap-1" aria-hidden>
              {paletteFor('bulldozer').map(([c]) => <span key={c} className="size-4 rounded-full border-2 border-encre" style={{ background: c, boxShadow: '0 0 0 1px rgba(205,184,240,.45)' }} />)}
            </span>
            Tous masqués, chacun sa couleur.
          </p>
        </div>

        <ul className="grid gap-3 text-[15px]">
          <li className="card-line px-4 py-3"><b className="font-display text-lg text-soleil">Équitable.</b> On compte en % de ton poids de départ, sur une courbe lissée.</li>
          <li className="card-line px-4 py-3"><b className="font-display text-lg text-soleil">Pudique.</b> Les autres voient des % et des points de vie, jamais tes kilos.</li>
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

/** Une case de la bande : le gros plan dans son cadre d'encre, puis sa légende. */
function Strip({ k, text, c1, c2, shout, children }: { k: string; text: string; c1: string; c2: string; shout?: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="bdx-gp bdh-panel" style={{ '--c1': c1, '--c2': c2 } as React.CSSProperties} aria-hidden>
        <div className="bdx-gp-rays" />
        {children}
        {shout ? <div className="bdx-gp-txt"><b>{shout}</b></div> : null}
      </div>
      <div className="flex flex-col">
        <span className="font-display text-[14px] leading-tight text-soleil">{k}</span>
        <span className="text-[13px] leading-snug">{text}</span>
      </div>
    </li>
  );
}

/** Gros plan d'expression, centré sur le visage, qui s'adapte à la largeur de sa case. */
function Face({ who, expr, glove }: { who: SpriteLook['who']; expr: string; glove?: string }) {
  const f = faceFor(who, expr);
  if (!f) return null;
  const K = 124; // taille du dessin, en % de la case
  return (
    <span style={{ position: 'absolute', width: `${K}%`, height: `${K}%`, left: `${50 - f.c[0] * K}%`, top: `${52 - f.c[1] * K}%` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={faceUrl(who, expr)} alt="" draggable={false} decoding="async" loading="lazy" style={{ display: 'block', width: '100%', height: '100%', maxWidth: 'none' }} />
      {glove ? <TintLayer url={faceUrl(who, expr, 'o')} color={tintHex(glove)} /> : null}
    </span>
  );
}
