import 'server-only';
import { cookies } from 'next/headers';
import { styleFrom, type LookStyle } from './fighter/bd';

/** Cookie d'essai : allume (ou éteint) le look « BD » pour cet appareil seulement. Posé par /look/bd, /look/svg, /look/auto. */
export const LOOK_COOKIE = 'bdb-look';

/**
 * Réglage par défaut du dessin des combattants.
 * « bd » : les combattants masqués dessinés, pour tout le monde (réglage actuel).
 * « svg » : les combattants tracés par le code ; seuls les appareils passés par /look/bd voient alors les dessins.
 * La variable d'environnement BDB_FIGHTER_STYLE (bd | svg) prend le pas sur ce réglage, sans toucher au code :
 * « svg » y sert de retour arrière.
 */
export const DEFAULT_LOOK: LookStyle = 'bd';

/** Dessin à utiliser pour cette requête. Lu côté serveur uniquement, puis transmis aux composants. */
export async function fighterStyle(): Promise<LookStyle> {
  const jar = await cookies();
  return styleFrom(DEFAULT_LOOK, process.env.BDB_FIGHTER_STYLE, jar.get(LOOK_COOKIE)?.value);
}
