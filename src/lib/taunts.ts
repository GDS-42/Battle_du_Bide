// Provocations prêtes à l'emploi. On chambre le joueur, jamais le corps.
export const TAUNTS = {
  bon: [
    'Rendez-vous sur le ring à 21 h !',
    'Prépare ta serviette, ce soir ça va piquer !',
    'Ma tendance descend, la tienne médite ?',
    'Je me pèse demain à 7 h pile, et toi ?',
    'Belle série ! Mais la mienne est plus longue.',
    'Ce round est pour moi, c’est écrit.'
  ],
  trash: [
    'Tu t’entraînes ou tu fais la sieste ?',
    'Ce soir, je te mets au tapis.',
    'Ta jauge de super, elle est en grève ?',
    'J’espère que t’as pris un protège-dents.',
    'La ceinture ? Je lui ai déjà fait une place.',
    'Tu sèches la pesée ou tu as perdu la balance ?'
  ]
} as const;

export const REACTIONS = [
  { key: 'feu', label: 'En feu', icon: 'fire' },
  { key: 'eclair', label: 'Éclair', icon: 'zap' },
  { key: 'rire', label: 'Mort de rire', icon: 'laugh' },
  { key: 'gant', label: 'Respect', icon: 'glove' }
] as const;
