# Battle du Bide · Direction artistique

> « Coucher de soleil sur le ring » : un jeu de combat arcade des années 90, en bande dessinée, sous un ciel de fin de journée.

Le canevas de design complet (planches, écrans, galerie, sons) est ici : **[canevas de DA](https://claude.ai/artifact/LkTsuFTThcf2AUkyQ8k4Gx)**.
Ses sources sont versionnées dans [`design/canvas/`](../design/canvas/), et l'atelier qui a servi à mettre au point les combattants dans [`design/atelier/`](../design/atelier/).

## 1. Intentions

- **Arcade, pas fitness.** On ne montre jamais de balance, de mètre ruban ni de « avant/après ». On montre un ring, des gants, des barres de vie.
- **Bon enfant.** Les combattants sont des personnages de BD, ronds et expressifs. Le commentateur chambre le *joueur*, jamais son corps.
- **Lisible au pouce.** Écrans mobiles, gros boutons (48 px minimum), un seul geste principal par écran.
- **Inspiration** : l'énergie graphique de Streets of Nice (aplats saturés, contours épais, trames, typographie qui claque), transposée dans un univers de boxe.

## 2. Palette

| Jeton | Couleur | Usage |
|---|---|---|
| `nuit` | `#1C0E33` | fond de l'app |
| `encre` | `#140A22` | contours, ombres portées, barres |
| `violet` | `#2A1548` | cartes |
| `violet-2` | `#3A1F5E` | cartes en relief, boutons secondaires |
| `prune` | `#5A2A7A` | filets, bords discrets, immeubles |
| `magenta` | `#E8287C` | ciel, accents, bouton « super » |
| `orange` | `#F7893B` | ciel bas, avertissements |
| `soleil` | `#FFD23D` | action principale, PV, titres |
| `rouge` | `#D22B3A` | rubans, dégâts encaissés |
| `neon` | `#2BB5FF` | jauge de super, adversaire, confirmations |
| `creme` | `#FFF4E3` | texte |
| `lilas` | `#CDB8F0` | texte secondaire |

Les jetons sont déclarés dans [`src/app/globals.css`](../src/app/globals.css) (`@theme` de Tailwind v4) et utilisables partout (`bg-soleil`, `text-lilas`…).

Le **ciel** est un dégradé en bandes franches (violet → magenta → orange → soleil), recouvert d'une trame de points. La **ville** est une silhouette d'immeubles violets aux fenêtres jaunes. Le **ring** a des poteaux jaunes et trois cordes (magenta, crème, bleu).

La **flamme du ring** embellit ce décor par paliers, qui se cumulent : braseros allumés sur les poteaux (7 jours), guirlande de fanions et faisceaux de projecteurs (14 jours), cordes d'or et feu d'artifice (30 jours).

## 3. Typographie

- **Lilita One** (titres, boutons, chiffres de combat) : ronde, épaisse, arcade.
- **Rubik** (texte), dont l'*italique 900* pour les onomatopées (« CROCHET », « K.O. ») avec contour d'encre.
- Les polices sont embarquées (`@fontsource`), sans appel à un service externe.

## 4. Composants

- **Boutons** : pilule épaisse, contour d'encre, ombre portée décalée vers le bas (`.btn`, variantes `-soleil`, `-magenta`, `-violet`, `-ghost`).
- **Rubans** : bandeau penché (`skewX`) avec ombre dure, pour les titres de scène (« COUP CHARGÉ ! », « FIN DU ROUND »).
- **Barres de vie** : biseautées, en miroir de chaque côté du médaillon « ROUND » ; la partie perdue ce soir reste rouge un instant.
- **Éclats** : étoile jaune à 12 branches, texte magenta contouré, pour chaque coup du replay.
- **Jauge de super** : 7 crans biseautés qui s'allument en bleu néon.

## 5. Le combattant

Le combattant est **généré** (SVG), pas dessiné à la main : une même fonction fabrique toutes les variantes, à toutes les corpulences et dans toutes les poses.

- **Vue de trois quarts**, contours lisses (splines), ombrage BD en deux tons (ombre + reflet) par masques.
- **Corpulence = IMC réel** : un paramètre `k` va de 1 (IMC ≥ 40) à 0 (IMC ≤ 23, « forme équilibrée »). Six silhouettes clés, S1 à S6. Quand la tendance franchit une silhouette clé, l'app annonce une **« Transformation ! »**.
- **Apparence** : 2 gabarits, 8 carnations nommées sans référence ethnique (Porcelaine → Ébène), yeux, nez, lèvres, 12 coiffures, 9 couleurs de cheveux, 6 barbes, 5 accessoires, 3 âges (rides, sourcils clairs), 5 tenues (boxe, catch, kimono, MMA, survêt rétro) et 3 couleurs (principale, liseré, gants).
- **Poses** : garde, coup, coup encaissé, plus une version « fantôme » pour l'adversaire attendu.
- **Galerie** de 12 personnages prêts à jouer (Le Bulldozer, La Fusée, La Mamie Cogneuse, Papy Uppercut, El Tornado, La Ceinture Noire, Le Bûcheron, La Punk, Le Groove, Le Geek, La Reine du Ring, Le Chauve Furieux), que chacun retouche ensuite.

Le générateur de l'app ([`src/lib/fighter/gen.ts`](../src/lib/fighter/gen.ts)) est un portage exact de celui de l'atelier ([`design/atelier/fighter.js`](../design/atelier/fighter.js)) ; un test vérifie qu'ils produisent les mêmes tracés.

### 5.1 Le look « BD » (look par défaut)

La façon dont le jeu montre le combattant par défaut (le tracé du générateur, ci-dessus, reste le repli) : des catcheurs **masqués**, dessinés à l'encre dans l'esprit de la BD franco-belge, une image par pose. Le masque laisse voir les yeux et la bouche. On se reconnaît à un masque et à une couleur, pas à un visage.

- **Trois combattants au choix** : Le Bulldozer (rond et têtu, rouge), El Tornado (grand et costaud, vert) et La Fusée (vive et nerveuse, bleu). Le Bide a aussi son dessin.
- **Une couleur par joueur**, pour le masque, la tenue et les gants ensemble : la palette du jeu, moins la couleur du liseré du combattant (sept teintes). Elle s'applique par un calque CSS : le gris du dessin (plis et ombres) multiplié par la teinte, limité à sa zone par un masque. Aucune image n'est recalculée.
- **Neuf poses** par combattant : garde, jab, élan, uppercut, coup encaissé, vol plané, K.O., victoire, endormi.
- **Sept gros plans d'expression** par combattant : défi, rage, panique, coup reçu, sonné, moqueur, blasé. Grotesques et drôles, jamais moqueurs du corps.
- **Récompenses** : la ceinture de champion dore la bande de taille ; les gants dorés sont une médaille portée derrière le combattant.
- **Corpulence** : le dessin ne change pas avec le poids. La « Transformation ! » est montrée par deux silhouettes unies (avant → après), tracées par le générateur à partir du poids réel.
- **Repli** : les silhouettes « fantôme » et tout combattant sans dessin gardent le tracé du générateur.

**Le combat animé.** Avec ce look, le replay du soir devient un petit dessin animé, sur un décor peint (les toits au coucher du soleil). C'est de l'**animation limitée** : les poses dessinées s'échangent d'un coup, avec élans, arrêts sur image, traits de vitesse et poussière ; aux moments forts, le visage passe en **gros plan dans une case de BD** (rage de celui qui frappe, panique puis tête déformée de celui qui encaisse, rire du vainqueur).

| Ce soir-là | Séquence |
|---|---|
| Premier visionnage | Entrée des deux camps, face-à-face en gros plan, éclairs entre les regards, « VS » |
| Jab | Élan court, coup, case « PAF! » |
| Crochet | Poing armé, cri, coup, grande case « BOUM! », vol plané, étoiles, relevé |
| Crochet bloqué | Le coup armé fait « pschitt… », rire d'en face, puis le jab |
| Super | Aura, annonce du coup spécial du joueur sur un bandeau, rafale, poing d'énergie, adversaire calciné |
| Absent ou en retard | Il dort debout, un buisson traverse le ring, l'adversaire en tombe à la renverse |
| Le Bide | Il gonfle, charge ventre en avant, aplatit l'adversaire comme une crêpe |
| K.O. | Coup final en uppercut (ou coup de bide), vol plané, pose de victoire. Le vaincu frappe **avant** : il ne se relève pas pour répliquer |
| Double K.O. | Les deux se percutent au centre et s'envolent chacun de leur côté |

En équipe, le second combattant se tient derrière le premier ; il encaisse, tombe ou lève les bras avec lui. Les barres de vie et le commentaire suivent l'animation : les points de vie baissent à l'instant où le coup porte. Un combat dure de 12 à 20 secondes ; « Passer » et « Rejouer » restent disponibles à tout moment.

**L'accueil.** La page d'accueil est composée comme une affiche de combat : le ring peint, le titre, Le Bide bras levés au fond (l'adversaire de tout le monde), deux catcheurs qui se toisent devant lui, et la devise en bandeau au pied du ring. En dessous, une seule phrase et les boutons : les explications sont dans « Comment ça marche ? ». Aucun script : tout est rendu par le serveur.

Les images sont dans `public/bd/v1/`, leurs repères (taille, appui au sol, tête, main) dans [`src/lib/fighter/bd-sprites.ts`](../src/lib/fighter/bd-sprites.ts). Un fichier publié n'est jamais réécrit : un dessin modifié part dans `/bd/v2`. C'est le réglage par défaut (`DEFAULT_LOOK`, `src/lib/look.ts`). L'ancien dessin revient pour tous par `BDB_FIGHTER_STYLE=svg`, ou sur un seul appareil par le lien `/look/svg` (voir [le guide de déploiement](04-deploiement-coolify.md)).

## 6. Mouvement et son

- **Animations** courtes : `pop` (apparition avec rebond), `shake` (tremblement d'écran sur les gros coups), `floatup` (dégâts qui s'envolent), `flicker` (braseros qui dansent), `twinkle` (feu d'artifice qui scintille). Les deux dernières s'arrêtent si le joueur a demandé moins de mouvement.
- **Combat animé du look « BD »** (§5.1) : il n'est joué que si le joueur n'a pas demandé moins de mouvement. Sinon, le replay sobre (étapes fixes, sans déplacement) le remplace.
- **Sons** synthétisés en direct (Web Audio, aucun fichier) : pesée, coup chargé, jab, crochet, coup bloqué, super, K.O., cloche, ouverture du combat, coup de coude ; et pour le combat animé : sifflement d'un coup, chute, rebond, éclairs du face-à-face, ralenti, annonce du super, gonflement du Bide, « pschitt », ronflement, vent. Ils sont désactivables dans le profil.
- **Fabrication des sons** ([`src/lib/sound.ts`](../src/lib/sound.ts)) : chaque bruitage superpose plusieurs couches. Un coup, c'est la claque du gant (bruit bref et aigu), la chair (bruit plus sourd), un « toc » médium et un grave qui plonge ; le crochet, le super et le K.O. y ajoutent de la saturation et une queue plus longue. La cloche du ring est faite de partiels inharmoniques, comme un métal frappé. Tous les sons passent par un limiteur et envoient une part dans une courte réverbération de salle, fabriquée sur place.
- **L'ambiance du ring** (combat animé) : un fond de foule discret pendant tout le combat, et des réactions calées sur l'action. La salle salue l'entrée des combattants, lâche un « hé ! » sur un jab et un grand « OOOH ! » quand un crochet envoie l'adversaire au tapis, soupire sur un crochet bloqué, **hue** celui qui ne s'est pas pesé, retient son souffle pendant qu'un super se charge, et se lève pour une **ovation** (acclamations, applaudissements, sifflets) quand un combattant tombe K.O. La foule est fabriquée par le code ([`src/lib/crowd.ts`](../src/lib/crowd.ts)) : des dizaines de voix synthétiques, chacune avec sa hauteur et sa voyelle (« a/é » pour acclamer, « o » pour le « oooh », « ou » pour les huées), décalées et réparties entre la gauche et la droite ; les applaudissements sont des centaines de claquements brefs. Elle reste toujours quelques décibels sous les coups, et le bouton son la coupe comme le reste.
- **Réglés pour un téléphone** : un petit haut-parleur ne restitue presque rien sous 200 à 300 Hz. Le poids d'un coup est donc porté par le médium autant que par le grave, et les niveaux sont hiérarchisés à l'écoute « téléphone » : super et K.O. devant, puis crochet, cloche, jab, et les effets d'ambiance (vent, ronflement) en retrait.
- **Vibrations** légères sur mobile pour les gros coups et le K.O.
