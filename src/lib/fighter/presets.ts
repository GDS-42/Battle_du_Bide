import type { FighterConfig } from './types';

export interface Preset {
  key: string;
  name: string;
  move: string;
  tag: string;
  cfg: FighterConfig;
  /** Corpulence d'affichage dans la galerie (en jeu, c'est l'IMC réel qui compte). */
  k: number;
}

export const PRESETS: Preset[] = [
  { key: 'bulldozer', name: 'Le Bulldozer', move: 'Le Rouleau Compresseur', tag: 'Boxe · adulte', k: 0.6, cfg: { base: 'A', skin: 'peche', hairStyle: 'spiky', hairColor: 'brun', outfit: 'boxe', main: '#D22B3A', trim: '#FFF4E3', boot: '#FFF4E3' } },
  { key: 'fusee', name: 'La Fusée', move: 'La Raclette Volante', tag: 'Boxe · adulte', k: 0.1, cfg: { base: 'B', skin: 'cannelle', hairStyle: 'ponytail', hairColor: 'noir', acc: ['headband'], band: '#E8287C', outfit: 'boxe', main: '#2BB5FF', trim: '#FFF4E3', boot: '#140A22' } },
  { key: 'mamie', name: 'La Mamie Cogneuse', move: 'Le Coup du Sac à Main', tag: 'Survêt rétro · senior', k: 0.5, cfg: { base: 'B', age: 'senior', skin: 'porcelaine', hairStyle: 'bun', hairColor: 'blanc', acc: ['glassesRound'], eyes: 'ronds', outfit: 'track', main: '#5A2A7A', trim: '#FFD23D' } },
  { key: 'papy', name: 'Papy Uppercut', move: "L'Uppercut de 1974", tag: 'Boxe vintage · senior', k: 0.35, cfg: { base: 'A', age: 'senior', skin: 'cacao', hairStyle: 'receding', hairColor: 'blanc', beard: 'moustache', nose: 'large', outfit: 'boxe', main: '#B5532A', trim: '#FFF4E3', boot: '#2A1548' } },
  { key: 'tornado', name: 'El Tornado', move: 'La Tornade Tropicale', tag: 'Catch masqué · adulte', k: 0.75, cfg: { base: 'A', skin: 'caramel', outfit: 'catch', mask: true, main: '#2BB5FF', trim: '#FFD23D' } },
  { key: 'ceinture', name: 'La Ceinture Noire', move: 'Le Balayage Fatal', tag: 'Kimono · adulte', k: 0.2, cfg: { base: 'B', skin: 'ebene', hairStyle: 'braids', hairColor: 'noir', lips: 'pleines', outfit: 'kimono', glove: '#D22B3A' } },
  { key: 'bucheron', name: 'Le Bûcheron', move: 'La Hache Velue', tag: 'Catch · adulte', k: 0.85, cfg: { base: 'A', skin: 'porcelaine', hairStyle: 'buzz', hairColor: 'roux', beard: 'big', outfit: 'catch', main: '#2E9E6B', trim: '#FFF4E3' } },
  { key: 'punk', name: 'La Punk', move: 'Le Pogo Dévastateur', tag: 'MMA · jeune', k: 0.3, cfg: { base: 'B', age: 'jeune', skin: 'miel', hairStyle: 'mohawk', hairColor: 'rose', acc: ['earrings'], eyes: 'etires', outfit: 'mma', top: '#140A22', bottom: '#140A22', trim: '#FF5FA2', glove: '#FF5FA2' } },
  { key: 'groove', name: 'Le Groove', move: 'La Boule à Facettes', tag: 'Survêt rétro · adulte', k: 0.45, cfg: { base: 'A', skin: 'noisette', hairStyle: 'afro', hairColor: 'noir', beard: 'moustache', outfit: 'track', main: '#FFD23D', trim: '#140A22', glove: '#E8287C' } },
  { key: 'geek', name: 'Le Geek', move: 'Le Ctrl+Alt+Suppr', tag: 'MMA · jeune', k: 0.55, cfg: { base: 'A', age: 'jeune', skin: 'peche', hairStyle: 'bob', hairColor: 'chatain', acc: ['glassesSquare'], eyes: 'ronds', outfit: 'mma', top: '#2BB5FF', bottom: '#140A22', trim: '#FFF4E3', glove: '#2BB5FF' } },
  { key: 'reine', name: 'La Reine du Ring', move: 'Le Sceptre Royal', tag: 'Boxe dorée · adulte', k: 0.65, cfg: { base: 'B', skin: 'noisette', hairStyle: 'long', hairColor: 'brun', acc: ['earrings'], lips: 'pleines', outfit: 'boxe', main: '#FFD23D', trim: '#140A22', boot: '#FFD23D', glove: '#FFD23D' } },
  { key: 'chauve', name: 'Le Chauve Furieux', move: 'Le Coup de Boule Lustré', tag: 'Catch · adulte', k: 0.4, cfg: { base: 'A', skin: 'cannelle', hairStyle: 'bald', hairColor: 'noir', beard: 'goatee', nose: 'busque', outfit: 'catch', main: '#140A22', trim: '#D22B3A' } }
];

