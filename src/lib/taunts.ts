// Fil du ring : chacun écrit son message ; ces quelques suggestions courtes préremplissent le champ.
// On chambre le joueur, jamais le corps.
export const TAUNTS = {
  bon: ['Rendez-vous à 21 h !', 'Ce soir, ça va piquer !', 'Ce round est pour moi.'],
  trash: ['Ce soir, au tapis !', 'Tu fais la sieste ?', 'La ceinture est à moi.']
} as const;

/** Longueur maximale d'un message du fil. */
export const TAUNT_MAX = 140;

/** Nettoie un message libre : caractères de contrôle retirés, espaces resserrés, longueur bornée. */
export function cleanTaunt(raw: unknown): string {
  return String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u2064\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, TAUNT_MAX);
}

export const REACTIONS = [
  { key: 'feu', label: 'En feu', icon: 'fire' },
  { key: 'eclair', label: 'Éclair', icon: 'zap' },
  { key: 'rire', label: 'Mort de rire', icon: 'laugh' },
  { key: 'gant', label: 'Respect', icon: 'glove' }
] as const;
