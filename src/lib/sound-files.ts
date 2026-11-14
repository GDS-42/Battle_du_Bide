// Les vrais sons du jeu (fichiers audio dans public/son/v1), générés par une IA de bruitage : la salle du ring
// (fond de foule et réactions du public) et les coups (poings, chute au tapis, cloche). Les autres bruitages restent
// fabriqués par le code (sound.ts), qui sert aussi de repli tant qu'un fichier n'est pas chargé.
// Ce module ne fait que nommer les fichiers : il est pur, donc testable (un test vérifie que chaque fichier cité
// existe et reste léger).

/** Le fond de salle, et les réactions du public. */
export type CrowdName = 'fond' | 'acclame' | 'ovation' | 'ooh' | 'decu' | 'applaud';

/** Dossier figé : un fichier publié n'est jamais réécrit. Un son modifié part dans /son/v2. */
export const SOUND_BASE = '/son/v1/';

/** Les coups enregistrés : jab, crochet, coup du K.O., chute au tapis, un coup de cloche. */
export type HitName = 'jab' | 'crochet' | 'ko' | 'thud' | 'cloche';

/** Fichiers de chaque coup. Plusieurs prises : un coup ne sonne jamais deux fois de suite pareil. */
export const HIT_FILES: Record<HitName, string[]> = {
  jab: ['jab-1.mp3', 'jab-2.mp3', 'jab-3.mp3'],
  crochet: ['crochet-1.mp3', 'crochet-2.mp3', 'crochet-3.mp3'],
  ko: ['ko.mp3'],
  thud: ['thud-1.mp3', 'thud-2.mp3'],
  cloche: ['cloche.mp3']
};

/** Fichiers de chaque son. Quand il y a plusieurs prises, on en change à chaque fois : la salle ne se répète pas. */
export const CROWD_FILES: Record<CrowdName, string[]> = {
  fond: ['fond.mp3'],
  acclame: ['acclame.mp3'],
  ovation: ['ovation.mp3'],
  ooh: ['ooh-1.mp3', 'ooh-2.mp3'],
  decu: ['decu.mp3'],
  applaud: ['applaud.mp3']
};

/**
 * Boucle du fond, en secondes, à l'intérieur du fichier. Le fichier contient la boucle (8,2 s) précédée de sa propre
 * fin et suivie de son propre début (0,5 s de chaque côté) : on boucle donc loin des bords, et le raccord reste
 * inaudible même si le décodeur décale un peu le son (un MP3 ajoute toujours un court silence au début et à la fin).
 */
export const CROWD_LOOP = { start: 0.5, end: 8.7 };