export function presetByKey(key: string | null | undefined): Preset | undefined {
  return PRESETS.find((p) => p.key === key);
}

export const SKIN_OPTIONS: [string, string, string][] = [
  ['porcelaine', 'Porcelaine', '#F7D9C4'], ['peche', 'Pêche', '#F0B38A'], ['miel', 'Miel', '#DDA06B'], ['caramel', 'Caramel', '#C68350'],
  ['cannelle', 'Cannelle', '#A86B45'], ['noisette', 'Noisette', '#8E5532'], ['cacao', 'Cacao', '#6E3F25'], ['ebene', 'Ébène', '#4E2C1C']
];
export const HAIR_COLOR_OPTIONS: [string, string, string][] = [
  ['noir', 'Noir', '#1B1420'], ['brun', 'Brun', '#3B2416'], ['chatain', 'Châtain', '#6B4226'], ['roux', 'Roux', '#B5532A'], ['blond', 'Blond', '#E2B54B'],
  ['gris', 'Gris', '#9C97A6'], ['blanc', 'Blanc', '#EDE8F2'], ['rose', 'Rose', '#FF5FA2'], ['bleu', 'Bleu', '#2BB5FF']
];
export const HAIR_STYLE_OPTIONS: [string, string][] = [
  ['spiky', 'Pétard'], ['buzz', 'Rasé'], ['mohawk', 'Crête'], ['afro', 'Afro'], ['braids', 'Tresses'], ['dreads', 'Dreads'],
  ['bun', 'Chignon'], ['ponytail', 'Queue de cheval'], ['long', 'Longs'], ['bob', 'Carré'], ['receding', 'Dégarni'], ['bald', 'Chauve']
];
export const BEARD_OPTIONS: [string, string][] = [['none', 'Aucune'], ['stubble', '3 jours'], ['short', 'Courte'], ['big', 'Grande barbe'], ['moustache', 'Moustache'], ['goatee', 'Bouc']];
export const ACC_OPTIONS: [string, string][] = [['glassesRound', 'Lunettes rondes'], ['glassesSquare', 'Lunettes carrées'], ['headband', 'Bandeau'], ['bandana', 'Bandana'], ['earrings', "Boucles d'oreilles"]];
export const OUTFIT_OPTIONS: [string, string][] = [['boxe', 'Boxe'], ['catch', 'Catch'], ['kimono', 'Kimono'], ['mma', 'MMA'], ['track', 'Survêt rétro']];
export const MAIN_COLOR_OPTIONS: [string, string][] = [
  ['#D22B3A', 'Rouge'], ['#2BB5FF', 'Bleu néon'], ['#FFD23D', 'Soleil'], ['#E8287C', 'Magenta'], ['#2E9E6B', 'Vert'], ['#5A2A7A', 'Prune'], ['#140A22', 'Noir'], ['#F4F1EA', 'Blanc']
];
export const EYES_OPTIONS: [string, string][] = [['amande', 'Amande'], ['ronds', 'Ronds'], ['etires', 'Étirés']];
export const NOSE_OPTIONS: [string, string][] = [['fin', 'Fin'], ['large', 'Large'], ['busque', 'Busqué']];
export const LIPS_OPTIONS: [string, string][] = [['fines', 'Fines'], ['pleines', 'Pleines']];
export const AGE_OPTIONS: [string, string][] = [['jeune', 'Jeune'], ['adulte', 'Adulte'], ['senior', 'Senior']];
export const BASE_OPTIONS: [string, string][] = [['A', 'Épaules larges'], ['B', 'Hanches marquées']];
