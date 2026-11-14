// Le combat du soir, vu par le replay : ce que le serveur prépare (Scene) et sa traduction en une suite de
// séquences d'animation (Beat). Tout ici est pur, donc testable sans navigateur.
import type { FighterRender } from '@/lib/fighter/types';

export interface SideView {
  id: string;
  name: string;
  sub: string;
  boss: boolean;
  fighters: { key: string; cfg: FighterRender }[];
  attack: { total: number; jab: number; crochet: number; super: number; teamBonus: number; weighed: boolean; late: boolean; blocked: boolean; garde: boolean; combo: number };
  /** Nom du coup spécial du camp (annoncé pendant le super). */
  move?: string | null;
}
export interface Scene {
  key: string;
  mine: boolean;
  idle: boolean;
  a: SideView;
  b: SideView;
  hpBefore: { a: number; b: number };
  hpAfter: { a: number; b: number };
  ko: 'a' | 'b' | 'both' | null;
  lines: { a: string[]; b: string[]; end: string | null };
}

export type BlowKind = 'bide' | 'absent' | 'super' | 'crochet' | 'bloque' | 'jab';

/** Le coup d'un camp ce soir-là. Même ordre de priorité que l'étiquette affichée par le replay. */
export function blowOf(s: SideView): BlowKind {
  const a = s.attack;
  if (s.boss) return 'bide';
  if (!a.weighed) return 'absent';
  if (a.super > 0) return 'super';
  if (a.crochet > 0) return 'crochet';
  if (a.blocked) return 'bloque';
  return 'jab';
}

interface Blow { by: 'a' | 'b'; blow: BlowKind; dmg: number; late: boolean; move: string | null }
export type Beat =
  | { kind: 'intro' }
  | ({ kind: 'blow' } & Blow)
  /** Coup final : le camp `by` met l'autre K.O. */
  | ({ kind: 'ko' } & Blow)
  | { kind: 'doubleKo' };

const blow = (s: SideView, by: 'a' | 'b'): Blow => ({ by, blow: blowOf(s), dmg: Math.max(0, Math.round(s.attack.total)), late: s.attack.late, move: s.move ?? null });

/**
 * Suite de séquences d'un combat. Sans K.O. : A frappe, puis B. Avec K.O. : le futur vaincu frappe d'abord, puis
 * le vainqueur porte le coup final (celui qui tombe ne frappe plus ensuite). Double K.O. : une seule séquence croisée.
 * Un combat sans coup (déjà plié plus tôt dans le round) ne donne aucune séquence.
 */
export function toBeats(scene: Scene, intro: boolean): Beat[] {
  if (scene.idle) return [];
  const a = blow(scene.a, 'a'), b = blow(scene.b, 'b');
  const head: Beat[] = intro ? [{ kind: 'intro' }] : [];
  if (scene.ko === 'both') return [...head, { kind: 'doubleKo' }];
  if (scene.ko === 'b') return a.blow === 'absent' ? [...head, { kind: 'blow', ...b }, { kind: 'blow', ...a }] : [...head, { kind: 'blow', ...b }, { kind: 'ko', ...a }];
  if (scene.ko === 'a') return b.blow === 'absent' ? [...head, { kind: 'blow', ...a }, { kind: 'blow', ...b }] : [...head, { kind: 'blow', ...a }, { kind: 'ko', ...b }];
  return [...head, { kind: 'blow', ...a }, { kind: 'blow', ...b }];
}

/** Camps qui agissent pendant une séquence (pour révéler leurs dégâts et leurs lignes de commentaire). */
export function actorsOf(beat: Beat): ('a' | 'b')[] {
  if (beat.kind === 'intro') return [];
  if (beat.kind === 'doubleKo') return ['a', 'b'];
  return [beat.by];
}
