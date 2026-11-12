# Battle du Bide · Le Ring : concept du jeu

> **« Que le meilleur perde ! »**
> Chaque matin, ta pesée charge ton coup. À 21 h, les combattants montent sur le ring.

Statut : **concept validé (phase 1)**. C'est le cahier des charges des phases 2 (design) et 3 (code). Les fondements scientifiques sont dans [00-recherche.md](00-recherche.md) et [05-moteurs-psychologiques.md](05-moteurs-psychologiques.md).

---

## Sommaire

1. [Le pitch](#1-le-pitch)
2. [Les principes fondateurs](#2-les-principes-fondateurs)
3. [La structure : battle, rounds, journée](#3-la-structure--battle-rounds-journée)
4. [Une journée sur le ring](#4-une-journée-sur-le-ring)
5. [Les mécaniques de combat](#5-les-mécaniques-de-combat)
6. [Les formats](#6-les-formats)
7. [La tendance lissée](#7-la-tendance-lissée)
8. [Le combattant](#8-le-combattant)
9. [Les enjeux : gage et cagnotte](#9-les-enjeux--gage-et-cagnotte)
10. [Fin de battle et après](#10-fin-de-battle-et-après)
11. [Le social](#11-le-social)
12. [Les notifications](#12-les-notifications)
13. [Anti-triche](#13-anti-triche)
14. [Parcours et écrans](#14-parcours-et-écrans)
15. [Périmètre V1 / V2](#15-périmètre-v1--v2)
16. [Pistes pour les phases 2 et 3](#16-pistes-pour-les-phases-2-et-3)
17. [Questions ouvertes](#17-questions-ouvertes)

---

## 1. Le pitch

**Battle du Bide** est un jeu de combat arcade entre amis, où **ta perte de poids réelle devient tes coups**.

- Chaque joueur incarne un **combattant** dont la silhouette correspond à sa **corpulence réelle**. Le combattant s'affine à mesure que le joueur maigrit.
- **Chaque matin**, tu te pèses : ta pesée charge ton coup.
- **Chaque soir à 21 h**, le serveur fait s'affronter les combattants. Tout le monde découvre en même temps le replay du combat, avec un commentateur.
- **Chaque semaine** est un round de 7 jours, et au début de chaque round les barres de vie repartent à fond.
- À la fin de la battle, le vainqueur remporte **la ceinture**, et le perdant s'acquitte du gage ou de la cagnotte.

C'est un jeu de combat **original**, dans la tradition des jeux d'arcade de versus 2D : écran de face-à-face, barres de vie, rounds, jauge de super, KO. Il ne reprend aucun personnage, nom, décor ou élément visuel d'un jeu existant.

---

## 2. Les principes fondateurs

Chaque mécanique s'appuie sur un résultat de recherche. Le détail par étude est dans [00-recherche.md](00-recherche.md) ; le détail par mécanique, avec les ressorts psychologiques, leur niveau de preuve, leurs limites et la bibliographie, est dans [05-moteurs-psychologiques.md](05-moteurs-psychologiques.md).

| Principe | Ce que dit la recherche | Ce que ça donne dans le jeu |
|---|---|---|
| **La rivalité est le moteur** | La compétition fait mieux que le soutien et la collaboration, et c'est la seule à rester efficace après le jeu (STEP UP, 2019). | Duels, même au sein d'un groupe. |
| **La pesée quotidienne fait maigrir, le jeu la fait tenir** | Une balance et une courbe : −6,6 % contre −0,4 % (Steinberg, 2013). Des points seuls ne suffisent pas (LOSE IT, 2018). | Se peser rapporte toujours un coup. La pesée est l'action centrale. |
| **Perdre motive plus que gagner** | Une somme avancée, qu'on perd à chaque jour manqué : objectif tenu 45 % des jours, contre 30 % sans récompense. La même somme présentée comme un gain ne fait pas mieux que rien (Patel, 2016). | Une **barre de vie à défendre**. |
| **Chaque round est un nouveau départ** | Effet « nouveau départ » (Dai, Milkman & Riis, 2014). | Rounds de 7 jours, vie remise à fond au début de chaque round. L'organisateur peut faire démarrer la battle un lundi pour en profiter à plein. |
| **Une habitude met environ 66 jours à se former** | C'est une médiane, de 18 à 254 jours selon les personnes. Rater un jour ne la casse pas (Lally, 2010). | Battle de **8 semaines** par défaut. |
| **Une série cassée fait décrocher** | La réparer limite ce décrochage (Silverman & Barasch, 2023). | Les **gardes** sauvent la série. |
| **La nouveauté s'use en 4 à 6 semaines** | Pokémon Go (Howe, 2016) ; méta-analyse Mazeas, 2022. | Des rebondissements : rounds, KO, transformations, ceinture, revanche. |
| **L'effet s'arrête avec le jeu** | Le poids revient après la fin des incitations (Volpp, 2008 ; John, 2011). | La **ceinture se défend** après la battle. |
| **Cagnotte partagée entre ceux qui réussissent** | −4,8 kg, contre −1,7 kg avec une récompense individuelle (Kullgren, 2013). | Mode de cagnotte « objectif commun ». |
| **Les équipes renforcent** | Sentir l'influence de ses coéquipiers va de pair avec une perte d'au moins 5 % (rapport de cotes de 1,20 ; Leahey, 2012). | Mode équipes dès la V1. |

---

## 3. La structure : battle, rounds, journée

| Niveau | Durée | Ce qui se joue |
|---|---|---|
| **Battle** | 4, 8 (par défaut) ou 12 semaines | Le titre de champion, **la ceinture**, le gage ou la cagnotte. |
| **Round** | 7 jours, à partir du jour de départ | Une victoire de round. Chaque combattant commence le round à **100 PV**. |
| **Combat du soir** | Chaque jour à 21 h | Les coups chargés par les pesées du jour sont échangés et rejoués en animation. |

- **Date de départ.** L'organisateur choisit le jour du premier combat : ce soir (si l'heure du combat n'est pas passée), demain (choix par défaut), un lundi ou toute autre date dans les 60 jours. Il peut encore la changer tant qu'aucun combat n'a eu lieu.
- **Échauffement.** Entre la création et le premier combat, les joueurs rejoignent la battle, créent leur combattant et font leurs premières pesées. Ces pesées servent à fixer le poids de départ. Si la battle démarre le jour même, la première pesée sert de poids de départ.
- **Pas de combat sans adversaire.** Si, à l'heure du premier combat, un seul camp est inscrit, le départ est reporté au soir suivant, et ainsi de suite jusqu'à l'arrivée d'un rival.
- **Inscriptions.** Elles ferment au premier combat : un combat joué n'est jamais réécrit par un nouvel arrivant.
- **Pesée après l'heure du combat.** Elle ne donne pas de coup ce soir-là, mais elle conserve la série, remplit la jauge et met la tendance à jour. Le crochet attend la prochaine pesée à l'heure.
- **Heure du combat.** 21 h par défaut, réglable par battle à la création.
- **Vainqueur de la battle.** Celui qui a gagné le plus de rounds. En cas d'égalité, celui qui a infligé le plus de dégâts au total.

---

## 4. Une journée sur le ring

### Le matin : la pesée (10 secondes)

1. Notification à l'heure choisie par le joueur : *« ⚖️ Ton coup t'attend. »*
2. L'app s'ouvre directement sur l'écran de pesée, avec le poids de la veille pré-rempli. On ajuste avec une molette ou des boutons ±0,1, et on valide.
3. **Retour immédiat** (pour soi seulement) :
   - ta tendance du jour et sa variation ;
   - **le coup que tu as chargé**, par exemple *« Jab + crochet chargés : 11 PV »*, ou *« Garde haute : tendance stable, ton jab est prêt »* ;
   - l'état de ta jauge de super, et le bouton **« Déclencher mon super ce soir »** si elle est pleine ;
   - un message chaleureux et varié, par exemple *« La balance fait du yo-yo, ta tendance, elle, descend. »*
4. On voit **qui s'est déjà pesé** (✅), mais **pas leurs résultats** : ils restent secrets jusqu'à 21 h.

### Dans la journée : le suspense

- Les joueurs voient les ✅ apparaître, échangent des provocations et des coups de coude 👊.
- Celui qui ne s'est pas pesé reçoit, au plus une fois par jour, un rappel venant de ses rivaux.

### 21 h : l'heure du combat

- Le serveur résout les coups du jour et génère un **replay de 10 à 15 secondes**.
- **Tout le monde le découvre en même temps** : écran de face-à-face, échanges de coups, barres de vie qui descendent et commentaire.
- Ensuite viennent les réactions, le chambrage et le classement du round mis à jour.

**Exemple de replay (mercredi, round 3) :**

> 🎙 *« Marc ouvre avec un jab… 5 PV ! »*
> 🎙 *« Julie répond du tac au tac : jab et crochet, sa tendance a perdu 0,13 %… 11 PV ! »*
> 🎙 *« Marc tente le crochet… bloqué ! Sa tendance remonte de 50 g. »*
> 🎙 *« Julie mène le round, 81 PV contre 74. Rendez-vous demain, 21 h ! »*

---

## 5. Les mécaniques de combat

> Les valeurs ci-dessous sont des **ordres de grandeur de départ**. Elles seront calibrées en phase 3 avec des données réelles, pour que les rounds restent serrés et les KO rares et spectaculaires.

### 5.1 Les coups

| Coup | Déclencheur | Dégâts infligés à l'adversaire |
|---|---|---|
| 👊 **Jab** (coup de base) | Tu t'es pesé avant l'heure du combat. | **4 PV**, ou 5 PV avec un combo de 7 jours ou plus, ou 6 PV à partir de 21 jours. |
| 💥 **Crochet** (coup puissant) | Ta tendance atteint **un nouveau plus bas du round**. | **5 PV par 0,1 %** de baisse, en % de ton poids de départ. **Sans plafond.** |
| ⚡ **Super** | Ta jauge est pleine et tu as choisi de la déclencher ce soir. | **+15 PV**, avec une animation spéciale et ton coup spécial nommé. |

- **Le crochet est calculé par rapport au plus bas du round.** Au début de chaque round, la référence est ta tendance du premier jour du round. Tu ne frappes en crochet que lorsque tu descends sous ton meilleur niveau de la semaine. On ne gagne donc rien à faire du yo-yo, et une semaine ratée n'handicape pas la suivante : nouveau départ.
- **Tout est en % du poids de départ**, pour que la comparaison reste équitable entre gabarits. Perdre 0,7 kg en partant de 98 kg (0,71 %) frappe aussi fort que perdre 0,45 kg en partant de 64 kg (0,70 %).

### 5.2 Combo, super et garde

| Mécanique | Règle |
|---|---|
| 🔥 **Combo** | Nombre de jours de pesée consécutifs, affiché en permanence (« Combo ×12 »). À 7 jours, le jab passe à 5 PV ; à 21 jours, à 6 PV. |
| ⚡ **Jauge de super** | 1 cran par jour de pesée, **7 crans**. Pleine, elle se déclenche **quand le joueur le décide**, un soir avant 21 h, ce qui laisse un petit choix tactique. Elle se conserve d'un round à l'autre, avec un seul super en réserve au maximum. |
| 🛡 **Garde** (joker) | 1 garde gagnée tous les 7 jours de combo, 2 au maximum. Un jour sans pesée, elle s'utilise automatiquement : **le combo est sauvé**, mais il n'y a pas d'attaque ce jour-là. |

### 5.3 Ce qui se passe quand…

| Situation | Effet |
|---|---|
| **Tu t'es pesé et ta tendance a baissé sous le plus bas du round** | Jab + crochet. |
| **Tu t'es pesé mais ta tendance stagne ou remonte** | Jab seul. Ton crochet est **bloqué** : aucune sanction pour une fluctuation. |
| **Tu ne t'es pas pesé** | Aucune attaque ce soir. Le combo est sauvé si tu as une garde, sinon il retombe à zéro. |
| **Un combattant tombe à 0 PV avant la fin du round** | **KO** : le round s'arrête et va au vainqueur, avec une animation de KO et un badge. Jusqu'au round suivant, les pesées continuent de remplir le combo et la jauge de super. |
| **Fin du round (7ᵉ soir, 21 h)** | Le combattant qui a **le plus de PV** gagne le round. En cas d'égalité, c'est celui qui s'est pesé le plus de jours. |

### 5.4 Exemple chiffré : round 3 d'un duel

Marc part de 98 kg et Julie de 64 kg. Tous deux ont un combo supérieur à 7 jours (jab à 5 PV), et chacun déclenche son super une fois dans la semaine.

| | Marc | Julie |
|---|---|---|
| Pesées | 6 sur 7 (le jeudi raté est sauvé par une garde) | 7 sur 7 |
| Tendance sur le round | 95,20 → 94,50 kg (−0,70 kg = 0,71 %) | 62,00 → 61,55 kg (−0,45 kg = 0,70 %) |
| Jabs | 6 × 5 = 30 PV | 7 × 5 = 35 PV |
| Crochets | 0,71 % × 50 = 36 PV | 0,70 % × 50 = 35 PV |
| Super | 15 PV | 15 PV |
| **Dégâts infligés** | **81 PV** | **85 PV** |
| **PV restants dimanche** | 100 − 85 = **15 PV** | 100 − 81 = **19 PV** → 🏆 **round pour Julie** |

👉 Marc a perdu plus de kilos, mais en proportion c'est égal, et **la régularité de Julie fait la différence**.

---

## 6. Les formats

### 🥊 Duel (2 joueurs)

Le format signature : un face-à-face, un combat chaque soir et un round chaque semaine.

### 👑 Tournoi (3 à 8 joueurs)

- **Chaque semaine, un tirage de duels.** Chacun affronte un adversaire différent, et on fait tourner les affiches pour que tout le monde se rencontre.
- **Classement du tournoi** : nombre de rounds gagnés, puis dégâts infligés au total pour départager.
- **La carte du soir** : à 21 h, tous les duels de la soirée s'enchaînent comme un gala de boxe.
- **Nombre impair** : chaque semaine, un joueur affronte **« Le Bide »**, le boss joué par l'app.
  - Le Bide frappe comme la moyenne des autres combattants du soir (au moins 4 PV, un jab de base) : pour le battre, il faut faire mieux que ses rivaux.
  - Le battre compte comme une victoire de round, et le commentateur s'en donne à cœur joie.

### 🤝 Équipes (2 contre 2)

- Couples contre couples, binômes de potes ou de collègues.
- **Une barre de vie commune** par équipe (100 PV).
- **Dégâts de l'équipe = moyenne des dégâts de ses membres**, ce qui garde l'équilibre même si une équipe est incomplète un soir.
- **Attaque combinée** : si les deux membres se sont pesés le même jour, l'équipe gagne +2 PV de dégâts. On se motive mutuellement.
- Dans le replay, les deux équipiers se relaient sur le ring, comme dans un combat par équipe.
- Plusieurs équipes (3 ou 4) peuvent s'affronter en tournoi, sur le même principe que le tournoi individuel.

---

## 7. La tendance lissée

Le poids varie de 0,5 à 1 kg d'un jour à l'autre (eau, sel, repas de la veille) et suit un cycle hebdomadaire (plus haut le lundi, plus bas le vendredi). **Le jeu ne regarde jamais la pesée brute** : tout est calculé sur une **tendance**, une moyenne mobile pondérée.

```
tendance_du_jour = tendance_d_hier + α × (pesée_du_jour − tendance_d_hier)
```

- **α** est à calibrer entre 0,1 et 0,25. *The Hacker's Diet* utilise 0,1 : plus α est bas, plus la courbe est lisse mais lente à réagir. Vu la durée des battles, un α autour de 0,2 semble un bon compromis.
- **Une mauvaise pesée fait peu de dégâts au moral** : +0,8 kg sur la balance ne fait monter la tendance que de 160 g. L'app le dit.
- **Les excès d'un soir ne paient pas** : se déshydrater pour une pesée ne déplace presque pas la tendance.
- **Le pic du lundi n'est jamais pénalisé** : une tendance qui monte bloque seulement le crochet.
- **Pesée manquée** : la tendance reste inchangée ce jour-là et reprend à la pesée suivante.

---

## 8. Le combattant

### 8.1 Création

- **Surnom de combat** : Marc *« Le Bulldozer »*, Julie *« La Fusée »*.
- **Morphologie de base** : plusieurs gabarits au choix (par exemple masculin, féminin, neutre).
- **Style de combat** : *Cogneur*, *Technicien* ou *Voltigeur*. **Purement cosmétique** : il change les animations et les poses, jamais les dégâts.
- **Couleurs** de la tenue.
- **Nom du coup spécial**, déclenché par le super : *« La Raclette Volante »*, *« Le Coup du Lundi »*…
- **Phrase d'entrée sur le ring** : *« Ce soir, je mange léger… et toi aussi ! »*

### 8.2 La corpulence réelle

- **Au départ**, la silhouette du combattant reproduit **la corpulence réelle du joueur**, calculée par l'**IMC** à partir de la taille (demandée à l'inscription) et du poids de départ.
- **À mesure que la tendance baisse**, l'IMC baisse et le combattant **s'affine** : il devient plus svelte, plus athlétique et mieux équilibré, avec une posture plus assurée et une garde plus vive.
- **La transformation est continue**, par interpolation entre des **silhouettes clés** :

| Silhouette clé | IMC de référence |
|---|---|
| S1 | 40 et plus |
| S2 | 35 |
| S3 | 30 |
| S4 | 27 |
| S5 | 25 |
| **S6 · forme équilibrée** | **23** |

- **Forme optimale** : vers un IMC de 23, le combattant atteint sa **forme équilibrée**, la plus athlétique, et ne s'affine plus au-delà. Le but visuel est la forme d'athlète, pas la maigreur.
- **Moment fort : l'écran « Transformation ! »**. Quand le combattant franchit une silhouette clé, une animation dédiée montre l'avant/après **du personnage**, jamais de photo du joueur. On peut la partager dans le fil.
- La silhouette est visible par tous les joueurs de la battle, même en mode pudique où les kilos sont cachés.

### 8.3 Ce qui s'ajoute au fil des battles

- **Gants dorés** : à 21 jours de pesée d'affilée, les gants du combattant deviennent dorés. Ils le restent tant que la série tient : les perdre fait plus mal que ne pas les avoir.
- **Ceinture de champion** : le vainqueur de sa dernière battle terminée la porte à la taille, visible de ses rivaux, tant que la défense tient (en solo).
- **Badges** : 16 badges calculés à partir des pesées et des battles, jamais stockés. Régularité (première pesée, séries de 7, 21 et 50 jours), progression (premier kilo, −2 %, −5 %, −10 %), combat (premier crochet, super, round gagné, cinq rounds, K.O., vainqueur du Bide, remontée, ceinture). Un joueur qui stagne en poids gagne quand même par sa régularité.
- **Palmarès** dans le profil : pesées, série en cours et record, rounds gagnés, K.O., battles, ceintures.
- **Exploits du round**, affichés dans le bilan : 7 pesées sur 7, victoire par K.O., Le Bide au tapis, remontée, super déclenché.
- Plus tard : équipement à débloquer (short, bandeau…) et aura de combo.

---

## 9. Les enjeux : gage et cagnotte

À la création de la battle, le créateur choisit un enjeu (facultatif), affiché en permanence sur le ring.

### 🎭 Le gage

Texte libre : *« Le perdant paie le resto »*, *« Le dernier fait la vaisselle pendant un mois »*. Il est rappelé tout au long de la battle et annoncé solennellement à la fin.

### 💰 La cagnotte (déclarative)

- Chaque joueur annonce sa **mise**, la même pour tous, par exemple 20 €.
- **L'app ne touche jamais l'argent.** Elle note les mises et, à la fin, **calcule qui doit combien à qui**, avec le moins de virements possible. Les joueurs se paient entre eux (Lydia, Wero, espèces) et cochent « payé ».
- **Deux modes au choix :**

| Mode | Règle |
|---|---|
| 🏆 **Le vainqueur rafle tout** | Le champion empoche la cagnotte. |
| 🎯 **Objectif commun** (recommandé) | La battle fixe un objectif, par exemple −5 % du poids de départ. **La cagnotte est partagée entre tous ceux qui l'atteignent**, et ceux qui le ratent paient. Si personne ne l'atteint, la cagnotte est **reportée sur la revanche**. C'est le mécanisme qui a donné la plus forte perte dans l'essai de Kullgren (2013). |

---

## 10. Fin de battle et après

### La finale

- **Podium animé** et cérémonie de remise de la ceinture.
- **Stats de la battle** : rounds gagnés, KO, plus long combo, plus gros crochet, transformation du combattant (avant/après).
- **Rappel de l'enjeu** : *« Marc, tu dois un resto à Julie 🍽️ »*, ou le décompte de la cagnotte.
- Bouton **« Revanche ? »** pour relancer la même battle avec les mêmes joueurs, en un clic.

### La défense de la ceinture

Le poids revient souvent après la fin d'un jeu. Pour l'éviter, **la ceinture se défend** après la battle :

- Le champion garde sa ceinture **tant que sa tendance reste à ±1 %** de son niveau de fin de battle et qu'il continue à se peser, au moins 5 jours sur 7.
- Tout joueur de la battle peut lancer un **défi pour la ceinture**, qui démarre une nouvelle battle.
- Si le champion laisse filer sa tendance ou arrête de se peser, la ceinture devient **vacante**, et tout le fil est prévenu.

### Le raid de fin de saison (V2)

Entre deux battles, tous les joueurs s'allient contre **« Le Bide »**, le boss géant. Chaque pesée lui inflige des dégâts. C'est un moment coopératif qui relance l'intérêt avant la battle suivante.

---

## 11. Le social

| Fonction | Détail |
|---|---|
| **Réactions sur le replay** | Emojis (🔥 💪 😱 😂 🥊) sur chaque combat du soir. |
| **Provocations** | Message libre dans le fil du ring, avec quelques suggestions courtes adaptées au ton de la battle. |
| **Commentaire de pesée** | Une ligne facultative : *« Raclette hier, soyez indulgents »*. |
| **Coup de coude 👊** | Un rival ne s'est pas encore pesé ? Un tap lui envoie une notification. **Une fois par jour** et par personne. |
| **Flamme du ring** | Série commune : nombre de jours consécutifs où **tous** les joueurs se sont pesés. À 7, 14 et 30 jours, le décor du ring s'améliore. |
| **Mode pudique** (par défaut) | Les autres voient des **%**, des PV et la silhouette, **jamais les kilos**. Le mode **transparent**, où les kilos sont visibles, s'active par battle. |

### Le ton

- **Par défaut : bon enfant.** Taquin et bienveillant. *« Joli crochet de Julie ! Marc va devoir sortir le grand jeu. »*
- **Mode « trash talk »**, activable par le créateur de la battle. Provocations franches, façon conférence de presse d'avant-combat. *« Marc a séché la pesée. Il paraît qu'il a peur de la balance. »*
- **Dans les deux cas, on chambre le joueur, jamais le corps** : aucune vanne sur le physique, ni dans les textes de l'app, ni dans le commentateur.

---

## 12. Les notifications

**Au maximum 2 notifications programmées par jour**, plus quelques événements. Chaque type peut être coupé individuellement.

| Moment | Exemple |
|---|---|
| **Rappel du matin**, à l'heure choisie à l'inscription | *« ⚖️ Ton coup t'attend. Julie a déjà chargé le sien… »* |
| **Ton rival vient de se peser** (adversaire du round ou coéquipier) | *« 🥊 Julie a chargé son coup. À toi, avant 21 h ! »* |
| **21 h, le combat est prêt** | *« 🔔 Round 3, jour 4 : le combat est prêt ! »* |
| Événement : coup de coude reçu | *« 👊 Julie te met un coup de coude. »* |
| Événement : KO, ceinture, transformation | *« 💥 KO ! »*, *« 🏆 La ceinture est vacante ! »*, *« ✨ Ton combattant se transforme ! »* |

- **À l'inscription**, le joueur choisit **quand** il se pèse (au réveil, après la douche, avant le café) et à quelle heure. C'est l'heure de son rappel.
- Les messages **changent tous les jours**, pour éviter l'usure.
- **Jamais culpabilisants.** Après plusieurs jours d'absence, on ralentit au lieu d'insister.

---

## 13. Anti-triche

Entre amis, la triche reste marginale, mais un minimum de règles protège le jeu.

| Risque | Parade |
|---|---|
| Gonfler son poids avant le départ | **Poids de départ = moyenne des 3 dernières pesées de l'échauffement**, ou des 3 premiers jours s'il n'y a pas eu d'échauffement. |
| Se repeser jusqu'à obtenir un bon chiffre | **La première pesée du jour compte.** Correction possible pendant 10 minutes seulement, pour une faute de frappe. |
| Saisir un chiffre inventé | Une **variation de plus de 2 % en un jour** est signalée « à confirmer ». Elle est exclue de la tendance jusqu'à ce que la pesée suivante la confirme. |
| Le doute entre joueurs | Option par battle : **photo de la balance avec le « mot du jour »** affiché par l'app. |
| Saisie manuelle | V2 : **balance connectée**, pesées marquées « certifiées ✅ ». |

---

## 14. Parcours et écrans

### Premier lancement (moins de 2 minutes)

```
Lien d'invitation reçu sur Signal
 → « Julie "La Fusée" te défie ! Enjeu : le resto »
 → Relever le défi : prénom + e-mail → lien magique (pas de mot de passe)
 → Créer son combattant : surnom, gabarit, style, couleurs, coup spécial
 → Taille + première pesée → la silhouette prend sa corpulence
 → Quand et à quelle heure tu te pèses ? (rappel)
 → Installer l'app sur l'écran d'accueil + activer les notifications
 → « Tu es sur le ring. Premier combat demain. »
```

**Créer une battle** : format → durée → heure du combat → enjeu (gage ou cagnotte) → confidentialité → ton → lien d'invitation.

### Inventaire des écrans (entrée de la phase 2)

| # | Écran | Rôle |
|---|---|---|
| 1 | **Invitation** | « Julie te défie », affiche du combat, enjeu, bouton « Relever le défi ». |
| 2 | **Connexion** | Lien magique par e-mail. |
| 3 | **Création du combattant** | Surnom, gabarit, style, couleurs, coup spécial, phrase d'entrée, taille. |
| 4 | **Création de battle** | Assistant en quelques étapes, tout pré-rempli. |
| 5 | **Partage** | Lien, QR code, bouton Signal. |
| 6 | ⭐ **Pesée** | L'écran roi : gros chiffres, molette, un bouton. |
| 7 | ⭐ **Retour immédiat** | Tendance, coup chargé, jauge de super, bouton « Déclencher mon super ». |
| 8 | ⭐ **Face-à-face et replay du combat** | Le spectacle du soir : barres de vie, coups, commentateur. |
| 9 | **Ring du round** | État du round : PV, combos, jauges, qui s'est pesé, flamme du ring. Pour un tournoi, la carte des duels et le classement. |
| 10 | **Fil** | Replays, réactions, provocations, coups de coude, transformations. |
| 11 | **Fiche combattant** | Silhouette, courbe de pesées et de tendance (en kilos, visible par le joueur seul), stats, équipement, ceintures. |
| 12 | **Transformation !** | L'avant/après du combattant au passage d'une silhouette clé. |
| 13 | **Fin de round** | La cloche : vainqueur du round, stats de la semaine. |
| 14 | **Fin de battle** | Podium, ceinture, enjeu ou cagnotte, revanche. |
| 15 | **Mes battles** | En cours, terminées, ceintures détenues. |
| 16 | **Réglages** | Notifications, heure de pesée, unité, confidentialité, export et suppression des données. |

---

## 15. Périmètre V1 / V2

### ✅ V1 : le jeu complet

- Comptes par lien magique, installation en PWA.
- Création du combattant, avec corpulence réelle et transformation progressive.
- **Les trois formats** : duel, tournoi de 3 à 8 joueurs avec boss « Le Bide », équipes en 2 contre 2.
- Pesée quotidienne, tendance lissée, retour immédiat.
- Mécaniques de combat : jab, crochet, super, combo, garde, KO, rounds.
- **Combat du soir à heure fixe**, avec un replay **en ambiance arcade** : face-à-face, barres de vie, impacts, écran qui tremble, commentateur texte.
- Fin de round, fin de battle, ceinture et défense de ceinture, revanche.
- **Gage et cagnotte déclarative**, avec les deux modes.
- Social : réactions, provocations, commentaire de pesée, coup de coude, flamme du ring, modes pudique et transparent, ton bon enfant ou trash talk.
- Notifications push.
- Anti-triche de base, avec photo et mot du jour en option.

### 🔜 V2 : enrichissements

- **Combattants entièrement animés** : chorégraphies de combat complètes par style.
- **Balance connectée** (Withings…) et import depuis Apple Santé ou Google Health Connect.
- **Raid de fin de saison** contre « Le Bide ».
- **Cartes de partage** : image du KO, de la transformation ou du podium, pour Signal ou Instagram.
- Badges complets et niveau de combattant toutes battles confondues.
- Commentateur vocal.

---

## 16. Pistes pour les phases 2 et 3

### Phase 2 : design

- **Une identité arcade originale** : énergie des affiches de combat, typographie très grasse, couleurs vives, effets d'impact généreux. Le ton est l'humour français bon enfant, et le slogan *« Que le meilleur perde ! »*.
- **Trois écrans à soigner en priorité** : la pesée, le retour immédiat et le replay du combat.
- **Personnages en 2D vectoriel paramétrique.** Une entrée numérique « corpulence » pilote la silhouette, de S1 à S6. Ainsi, un seul jeu d'animations sert à toutes les corpulences : c'est ce qui rend la transformation réaliste à produire.

### Phase 3 : technique

| Brique | Choix pressenti |
|---|---|
| Application | **PWA** installable : pas de store, notifications push sur Android et iOS (16.4 et plus) |
| Framework | **Next.js** + TypeScript |
| UI et animations | Tailwind CSS, Motion ; **Rive** (animation pilotée par des paramètres) ou SVG à formes interpolées pour les combattants |
| Données | **PostgreSQL** + Drizzle ORM |
| Authentification | Lien magique par e-mail (Better Auth) |
| Combats du soir | **Tâche planifiée** à l'heure du combat : résolution des coups, génération du script du replay, notifications |
| Hébergement | Docker sur **Coolify** (app + Postgres, sauvegardes) |

Le replay est un **script** calculé par le serveur (suite de coups, dégâts, répliques du commentateur) et **joué** par le client. C'est léger, et le même combat est rejouable à volonté.

---

## 17. Questions ouvertes

1. **Médicaments GLP-1** : un joueur sous traitement perd beaucoup plus vite en %. Faut-il une déclaration facultative et un handicap, ou laisser faire ?
2. **Public** : cercle privé de test pour l'instant. Ouverture plus large un jour ?
3. **Calibrage des dégâts** : PV par 0,1 %, valeur du jab et du super, PV du boss. À ajuster avec les premières vraies données pour que les rounds restent serrés.
4. **Heure du combat** : 21 h pour tous, ou réglable par battle (prévu à la création) ?
5. **Seuils d'IMC des silhouettes** : à valider avec les premières esquisses de la phase 2.
6. **Cagnotte « objectif commun »** : quel objectif par défaut selon la durée (par exemple −3 % en 4 semaines, −5 % en 8, −7 % en 12) ?
