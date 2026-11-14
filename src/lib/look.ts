import 'server-only';
import { cookies } from 'next/headers';
import { styleFrom, type LookStyle } from './fighter/bd';

/** Cookie d'essai : allume (ou éteint) le look « BD » pour cet appareil seulement. Posé par /look/bd, /look/svg, /look/auto. */
export const LOOK_COOKIE = 'bdb-look';

/**
 * Réglage par défaut du dessin des combattants.
 * « svg » : les combattants dessinés sont livrés mais éteints ; seuls les appareils passés par /look/bd les voient.
 * « bd » : ils sont actifs pour tout le monde.
 * La variable d'environnement BDB_FIGHTER_STYLE (bd | svg) prend le pas sur ce réglage, sans toucher au code.
 */
export const DEFAULT_LOOK: LookStyle = 'svg';

/** Dessin à utiliser pour cette requête. Lu côté serveur uniquement, puis transmis aux composants. */
export async function fighterStyle(): Promise<LookStyle> {
  const jar = await cookies();
  return styleFrom(DEFAULT_LOOK, process.env.BDB_FIGHTER_STYLE, jar.get(LOOK_COOKIE)?.value);
}
