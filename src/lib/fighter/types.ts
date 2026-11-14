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
  /** Combattant dessiné choisi par le joueur (look « BD »). Absent tant qu'il n'a rien choisi : il est alors déduit du reste. */
  bd?: BdKey;
  /** Couleur de son masque, de sa tenue et de ses gants (une teinte de la palette du jeu). */
  bdColor?: string;
}

/** Les combattants dessinés que le joueur peut choisir. */
export type BdKey = 'bulldozer' | 'tornado' | 'fusee';

/** Allure dessinée, résolue au moment de l'affichage (elle n'est jamais stockée telle quelle). */
export interface SpriteLook {
  who: BdKey | 'bide';
  /** Couleur du masque, de la tenue et des gants ; null = couleur d'origine du dessin. */
  color: string | null;
  /** Ceinture de champion : la bande de taille passe à l'or. */
  belt?: boolean;
  /** Gants dorés (série de 21 jours) : un insigne doré accompagne le combattant. */
  gold?: boolean;
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
  /** Présent quand le look « BD » est actif : le combattant est alors affiché par son dessin, pas par le générateur. */
  sprite?: SpriteLook;
  /** Pose du dessin quand elle n'a pas d'équivalent dans le générateur (ex. « victoire »). */
  spritePose?: string;
}
