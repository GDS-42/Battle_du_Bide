# Battle du Bide · Déploiement sur Coolify

L'app se déploie comme **un conteneur Docker** (image Node 22 « standalone », environ 350 Mo) **plus une base PostgreSQL**. Au démarrage, elle applique elle-même les migrations et lance son horloge interne : aucune commande à lancer à la main.

Deux façons de faire sur Coolify :

- **A. Docker Compose** (le plus simple) : l'app et sa base dans une seule ressource, à partir du `docker-compose.yml` du dépôt.
- **B. Dockerfile + base gérée par Coolify** : utile si vous avez déjà un PostgreSQL ou voulez ses sauvegardes intégrées.

## 0. Avant de commencer

1. Un nom de domaine qui pointe vers le serveur Coolify (enregistrement A), par exemple `bide.example.com`. Le HTTPS est géré par Coolify.
2. **Des clés VAPID** pour les notifications push. Sur n'importe quel poste avec Node :
   ```bash
   npx web-push generate-vapid-keys
   ```
   (ou `npm run vapid` dans le dépôt). Gardez la clé publique et la clé privée.
3. **Un compte SMTP** pour envoyer les liens de connexion (Brevo, Mailjet, OVH, Gmail avec mot de passe d'application…). Format de `SMTP_URL` : `smtps://utilisateur:motdepasse@smtp.exemple.com:465`.
   Sans SMTP, les liens n'apparaissent que dans les logs du conteneur : jouable en tout petit comité (vous copiez le lien aux joueurs), mais pas pratique.

## A. Docker Compose (recommandé)

1. **Nouvelle ressource** → *Application* → votre dépôt GitHub (via la GitHub App de Coolify) → branche à déployer.
2. **Build pack** : *Docker Compose*. Fichier : `/docker-compose.yml` (base `/`).
3. **Variables d'environnement** : Coolify détecte les `${…}` du fichier et les affiche. Renseignez au minimum :

   | Variable | Exemple | Rôle |
   |---|---|---|
   | `APP_URL` | `https://bide.example.com` | URL publique (liens magiques, notifications) |
   | `POSTGRES_PASSWORD` | un long mot de passe aléatoire | mot de passe de la base |
   | `SMTP_URL` | `smtps://…@smtp.exemple.com:465` | envoi des liens de connexion |
   | `MAIL_FROM` | `Battle du Bide <ring@example.com>` | expéditeur |
   | `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | clés générées à l'étape 0 | notifications push |
   | `VAPID_SUBJECT` | `mailto:vous@example.com` | contact exigé par Web Push |

   Facultatives : `DEFAULT_TIMEZONE` (`Europe/Paris`), `INTERNAL_CLOCK` (`1`), `CRON_SECRET`, `SHOW_MAGIC_LINK` (`0`).
4. **Domaine** : dans la configuration du service `app`, indiquez `https://bide.example.com:3000`. Le `:3000` dit au proxy de Coolify sur quel port interne joindre l'app ; le site reste servi en HTTPS standard.
5. **Déployer.** Au premier démarrage, les logs de `app` affichent :
   ```
   [bdb] migrations à jour
   [bdb] horloge interne active (une passe par minute)
   ```
6. **Vérifier** : `https://bide.example.com/api/health` doit répondre `{"ok":true}`.

Les volumes `pgdata` (base) et `uploads` (photos de balance) sont persistants : Coolify les conserve d'un déploiement à l'autre.

## B. Dockerfile + PostgreSQL géré par Coolify

1. **Nouvelle ressource** → *Database* → *PostgreSQL 16*. Notez l'URL de connexion interne.
2. **Nouvelle ressource** → *Application* → le dépôt → **Build pack** : *Dockerfile*. Port exposé : `3000`.
3. Variables : `DATABASE_URL` (l'URL interne de l'étape 1), puis les mêmes que ci-dessus (sauf `POSTGRES_PASSWORD`).
4. **Stockage persistant** : ajoutez un volume monté sur `/app/uploads`.
5. Domaine `https://bide.example.com`, puis déployer.

## Après le déploiement

- **Premier test** : ouvrez le site sur votre téléphone, connectez-vous, créez votre combattant, lancez une battle et envoyez le lien d'invitation.
- **Installer l'app** : Android, menu du navigateur → *Installer l'application*. iPhone : Safari → *Partager* → *Sur l'écran d'accueil* (indispensable pour recevoir les notifications sur iOS).
- **Notifications** : chaque joueur les active dans *Profil* → *Activer sur cet appareil*.

## Mises à jour

Poussez sur la branche suivie, puis *Redeploy* dans Coolify (ou activez le déploiement automatique). Les nouvelles migrations s'appliquent au démarrage. Le moteur recalcule les combats à partir des pesées : une mise à jour du barème s'applique donc aussi aux combats passés ; évitez de changer `rules.ts` en cours de battle.

## Dessin des combattants (look « BD »)

Les combattants masqués dessinés sont livrés avec l'app. Le réglage par défaut est dans le code (`DEFAULT_LOOK`, `src/lib/look.ts`).

- **Essayer sur un seul appareil**, sans rien changer pour les autres joueurs : ouvrir `https://bide.example.com/look/bd`. Pour revenir au réglage général : `/look/auto`. C'est un simple cookie ; rien n'est écrit en base.
- **Allumer ou éteindre pour tout le monde sans toucher au code** : variable `BDB_FIGHTER_STYLE`, avec `bd` (combattants dessinés) ou `svg` (tracés par le code), puis redéployer. Laissée vide, le réglage du code s'applique.
- **Retour arrière** : `BDB_FIGHTER_STYLE=svg` rétablit l'ancien dessin, l'ancien studio et l'ancien replay. Les données ne sont pas touchées : le choix d'un combattant dessiné n'ajoute que deux clés au réglage du joueur, sans en retirer aucune.

## Sauvegardes

L'essentiel tient dans la base. Option B : activez les sauvegardes planifiées de la ressource PostgreSQL dans Coolify. Option A : une tâche planifiée Coolify sur le service `db` :

```bash
pg_dump -U bdb battle_du_bide | gzip > /var/lib/postgresql/data/backup-$(date +%F).sql.gz
```

Les photos (volume `uploads`) sont accessoires.

## Dépannage

| Symptôme | Piste |
|---|---|
| `[bdb] base indisponible, nouvel essai…` en boucle | `DATABASE_URL` ou `POSTGRES_PASSWORD` incorrects, ou base pas encore prête |
| Les liens magiques n'arrivent pas | vérifier `SMTP_URL` ; le lien est aussi écrit dans les logs de `app` |
| Le lien de connexion pointe vers `localhost` | `APP_URL` manquante ou erronée |
| Pas de notifications | clés VAPID absentes, notifications non activées sur l'appareil, ou iPhone sans installation sur l'écran d'accueil |
| Pas de « combat prêt » à 21 h | l'horloge interne est-elle active (log au démarrage) ? Si `INTERNAL_CLOCK=0`, un cron externe doit appeler `/api/cron/tick` |
| Mauvaise heure | le fuseau est celui de chaque battle (`Europe/Paris` par défaut), pas celui du serveur |
