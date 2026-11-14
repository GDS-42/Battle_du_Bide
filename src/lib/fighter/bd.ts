// Look « BD » : des combattants masqués dessinés à l'encre, une image par pose. Le joueur choisit son combattant
// et une couleur (masque, tenue et gants ensemble). Tout ce fichier est pur : aucune lecture de base ni d'environnement.
import { MAIN_COLOR_OPTIONS, PRESETS } from './presets';
import { SPRITES, type FaceMeta, type PoseMeta } from './bd-sprites';
import type { BdKey, FighterConfig, Pose, SpriteLook } from './types';

export const BD_KEYS = ['bulldozer', 'tornado', 'fusee'] as const satisfies readonly BdKey[];
export const BD_BASE = '/bd/v1/';

export interface BdInfo {
  name: string;
  /** Coup spécial proposé par défaut. */
  move: string;
  tag: string;
  /** Couleur d'origine du dessin : avec elle, aucune teinte n'est appliquée. */
  color: string;
  /** Couleur de son liseré : retirée de sa palette, sinon le motif du masque disparaîtrait. */
  trim: string;
}
export const BD_CAST: Record<BdKey, BdInfo> = {
  bulldozer: { name: 'Le Bulldozer', move: 'Le Rouleau Compresseur', tag: 'Rond et têtu', color: '#D22B3A', trim: '#F4F1EA' },
  tornado: { name: 'El Tornado', move: 'La Tornade Tropicale', tag: 'Grand et costaud', color: '#2E9E6B', trim: '#FFD23D' },
  fusee: { name: 'La Fusée', move: 'La Raclette Volante', tag: 'Vive et nerveuse', color: '#2BB5FF', trim: '#E8287C' }
};
export const BD_BOSS = { name: 'Le Bide', color: '#5A2A7A' } as const;

