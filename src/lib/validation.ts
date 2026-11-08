import { z } from 'zod';

const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const skin = z.union([z.enum(['porcelaine', 'peche', 'miel', 'caramel', 'cannelle', 'noisette', 'cacao', 'ebene']), color]);
const hairColor = z.union([z.enum(['noir', 'brun', 'chatain', 'roux', 'blond', 'gris', 'blanc', 'rose', 'bleu']), color]);

export const FighterSchema = z.object({
  base: z.enum(['A', 'B']).optional(),
  skin: skin.optional(),
  eyes: z.enum(['amande', 'ronds', 'etires']).optional(),
  nose: z.enum(['fin', 'large', 'busque']).optional(),
  lips: z.enum(['fines', 'pleines']).optional(),
  hairStyle: z.enum(['spiky', 'buzz', 'mohawk', 'afro', 'braids', 'dreads', 'bun', 'ponytail', 'long', 'bob', 'receding', 'bald']).optional(),
  hairColor: hairColor.optional(),
  beard: z.enum(['none', 'stubble', 'short', 'big', 'moustache', 'goatee']).optional(),
  beardColor: hairColor.optional(),
  acc: z.array(z.enum(['glassesRound', 'glassesSquare', 'headband', 'bandana', 'earrings'])).max(5).optional(),
  age: z.enum(['jeune', 'adulte', 'senior']).optional(),
  outfit: z.enum(['boxe', 'catch', 'kimono', 'mma', 'track']).optional(),
  main: color.optional(), trim: color.optional(), glove: color.optional(), top: color.optional(), bottom: color.optional(),
  boot: color.optional(), belt: color.optional(), band: color.optional(), bandana: color.optional(),
  mask: z.boolean().optional(), tank: z.boolean().optional()
}).strip();

/** Poids saisi en kg, accepte la virgule. */
export const WeightSchema = z.preprocess(
  (v) => (typeof v === 'string' ? Number(v.replace(',', '.').trim()) : v),
  z.number().min(30, 'Poids trop faible').max(300, 'Poids trop élevé')
);

export const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
