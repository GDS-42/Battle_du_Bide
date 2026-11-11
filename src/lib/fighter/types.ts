export type HairStyle = 'spiky' | 'buzz' | 'mohawk' | 'afro' | 'braids' | 'dreads' | 'bun' | 'ponytail' | 'long' | 'bob' | 'receding' | 'bald';
export type Beard = 'none' | 'stubble' | 'short' | 'big' | 'moustache' | 'goatee';
export type Accessory = 'glassesRound' | 'glassesSquare' | 'headband' | 'bandana' | 'earrings';
export type Outfit = 'boxe' | 'catch' | 'kimono' | 'mma' | 'track';
export type Pose = 'guard' | 'punch' | 'hurt';

/** Apparence choisie par le joueur (stockée en base). La corpulence n'en fait pas partie : elle vient de l'IMC réel. */
export interface FighterConfig {
  base?: 'A' | 'B';
  skin?: string;
  eyes?: 'amande' | 'ronds' | 'etires';
  nose?: 'fin' | 'large' | 'busque';
  lips?: 'fines' | 'pleines';
  hairStyle?: HairStyle;
  hairColor?: string;
  beard?: Beard;
  beardColor?: string;
  acc?: Accessory[];
  age?: 'jeune' | 'adulte' | 'senior';
  outfit?: Outfit;
  main?: string;
  trim?: string;
  glove?: string;
  top?: string;
  bottom?: string;
  boot?: string;
  belt?: string;
  band?: string;
  bandana?: string;
  mask?: boolean;
  tank?: boolean;
}

/** Paramètres de rendu : apparence + corpulence + pose. */
export interface FighterRender extends FighterConfig {
  k: number;
  pose?: Pose;
  flip?: boolean;
  ghost?: boolean;
  w?: number;
  /** Ceinture de champion portée à la taille (récompense ; dessinée par le composant Fighter, pas par le générateur). */
  champ?: boolean;
}