const isBdKey = (v: unknown): v is BdKey => typeof v === 'string' && (BD_KEYS as readonly string[]).includes(v);
const HEX = /^#[0-9A-Fa-f]{6}$/;
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Les couleurs proposées pour un combattant : la palette du jeu, moins la couleur de son liseré. */
export function paletteFor(key: BdKey): [string, string][] {
  return MAIN_COLOR_OPTIONS.filter(([c]) => !same(c, BD_CAST[key].trim));
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** Teinte de la liste la plus proche d'une couleur donnée. */
export function nearestColor(hex: string, list: string[]): string {
  if (!HEX.test(hex) || !list.length) return list[0];
  const [r, g, b] = rgb(hex);
  let best = list[0], d = Infinity;
  for (const c of list) {
    const [r2, g2, b2] = rgb(c);
    const dist = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (dist < d) { d = dist; best = c; }
  }
  return best;
}

// À quel combattant dessiné correspond chacun des douze personnages de l'ancien studio. Le choix part du
// personnage, jamais du poids : il ne change donc pas d'un jour à l'autre.
const PRESET_TO_BD: Record<string, BdKey> = {
  bulldozer: 'bulldozer', bucheron: 'bulldozer',
  papy: 'tornado', tornado: 'tornado', groove: 'tornado', geek: 'tornado', chauve: 'tornado',
  fusee: 'fusee', mamie: 'fusee', ceinture: 'fusee', punk: 'fusee', reine: 'fusee'
};
// Couleur principale par défaut de chaque tenue de l'ancien studio (quand le joueur n'en a pas choisi).
const OUTFIT_MAIN: Record<string, string> = { boxe: '#D22B3A', catch: '#E8287C', kimono: '#F4F1EA', mma: '#2A1548', track: '#5A2A7A' };

/**
 * Combattant et couleur d'un joueur. S'il les a choisis, ce sont eux. Sinon ils sont déduits de son ancien
 * personnage (gabarit → combattant, couleur principale → teinte la plus proche), sans rien écrire en base.
 */
export function resolveLook(cfg: FighterConfig | null | undefined, presetKey?: string | null): { bd: BdKey; color: string } {
  const preset = PRESETS.find((p) => p.key === presetKey);
  const src = cfg ?? preset?.cfg ?? null;
  let bd: BdKey;
  if (isBdKey(cfg?.bd)) bd = cfg.bd;
  else if (src?.base === 'B') bd = 'fusee';
  else {
    const viaPreset = presetKey ? PRESET_TO_BD[presetKey] : undefined;
    bd = viaPreset && viaPreset !== 'fusee' ? viaPreset : 'bulldozer';
  }
  const palette = paletteFor(bd).map(([c]) => c);
  const chosen = typeof cfg?.bdColor === 'string' ? palette.find((c) => same(c, cfg.bdColor!)) : undefined;
  if (chosen) return { bd, color: chosen };
  const main = src?.main && HEX.test(src.main) ? src.main : OUTFIT_MAIN[src?.outfit ?? ''] ?? BD_CAST[bd].color;
  return { bd, color: nearestColor(main, palette) };
}

/** Allure d'affichage d'un joueur, avec ses récompenses. */
export function lookOf(cfg: FighterConfig | null | undefined, presetKey?: string | null, reward?: { gold: boolean; belt: boolean } | null): SpriteLook {
  const { bd, color } = resolveLook(cfg, presetKey);
  return { who: bd, color: same(color, BD_CAST[bd].color) ? null : color, ...(reward?.belt ? { belt: true } : {}), ...(reward?.gold ? { gold: true } : {}) };
}
export const BOSS_LOOK: SpriteLook = { who: 'bide', color: null };

/**
 * Ce qui est enregistré quand le joueur choisit son combattant : son réglage existant, auquel s'ajoutent les deux
 * clés du look. Rien d'autre n'est modifié ni retiré, pour que l'ancien dessin reste disponible à tout moment.
 */
export function mergeLook(stored: FighterConfig | null | undefined, presetKey: string | null | undefined, look: { bd: BdKey; bdColor: string }): FighterConfig {
  const base: FighterConfig = stored ?? PRESETS.find((p) => p.key === presetKey)?.cfg ?? PRESETS.find((p) => p.key === look.bd)?.cfg ?? PRESETS[0].cfg;
  return { ...base, bd: look.bd, bdColor: look.bdColor };
}

/**
 * Deux adversaires à l'allure identique seraient indiscernables : le second passe, le temps de l'affichage,
 * à la teinte suivante de sa palette. Sans effet si les allures diffèrent déjà.
 */
export function distinctPair(a: SpriteLook, b: SpriteLook): SpriteLook {
  if (a.who !== b.who || a.who === 'bide' || b.who === 'bide') return b;
  const eff = (l: SpriteLook) => l.color ?? BD_CAST[l.who as BdKey].color;
  if (!same(eff(a), eff(b))) return b;
  const palette = paletteFor(b.who).map(([c]) => c);
  const i = palette.findIndex((c) => same(c, eff(b)));
  const next = palette[(i + 1) % palette.length];
  return { ...b, color: same(next, BD_CAST[b.who].color) ? null : next };
}

/** Teinte réellement appliquée au dessin : le noir de la palette est éclairci, sinon les plis disparaissent. */
export function tintHex(color: string): string {
  return same(color, '#140A22') ? '#3D3158' : color;
}

export type LookStyle = 'bd' | 'svg';
/**
 * Quel dessin afficher. Par ordre de priorité : le choix d'essai de l'appareil (cookie), la variable
 * d'environnement du serveur, puis le réglage par défaut du code.
 */
export function styleFrom(def: LookStyle, env: string | undefined, cookie: string | undefined): LookStyle {
  if (cookie === 'bd' || cookie === 'svg') return cookie;
  if (env === 'bd' || env === 'svg') return env;
  return def;
}

// ---- Dessins ----
const POSE_OF: Record<Pose, string> = { guard: 'garde', punch: 'jab', hurt: 'touche' };
// Pose de repli quand un combattant n'a pas le dessin demandé (Le Bide n'a pas toutes les poses).
const FALLBACK: Record<string, string[]> = { jab: ['bide', 'garde'], elan: ['garde'], uppercut: ['bide', 'jab', 'garde'], dodo: ['garde'], bide: ['jab', 'garde'], vol: ['touche', 'garde'], ko: ['touche', 'garde'], touche: ['garde'], victoire: ['garde'] };

export function hasSprites(who: string): who is SpriteLook['who'] {
  return Object.prototype.hasOwnProperty.call(SPRITES, who);
}
/** Nom du dessin à utiliser pour une pose (avec repli), et ses repères. */
export function poseFor(who: SpriteLook['who'], pose: string): { pose: string; meta: PoseMeta } {
  const set = SPRITES[who].poses;
  for (const p of [pose, ...(FALLBACK[pose] ?? []), 'garde']) if (set[p]) return { pose: p, meta: set[p] };
  return { pose: 'garde', meta: set.garde };
}
export const spritePoseOf = (pose: Pose | undefined, spritePose?: string) => spritePose ?? POSE_OF[pose ?? 'guard'];
export function faceFor(who: SpriteLook['who'], expr: string): FaceMeta | null {
  return SPRITES[who].faces[expr] ?? null;
}
/** Le Bide garde ses couleurs : seuls les trois combattants des joueurs ont des calques de teinte. */
export const tintable = (who: SpriteLook['who']) => who !== 'bide';
export const spriteUrl = (who: string, pose: string, layer?: 'c' | 'b') => `${BD_BASE}${who}-${pose}${layer ? `.${layer}` : ''}.webp`;
export const faceUrl = (who: string, expr: string, layer?: 'c' | 'o') => `${BD_BASE}${who}-f-${expr}${layer ? `.${layer}` : ''}.webp`;
