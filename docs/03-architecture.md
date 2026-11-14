# Battle du Bide · Architecture technique

## 1. Vue d'ensemble

Une seule application **Next.js 16** (App Router, React 19, TypeScript), installable comme une app mobile (**PWA**), avec une base **PostgreSQL**. Pas de service tiers obligatoire : les e-mails (SMTP) et les notifications push (VAPID) sont facultatifs.

```
Navigateur / PWA ──HTTPS──▶ Next.js (Node 22, « standalone »)
                              ├─ pages serveur + server actions
                              ├─ routes /api (push, export, photos, santé, tâche planifiée)
                              ├─ horloge interne : POST /api/cron/tick chaque minute
                              └─ Drizzle ORM ──▶ PostgreSQL 16
                                                  └─ volume /app/uploads (photos de balance)
```

| Brique | Choix |
|---|---|
| Interface | Next.js App Router, composants serveur par défaut, Tailwind CSS v4 |
| Données | PostgreSQL + Drizzle ORM ; migrations SQL versionnées dans `drizzle/`, appliquées au démarrage |
| Connexion | lien magique par e-mail (aucun mot de passe) |
| Notifications | Web Push (VAPID) via un service worker |
| Tests | Vitest (moteur de jeu, dates, générateur de combattant, look « BD ») ; parcours Playwright manuel |

## 2. Arborescence

```
src/
  app/
    page.tsx                    accueil
    connexion/, auth/verifier/  lien magique
    combattant/                 studio : galerie → retouches → fiche ; avec le look « BD » : combattant et couleur → fiche
    look/[style]/               lien d'essai du look « BD » pour un seul appareil (cookie)
    b/[code]/                   page d'invitation (publique)
    (app)/                      espace connecté, avec barre de navigation
      battles/                  liste, création, ring, replay du combat du soir, bilan de round et son image à partager
    BdHome.tsx                  accueil du look « BD » (affiche de combat : ring peint, catcheurs, devise) ; `page.tsx` garde l'accueil d'origine en repli
    bd.css                      styles du look « BD » : combat animé (`.bdx`) et accueil (`.bdh`)
      pesee/                    pesée du matin, puis « coup chargé »
      profil/                   combattant, réglages, export, suppression
    actions/                    server actions (auth, combattant, pesée, battle, profil)
    api/                        push, export, photos/[id], health, cron/tick
    icons/[size]/, manifest.ts  PWA
  components/                   Fighter (tracé SVG, ou dessin BdFighter selon le look), ui (rubans, barres de vie…), WeightChart (courbe de pesées)…
    bd/engine.ts                moteur du combat animé (look « BD »), chargé au clic sur « Lancer le combat »
  lib/
    engine/                     moteur de jeu PUR (aucune dépendance à la base)
    fighter/                    générateur de combattant et presets ; look « BD » (bd.ts : choix, palette, fusion ; bd-sprites.ts : repères des dessins)
    replay/model.ts             le combat du soir traduit en suite de séquences d'animation (pur, testé)
    look.ts                     quel dessin afficher pour cette requête (réglage du code, variable d'environnement, cookie d'essai)
    db/                         schéma Drizzle, connexion, migrations
    battles.ts, weighin.ts      chargement des données, règles d'écriture
    career.ts                   palmarès, badges et récompenses portées par le combattant (calculés, jamais stockés)
    notify.ts, push.ts          tâche planifiée et notifications
    auth.ts, mail.ts            sessions et liens magiques
    time.ts                     dates locales par fuseau (sans dépendance)
    sound.ts                    bruitages synthétisés en couches (Web Audio), limiteur et réverbération ; aucun fichier audio
    crowd.ts                    la foule du ring, fabriquée (voix synthétiques, applaudissements) ; pur et testé, chargé à la demande
drizzle/                        migrations SQL
design/                         sources du canevas de DA et atelier du combattant
scripts/                        migrate, seed-demo, vapid
```

## 3. Le moteur de jeu

Tout le jeu tient dans [`src/lib/engine/`](../src/lib/engine/) : des **fonctions pures et déterministes**. L'état d'une battle n'est **jamais stocké** : il est recalculé à chaque affichage à partir des pesées (`simulateBattle(input, until)`).

