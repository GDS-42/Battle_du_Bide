import type { Metadata } from 'next';
import Link from 'next/link';
import { GOLD_STREAK } from '@/lib/engine/badges';
import { BOSS_NAME, RULES } from '@/lib/engine/rules';
import { Icon, Ribbon, TopBar } from '@/components/ui';

export const metadata: Metadata = { title: 'Comment ça marche ?' };

type IconName = Parameters<typeof Icon>[0]['name'];

// Les chiffres viennent du barème du moteur : la page reste juste si on le recalibre.
const pv = (n: number) => `${n.toLocaleString('fr-FR')} PV`;
const CROCHET_PER_TENTH = RULES.CROCHET_PER_PCT / 10;
const YOYO_G = 300;
const TREND_MOVE_G = Math.round(YOYO_G * RULES.ALPHA);

/** Mode d'emploi public : se lit sans compte, avant même de rejoindre une battle. */
export default function AidePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      <TopBar back="/battles" kicker="MODE D'EMPLOI" title="Comment ça marche ?" />

      <section className="flex flex-col gap-4 px-4 pb-[calc(env(safe-area-inset-bottom)+32px)] pt-5">
        {/* 1. En bref */}
        <div className="card flex flex-col gap-4 p-4">
          <Ribbon className="self-start">EN BREF</Ribbon>
          <p className="font-display text-[23px] leading-tight">Tes kilos en moins deviennent des coups contre tes potes.</p>
          <ol className="flex flex-col gap-3">
            <Step icon="scale" k="Le matin">Tu te pèses : ça charge ton coup du jour.</Step>
            <Step icon="clock" k="Le soir">
              À l'heure du combat (21&nbsp;h, sauf si le créateur de la battle a choisi une autre heure), les combattants s'affrontent.
            </Step>
            <Step icon="calendar" k="Chaque semaine">Un round de 7 jours, à partir du jour de départ choisi par l'organisateur.</Step>
            <Step icon="trophy" k="À la fin">Celui qui a gagné le plus de rounds remporte la ceinture.</Step>
          </ol>
        </div>

        {/* 2. Quand se peser ? (le point clé) */}
        <div id="quand-se-peser" className="card flex scroll-mt-24 flex-col gap-3 bg-soleil p-4 text-encre">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl border-[3px] border-encre bg-creme">
              <Icon name="scale" size={26} />
            </span>
            <div>
              <div className="text-[12px] font-bold uppercase tracking-[.14em]">Le plus important</div>
              <h2 className="font-display text-[26px] leading-tight">Quand se peser ?</h2>
            </div>
          </div>
          <p className="font-sans text-[20px] font-black italic leading-snug">
            Une fois par jour, le matin, avant l'heure du combat.
          </p>
          <ul className="flex flex-col gap-2 text-[15px] leading-snug">
            <Bullet dark>Au réveil, après être passé aux toilettes, avant le petit-déj.</Bullet>
            <Bullet dark>Toujours la même balance, dans les mêmes conditions.</Bullet>
            <Bullet dark>Seule la première pesée du jour compte. Une faute de frappe ? Tu as 10 minutes pour corriger.</Bullet>
            <Bullet dark>Une seule pesée suffit pour toutes tes battles.</Bullet>
          </ul>
          <div className="rounded-2xl border-[3px] border-encre bg-creme px-3 py-2.5 text-[15px] leading-snug">
            <b>Trop tard ?</b> Une pesée après l'heure du combat ne donne pas de coup ce soir-là, mais elle sauve ta série
            et met ta tendance à jour. Ton crochet attendra ta prochaine pesée à l'heure.
          </div>
          <p className="flex gap-2 text-[14px] leading-snug">
            <Icon name="bell" size={20} className="shrink-0" />
            <span>
              Un rappel t'arrive à ton heure de pesée si tu ne t'es pas encore pesé (tu la règles dans ton <b>Profil</b>).
              Tu es aussi prévenu dès que ton adversaire du round s'est pesé, et une alerte « Série en danger » tombe une heure
              avant le combat si ta série est en jeu. Un compte à rebours t'indique partout le temps qu'il reste.
            </span>
          </p>
        </div>

        {/* 3. L'échauffement */}
        <Block icon="fire" title="L'échauffement">
          <p className="text-[15px] leading-snug">
            L'organisateur choisit la date du premier combat : ce soir, demain ou plus tard. D'ici là, pas encore de combat.
            Pèse-toi quelques matins : la moyenne de tes 3 dernières pesées devient ton <b className="text-soleil">poids de départ</b>.
            Si la battle démarre le jour même, c'est ta première pesée qui compte.
          </p>
          <p className="text-[15px] leading-snug">
            Pas de combat sans adversaire : tant que personne n'a relevé le défi, le premier combat est reporté au soir suivant.
            Et les inscriptions ferment au premier combat.
          </p>
          <p className="text-[14px] leading-snug text-lilas">Profites-en pour créer ton combattant et inviter tes potes.</p>
        </Block>

        {/* 4. Tes coups */}
        <Block icon="glove" title="Tes coups">
          <div className="flex flex-col gap-3">
            <Move k="JAB">
              Tu t'es pesé avant le combat : {pv(RULES.JAB[0])}. Puis {pv(RULES.JAB[1])} dès {RULES.COMBO_TIER_1} jours de série,
              et {pv(RULES.JAB[2])} dès {RULES.COMBO_TIER_2} jours.
            </Move>
            <Move k="CROCHET">
              Ta tendance passe sous ton plus bas du round ? Crochet ! Plus tu descends, plus ça cogne
              ({pv(CROCHET_PER_TENTH)} par 0,1&nbsp;% de baisse, sans plafond).
            </Move>
            <Move k="SUPER">
              Chaque jour de pesée ajoute un cran à ta jauge. À {RULES.SUPER_MAX} crans, choisis ton soir : déclenche ton super avant
              l'heure du combat, pèse-toi ce jour-là, et c'est +{pv(RULES.SUPER_DAMAGE)}. La jauge se garde d'une semaine à l'autre.
            </Move>
            <Move k="GARDE">
              Tous les {RULES.GARDE_EVERY} jours de série, tu gagnes une garde ({RULES.GARDE_MAX} au maximum). Un jour sans pesée,
              elle s'active toute seule : ta série est sauvée, mais ce soir-là, tu ne frappes pas.
            </Move>
          </div>
          <ul className="flex flex-col gap-2 border-t-2 border-prune pt-3 text-[14px] leading-snug text-lilas">
            <Bullet>La série (ton « combo »), c'est le nombre de jours de pesée d'affilée.</Bullet>
            <Bullet>Pas pesé et pas de garde : pas de coup ce soir, et ta série repart de zéro.</Bullet>
            <Bullet>Ta tendance stagne ou remonte ? Aucune sanction : ton jab part quand même, seul le crochet est bloqué.</Bullet>
            <Bullet>Tout est compté en % de ton poids de départ : petit ou grand gabarit, à effort égal, on frappe aussi fort.</Bullet>
          </ul>
        </Block>

        {/* 5. La tendance */}
        <Block icon="laugh" title="La tendance, pas le chiffre du jour">
          <p className="text-[15px] leading-snug">
            La balance fait du yo-yo : eau, sel, repas de la veille… L'app lisse tes pesées en une <b className="text-soleil">tendance</b>,
            et c'est elle qui compte.
          </p>
          <p className="text-[15px] leading-snug">
            +{YOYO_G}&nbsp;g sur la balance un matin ? Ta tendance ne bouge que d'environ {TREND_MOVE_G}&nbsp;g. Pas de quoi stresser.
          </p>
          <p className="text-[15px] leading-snug">
            Ta <b className="text-soleil">courbe</b> (tes pesées et ta tendance, en kilos) t'attend sur le ring, après chaque pesée et dans ton Profil.
            Elle démarre dès ta première pesée, même pendant l'échauffement, et tu es le seul à la voir.
          </p>
          <p className="text-[14px] leading-snug text-lilas">
            Un chiffre vraiment bizarre (plus de {Math.round(RULES.ANOMALY * 100)}&nbsp;% d'écart d'un coup) est mis de côté
            jusqu'à ce que ta pesée suivante le confirme.
          </p>
        </Block>

        {/* 6. Le combat du soir et les rounds */}
        <Block icon="ring" title="Le combat du soir">
          <ul className="flex flex-col gap-2 text-[15px] leading-snug">
            <Bullet>Dans la journée, tu vois qui s'est pesé, mais les résultats restent secrets jusqu'au combat.</Bullet>
            <Bullet>
              <b className="text-soleil">Flamme du ring</b> : elle grandit chaque jour où tous les joueurs se pèsent. À {RULES.FLAME_TIERS[0]},{' '}
              {RULES.FLAME_TIERS[1]} et {RULES.FLAME_TIERS[2]} jours d'affilée, le décor du ring s'embellit, et un décor gagné reste acquis.
              Un seul absent, et le compteur repart de zéro : une pesée tardive l'entretient, une garde non.
            </Bullet>
            <Bullet>À l'heure du combat, les coups du jour sont échangés. Chaque combat se revoit en replay.</Bullet>
            <Bullet>À la fin de chaque round, ton bilan t'attend, avec une image à partager (touche un round sur le ring).</Bullet>
            <Bullet>Au début de chaque round (tous les 7 jours), chaque camp repart avec {pv(RULES.HP)}.</Bullet>
            <Bullet>Tombé à 0&nbsp;PV ? <b className="text-soleil">K.O.</b> : le round s'arrête là et va à l'adversaire.</Bullet>
            <Bullet>Sinon, au 7ᵉ soir, celui qui a le plus de PV gagne le round (à égalité : celui qui s'est pesé le plus de jours).</Bullet>
          </ul>
          <div className="flex flex-col gap-2 border-t-2 border-prune pt-3">
            <span className="label">Les formats</span>
            <Format k="Duel">Un contre un, chaque soir.</Format>
            <Format k="Tournoi">De 3 à 8 joueurs, un adversaire différent chaque semaine.</Format>
            <Format k="Équipes de 2">
              Une barre de vie commune. Vos dégâts, c'est la moyenne des deux, +{pv(RULES.TEAM_BONUS)} si vous vous êtes pesés tous les deux.
            </Format>
            <p className="text-[14px] leading-snug text-lilas">
              Nombre impair de camps ? Chaque semaine, l'un d'eux affronte « {BOSS_NAME} », le boss de l'app. Il frappe comme la moyenne
              des autres combattants du soir (au moins {pv(RULES.BOSS_MIN)}) : pour le battre, il faut faire mieux que tes rivaux.
            </p>
          </div>
        </Block>

        {/* 7. Fin de la battle */}
        <Block icon="trophy" title="Fin de la battle">
          <ul className="flex flex-col gap-2 text-[15px] leading-snug">
            <Bullet>Une battle dure 4, 8 ou 12 semaines.</Bullet>
            <Bullet>
              Le champion, c'est celui qui a gagné le plus de rounds (à égalité : le plus de dégâts infligés). Il remporte <b className="text-soleil">la ceinture</b>.
            </Bullet>
            <Bullet>
              L'enjeu se choisit à la création : un gage, une cagnotte ou juste pour l'honneur. L'app ne touche jamais l'argent :
              elle calcule seulement qui doit quoi à qui.
            </Bullet>
            <Bullet>Après la battle, le champion défend sa ceinture : il la garde tant qu'il continue de se peser et que sa tendance reste stable.</Bullet>
            <Bullet>Envie d'en découdre ? La revanche se lance en un clic, avec les mêmes joueurs.</Bullet>
          </ul>
        </Block>

        {/* 8. Badges et récompenses */}
        <Block icon="trophy" title="Badges et récompenses">
          <ul className="flex flex-col gap-2 text-[15px] leading-snug">
            <Bullet>Des <b className="text-soleil">badges</b> saluent ta régularité, ta progression et tes combats. Tu les retrouves dans ton Profil.</Bullet>
            <Bullet>
              <b className="text-soleil">Gants dorés</b> : à {GOLD_STREAK} jours de pesée d'affilée, tes gants deviennent dorés, et le restent tant que ta série tient.
            </Bullet>
            <Bullet>
              <b className="text-soleil">Ceinture de champion</b> : le vainqueur d'une battle la porte à la taille, visible de tous ses rivaux, tant qu'il la défend.
            </Bullet>
            <Bullet>À la fin de chaque round, ton bilan affiche tes exploits de la semaine.</Bullet>
          </ul>
        </Block>

        {/* 9. Vie privée et astuces */}
        <Block icon="zap" title="Vie privée et astuces">
          <ul className="flex flex-col gap-3">
            <Step icon="lock" k="Mode pudique">
              Activé par défaut : les autres voient des %, des PV et ta silhouette, jamais tes kilos.
            </Step>
            <Step icon="bell" k="Installe l'app">
              Ajoute-la à ton écran d'accueil, puis active les notifications dans ton Profil. iPhone : dans Safari,
              Partager → « Sur l'écran d'accueil ». Android : menu du navigateur → « Installer l'application ».
            </Step>
            <Step icon="mic" k="Chambre tes rivaux">
              Dans le fil du ring. Un pote pas encore pesé ? Envoie-lui un coup de coude (une fois par jour).
              On chambre le joueur, jamais son corps.
            </Step>
          </ul>
        </Block>

        <Link href="/battles" className="btn btn-soleil w-full text-[22px]">C'EST PARTI</Link>
      </section>
    </main>
  );
}

function Block({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-prune bg-encre text-soleil">
          <Icon name={icon} />
        </span>
        <h2 className="font-display text-[22px] leading-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Step({ icon, k, children }: { icon: IconName; k: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-encre text-soleil"><Icon name={icon} size={19} /></span>
      <div className="flex min-w-0 flex-col">
        <span className="font-display text-[17px] text-soleil">{k}</span>
        <span className="text-[15px] leading-snug">{children}</span>
      </div>
    </li>
  );
}

function Move({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-[18px] text-soleil">{k}</span>
      <span className="text-[15px] leading-snug">{children}</span>
    </div>
  );
}

function Format({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="card-line flex flex-col px-3 py-2">
      <span className="font-display text-[17px] text-soleil">{k}</span>
      <span className="text-[14px] leading-snug">{children}</span>
    </div>
  );
}

function Bullet({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className="flex gap-2.5">
      <span aria-hidden className={`mt-[7px] size-2 shrink-0 rotate-45 ${dark ? 'bg-encre' : 'bg-soleil'}`} />
      <span>{children}</span>
    </li>
  );
}
