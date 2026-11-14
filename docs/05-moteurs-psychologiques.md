# Battle du Bide · Les moteurs psychologiques du jeu

> Pourquoi une barre de vie plutôt qu'un score ? Pourquoi des gants dorés qu'on peut perdre ? Pourquoi le combat à 21 h et pas tout de suite ?

Ce document explique, mécanique par mécanique, sur quels ressorts psychologiques le jeu s'appuie et d'où ils viennent : psychologie cognitive et sociale, économie comportementale, neurosciences, sociologie, études du jeu. Il complète [00-recherche.md](00-recherche.md), qui classe les mêmes connaissances **par étude**, et [01-concept.md](01-concept.md), qui décrit les règles.

Il dit aussi ce que la recherche ne montre pas. Un jeu ne fait pas maigrir à lui seul : au mieux, il fait tenir la pesée quotidienne, qui est le comportement le mieux étayé de toute cette littérature.

---

## Sommaire

1. [Comment lire ce document](#1-comment-lire-ce-document)
2. [Vue d'ensemble](#2-vue-densemble)
3. [Les dix familles de moteurs](#3-les-dix-familles-de-moteurs)
   1. [Se voir agir](#31-se-voir-agir)
   2. [Le présent contre le futur](#32-le-présent-contre-le-futur)
   3. [La peur de perdre](#33-la-peur-de-perdre)
   4. [L'habitude](#34-lhabitude)
   5. [Les autres](#35-les-autres)
   6. [L'engagement](#36-lengagement)
   7. [L'identité](#37-lidentité)
   8. [Compétence et équité](#38-compétence-et-équité)
   9. [Le rituel et le récit](#39-le-rituel-et-le-récit)
   10. [Le ton](#310-le-ton)
4. [Ce que dit le cerveau](#4-ce-que-dit-le-cerveau)
5. [Limites et choix assumés](#5-limites-et-choix-assumés)
6. [Bibliographie](#6-bibliographie)

---

## 1. Comment lire ce document

**Aucune de ces mécaniques n'a été testée dans ce jeu.** Chaque moteur porte un niveau de preuve, qui qualifie la solidité du résultat de recherche et la distance qui le sépare de ce que fait le jeu. Il ne dit rien de l'efficacité du jeu lui-même.

| Niveau | Ce que ça veut dire |
|---|---|
| 🟢 **Établi** | Méta-analyses ou essais randomisés sur un comportement proche : se peser, marcher plus, tenir un objectif. |
| 🟡 **Plausible** | Théorie solide ou résultats de laboratoire, transposés au jeu sans test direct. |
| 🟠 **Pari** | Intuition de conception, analogie ou source non académique. |

Chaque famille de la partie 3 suit le même plan : **le mécanisme** (ce que dit la recherche), **dans le jeu** (ce qu'on en a fait), **limites** (ce qui est contesté, ou ce que la transposition a de fragile).

**Tailles d'effet.** Les lettres *d* et *g* désignent une taille d'effet standardisée. Les repères usuels : 0,2 est un petit effet, 0,5 un effet moyen, 0,8 un grand effet.

**Vérification des références.** Toutes les références ont été recoupées par recherche web en novembre 2026 : auteurs, année, revue, et le fait que l'article dit bien ce qu'on lui fait dire. Les liens DOI ont été relevés dans au moins une source (éditeur, PubMed ou index bibliographique), mais ils n'ont pas été ouverts un par un. Quand le DOI n'a pas été vu, la bibliographie donne le volume et les pages à la place. Les textes complets n'ont en général pas été lus : les chiffres viennent des résumés et de leurs reprises. Une référence rétractée a été écartée, et les résultats contestés sont signalés (partie 5).

---

## 2. Vue d'ensemble

| Mécanique du jeu | Moteur psychologique | Discipline | Référence clé | Preuve | Détail |
|---|---|---|---|---|---|
| Pesée du matin, une fois par jour | Auto-surveillance | Psychologie de la santé | Harkin et al., 2016 ; Steinberg et al., 2013 | 🟢 Établi | [3.1](#31-se-voir-agir) |
| Courbe et tendance lissée | Rétroaction lisible | Psychologie de la santé | Steinberg et al., 2013 ; Edholm et al., 1974 | 🟡 Plausible | [3.1](#31-se-voir-agir) |
| Écran « Coup chargé », combat le soir même | Récompense immédiate contre la préférence pour le présent | Économie comportementale | Ainslie, 1975 ; O'Donoghue & Rabin, 1999 | 🟡 Plausible | [3.2](#32-le-présent-contre-le-futur) |
| Résultats secrets jusqu'à l'heure du combat, compte à rebours | Curiosité, anticipation | Psychologie cognitive, neurosciences | Loewenstein, 1994 ; Knutson et al., 2001 | 🟠 Pari | [3.2](#32-le-présent-contre-le-futur) |
| Rounds de 7 jours, vie remise à 100 PV | Effet « nouveau départ » | Économie comportementale | Dai, Milkman & Riis, 2014 | 🟡 Plausible | [3.2](#32-le-présent-contre-le-futur) |
| Barre de vie à défendre | Aversion à la perte | Économie comportementale | Kahneman & Tversky, 1979 ; Patel et al., 2016 | 🟡 Plausible | [3.3](#33-la-peur-de-perdre) |
| Gants dorés, ceinture à défendre | Effet de dotation | Économie comportementale | Kahneman, Knetsch & Thaler, 1990 | 🟠 Pari | [3.3](#33-la-peur-de-perdre) |
| Heure de pesée choisie, rappel du matin | Intention de mise en œuvre, déclencheur | Psychologie de la motivation | Gollwitzer & Sheeran, 2006 | 🟢 Établi | [3.4](#34-lhabitude) |
| Combo, paliers à 7 et 21 jours, jauge de super | Formation d'habitude, gradient de but | Psychologie, comportement du consommateur | Lally et al., 2010 ; Kivetz et al., 2006 | 🟡 Plausible | [3.4](#34-lhabitude) |
| Garde, pesée tardive qui sauve la série | Série réparable, effet « foutu pour foutu » | Comportement du consommateur | Silverman & Barasch, 2023 ; Herman & Mack, 1975 | 🟡 Plausible | [3.4](#34-lhabitude) |
| Duel, y compris en tournoi | Comparaison sociale, rivalité, effet N | Psychologie sociale | Patel et al., 2019 (STEP UP) ; Garcia & Tor, 2009 | 🟢 Établi pour l'activité physique | [3.5](#35-les-autres) |
| Équipes de 2, bonus si les deux se pèsent | Effet Köhler, appartenance au groupe | Psychologie sociale | Hertel, Kerr & Messé, 2000 ; Tajfel et al., 1971 | 🟡 Plausible | [3.5](#35-les-autres) |
| « Ton rival s'est pesé », coup de coude, liste de ceux qui se sont pesés | Norme descriptive, déclencheur social | Psychologie sociale | Cialdini, Reno & Kallgren, 1990 | 🟡 Plausible | [3.5](#35-les-autres) |
| Flamme du ring : série commune, décor qui s'embellit par paliers | Objectif commun où chacun est indispensable, gradient de but | Psychologie sociale, comportement du consommateur | Hertel, Kerr & Messé, 2000 ; Patel et al., 2019 (STEP UP) ; Kivetz et al., 2006 | 🟠 Pari | [3.5](#35-les-autres) |
| Gage, cagnotte déclarative | Dispositif d'engagement | Économie comportementale | Bryan, Karlan & Nelson, 2010 ; Kullgren et al., 2013 | 🟡 Plausible | [3.6](#36-lengagement) |
| Combattant à la corpulence réelle, « Transformation ! » | Auto-modélisation, effet Protée, auto-efficacité | Psychologie des médias | Fox & Bailenson, 2009 ; Bandura, 1977 | 🟠 Pari | [3.7](#37-lidentité) |
| Badges sur trois axes, palmarès | Besoin de compétence | Psychologie de la motivation | Deci & Ryan, 2000 | 🟠 Pari | [3.8](#38-compétence-et-équité) |
| Score en %, crochet relatif au round, Le Bide rééquilibré | Équité, défi à sa mesure | Psychologie de la motivation, économie | Locke & Latham, 2002 ; Brown, 2011 | 🟡 Plausible | [3.8](#38-compétence-et-équité) |
| Combat du soir à heure fixe, replay commenté | Rituel partagé, jeu comme espace à part | Sociologie, études du jeu | Collins, 2004 ; Huizinga, 1938 ; Caillois, 1958 | 🟠 Pari | [3.9](#39-le-rituel-et-le-récit) |
| Bilan de round à partager, finale | Règle pic-fin, partage des bonnes nouvelles | Psychologie cognitive et sociale | Kahneman et al., 1993 ; Gable et al., 2004 | 🟡 Plausible | [3.9](#39-le-rituel-et-le-récit) |
| « On chambre le joueur, jamais le corps », mode pudique | Taquinerie qui lie, stigmatisation qui nuit | Psychologie sociale, santé publique | Keltner et al., 2001 ; Puhl & Heuer, 2010 | 🟢 Établi pour l'interdit | [3.10](#310-le-ton) |

---

## 3. Les dix familles de moteurs

### 3.1 Se voir agir

**Le mécanisme.** Mesurer régulièrement où l'on en est par rapport à un objectif aide à l'atteindre : c'est l'auto-surveillance, pièce centrale des théories de l'autorégulation.

- Une méta-analyse de 138 études randomisées (19 951 participants) trouve un effet moyen de *d* = 0,40 sur l'atteinte de l'objectif. L'effet est plus fort quand le suivi est consigné et quand il est rendu public (Harkin et al., 2016).
- Pour le poids, les revues associent la pesée fréquente à une plus grande perte (Burke, Wang & Sevick, 2011 ; Zheng et al., 2015).
- Un essai randomisé le confirme : une balance connectée, une courbe et un retour chaque semaine donnent −6,55 % du poids en six mois, contre −0,35 % sans ce suivi (Steinberg et al., 2013, 91 participants).
- Chez l'adulte, la pesée régulière ne s'accompagne pas d'effet psychologique négatif en moyenne (Zheng et al., 2015 ; Benn et al., 2016).

**Dans le jeu.**

- **La pesée du matin est l'action centrale** : dix secondes, une fois par jour, et tout le reste en découle.
- **La courbe** montre les pesées et la tendance dès la première pesée, échauffement compris. Elle est visible par le joueur seul.
- **Le suivi est consigné et en partie public** : tout le ring voit qui s'est pesé, et le combat du soir en donne le résultat. Ce sont les deux conditions qui renforcent l'effet chez Harkin et al.
- **La tendance lissée** remplace la pesée brute. Le poids varie d'un jour à l'autre sans rapport avec la masse grasse : chez de jeunes hommes, environ un tiers des écarts d'un jour au lendemain atteignent 0,5 kg (Edholm, Adam & Best, 1974), et le poids suit un cycle hebdomadaire, plus haut après le week-end (Orsama et al., 2014). Juger un joueur sur la pesée du jour reviendrait à récompenser le bruit.

**Limites.**

- L'étude qui chiffre l'avantage de la pesée quotidienne (Steinberg et al., 2015) est une analyse d'association, pas un essai : les gens qui se pèsent tous les jours diffèrent peut-être des autres.
- **Habiller la pesée d'un jeu n'ajoute pas forcément de perte de poids.** Dans l'essai LOSE IT, des points et des niveaux en binôme n'ont rien donné de plus que la pesée seule (Kurtzman et al., 2018). Chez des adultes diabétiques, la gamification a augmenté les pas sans changer le poids (Patel et al., 2021). Le pari du jeu est plus modeste : faire durer la pesée.
- Chez les adolescents et les jeunes adultes, surtout les jeunes femmes, la pesée fréquente est associée à davantage de préoccupations liées au poids (Pacanowski et al., 2015). Le lissage de la tendance est un choix de conception inspiré d'applications existantes, pas un résultat d'essai.

### 3.2 Le présent contre le futur

**Le mécanisme.** On accorde un poids démesuré à ce qui arrive tout de suite : c'est la préférence pour le présent, ou actualisation hyperbolique (Ainslie, 1975 ; Laibson, 1997 ; O'Donoghue & Rabin, 1999). Maigrir cumule les deux handicaps : l'effort est immédiat, le bénéfice est lointain et diffus. La parade classique consiste à rapprocher une conséquence dans le temps.

Deux autres ressorts jouent sur le temps :

- **La curiosité.** Loewenstein (1994) la décrit comme un manque, créé par l'écart entre ce que l'on sait et ce que l'on veut savoir. Un résultat qu'on sait proche mais qu'on ne connaît pas encore occupe l'esprit.
- **Le nouveau départ.** Les repères du calendrier ouvrent une « nouvelle période » où l'on se remet plus volontiers à ses objectifs. Dans les archives d'une salle de sport universitaire, la fréquentation augmente de 33,4 % en début de semaine, de 14,4 % en début de mois et de 47,1 % en début de semestre (Dai, Milkman & Riis, 2014).

**Dans le jeu.**

- **« Coup chargé »** : dans la minute qui suit la pesée, un écran montre ce qu'elle rapporte (jab, crochet, jauge de super, série).
- **Le combat a lieu le soir même.** La récompense est à moins de 24 heures, pas à trois mois.
- **Le suspense** : jusqu'à l'heure du combat, on sait qui s'est pesé, mais pas ce que valent les coups. Un compte à rebours indique le temps qu'il reste.
- **Chaque round est un nouveau départ** : la vie repart à 100 PV et le crochet se mesure par rapport au plus bas du round. Une mauvaise semaine n'hypothèque pas la suivante. L'organisateur peut faire démarrer la battle un lundi pour profiter du repère du calendrier.

**Limites.** Ces théories sont solides, mais aucune ne dit qu'un coup de poing virtuel pèse autant qu'une récompense réelle. L'étude de Dai et al. porte sur des données d'archives et sur les repères naturels du calendrier : un début de round est un repère fabriqué. Le lien entre suspense et retour dans l'app est un pari.

### 3.3 La peur de perdre

**Le mécanisme.** Une perte pèse plus lourd qu'un gain de même taille : c'est l'aversion à la perte, au cœur de la théorie des perspectives (Kahneman & Tversky, 1979 ; Tversky & Kahneman, 1991). Une méta-analyse récente situe le coefficient moyen à 1,955, avec un intervalle de 1,82 à 2,10 : une perte compte environ deux fois plus qu'un gain équivalent (Brown, Imai, Vieider & Camerer, 2024). L'effet de dotation en est un cousin : on accorde plus de valeur à ce qu'on possède déjà (Kahneman, Knetsch & Thaler, 1990).

Un essai l'a appliqué à l'activité physique (Patel et al., 2016, 281 participants). Dans un groupe, 42 $ sont avancés chaque mois et 1,40 $ est retiré par jour d'objectif manqué. L'objectif est atteint **45 % des jours**, contre 35 % quand la même somme est présentée comme un gain, 36 % avec une loterie et 30 % sans récompense. Seul le cadrage en perte fait mieux que l'absence de récompense.

**Dans le jeu.**

- **La barre de vie** : 100 PV sont donnés au début de chaque round, et on les défend. C'est le cadrage en perte, traduit en jeu de combat.
- **La série** (combo) : plus elle est longue, plus la rompre coûte.
- **Les gants dorés** s'obtiennent à 21 jours de série et se perdent si elle casse. L'aide le dit : ils restent dorés « tant que ta série tient ».
- **La ceinture se défend** : le champion la garde tant que sa tendance reste à ±1 % de son niveau de fin de battle et qu'il se pèse au moins 5 jours sur 7.

**Limites.**

- L'aversion à la perte n'est pas une loi universelle. Gal & Rucker (2018) contestent sa généralité, et Plott & Zeiler (2005) montrent que l'effet de dotation dépend de la façon dont l'expérience est menée.
- L'essai de Patel porte sur de l'argent réel et sur des pas. Le transposer à des points de vie symboliques est une hypothèse.
- La peur de perdre a un revers : quand ce qu'on protégeait est perdu, l'envie de continuer peut tomber avec. C'est l'objet de la famille suivante.

### 3.4 L'habitude

**Le mécanisme.** Un comportement répété dans le même contexte finit par être déclenché par ce contexte, sans délibération (Wood & Neal, 2007).

- **Combien de temps ?** Dans une étude de suivi, l'automatisme atteint son plateau après une **médiane de 66 jours**, avec une fourchette de 18 à 254 jours selon les personnes et les comportements. Manquer une occasion n'a pas compromis la formation de l'habitude (Lally et al., 2010).
- **Décider d'avance quand et où.** Formuler un plan du type « quand X arrive, je fais Y » augmente le passage à l'action (Gollwitzer, 1999). La méta-analyse de 2006 donnait *d* = 0,65 sur 94 tests ; celle de 2024, sur 642 tests, donne de 0,27 à 0,66 selon le type de résultat (Gollwitzer & Sheeran, 2006 ; Sheeran, Listrom & Gollwitzer, 2024).
- **Un déclencheur au bon moment.** Dans le modèle de Fogg (2009), un comportement survient quand la motivation, la capacité et un déclencheur sont réunis au même instant. C'est un modèle de conception, pas un résultat expérimental.
- **On accélère près du but.** L'effort augmente quand l'objectif approche (Kivetz, Urminsky & Zheng, 2006). Une progression déjà entamée se termine plus souvent : une carte de fidélité déjà tamponnée en partie est complétée par 34 % des clients, contre 19 % pour une carte vierge qui demande le même nombre d'achats (Nunes & Drèze, 2006).
- **Les séries.** Une série rompue réduit l'envie de continuer, et pouvoir la réparer limite ce décrochage (Silverman & Barasch, 2023).
- **« Foutu pour foutu ».** Des personnes au régime à qui l'on a fait rompre leur régime mangent ensuite davantage, à l'inverse des autres (Herman & Mack, 1975). Un écart vécu comme un échec total entraîne l'abandon.

**Dans le jeu.**

- **L'heure de pesée** est choisie par le joueur, et un rappel arrive à cette heure-là : un plan « quand et où », plus un déclencheur. L'aide recommande toujours le même moment et les mêmes conditions, donc un contexte stable.
- **La pesée prend dix secondes** : la capacité n'est jamais l'obstacle.
- **Le combo et ses paliers** (jab plus fort à 7 puis 21 jours), **la jauge de super** (7 crans), **une garde tous les 7 jours** : toujours un but proche.
- **Une série réparable.** La garde sauve automatiquement la série un jour sans pesée. Une pesée faite après la cloche ne donne pas de coup, mais elle sauve la série et met la tendance à jour. Un écart ne devient pas un échec total.
- **On ne part pas de zéro** : les pesées d'échauffement comptent déjà pour la courbe, les badges et la série qui mène aux gants dorés.
- **8 semaines par défaut**, soit 56 jours : l'ordre de grandeur de la médiane de Lally.

**Limites.**

- « 66 jours » n'est pas un seuil. C'est une médiane, calculée sur 39 participants, avec une très grande dispersion.
- L'effet des intentions de mise en œuvre a été revu à la baisse depuis 2006.
- Une série a un revers : quand elle devient le but, sa rupture peut faire tout lâcher. La garde et la pesée tardive servent à l'amortir, sans garantie.

### 3.5 Les autres

**Le mécanisme.**

- **La comparaison sociale.** On s'évalue en se comparant à des gens proches et semblables, avec une poussée à faire un peu mieux qu'eux (Festinger, 1954). La force de cette poussée dépend de la situation : proximité d'un classement, nombre de concurrents, enjeu (Garcia, Tor & Schiff, 2013).
- **L'effet N.** Plus les concurrents sont nombreux, moins chacun s'investit : des participants finissent un quiz plus vite quand ils croient affronter 10 personnes plutôt que 100 (Garcia & Tor, 2009).
- **La rivalité** est une relation, pas une simple compétition. Elle naît de la ressemblance, d'affrontements répétés et de scores serrés (Kilduff, Elfenbein & Staw, 2010). Des coureurs amateurs vont plus vite dans les courses où figure un de leurs rivaux (Kilduff, 2014, données d'archives d'un club).
- **La présence des autres** améliore les tâches simples et bien maîtrisées, et dégrade les tâches complexes (Zajonc, 1965). Se peser est une tâche simple.
- **L'effet Köhler.** Dans un binôme, le membre le moins fort fournit plus d'effort que s'il était seul, surtout quand le résultat du groupe dépend de lui (Hertel, Kerr & Messé, 2000). Avec un partenaire virtuel un peu meilleur qu'eux, des participants tiennent un exercice environ 24 % plus longtemps (Feltz, Kerr & Irwin, 2011).
- **Les groupes minimaux.** Répartir des gens en deux groupes sur un critère sans importance suffit pour qu'ils favorisent le leur (Tajfel, Billig, Bundy & Flament, 1971).
- **Les normes descriptives.** Voir ce que font les autres oriente ce que l'on fait (Cialdini, Reno & Kallgren, 1990).

Les essais de santé vont dans le même sens :

| Essai | Résultat |
|---|---|
| STEP UP (Patel et al., 2019, 602 participants) | Pas quotidiens en plus par rapport aux témoins : **compétition +920**, soutien +689, collaboration +637. Douze semaines après l'arrêt, seule la compétition garde un effet (+569). |
| BE FIT (Patel et al., 2017, 200 participants, en famille) | Objectif atteint 53 % des jours dans le groupe « jeu », contre 32 % chez les témoins. |
| Wing & Jeffery, 1999 | Parmi les participants recrutés avec des amis et dotés d'un soutien social, 66 % maintiennent toute leur perte, contre 24 % de ceux recrutés seuls avec le programme standard. |
| Shape Up Rhode Island (Wing et al., 2009 ; Leahey et al., 2012) | Compétition par équipes à l'échelle d'un État. Sentir l'influence de ses coéquipiers va de pair avec une perte d'au moins 5 % (rapport de cotes de 1,20). |

**Dans le jeu.**

- **Le duel est l'unité de base**, même en tournoi : chaque round oppose deux camps, et l'adversaire change au round suivant. Peu de concurrents, des affrontements répétés, des scores serrés : les ingrédients de la rivalité.
- **Les équipes de 2** : le score est la moyenne des deux membres, avec 2 PV de bonus si les deux se sont pesés. Chacun est indispensable à l'autre.
- **On voit qui s'est pesé.** Une notification part quand l'adversaire du round vient de se peser, et un coup de coude peut être envoyé une fois par jour à un rival en retard.
- **La flamme du ring** : une série commune, qui compte les jours d'affilée où tous les joueurs se sont pesés, rivaux compris. Chacun y est indispensable, comme dans l'effet Köhler ou dans le bras « collaboration » de STEP UP. À 7, 14 et 30 jours, le décor du ring s'embellit : toujours un palier proche ([3.4](#34-lhabitude)). Un absent remet le compteur à zéro, mais le décor gagné reste acquis, et aucun message ne désigne celui qui a éteint la flamme.
- **Le fil du ring et les réactions** donnent un public au combat.

**Limites.**

- STEP UP et BE FIT mesurent des pas, pas du poids.
- Dans l'étude de Feltz, la condition où le résultat dépend du plus faible n'a pas fait mieux que les autres conditions avec partenaire, et le chiffre de 24 % vient d'articles ultérieurs des mêmes auteurs.
- L'essai de Wing & Jeffery n'a pas tiré au sort le fait de venir avec des amis.
- **La flamme du ring est un pari.** L'effet Köhler a été observé entre coéquipiers, pas entre rivaux, et dans STEP UP le bras « collaboration » fait moins bien que la compétition, sans effet qui dure après l'arrêt. Une série commune a aussi un revers : celui qui la rompt peut se sentir fautif devant les autres. Le décor acquis et l'absence de message nominatif servent à l'amortir, sans garantie.
- **La « contagion » de l'obésité n'est pas retenue.** L'étude célèbre qui associe l'obésité d'un ami à un risque accru de 57 % (Christakis & Fowler, 2007) est une association observationnelle, dont la méthode a été contestée (Cohen-Cole & Fletcher, 2008). Le jeu ne s'appuie pas dessus.
- L'expérience de Triplett (1898), souvent citée comme la première preuve que la compétition fait aller plus vite, ne montre presque rien une fois réanalysée (Strube, 2005).
- Se comparer à nettement plus fort que soi peut décourager : voir [3.8](#38-compétence-et-équité).

### 3.6 L'engagement

**Le mécanisme.** Un dispositif d'engagement consiste à se lier les mains aujourd'hui pour tenir demain (Bryan, Karlan & Nelson, 2010). Les essais avec de l'argent montrent un effet réel, mais limité à la durée de l'incitation :

| Essai | Résultat |
|---|---|
| Giné, Karlan & Zinman, 2010 (arrêt du tabac) | Un contrat où l'on dépose son propre argent, perdu en cas d'échec : 11 % des personnes à qui on le propose le signent, et l'offre augmente la réussite d'environ 3 points à six mois. |
| Volpp et al., 2008 (57 participants) | À 16 semaines : −5,9 kg avec une loterie et −6,4 kg avec un dépôt d'argent, contre −1,8 kg chez les témoins. L'écart n'est plus significatif à 7 mois. |
| John et al., 2011 | Avec un dépôt d'argent, la perte est réelle, puis le poids revient après la fin. |
| Kullgren et al., 2013 (105 participants, 24 semaines) | Cagnotte partagée entre ceux qui atteignent l'objectif : −4,8 kg, contre −1,7 kg avec une récompense individuelle et −0,5 kg chez les témoins. |
| Leahey & Rosen, 2014 (DietBet, sans groupe témoin) | Environ −2,6 % du poids en 4 semaines, −4,9 % chez les gagnants. |

S'engager devant les autres met aussi en jeu sa « face » : l'image de soi que l'on revendique dans une interaction et que l'on cherche à ne pas perdre (Goffman, 1955).

**Dans le jeu.**

- **Le gage** : un texte libre, affiché en permanence sur le ring et rappelé à la fin.
- **La cagnotte déclarative** : l'app ne touche jamais l'argent, elle calcule qui doit quoi à qui. Le mode conseillé partage la cagnotte entre ceux qui atteignent l'objectif, sur le modèle de l'essai de Kullgren.
- **L'invitation** : on s'engage devant des gens qu'on connaît, avec une date de départ annoncée.
- **L'après** : la ceinture se défend et la revanche se lance en un clic, parce que l'effet d'un enjeu s'arrête avec lui.

**Limites.**

- Dans ces essais, l'argent est réel et géré par l'étude. Ici, tout est déclaratif entre amis : l'effet peut être plus faible, ou tenir davantage au regard des autres qu'à la somme.
- Chez Kullgren, le groupe « cagnotte » pouvait aussi gagner davantage : on ne peut pas isoler l'effet du partage.
- Après l'arrêt d'incitations financières, le poids revient plus vite, d'environ 1 à 1,5 kg par an de plus (Hartmann-Boyce et al., 2021).
- L'étude souvent citée sur les échéances que l'on s'impose (Ariely & Wertenbroch, 2002) a été rétractée en 2026 : elle n'est pas utilisée ici.

### 3.7 L'identité

**Le mécanisme.**

- **L'auto-efficacité** est la conviction d'être capable d'y arriver. Elle se nourrit surtout des réussites vécues, et aussi de l'observation de modèles qui réussissent (Bandura, 1977).
- **L'effet Protée.** On se conforme en partie aux traits de son avatar (Yee & Bailenson, 2007). Une méta-analyse trouve un effet petit à moyen, entre 0,22 et 0,26 (Ratan et al., 2020).
- **L'auto-modélisation virtuelle.** Des participants qui voient leur double virtuel mincir quand ils font de l'exercice en font ensuite davantage, et plus encore avec leur propre double qu'avec celui d'un inconnu (Fox & Bailenson, 2009).

**Dans le jeu.**

- **Le combattant a la corpulence réelle du joueur**, calculée par l'IMC, et s'affine à mesure que la tendance baisse. La forme « équilibrée » est atteinte vers un IMC de 23 ; au-delà, il ne s'affine plus.
- **« Transformation ! »** : franchir une silhouette clé est annoncé au joueur et dans le fil du ring. Une réussite vécue devient visible.
- **Les gants dorés et la ceinture se portent** : le combattant affiche ce que le joueur a fait.
- **Le palmarès** (pesées, série record, rounds gagnés) raconte une identité : quelqu'un qui se pèse tous les jours.

**Limites.** C'est la famille la plus fragile.

- Ces expériences se déroulent en réalité virtuelle immersive et mesurent un effet à très court terme, comme l'exercice fait dans les minutes qui suivent. Aucune ne mesure une perte de poids, et ici le combattant est un petit personnage en 2D sur un téléphone.
- Un avatar qui reproduit la corpulence réelle peut aussi gêner. Le jeu l'assume : la silhouette est visible de tous les joueurs de la battle, même en mode pudique. Aucune étude citée ici ne dit si l'effet net est positif.

### 3.8 Compétence et équité

**Le mécanisme.**

- **Trois besoins.** Selon la théorie de l'autodétermination, la motivation durable repose sur l'autonomie, le sentiment de compétence et le lien social (Deci & Ryan, 2000 ; Ryan & Deci, 2000). Les jeux vidéo retiennent leurs joueurs dans la mesure où ils satisfont ces besoins (Ryan, Rigby & Przybylski, 2006).
- **Les retours comptent plus que les récompenses.** Dans une méta-analyse de 128 études, les retours verbaux positifs augmentent la motivation intrinsèque (*d* = +0,33), alors que les récompenses matérielles attendues la diminuent (Deci, Koestner & Ryan, 1999, à la suite de Lepper, Greene & Nisbett, 1973).
- **Des objectifs précis et difficiles**, avec un retour d'information, font mieux que « fais de ton mieux » (Locke & Latham, 2002). L'engagement est maximal quand le défi est à la mesure des capacités (Csikszentmihalyi, 1990).
- **Face à beaucoup plus fort, on baisse les bras.** Des golfeurs professionnels jouent moins bien dans les tournois où participe une superstar (Brown, 2011). Dans une classe, un classement et des badges ont fait baisser la motivation et les notes (Hanus & Fox, 2015).
- **La gamification** donne des effets positifs mais dépendants du contexte (Hamari, Koivisto & Sarsa, 2014 ; Koivisto & Hamari, 2019 ; Sailer & Homner, 2020). Points, niveaux et classements augmentent la performance sans augmenter la motivation intrinsèque (Mekler et al., 2017).

**Dans le jeu.**

- **L'équité.** Tout est exprimé en % du poids de départ et calculé sur la tendance lissée. Une pesée faite après l'heure du combat ne frappe pas ce soir-là, et un combat révélé ne change plus. Le Bide, qui complète le tableau quand le nombre de camps est impair, frappe comme la moyenne des autres camps du soir, avec un minimum de 4 PV.
- **Des écarts serrés.** Chaque round repart à 100 PV et le crochet se mesure par rapport au plus bas du round : un joueur distancé au classement peut gagner le round suivant.
- **Plusieurs façons d'être bon.** Les 16 badges couvrent la régularité, la progression et le combat. Se peser donne toujours un jab, même quand le poids stagne.
- **Des objectifs précis et proches** : le prochain palier du combo, la jauge de super, le badge suivant avec son compteur.
- **L'autonomie** : un combattant à soi, un super déclenché le soir que l'on choisit, et pour l'organisateur le format, l'enjeu, le ton et la date de départ.
- **Les retours** : l'écran « Coup chargé » après chaque pesée et le commentateur du combat.

**Limites.**

- Rien n'indique que des badges fassent maigrir à eux seuls (Kurtzman et al., 2018). Ils sont un habillage du retour d'information, pas le moteur.
- La méta-analyse de 1999 reste débattue sur les récompenses matérielles, et des badges n'en sont pas.
- L'étude de Hanus & Fox est une quasi-expérience sur 71 étudiants. Celle de Brown est discutée par des travaux ultérieurs.
- Le score en % du poids de départ est la convention des concours de perte de poids, pas un choix validé par la recherche (voir [00-recherche.md](00-recherche.md), §10).

### 3.9 Le rituel et le récit

**Le mécanisme.**

- **Le jeu comme espace à part.** Pour Huizinga (1938), le jeu est une activité libre, séparée de la vie courante, bornée dans le temps et dans l'espace, avec ses règles propres. L'expression « cercle magique » vient de lui et a été popularisée par Salen & Zimmerman (2003).
- **Quatre formes de jeu.** Caillois (1958) distingue l'*agôn* (la compétition), l'*alea* (le hasard), la *mimicry* (le simulacre) et l'*ilinx* (le vertige). Battle du Bide combine l'*agôn*, un duel où l'on cherche des chances égales, et la *mimicry*, avec un combattant, un ring et un commentateur. Il écarte l'*alea* : aucun coup n'est tiré au sort.
- **Le rituel partagé.** Un rassemblement, une attention commune et une émotion partagée produisent ce que Durkheim (1912) appelle l'effervescence collective. Collins (2004) en fait une théorie des rituels d'interaction : ils chargent les participants d'une « énergie émotionnelle » et les attachent au groupe.
- **La règle pic-fin.** Le souvenir d'une expérience est dominé par son moment le plus intense et par sa fin, bien plus que par sa durée (Kahneman, Fredrickson, Schreiber & Redelmeier, 1993). Une méta-analyse confirme l'effet (Alaybek et al., 2022).
- **Partager une bonne nouvelle.** La raconter à des proches qui y répondent avec enthousiasme en augmente le bénéfice (Gable, Reis, Impett & Asher, 2004).

**Dans le jeu.**

- **Un rendez-vous** : le combat a lieu à heure fixe (21 h par défaut), pour tous les joueurs de la battle, et les résultats sont révélés en même temps.
- **Un récit** : le replay animé, les barres de vie, le commentateur, les sons d'arcade, le K.O.
- **Des pics et des fins soignés** : le bilan de chaque round avec ses exploits et son image à partager, puis la finale avec la ceinture.
- **Des réponses** : les réactions sur le combat et le fil du ring donnent un écho aux bonnes nouvelles.

**Limites.**

- Durkheim et Collins décrivent des rassemblements physiques, et Collins tient la présence des corps pour presque nécessaire. Parler de rituel pour un rendez-vous sur téléphone, que chacun regarde de son côté, est une analogie.
- Huizinga et Caillois proposent des cadres d'analyse, pas des résultats expérimentaux.
- L'expérience de Kahneman porte sur une épreuve désagréable en laboratoire, pas sur un jeu.

### 3.10 Le ton

**Le mécanisme.**

- **La taquinerie** associe une provocation et des signaux qui indiquent qu'on joue. Elle rapproche quand ces signaux dominent et que la relation est proche ; elle blesse quand ils manquent (Keltner et al., 2001).
- **La stigmatisation du poids ne motive pas.** Elle nuit à la santé et n'incite pas à maigrir (Puhl & Heuer, 2010). Tomiyama (2014) décrit un cercle vicieux : la stigmatisation crée du stress, le stress pousse à manger, la prise de poids expose à plus de stigmatisation.
- **Les réglages par défaut.** La plupart des gens gardent l'option proposée d'emblée (Johnson & Goldstein, 2003 ; Thaler & Sunstein, 2008).

**Dans le jeu.**

- **« On chambre le joueur, jamais le corps »** : aucune vanne sur le physique dans les textes de l'app ni dans le commentateur, quel que soit le ton choisi (bon enfant ou trash talk).
- **Le mode pudique est le réglage par défaut** : les autres voient des %, des PV et la silhouette, jamais les kilos. La courbe en kilos n'est visible que par le joueur, et l'image du bilan ne montre pas les kilos.
- **Les notifications ne culpabilisent pas** : elles annoncent un coup à charger, un combat prêt ou une série en jeu, et chaque rappel programmé part au plus une fois par jour.

**Limites.** Le trash talk entre amis reste une taquinerie tant que la relation le supporte, et l'app ne peut pas le vérifier. Le fil du ring est libre : l'app ne modère pas ce que les joueurs s'écrivent.

---

## 4. Ce que dit le cerveau

Les neurosciences ne justifient à elles seules aucune mécanique du jeu. Elles donnent un arrière-plan à ce que la psychologie et l'économie observent dans les comportements.

| Idée | Résultat | Lien avec le jeu |
|---|---|---|
| **Attendre compte autant qu'obtenir** | Les neurones à dopamine signalent l'écart entre la récompense attendue et la récompense reçue, plus que la récompense elle-même (Schultz, Dayan & Montague, 1997). Chez l'humain, l'attente d'un gain active le noyau accumbens (Knutson et al., 2001, 8 participants). Chez le singe, une récompense incertaine entretient cette activité pendant l'attente, au maximum quand elle a une chance sur deux d'arriver (Fiorillo, Tobler & Schultz, 2003). La dopamine relève plus du « vouloir » que du « plaisir » (Berridge & Robinson, 1998). | Le suspense entre la pesée et le combat du soir. |
| **Tout de suite ou plus tard** | Les récompenses immédiates mobiliseraient davantage des régions limbiques, et les choix patients des régions préfrontales (McClure et al., 2004). Kable & Glimcher (2007) contestent cette lecture : une seule valeur subjective serait calculée. | La récompense immédiate de l'écran « Coup chargé ». |
| **Perdre** | Devant des paris à pile ou face, l'activité du striatum et du cortex préfrontal ventromédian baisse davantage pour les pertes possibles qu'elle n'augmente pour les gains, en proportion de l'aversion à la perte de chacun (Tom et al., 2007). | La barre de vie à défendre. |
| **Se comparer** | Quand deux personnes font la même tâche, la réponse du striatum ventral à un gain dépend de ce que l'autre reçoit (Fliessbach et al., 2007). | Le duel. |
| **L'habitude** | À mesure qu'une action devient habituelle, son contrôle glisse du striatum dorsomédian, qui vise un but, vers le striatum dorsolatéral, qui répond au contexte (Yin & Knowlton, 2006 ; Graybiel, 2008). | La pesée à heure fixe. |
| **Être exclu** | Être écarté d'un jeu de balle virtuel active le cortex cingulaire antérieur, également impliqué dans la douleur physique (Eisenberger, Lieberman & Williams, 2003). L'interprétation en « douleur sociale » est contestée. | Ne pas humilier le dernier, mode pudique. |

**Le saut à ne pas faire.** Ces résultats viennent du laboratoire : petits échantillons, récompenses en argent ou en jus de fruit, parfois chez l'animal. Aucune étude d'imagerie n'a porté sur une app de ce genre. Dans le tableau de la partie 2, aucune mécanique n'est classée « établi » sur la foi d'une étude du cerveau.

---

## 5. Limites et choix assumés

### 5.1 Ce que la recherche ne montre pas

- **Le jeu ne fait pas maigrir à lui seul.** Les essais qui ajoutent des points et des niveaux à la pesée ou à la marche ne trouvent pas de perte de poids supplémentaire (Kurtzman et al., 2018 ; Patel et al., 2021).
- **La plupart des essais mesurent des pas, pas des kilos.** Les résultats les plus nets sur la compétition et le cadrage en perte concernent l'activité physique.
- **La nouveauté s'use.** L'effet de la gamification sur l'activité physique passe de *g* = 0,42 pendant l'intervention à 0,15 après (Mazeas et al., 2022). Pokémon Go a fait marcher 25 % de plus ses joueurs les plus engagés (Althoff, White & Horvitz, 2016), mais dans une autre étude le gain de 955 pas par jour de la première semaine a disparu à la sixième (Howe et al., 2016).
- **Les notifications s'usent aussi** : une notification augmente l'engagement des 24 heures suivantes de 3,9 %, et un message répété marche moins bien qu'un message nouveau (Bidargaddi et al., 2018 ; Yancey & Settles, 2020).
- **Le poids revient.** L'effet des incitations s'arrête avec elles (Volpp et al., 2008 ; John et al., 2011 ; Hartmann-Boyce et al., 2021). Six ans après un concours télévisé de perte de poids rapide, 14 participants avaient repris 41 kg en moyenne, et leur métabolisme de repos restait inférieur d'environ 700 kcal par jour à celui du départ (Fothergill et al., 2016).
- **Rien n'a été mesuré dans ce jeu.** Le barème (PV, paliers, crochet) est un point de départ, à calibrer avec l'usage.

### 5.2 Résultats contestés, révisés ou écartés

| Résultat | Statut | Ce qu'on en fait |
|---|---|---|
| Échéances que l'on s'impose (Ariely & Wertenbroch, 2002) | **Rétracté** par la revue en 2026 | Écarté. |
| « Contagion » de l'obésité entre amis (Christakis & Fowler, 2007) | Association contestée (Cohen-Cole & Fletcher, 2008) | Cité pour mémoire, non utilisé. |
| Généralité de l'aversion à la perte | Contestée (Gal & Rucker, 2018) ; la méta-analyse de 2024 maintient un effet moyen proche de 2 | Utilisé, comme hypothèse. |
| Effet de dotation | Dépend des procédures (Plott & Zeiler, 2005) | Utilisé avec prudence (gants dorés, ceinture). |
| Intentions de mise en œuvre | Effet revu à la baisse entre 2006 et 2024 | Utilisé : l'effet reste positif. |
| « 66 jours pour une habitude » (Lally et al., 2010) | Médiane sur 39 personnes, de 18 à 254 jours | Ordre de grandeur, pas un seuil. |
| Récompenses et motivation intrinsèque (Deci, Koestner & Ryan, 1999) | Débattu pour les récompenses matérielles | Retenu pour les retours positifs. |
| Effet de la superstar (Brown, 2011) | Discuté | Indice, pas preuve. |
| Deux systèmes pour l'immédiat et le différé (McClure et al., 2004) | Contesté (Kable & Glimcher, 2007) | Arrière-plan seulement. |
| « Douleur sociale » (Eisenberger et al., 2003) | Interprétation contestée | Arrière-plan seulement. |
| Première expérience de facilitation sociale (Triplett, 1898) | Effet quasi nul après réanalyse (Strube, 2005) | Non utilisé. |
| Effet Köhler avec partenaire virtuel (Feltz et al., 2011) | La condition la plus proche du jeu n'a pas fait mieux que les autres | Plausible, sans plus. |
| Cagnotte de groupe (Kullgren et al., 2013) | Effet du partage non isolé du montant | Mode conseillé, sans promesse. |
| Effet Protée | Effet petit à moyen, mesuré en réalité virtuelle | Pari. |

### 5.3 Ce que le jeu s'interdit, et ce qu'il assume

**Il s'interdit :**

- **La moquerie du corps**, dans tous les textes de l'app, quel que soit le ton choisi.
- **Les kilos exposés par défaut** : le mode pudique est le réglage de départ.
- **La fausse urgence.** Le compte à rebours indique une vraie échéance, l'heure du combat.
- **Le hasard qui accroche.** Aucun coup, aucune récompense n'est tiré au sort : le jeu n'emploie pas les récompenses aléatoires des machines à sous.
- **Les relances en rafale** : chaque rappel programmé part au plus une fois par jour, le coup de coude est limité à un par jour et par personne, et les notifications se coupent dans le profil.
- **Toucher à l'argent** : la cagnotte est déclarative.

**Il assume :**

- **Le crochet n'est pas plafonné.** Perdre plus vite frappe plus fort. C'est un choix de jeu, pas une recommandation de santé : la recherche sur les concours de perte rapide incite plutôt à la prudence (Fothergill et al., 2016).
- **Le combattant montre la corpulence réelle** à tous les joueurs de la battle.
- **Le jeu ne filtre pas ses joueurs.** Les réserves sur la pesée fréquente chez les plus jeunes (Pacanowski et al., 2015) ne se traduisent par aucune règle dans l'app.
- **La rivalité plutôt que l'entraide** comme moteur principal, parce que c'est elle qui tient le mieux dans les essais.

---

## 6. Bibliographie

Classée par discipline, puis par année. Le DOI est donné quand il a été vu dans une source ; sinon, le volume et les pages.

### Économie comportementale et psychologie de la décision

- Ainslie, G. (1975). Specious reward: A behavioral theory of impulsiveness and impulse control. *Psychological Bulletin*. [10.1037/h0076860](https://doi.org/10.1037/h0076860)
- Kahneman, D., & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. *Econometrica*. [10.2307/1914185](https://doi.org/10.2307/1914185)
- Kahneman, D., Knetsch, J. L., & Thaler, R. H. (1990). Experimental tests of the endowment effect and the Coase theorem. *Journal of Political Economy*. [10.1086/261737](https://doi.org/10.1086/261737)
- Tversky, A., & Kahneman, D. (1991). Loss aversion in riskless choice: A reference-dependent model. *The Quarterly Journal of Economics*. [10.2307/2937956](https://doi.org/10.2307/2937956)
- Kahneman, D., Fredrickson, B. L., Schreiber, C. A., & Redelmeier, D. A. (1993). When more pain is preferred to less: Adding a better end. *Psychological Science*. [10.1111/j.1467-9280.1993.tb00589.x](https://doi.org/10.1111/j.1467-9280.1993.tb00589.x)
- Loewenstein, G. (1994). The psychology of curiosity: A review and reinterpretation. *Psychological Bulletin*, 116(1), 75-98.
- Laibson, D. (1997). Golden eggs and hyperbolic discounting. *The Quarterly Journal of Economics*. [10.1162/003355397555253](https://doi.org/10.1162/003355397555253)
- O'Donoghue, T., & Rabin, M. (1999). Doing it now or later. *American Economic Review*. [10.1257/aer.89.1.103](https://doi.org/10.1257/aer.89.1.103)
- Johnson, E. J., & Goldstein, D. (2003). Do defaults save lives? *Science*, 302, 1338-1339.
- Plott, C. R., & Zeiler, K. (2005). The willingness to pay–willingness to accept gap, the "endowment effect," subject misconceptions, and experimental procedures for eliciting valuations. *American Economic Review*. [10.1257/0002828054201387](https://doi.org/10.1257/0002828054201387)
- Kivetz, R., Urminsky, O., & Zheng, Y. (2006). The goal-gradient hypothesis resurrected: Purchase acceleration, illusionary goal progress, and customer retention. *Journal of Marketing Research*, 43(1), 39-58.
- Nunes, J. C., & Drèze, X. (2006). The endowed progress effect: How artificial advancement increases effort. *Journal of Consumer Research*, 32(4), 504-512.
- Thaler, R. H., & Sunstein, C. R. (2008). *Nudge: Improving decisions about health, wealth, and happiness*. Yale University Press.
- Bryan, G., Karlan, D., & Nelson, S. (2010). Commitment devices. *Annual Review of Economics*. [10.1146/annurev.economics.102308.124324](https://doi.org/10.1146/annurev.economics.102308.124324)
- Giné, X., Karlan, D., & Zinman, J. (2010). Put your money where your butt is: A commitment contract for smoking cessation. *American Economic Journal: Applied Economics*, 2(4), 213-235.
- Brown, J. (2011). Quitters never win: The (adverse) incentive effects of competing with superstars. *Journal of Political Economy*. [10.1086/663306](https://doi.org/10.1086/663306)
- Dai, H., Milkman, K. L., & Riis, J. (2014). The fresh start effect: Temporal landmarks motivate aspirational behavior. *Management Science*. [10.1287/mnsc.2014.1901](https://doi.org/10.1287/mnsc.2014.1901)
- Gal, D., & Rucker, D. D. (2018). The loss of loss aversion: Will it loom larger than its gain? *Journal of Consumer Psychology*. [10.1002/jcpy.1047](https://doi.org/10.1002/jcpy.1047)
- Alaybek, B., et al. (2022). All's well that ends (and peaks) well? A meta-analysis of the peak-end rule and duration neglect. *Organizational Behavior and Human Decision Processes*. [10.1016/j.obhdp.2022.104149](https://doi.org/10.1016/j.obhdp.2022.104149)
- Silverman, J., & Barasch, A. (2023). On or off track: How (broken) streaks affect consumer decisions. *Journal of Consumer Research*. [10.1093/jcr/ucac029](https://doi.org/10.1093/jcr/ucac029)
- Brown, A. L., Imai, T., Vieider, F. M., & Camerer, C. F. (2024). Meta-analysis of empirical estimates of loss aversion. *Journal of Economic Literature*. [10.1257/jel.20221698](https://doi.org/10.1257/jel.20221698)

### Psychologie de la motivation, de l'autorégulation et des habitudes

- Lepper, M. R., Greene, D., & Nisbett, R. E. (1973). Undermining children's intrinsic interest with extrinsic reward: A test of the "overjustification" hypothesis. *Journal of Personality and Social Psychology*. [10.1037/h0035519](https://doi.org/10.1037/h0035519)
- Herman, C. P., & Mack, D. (1975). Restrained and unrestrained eating. *Journal of Personality*. [10.1111/j.1467-6494.1975.tb00727.x](https://doi.org/10.1111/j.1467-6494.1975.tb00727.x)
- Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. *Psychological Review*. [10.1037/0033-295X.84.2.191](https://doi.org/10.1037/0033-295X.84.2.191)
- Csikszentmihalyi, M. (1990). *Flow: The psychology of optimal experience*. Harper & Row.
- Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin*. [10.1037/0033-2909.125.6.627](https://doi.org/10.1037/0033-2909.125.6.627)
- Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. *American Psychologist*. [10.1037/0003-066X.54.7.493](https://doi.org/10.1037/0003-066X.54.7.493)
- Deci, E. L., & Ryan, R. M. (2000). The "what" and "why" of goal pursuits: Human needs and the self-determination of behavior. *Psychological Inquiry*. [10.1207/S15327965PLI1104_01](https://doi.org/10.1207/S15327965PLI1104_01)
- Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist*. [10.1037/0003-066X.55.1.68](https://doi.org/10.1037/0003-066X.55.1.68)
- Locke, E. A., & Latham, G. P. (2002). Building a practically useful theory of goal setting and task motivation: A 35-year odyssey. *American Psychologist*. [10.1037/0003-066X.57.9.705](https://doi.org/10.1037/0003-066X.57.9.705)
- Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. *Advances in Experimental Social Psychology*. [10.1016/S0065-2601(06)38002-1](https://doi.org/10.1016/S0065-2601%2806%2938002-1)
- Wood, W., & Neal, D. T. (2007). A new look at habits and the habit-goal interface. *Psychological Review*. [10.1037/0033-295X.114.4.843](https://doi.org/10.1037/0033-295X.114.4.843)
- Fogg, B. J. (2009). A behavior model for persuasive design. *Proceedings of the 4th International Conference on Persuasive Technology* (ACM). [10.1145/1541948.1541999](https://doi.org/10.1145/1541948.1541999)
- Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. *European Journal of Social Psychology*. [10.1002/ejsp.674](https://doi.org/10.1002/ejsp.674)
- Harkin, B., et al. (2016). Does monitoring goal progress promote goal attainment? A meta-analysis of the experimental evidence. *Psychological Bulletin*. [10.1037/bul0000025](https://doi.org/10.1037/bul0000025)
- Sheeran, P., Listrom, O., & Gollwitzer, P. M. (2024). The when and how of planning: Meta-analysis of the scope and components of implementation intentions in 642 tests. *European Review of Social Psychology*. [10.1080/10463283.2024.2334563](https://doi.org/10.1080/10463283.2024.2334563)

### Psychologie sociale

- Festinger, L. (1954). A theory of social comparison processes. *Human Relations*. [10.1177/001872675400700202](https://doi.org/10.1177/001872675400700202)
- Zajonc, R. B. (1965). Social facilitation. *Science*. [10.1126/science.149.3681.269](https://doi.org/10.1126/science.149.3681.269)
- Tajfel, H., Billig, M. G., Bundy, R. P., & Flament, C. (1971). Social categorization and intergroup behaviour. *European Journal of Social Psychology*, 1(2), 149-178.
- Cialdini, R. B., Reno, R. R., & Kallgren, C. A. (1990). A focus theory of normative conduct: Recycling the concept of norms to reduce littering in public places. *Journal of Personality and Social Psychology*. [10.1037/0022-3514.58.6.1015](https://doi.org/10.1037/0022-3514.58.6.1015)
- Hertel, G., Kerr, N. L., & Messé, L. A. (2000). Motivation gains in performance groups: Paradigmatic and theoretical developments on the Köhler effect. *Journal of Personality and Social Psychology*. [10.1037/0022-3514.79.4.580](https://doi.org/10.1037/0022-3514.79.4.580)
- Keltner, D., Capps, L., Kring, A. M., Young, R. C., & Heerey, E. A. (2001). Just teasing: A conceptual analysis and empirical review. *Psychological Bulletin*. [10.1037/0033-2909.127.2.229](https://doi.org/10.1037/0033-2909.127.2.229)
- Gable, S. L., Reis, H. T., Impett, E. A., & Asher, E. R. (2004). What do you do when things go right? The intrapersonal and interpersonal benefits of sharing positive events. *Journal of Personality and Social Psychology*. [10.1037/0022-3514.87.2.228](https://doi.org/10.1037/0022-3514.87.2.228)
- Strube, M. J. (2005). What did Triplett really find? A contemporary analysis of the first experiment in social psychology. *American Journal of Psychology*, 118(2), 271-286.
- Christakis, N. A., & Fowler, J. H. (2007). The spread of obesity in a large social network over 32 years. *New England Journal of Medicine*. [10.1056/NEJMsa066082](https://doi.org/10.1056/NEJMsa066082)
- Cohen-Cole, E., & Fletcher, J. M. (2008). Detecting implausible social network effects in acne, height, and headaches: Longitudinal analysis. *BMJ*. [10.1136/bmj.a2533](https://doi.org/10.1136/bmj.a2533)
- Garcia, S. M., & Tor, A. (2009). The N-effect: More competitors, less competition. *Psychological Science*. [10.1111/j.1467-9280.2009.02385.x](https://doi.org/10.1111/j.1467-9280.2009.02385.x)
- Kilduff, G. J., Elfenbein, H. A., & Staw, B. M. (2010). The psychology of rivalry: A relationally dependent analysis of competition. *Academy of Management Journal*. [10.5465/AMJ.2010.54533171](https://doi.org/10.5465/AMJ.2010.54533171)
- Puhl, R. M., & Heuer, C. A. (2010). Obesity stigma: Important considerations for public health. *American Journal of Public Health*. [10.2105/AJPH.2009.159491](https://doi.org/10.2105/AJPH.2009.159491)
- Feltz, D. L., Kerr, N. L., & Irwin, B. C. (2011). Buddy up: The Köhler effect applied to health games. *Journal of Sport & Exercise Psychology*, 33(4), 506-526.
- Garcia, S. M., Tor, A., & Schiff, T. M. (2013). The psychology of competition: A social comparison perspective. *Perspectives on Psychological Science*. [10.1177/1745691613504114](https://doi.org/10.1177/1745691613504114)
- Kilduff, G. J. (2014). Driven to win: Rivalry, motivation, and performance. *Social Psychological and Personality Science*. [10.1177/1948550614539770](https://doi.org/10.1177/1948550614539770)
- Tomiyama, A. J. (2014). Weight stigma is stressful. A review of evidence for the Cyclic Obesity/Weight-Based Stigma model. *Appetite*. [10.1016/j.appet.2014.06.108](https://doi.org/10.1016/j.appet.2014.06.108)

### Sociologie et études du jeu

- Durkheim, É. (1912). *Les Formes élémentaires de la vie religieuse*. Alcan.
- Huizinga, J. (1938). *Homo ludens*. Traduction française : Gallimard, 1951.
- Goffman, E. (1955). On face-work: An analysis of ritual elements in social interaction. *Psychiatry*. [10.1080/00332747.1955.11023008](https://doi.org/10.1080/00332747.1955.11023008)
- Caillois, R. (1958). *Les Jeux et les Hommes*. Gallimard.
- Salen, K., & Zimmerman, E. (2003). *Rules of play: Game design fundamentals*. MIT Press.
- Collins, R. (2004). *Interaction ritual chains*. Princeton University Press.

### Avatars, jeux vidéo et gamification

- Ryan, R. M., Rigby, C. S., & Przybylski, A. (2006). The motivational pull of video games: A self-determination theory approach. *Motivation and Emotion*. [10.1007/s11031-006-9051-8](https://doi.org/10.1007/s11031-006-9051-8)
- Yee, N., & Bailenson, J. (2007). The Proteus effect: The effect of transformed self-representation on behavior. *Human Communication Research*. [10.1111/j.1468-2958.2007.00299.x](https://doi.org/10.1111/j.1468-2958.2007.00299.x)
- Fox, J., & Bailenson, J. N. (2009). Virtual self-modeling: The effects of vicarious reinforcement and identification on exercise behaviors. *Media Psychology*. [10.1080/15213260802669474](https://doi.org/10.1080/15213260802669474)
- Hamari, J., Koivisto, J., & Sarsa, H. (2014). Does gamification work? A literature review of empirical studies on gamification. *47th Hawaii International Conference on System Sciences*. [10.1109/HICSS.2014.377](https://doi.org/10.1109/HICSS.2014.377)
- Hanus, M. D., & Fox, J. (2015). Assessing the effects of gamification in the classroom: A longitudinal study on intrinsic motivation, social comparison, satisfaction, effort, and academic performance. *Computers & Education*. [10.1016/j.compedu.2014.08.019](https://doi.org/10.1016/j.compedu.2014.08.019)
- Mekler, E. D., Brühlmann, F., Tuch, A. N., & Opwis, K. (2017). Towards understanding the effects of individual gamification elements on intrinsic motivation and performance. *Computers in Human Behavior*. [10.1016/j.chb.2015.08.048](https://doi.org/10.1016/j.chb.2015.08.048)
- Koivisto, J., & Hamari, J. (2019). The rise of motivational information systems: A review of gamification research. *International Journal of Information Management*. [10.1016/j.ijinfomgt.2018.10.013](https://doi.org/10.1016/j.ijinfomgt.2018.10.013)
- Ratan, R., Beyea, D., Li, B. J., & Graciano, L. (2020). Avatar characteristics induce users' behavioral conformity with small-to-medium effect sizes: A meta-analysis of the Proteus effect. *Media Psychology*. [10.1080/15213269.2019.1623698](https://doi.org/10.1080/15213269.2019.1623698)
- Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review*. [10.1007/s10648-019-09498-w](https://doi.org/10.1007/s10648-019-09498-w)
- Yancey, K. P., & Settles, B. (2020). A sleeping, recovering bandit algorithm for optimizing recurring notifications. *Proceedings of KDD '20* (ACM). [10.1145/3394486.3403351](https://doi.org/10.1145/3394486.3403351)
- Mazeas, A., et al. (2022). Evaluating the effectiveness of gamification on physical activity: Systematic review and meta-analysis of randomized controlled trials. *Journal of Medical Internet Research*. [10.2196/26779](https://doi.org/10.2196/26779)

### Neurosciences

- Schultz, W., Dayan, P., & Montague, P. R. (1997). A neural substrate of prediction and reward. *Science*. [10.1126/science.275.5306.1593](https://doi.org/10.1126/science.275.5306.1593)
- Berridge, K. C., & Robinson, T. E. (1998). What is the role of dopamine in reward: Hedonic impact, reward learning, or incentive salience? *Brain Research Reviews*. [10.1016/S0165-0173(98)00019-8](https://doi.org/10.1016/S0165-0173%2898%2900019-8)
- Knutson, B., Adams, C. M., Fong, G. W., & Hommer, D. (2001). Anticipation of increasing monetary reward selectively recruits nucleus accumbens. *The Journal of Neuroscience*. [10.1523/JNEUROSCI.21-16-j0002.2001](https://doi.org/10.1523/JNEUROSCI.21-16-j0002.2001)
- Eisenberger, N. I., Lieberman, M. D., & Williams, K. D. (2003). Does rejection hurt? An fMRI study of social exclusion. *Science*. [10.1126/science.1089134](https://doi.org/10.1126/science.1089134)
- Fiorillo, C. D., Tobler, P. N., & Schultz, W. (2003). Discrete coding of reward probability and uncertainty by dopamine neurons. *Science*. [10.1126/science.1077349](https://doi.org/10.1126/science.1077349)
- McClure, S. M., Laibson, D. I., Loewenstein, G., & Cohen, J. D. (2004). Separate neural systems value immediate and delayed monetary rewards. *Science*. [10.1126/science.1100907](https://doi.org/10.1126/science.1100907)
- Yin, H. H., & Knowlton, B. J. (2006). The role of the basal ganglia in habit formation. *Nature Reviews Neuroscience*. [10.1038/nrn1919](https://doi.org/10.1038/nrn1919)
- Fliessbach, K., et al. (2007). Social comparison affects reward-related brain activity in the human ventral striatum. *Science*. [10.1126/science.1145876](https://doi.org/10.1126/science.1145876)
- Kable, J. W., & Glimcher, P. W. (2007). The neural correlates of subjective value during intertemporal choice. *Nature Neuroscience*. [10.1038/nn2007](https://doi.org/10.1038/nn2007)
- Tom, S. M., Fox, C. R., Trepel, C., & Poldrack, R. A. (2007). The neural basis of loss aversion in decision-making under risk. *Science*. [10.1126/science.1134239](https://doi.org/10.1126/science.1134239)
- Graybiel, A. M. (2008). Habits, rituals, and the evaluative brain. *Annual Review of Neuroscience*. [10.1146/annurev.neuro.29.051605.112851](https://doi.org/10.1146/annurev.neuro.29.051605.112851)

### Essais et revues en santé

- Edholm, O. G., Adam, J. M., & Best, T. W. (1974). Day-to-day weight changes in young men. *Annals of Human Biology*, 1(1), 3-12.
- Wing, R. R., & Jeffery, R. W. (1999). Benefits of recruiting participants with friends and increasing social support for weight loss and maintenance. *Journal of Consulting and Clinical Psychology*. [10.1037/0022-006X.67.1.132](https://doi.org/10.1037/0022-006X.67.1.132)
- Volpp, K. G., et al. (2008). Financial incentive-based approaches for weight loss: A randomized trial. *JAMA*. [10.1001/jama.2008.804](https://doi.org/10.1001/jama.2008.804)
- Wing, R. R., et al. (2009). A statewide intervention reduces BMI in adults: Shape Up Rhode Island results. *Obesity*. [10.1038/oby.2008.655](https://doi.org/10.1038/oby.2008.655)
- Burke, L. E., Wang, J., & Sevick, M. A. (2011). Self-monitoring in weight loss: A systematic review of the literature. *Journal of the American Dietetic Association*. [10.1016/j.jada.2010.10.008](https://doi.org/10.1016/j.jada.2010.10.008)
- John, L. K., et al. (2011). Financial incentives for extended weight loss: A randomized, controlled trial. *Journal of General Internal Medicine*. [10.1007/s11606-010-1628-y](https://doi.org/10.1007/s11606-010-1628-y)
- Leahey, T. M., et al. (2012). Teammates and social influence affect weight loss outcomes in a team-based weight loss competition. *Obesity*. [10.1038/oby.2012.18](https://doi.org/10.1038/oby.2012.18)
- Kullgren, J. T., et al. (2013). Individual- versus group-based financial incentives for weight loss: A randomized, controlled trial. *Annals of Internal Medicine*. [10.7326/0003-4819-158-7-201304020-00002](https://doi.org/10.7326/0003-4819-158-7-201304020-00002)
- Steinberg, D. M., et al. (2013). The efficacy of a daily self-weighing weight loss intervention using smart scales and e-mail. *Obesity*. [10.1002/oby.20396](https://doi.org/10.1002/oby.20396)
- Leahey, T., & Rosen, J. (2014). DietBet: A web-based program that uses social gaming and financial incentives to promote weight loss. *JMIR Serious Games*. [10.2196/games.2987](https://doi.org/10.2196/games.2987)
- Orsama, A.-L., et al. (2014). Weight rhythms: Weight increases during weekends and decreases during weekdays. *Obesity Facts*. [10.1159/000356147](https://doi.org/10.1159/000356147)
- Pacanowski, C. R., Linde, J. A., & Neumark-Sztainer, D. (2015). Self-weighing: Helpful or harmful for psychological well-being? A review of the literature. *Current Obesity Reports*. [10.1007/s13679-015-0142-2](https://doi.org/10.1007/s13679-015-0142-2)
- Pacanowski, C. R., et al. (2015). Self-weighing throughout adolescence and young adulthood: Implications for well-being. *Journal of Nutrition Education and Behavior*. [10.1016/j.jneb.2015.08.008](https://doi.org/10.1016/j.jneb.2015.08.008)
- Steinberg, D. M., et al. (2015). Weighing every day matters: Daily weighing improves weight loss and adoption of weight control behaviors. *Journal of the Academy of Nutrition and Dietetics*. [10.1016/j.jand.2014.12.011](https://doi.org/10.1016/j.jand.2014.12.011)
- Zheng, Y., et al. (2015). Self-weighing in weight management: A systematic literature review. *Obesity*. [10.1002/oby.20946](https://doi.org/10.1002/oby.20946)
- Althoff, T., White, R. W., & Horvitz, E. (2016). Influence of Pokémon Go on physical activity: Study and implications. *Journal of Medical Internet Research*. [10.2196/jmir.6759](https://doi.org/10.2196/jmir.6759)
- Benn, Y., et al. (2016). What is the psychological impact of self-weighing? A meta-analysis. *Health Psychology Review*. [10.1080/17437199.2016.1138871](https://doi.org/10.1080/17437199.2016.1138871)
- Fothergill, E., et al. (2016). Persistent metabolic adaptation 6 years after "The Biggest Loser" competition. *Obesity*. [10.1002/oby.21538](https://doi.org/10.1002/oby.21538)
- Howe, K. B., et al. (2016). Gotta catch'em all! Pokémon GO and physical activity among young adults: Difference in differences study. *BMJ*. [10.1136/bmj.i6270](https://doi.org/10.1136/bmj.i6270)
- Patel, M. S., et al. (2016). Framing financial incentives to increase physical activity among overweight and obese adults: A randomized, controlled trial. *Annals of Internal Medicine*. [10.7326/M15-1635](https://doi.org/10.7326/M15-1635)
- Patel, M. S., et al. (2017). Effect of a game-based intervention designed to enhance social incentives to increase physical activity among families: The BE FIT randomized clinical trial. *JAMA Internal Medicine*. [10.1001/jamainternmed.2017.3458](https://doi.org/10.1001/jamainternmed.2017.3458)
- Bidargaddi, N., et al. (2018). To prompt or not to prompt? A microrandomized trial of time-varying push notifications to increase proximal engagement with a mobile health app. *JMIR mHealth and uHealth*. [10.2196/10123](https://doi.org/10.2196/10123)
- Kurtzman, G. W., et al. (2018). Social incentives and gamification to promote weight loss: The LOSE IT randomized, controlled trial. *Journal of General Internal Medicine*. [10.1007/s11606-018-4552-1](https://doi.org/10.1007/s11606-018-4552-1)
- Patel, M. S., et al. (2019). Effectiveness of behaviorally designed gamification interventions with social incentives for increasing physical activity among overweight and obese adults across the United States: The STEP UP randomized clinical trial. *JAMA Internal Medicine*. [10.1001/jamainternmed.2019.3505](https://doi.org/10.1001/jamainternmed.2019.3505)
- Hartmann-Boyce, J., et al. (2021). Association between characteristics of behavioural weight loss programmes and weight change after programme end: Systematic review and meta-analysis. *BMJ*. [10.1136/bmj.n1840](https://doi.org/10.1136/bmj.n1840)
- Patel, M. S., et al. (2021). Effect of behaviorally designed gamification with social incentives on lifestyle modification among adults with uncontrolled diabetes: A randomized clinical trial. *JAMA Network Open*. [10.1001/jamanetworkopen.2021.10255](https://doi.org/10.1001/jamanetworkopen.2021.10255)
