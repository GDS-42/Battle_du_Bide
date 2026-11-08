# Battle du Bide 🥊⚖️

> **Que le meilleur perde !**

Un jeu de combat arcade entre amis, où ta perte de poids réelle devient tes coups.
Chaque matin, ta pesée charge ton coup. À 21 h, les combattants montent sur le ring. Chaque semaine est un round, et à la fin, le vainqueur remporte la ceinture.

## Ce que fait la V1

- **Connexion sans mot de passe** (lien magique par e-mail).
- **Ton combattant** : 12 personnages prêts à jouer, à retoucher (peau, visage, coiffure, barbe, accessoires, âge, tenue, couleurs). Sa corpulence suit ton IMC réel et s'affine au fil des semaines (« Transformation ! »).
- **Battles** en duel, tournoi (3 à 8) ou équipes de 2 ; invitation par lien ou WhatsApp ; 4, 8 ou 12 rounds ; enjeu : gage, cagnotte déclarative ou honneur ; mode pudique (des %, jamais de kilos) ou transparent ; commentateur bon enfant ou trash talk.
- **La pesée du matin** en 10 secondes, puis l'écran **« Coup chargé »** : jab, crochet, jauge de super, garde.
- **Le combat du soir** rejoué en animation, avec barres de vie, éclats, commentateur, sons d'arcade et réactions.
- **Le ring** : face-à-face, classement, rounds, courbe de tendance, fil de provocations, coups de coude, finale avec ceinture et partage de la cagnotte, revanche en un clic.
- **Notifications** (rappel du matin, combat prêt, série en danger) et **app installable** sur l'écran d'accueil.
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
- [Synthèse des recherches](docs/00-recherche.md) : sciences comportementales, gamification, concurrents, formes de jeu.

## Stack

Next.js 16 (App Router, React 19, TypeScript) · Tailwind CSS v4 · PostgreSQL 16 + Drizzle ORM · Web Push · Vitest · Docker.

## Feuille de route

| Phase | Contenu | Statut |
|---|---|---|
| 1. Concept | Règles du jeu, mécaniques, formats, périmètre V1 | ✅ Validé |
| 2. Design | Direction artistique, combattants paramétriques, maquettes, sons | ✅ Validé |
| 3. Code | PWA Next.js + PostgreSQL, déployable sur Coolify | ✅ V1 livrée |