- **Tendance** : moyenne mobile exponentielle (α = 0,2). Une pesée qui s'écarte de plus de 2 % est « à confirmer » et ne compte qu'une fois confirmée le lendemain (à 1 % près).
- **Date de départ** : choisie par l'organisateur (d'aujourd'hui à 60 jours, voir `src/lib/start-date.ts`), modifiable tant qu'aucun combat n'a été joué. Le moteur ne dépend pas du jour de la semaine : un round = 7 jours comptés depuis `startDate`.
- **Poids de départ** : moyenne des 3 dernières pesées d'échauffement (avant le jour de départ), sinon la première pesée de la battle.
- **Coups** : jab de 4 à 6 PV selon le combo (paliers à 7 et 21 jours), crochet de 50 PV par point de pourcentage sous le plus bas du round, super de +15 PV quand la jauge (7 crans) est pleine et armée. Pas de plafond.
- **Rounds** : une semaine, 100 PV par camp, K.O. à 0. Vainqueur aux PV restants, puis au nombre de pesées. Champion : victoires, puis dégâts infligés.
- **Formats** : duel, tournoi (appariements par la méthode du cercle), équipes de 2 (moyenne des membres, +2 si tous pesés). Si le nombre de camps est impair, **Le Bide** complète le tableau : ce boss frappe comme la moyenne des autres camps du soir, avec un minimum de 4 PV.
- **Flamme du ring** (`ringFlame`, [`flame.ts`](../src/lib/engine/flame.ts)) : nombre de jours d'affilée où tous les joueurs se sont pesés. Elle est calculée jusqu'à aujourd'hui, et non jusqu'au dernier combat révélé : savoir qui s'est pesé n'est pas un secret. Une pesée tardive compte, une garde non, et la journée en cours ne casse pas la flamme tant qu'elle n'est pas finie. Le décor du ring s'embellit à 7, 14 et 30 jours ; le palier suit la meilleure flamme de la battle, donc un décor gagné reste acquis.
- Barème : [`rules.ts`](../src/lib/engine/rules.ts). Règles détaillées : [concept, §5](01-concept.md).

**Règle d'équité du soir.** Une pesée ne frappe au combat d'une date que si elle a été saisie **avant l'heure du combat** de cette battle, ce jour-là. Saisie après, elle est « tardive » : pas de coup, mais elle compte pour la série, la jauge et la tendance. Un combat révélé ne peut donc plus changer. La première pesée du jour est corrigeable 10 minutes, jamais après un combat déjà joué.

**Départ effectif** (`settleStart`, `src/lib/battles.ts`). À chaque chargement d'une battle non démarrée dont l'heure du premier combat est passée : s'il y a au moins deux camps, `battles.started` passe à vrai et les inscriptions ferment ; sinon `startDate` est reportée au prochain soir. Personne n'affronte Le Bide faute d'adversaire, et aucun combat joué n'est réécrit.

**Révélation.** Le combat du jour est visible à partir de l'heure du combat (21 h par défaut, dans le fuseau de la battle). Avant, les résultats des rivaux restent secrets ; on sait seulement qui s'est pesé.

## 4. Données

Tables principales ([`schema.ts`](../src/lib/db/schema.ts)) : `users` (profil, combattant en JSON, taille, heure de pesée, fuseau ; le JSON peut porter en plus le combattant dessiné choisi et sa couleur, `bd` et `bdColor`), `battles` (format, rounds, date de début, heure du combat, enjeu, confidentialité, ton), `battle_members`, `weighins` (une par joueur et par jour), `supers`, `feed` (provocations, transformations, coups de coude), `reactions`, `nudges`, `push_subscriptions`, `notif_log`, `sessions`, `login_tokens`.

Les pesées appartiennent au **joueur**, pas à la battle : une même pesée compte dans toutes ses battles en cours.

**Le look « BD » n'a demandé aucune migration.** Le combattant dessiné et sa couleur sont deux clés facultatives du JSON `users.fighter`. Tant qu'un joueur n'a rien choisi, ils sont déduits à l'affichage de son ancien personnage (`resolveLook`, pur et testé), sans rien écrire. Le studio des combattants dessinés n'envoie que ce choix ; le serveur le fusionne dans le réglage enregistré (`mergeLook`), sans retirer aucune clé : le tracé d'origine reste disponible à tout moment. Le dessin à afficher est décidé côté serveur (`src/lib/look.ts`) puis transmis aux composants.

**Le combat animé du look « BD »** s'ajoute au replay sans le remplacer :

