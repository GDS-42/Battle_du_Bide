// La salle du ring : de vrais sons de public (fichiers audio dans public/son/v1), générés par une IA de bruitage.
// Les bruitages des coups, eux, restent fabriqués par le code (sound.ts). Ce module ne fait que nommer les fichiers :
// il est pur, donc testable (un test vérifie que chaque fichier cité existe et reste léger).

/** Le fond de salle, et les réactions du public. */
export type CrowdName = 'fond' | 'acclame' | 'ovation' | 'ooh' | 'decu' | 'applaud';

/** Dossier figé : un fichier publié n'est jamais réécrit. Un son modifié part dans /son/v2. */
export const CROWD_BASE = '/son/v1/';

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
