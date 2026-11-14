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

## 6. Mouvement et son

- **Animations** courtes : `pop` (apparition avec rebond), `shake` (tremblement d'écran sur les gros coups), `floatup` (dégâts qui s'envolent), `flicker` (braseros qui dansent), `twinkle` (feu d'artifice qui scintille). Les deux dernières s'arrêtent si le joueur a demandé moins de mouvement.
- **Sons** synthétisés en direct (Web Audio, aucun fichier) : pesée, coup chargé, jab, crochet, coup bloqué, super, K.O., cloche, ouverture du combat, coup de coude. Ils sont désactivables dans le profil.
- **Vibrations** légères sur mobile pour les gros coups et le K.O.
