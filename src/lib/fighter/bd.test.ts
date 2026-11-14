import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  BD_CAST, BD_KEYS, BOSS_LOOK, distinctPair, faceFor, faceUrl, hasSprites, lookOf, mergeLook, nearestColor, paletteFor,
  poseFor, resolveLook, spritePoseOf, spriteUrl, styleFrom, tintable, tintHex
} from './bd';
import { SPRITES } from './bd-sprites';
import { MAIN_COLOR_OPTIONS, PRESETS } from './presets';
import type { FighterConfig } from './types';
import { BdLookSchema, FighterSchema } from '../validation';

const PUBLIC = path.resolve(__dirname, '../../../public');

describe('look « BD » : combattant et couleur d’un joueur', () => {
  it('chaque ancien personnage donne un combattant dessiné, sans dépendre du poids', () => {
    const expected: Record<string, string> = {
      bulldozer: 'bulldozer', bucheron: 'bulldozer',
      papy: 'tornado', tornado: 'tornado', groove: 'tornado', geek: 'tornado', chauve: 'tornado',
      fusee: 'fusee', mamie: 'fusee', ceinture: 'fusee', punk: 'fusee', reine: 'fusee'
    };
    for (const p of PRESETS) {
      const stored = resolveLook(p.cfg, p.key);
      expect(stored.bd, p.key).toBe(expected[p.key]);
      // joueur qui n'a jamais retouché son personnage : seul le nom du personnage est enregistré
      expect(resolveLook(null, p.key).bd, p.key).toBe(expected[p.key]);
      expect(paletteFor(stored.bd).map(([c]) => c)).toContain(stored.color);
    }
  });

  it('un réglage vide ou incomplet donne quand même un combattant et une couleur proposée', () => {
    for (const cfg of [null, undefined, {}, { base: 'A' } as FighterConfig, { outfit: 'kimono' } as FighterConfig]) {
      const l = resolveLook(cfg, null);
      expect(BD_KEYS).toContain(l.bd);
      expect(paletteFor(l.bd).map(([c]) => c)).toContain(l.color);
    }
    expect(resolveLook({ base: 'B' }, null).bd).toBe('fusee');
    expect(resolveLook({ base: 'A' }, 'fusee').bd).toBe('bulldozer'); // gabarit retouché : il l'emporte sur le personnage de départ
  });

  it('le choix du joueur l’emporte, et une valeur inconnue est ignorée sans erreur', () => {
    expect(resolveLook({ base: 'B', main: '#D22B3A', bd: 'tornado', bdColor: '#2BB5FF' }, 'fusee')).toEqual({ bd: 'tornado', color: '#2BB5FF' });
    expect(resolveLook({ bd: 'inconnu' as never, base: 'B' }, null).bd).toBe('fusee');
    // la couleur du liseré n'est pas proposée : on retombe sur la teinte la plus proche de la couleur principale
    const l = resolveLook({ bd: 'tornado', bdColor: BD_CAST.tornado.trim, main: '#D22B3A' }, null);
    expect(l).toEqual({ bd: 'tornado', color: '#D22B3A' });
  });

  it('la couleur principale donne la teinte la plus proche de la palette', () => {
    expect(resolveLook({ base: 'A', main: '#2BB5FF' }, 'bulldozer').color).toBe('#2BB5FF');
    expect(nearestColor('#D02030', MAIN_COLOR_OPTIONS.map(([c]) => c))).toBe('#D22B3A');
    expect(nearestColor('pas une couleur', ['#D22B3A', '#2BB5FF'])).toBe('#D22B3A');
  });

  it('chaque combattant a sept couleurs : la palette moins celle de son liseré', () => {
    for (const k of BD_KEYS) {
      const p = paletteFor(k).map(([c]) => c);
      expect(p).toHaveLength(7);
      expect(p).not.toContain(BD_CAST[k].trim);
      expect(p).toContain(BD_CAST[k].color);
    }
  });

  it('allure d’affichage : couleur d’origine sans teinte, récompenses reportées', () => {
    expect(lookOf({ base: 'A', main: '#D22B3A' }, 'bulldozer')).toEqual({ who: 'bulldozer', color: null });
    expect(lookOf({ bd: 'bulldozer', bdColor: '#2BB5FF' }, null, { gold: true, belt: true })).toEqual({ who: 'bulldozer', color: '#2BB5FF', belt: true, gold: true });
    expect(tintHex('#140A22')).not.toBe('#140A22');
    expect(tintHex('#2BB5FF')).toBe('#2BB5FF');
  });

  it('l’enregistrement ajoute le choix au réglage existant sans rien retirer', () => {
    const old: FighterConfig = { base: 'A', skin: 'cacao', hairStyle: 'afro', beard: 'moustache', outfit: 'track', main: '#FFD23D', acc: ['headband'] };
    const merged = mergeLook(old, 'groove', { bd: 'tornado', bdColor: '#E8287C' });
    expect(merged).toEqual({ ...old, bd: 'tornado', bdColor: '#E8287C' });
    // joueur sans réglage enregistré : on part de son personnage de départ, pour que l'ancien dessin reste entier
    expect(mergeLook(null, 'papy', { bd: 'tornado', bdColor: '#2E9E6B' })).toEqual({ ...PRESETS.find((p) => p.key === 'papy')!.cfg, bd: 'tornado', bdColor: '#2E9E6B' });
    expect(mergeLook(null, null, { bd: 'fusee', bdColor: '#2BB5FF' }).base).toBe('B');
  });

  it('deux adversaires identiques : le second change de teinte, sinon rien ne bouge', () => {
    const a = { who: 'bulldozer', color: null } as const;
    const twin = distinctPair(a, { who: 'bulldozer', color: null, belt: true });
    expect(twin.who).toBe('bulldozer');
    expect(twin.color).not.toBeNull();
    expect(twin.belt).toBe(true);
    expect(distinctPair(a, { who: 'bulldozer', color: '#2BB5FF' })).toEqual({ who: 'bulldozer', color: '#2BB5FF' });
    expect(distinctPair(a, { who: 'tornado', color: null })).toEqual({ who: 'tornado', color: null });
    expect(distinctPair(BOSS_LOOK, BOSS_LOOK)).toEqual(BOSS_LOOK);
    const same = distinctPair({ who: 'fusee', color: '#D22B3A' }, { who: 'fusee', color: '#D22B3A' });
    expect(same.color === '#D22B3A').toBe(false);
  });

  it('interrupteur : essai de l’appareil, puis variable du serveur, puis réglage du code', () => {
    expect(styleFrom('svg', undefined, undefined)).toBe('svg');
    expect(styleFrom('svg', 'bd', undefined)).toBe('bd');
    expect(styleFrom('bd', 'svg', undefined)).toBe('svg');
    expect(styleFrom('svg', 'svg', 'bd')).toBe('bd');
    expect(styleFrom('bd', undefined, 'svg')).toBe('svg');
    expect(styleFrom('svg', 'n’importe quoi', 'autre')).toBe('svg');
  });
});