- Le serveur prépare le même combat qu'avant. [`src/lib/replay/model.ts`](../src/lib/replay/model.ts) le traduit en une suite de séquences (`toBeats`) : face-à-face, coup de chaque camp, coup final. C'est une fonction pure, testée.
- [`src/components/bd/engine.ts`](../src/components/bd/engine.ts) joue ces séquences. Il n'est **chargé qu'au clic** sur « Lancer le combat » et ne touche au navigateur qu'à l'intérieur de `createStage()` : il ne peut donc pas faire échouer l'affichage de la page. Il prévient le replay au début de chaque séquence et à l'instant où un coup porte ; barres de vie et commentaire restent rendus par React.
- **Tout défaut ramène au replay sobre**, celui d'avant, resté en place dans `CombatReplay.tsx` : dessin introuvable ou trop long à charger, moteur qui ne se charge pas, joueur qui a demandé moins de mouvement.
- Les textes saisis par les joueurs (nom du camp, coup spécial) ne sont jamais interprétés comme du HTML : React les échappe, et le moteur les pose par `textContent`.
- **La foule** : `prepareCrowd()` (`src/lib/sound.ts`) fabrique les sons de foule une seule fois, au lancement du combat, par petits lots et avant que l'animation démarre. Le moteur déclenche ensuite les réactions (`crowd`) et allume ou éteint le fond (`bed`) ; une réaction pas encore prête est simplement sautée.
- Les styles sont dans `src/app/bd.css`, tous sous la classe `.bdx` et préfixés `bdx-` : ils ne peuvent pas toucher le reste du jeu.

## 5. Sécurité et confidentialité

- **Lien magique** : jeton aléatoire stocké haché (SHA-256), valable 20 minutes, à usage unique, consommé par un **POST** (bouton « Me connecter ») pour que les antivirus de messagerie qui ouvrent les liens ne le grillent pas. Session en cookie `HttpOnly`, `SameSite=Lax`, 90 jours.
- **Mode pudique** (par défaut) : les autres joueurs ne voient que des pourcentages, jamais de kilos. Les photos de balance ne sont visibles des autres que dans une battle en mode **transparent**.
- **Accès** : chaque page et action de battle vérifie l'appartenance du joueur ; les photos passent par `/api/photos/[id]`, qui contrôle la battle commune.
- **Données personnelles** : export CSV/JSON et suppression du compte depuis le profil (les battles créées passent à un autre membre).

## 6. Tâche planifiée et notifications

Au démarrage, [`instrumentation-node.ts`](../src/instrumentation-node.ts) applique les migrations, puis lance une **horloge interne** qui appelle `POST /api/cron/tick` chaque minute. Un verrou PostgreSQL (`pg_try_advisory_lock`) évite les doublons si plusieurs instances tournent ; chaque notification a une clé unique dans `notif_log`, ce qui rend la tâche idempotente.

| Notification | Quand |
|---|---|
| Pesée du matin | à l'heure de pesée choisie (jusqu'à 3 h après), si pas encore pesé |
| Combat prêt | à l'heure du combat (jusqu'à 3 h après) ; message spécial en fin de round et en finale |
| Série en danger | dans l'heure avant le combat, si pas pesé et combo ≥ 3 |
| Ton rival vient de se peser | à la pesée d'un joueur : son adversaire du round (et son coéquipier) pas encore pesé, une fois par jour et par battle |
| Coup de coude, arrivée d'un joueur | immédiatement |

Pour piloter la tâche depuis l'extérieur (cron, plusieurs instances) : `INTERNAL_CLOCK=0` et `CRON_SECRET`, puis appeler `POST /api/cron/tick` avec `Authorization: Bearer <CRON_SECRET>` chaque minute.

## 7. Développer en local

```bash
npm install
cp .env.example .env    # puis ajuster DATABASE_URL (PostgreSQL local)
npm run db:migrate
npm run demo:seed       # facultatif : 4 combattants et 2 battles commencées il y a 2 semaines
npm run dev
```

Sans `SMTP_URL`, le lien magique s'affiche à l'écran (hors production) et dans les logs. Pour se connecter à la démo : `marc@demo.local`, `julie@demo.local`, `sam@demo.local` ou `nadia@demo.local`.

**Voyager dans le temps** : `BDB_FAKE_NOW=2026-11-08T20:05:00Z npm run dev` fige l'horloge de l'app (en production, seulement avec `ALLOW_FAKE_NOW=1`). Pratique pour voir le combat du soir sans attendre 21 h.

Vérifications :

```bash
npm run typecheck
npm test
npm run build
```
