# Battle du Bide 🥊⚖️

> **Que le meilleur perde !**

Un jeu de combat arcade entre amis, où ta perte de poids réelle devient tes coups.
Chaque matin, ta pesée charge ton coup. À 21 h, les combattants montent sur le ring. Chaque semaine est un round, et à la fin, le vainqueur remporte la ceinture.

## Ce que fait la V1

- **Connexion sans mot de passe** (lien magique par e-mail).
- **Ton combattant** : 12 personnages prêts à jouer, à retoucher (peau, visage, coiffure, barbe, accessoires, âge, tenue, couleurs). Sa corpulence suit ton IMC réel et s'affine au fil des semaines (« Transformation ! »).
- **Look « BD »** (livré, éteint par défaut) : trois catcheurs masqués dessinés à l'encre, une couleur au choix. À essayer sur son appareil par `/look/bd`, à allumer pour tous par `BDB_FIGHTER_STYLE=bd`.
- **Battles** en duel, tournoi (3 à 8) ou équipes de 2 ; invitation par lien ou Signal ; date de départ au choix (dès le soir même) ; 4, 8 ou 12 rounds de 7 jours ; enjeu : gage, cagnotte déclarative ou honneur ; mode pudique (des %, jamais de kilos) ou transparent ; commentateur bon enfant ou trash talk.
- **La pesée du matin** en 10 secondes, puis l'écran **« Coup chargé »** : jab, crochet, jauge de super, garde.
- **Le combat du soir** rejoué en animation, avec barres de vie, éclats, commentateur, sons d'arcade et réactions.
- **Le ring** : face-à-face, classement, rounds, flamme du ring (les jours d'affilée où tout le monde s'est pesé embellissent le décor à 7, 14 et 30 jours), fil de provocations, coups de coude, finale avec ceinture et partage de la cagnotte, revanche en un clic.
- **Notifications** (rappel du matin, combat prêt, série en danger) et **app installable** sur l'écran d'accueil.
- **Badges et récompenses** : 16 badges (régularité, progression, combat), un palmarès, des gants dorés à 21 jours de série et la ceinture de champion portée par le combattant.
- **Le bilan de round** : à la fin de chaque round, ton score, tes pesées, ta série et ta tendance, avec une image à envoyer à tes rivaux (PV et %, jamais de kilos).
- **Ta courbe** : tes pesées et ta tendance en kilos, dès la première pesée (échauffement compris) ; sur le ring, après chaque pesée et dans le profil (30 jours, 90 jours ou tout l'historique). Visible par toi seul.
- **Tes données** : export CSV/JSON et suppression du compte.

## Démarrer

```bash
npm install
cp .env.example .env      # ajuster DATABASE_URL
npm run db:migrate
npm run demo:seed         # facultatif : données de démonstration
npm run dev
```

Puis http://localhost:3000. Sans serveur mail, le lien de connexion s'affiche à l'écran. Comptes de démo : `marc@demo.local`, `julie@demo.local`, `sam@demo.local`, `nadia@demo.local`.

Déploiement sur vos serveurs : **[guide Coolify](docs/04-deploiement-coolify.md)** (Docker Compose : l'app et PostgreSQL).

## Documentation

- [Concept du jeu](docs/01-concept.md) : règles, mécaniques de combat, formats, combattant, enjeux, écrans, périmètre.
- [Direction artistique](docs/02-direction-artistique.md) : palette, typographie, composants, générateur de combattant, sons. [Canevas de design](https://claude.ai/artifact/LkTsuFTThcf2AUkyQ8k4Gx).
- [Architecture technique](docs/03-architecture.md) : stack, moteur de jeu, données, sécurité, tâche planifiée, développement local.
- [Déploiement sur Coolify](docs/04-deploiement-coolify.md) : pas à pas, variables, sauvegardes, dépannage.
- [Les moteurs psychologiques du jeu](docs/05-moteurs-psychologiques.md) : pour chaque mécanique, le ressort sur lequel elle s'appuie (psychologie, économie comportementale, neurosciences, sociologie), son niveau de preuve, ses limites et la bibliographie.
- [Synthèse des recherches](docs/00-recherche.md) : sciences comportementales, gamification, concurrents, formes de jeu.

## Stack

Next.js 16 (App Router, React 19, TypeScript) · Tailwind CSS v4 · PostgreSQL 16 + Drizzle ORM · Web Push · Vitest · Docker.

Licence : [MIT](LICENSE).

## Feuille de route

| Phase | Contenu | Statut |
|---|---|---|
| 1. Concept | Règles du jeu, mécaniques, formats, périmètre V1 | ✅ Validé |
| 2. Design | Direction artistique, combattants paramétriques, maquettes, sons | ✅ Validé |
| 3. Code | PWA Next.js + PostgreSQL, déployable sur Coolify | ✅ V1 livrée |

## Licence

Battle du Bide est publié sous la **[licence MIT](LICENSE)** (© 2026 GDS-42) : chacun peut l'utiliser, le modifier, le partager et l'héberger, y compris à des fins commerciales, à condition de conserver la mention de copyright et le texte de la licence. Le logiciel est fourni tel quel, sans garantie.

Les dépendances (Next.js, React, Drizzle ORM, etc.) restent sous leurs propres licences, de même que les polices Lilita One et Rubik (SIL Open Font License 1.1).