describe('look « BD » : dessins', () => {
  it('poses du générateur → dessins, avec repli quand un dessin manque', () => {
    expect(spritePoseOf(undefined)).toBe('garde');
    expect(spritePoseOf('punch')).toBe('jab');
    expect(spritePoseOf('hurt')).toBe('touche');
    expect(spritePoseOf('guard', 'victoire')).toBe('victoire');
    expect(poseFor('bulldozer', 'uppercut').pose).toBe('uppercut');
    expect(poseFor('bide', 'jab').pose).toBe('bide');
    expect(poseFor('bide', 'uppercut').pose).toBe('bide');
    expect(poseFor('bide', 'dodo').pose).toBe('garde');
    expect(poseFor('fusee', 'pose-inconnue').pose).toBe('garde');
    expect(hasSprites('bulldozer')).toBe(true);
    expect(hasSprites('constructor')).toBe(false);
    expect(faceFor('bide', 'rage')).toBeNull();
  });

  it('chaque combattant des joueurs a ses neuf poses et ses sept expressions', () => {
    for (const k of BD_KEYS) {
      expect(Object.keys(SPRITES[k].poses).sort()).toEqual(['dodo', 'elan', 'garde', 'jab', 'ko', 'touche', 'uppercut', 'victoire', 'vol']);
      expect(Object.keys(SPRITES[k].faces).sort()).toEqual(['blase', 'defi', 'impact', 'panique', 'rage', 'rire', 'sonne']);
      for (const p of ['jab', 'elan', 'uppercut', 'victoire', 'garde']) expect(SPRITES[k].poses[p].hand, `${k} ${p}`).toBeDefined();
      expect(SPRITES[k].faces.defi.eye).toBeDefined();
    }
    for (const p of ['garde', 'bide', 'victoire', 'touche', 'vol', 'ko']) expect(SPRITES.bide.poses[p]).toBeDefined();
    expect(SPRITES.bide.faces.defi.eye).toBeDefined();
  });

  it('chaque image référencée existe dans public/', () => {
    const missing: string[] = [];
    const need = (url: string) => { if (!existsSync(path.join(PUBLIC, url))) missing.push(url); };
    for (const [who, set] of Object.entries(SPRITES)) {
      const tint = tintable(who as keyof typeof SPRITES);
      for (const pose of Object.keys(set.poses)) {
        need(spriteUrl(who, pose));
        if (tint) { need(spriteUrl(who, pose, 'c')); need(spriteUrl(who, pose, 'b')); }
      }
      for (const e of Object.keys(set.faces)) {
        need(faceUrl(who, e));
        if (tint) need(faceUrl(who, e, 'c'));
      }
      if (tint) need(faceUrl(who, 'impact', 'o'));
    }
    need('/bd/v1/decor.jpg');
    expect(missing).toEqual([]);
  });
});

describe('look « BD » : validation à l’enregistrement', () => {
  it('les deux clés du look survivent à la validation, les anciens réglages aussi', () => {
    for (const p of PRESETS) expect(FighterSchema.parse(p.cfg)).toEqual(p.cfg);
    const cfg = { ...PRESETS[3].cfg, bd: 'tornado', bdColor: '#2E9E6B' };
    expect(FighterSchema.parse(cfg)).toEqual(cfg);
  });

  it('Le Bide ne peut pas être enregistré comme combattant d’un joueur', () => {
    expect(FighterSchema.safeParse({ bd: 'bide' }).success).toBe(false);
    expect(BdLookSchema.safeParse({ bd: 'bide', bdColor: '#5A2A7A' }).success).toBe(false);
    expect(BdLookSchema.safeParse({ bd: 'fusee', bdColor: 'rouge' }).success).toBe(false);
    expect(BdLookSchema.safeParse({ bd: 'fusee', bdColor: '#D22B3A' }).success).toBe(true);
  });
});
