// Fichier généré par l'outil de préparation des dessins (ne pas modifier à la main).
// Repères de chaque dessin, en pixels d'affichage pour un cadre de 150 × 200 : taille, appui au sol,
// centre de la tête, main qui frappe. Les gros plans donnent le centre de la tête et l'œil d'où part l'éclair,
// en fractions de l'image.

export interface PoseMeta { w: number; h: number; ax: number; head: [number, number]; hand?: [number, number] }
export interface FaceMeta { c: [number, number]; eye?: [number, number] }
export interface SpriteSet { poses: Record<string, PoseMeta>; faces: Record<string, FaceMeta> }

export const SPRITES: Record<'bulldozer' | 'tornado' | 'fusee' | 'bide', SpriteSet> = {
  bulldozer: {
    poses: {
      garde: { w: 85.7, h: 178, ax: 40.3, head: [51.4, 23.1], hand: [70.2, 53.4] },
      jab: { w: 133.3, h: 155.7, ax: 56, head: [58.7, 20.2], hand: [124, 34.2] },
      elan: { w: 107.7, h: 154, ax: 53.8, head: [77.5, 26.2], hand: [39.8, 12.3] },
      touche: { w: 116.3, h: 163.3, ax: 48.9, head: [33.7, 18] },
      victoire: { w: 114.7, h: 199.7, ax: 57.3, head: [57.3, 39.9], hand: [11.5, 14] },
      dodo: { w: 84.3, h: 170.3, ax: 42.2, head: [52.3, 22.1] },
      ko: { w: 173.3, h: 60, ax: 86.7, head: [27.7, 22.8] },
      uppercut: { w: 99.7, h: 204.3, ax: 47.8, head: [41.9, 59.3], hand: [21.9, 12.3] },
      vol: { w: 167, h: 106.3, ax: 83.5, head: [26.7, 21.3] },
    },
    faces: {
      defi: { c: [0.51, 0.45], eye: [0.67, 0.43] },
      rage: { c: [0.5, 0.48] },
      panique: { c: [0.51, 0.46] },
      impact: { c: [0.52, 0.44] },
      sonne: { c: [0.51, 0.49] },
      rire: { c: [0.5, 0.44] },
      blase: { c: [0.5, 0.45] },
    }
  },
  tornado: {
    poses: {
      garde: { w: 92.7, h: 190, ax: 46.3, head: [52.8, 20.9], hand: [76, 60.8] },
      jab: { w: 148, h: 187.3, ax: 66.6, head: [62.2, 26.2], hand: [133.2, 41.2] },
      elan: { w: 125, h: 192.3, ax: 62.5, head: [70, 32.7], hand: [18.8, 19.2] },
      touche: { w: 130.3, h: 192.3, ax: 65.2, head: [62.6, 25] },
      victoire: { w: 128.3, h: 202, ax: 64.2, head: [64.2, 42.4], hand: [12.8, 16.2] },
      dodo: { w: 87.7, h: 178.7, ax: 45.6, head: [54.4, 23.2] },
      ko: { w: 168.7, h: 58, ax: 84.3, head: [23.6, 20.9] },
      uppercut: { w: 114.3, h: 223, ax: 45.7, head: [65.2, 69.1], hand: [37.7, 15.6] },
      vol: { w: 185.7, h: 99, ax: 92.8, head: [31.6, 32.7] },
    },
    faces: {
      defi: { c: [0.51, 0.44], eye: [0.71, 0.45] },
      rage: { c: [0.49, 0.47] },
      panique: { c: [0.49, 0.45] },
      impact: { c: [0.55, 0.47] },
      sonne: { c: [0.53, 0.47] },
      rire: { c: [0.5, 0.45] },
      blase: { c: [0.51, 0.44] },
    }
  },
  fusee: {
    poses: {
      garde: { w: 94.7, h: 184, ax: 44.5, head: [69.1, 23.9], hand: [83.3, 55.2] },
      jab: { w: 138, h: 173, ax: 63.5, head: [78.7, 22.5], hand: [127, 24.2] },
      elan: { w: 120.3, h: 187.7, ax: 60.2, head: [74.6, 50.7], hand: [30.1, 11.3] },
      touche: { w: 127.7, h: 175, ax: 51.1, head: [48.5, 21] },
      victoire: { w: 95.7, h: 195.7, ax: 47.8, head: [47.8, 43], hand: [6.7, 13.7] },
      dodo: { w: 69, h: 169.7, ax: 34.5, head: [46.9, 23.8] },
      ko: { w: 174.7, h: 46, ax: 87.3, head: [33.2, 17.5] },
      uppercut: { w: 87, h: 203.7, ax: 26.1, head: [31.3, 61.1], hand: [41.8, 12.2] },
      vol: { w: 150.7, h: 86.7, ax: 75.3, head: [19.6, 17.3] },
    },
    faces: {
      defi: { c: [0.55, 0.48], eye: [0.73, 0.44] },
      rage: { c: [0.54, 0.48] },
      panique: { c: [0.54, 0.44] },
      impact: { c: [0.6, 0.5] },
      sonne: { c: [0.55, 0.46] },
      rire: { c: [0.53, 0.4] },
      blase: { c: [0.53, 0.43] },
    }
  },
  bide: {
    poses: {
      garde: { w: 118.3, h: 204, ax: 59.2, head: [74.5, 26.5], hand: [94.7, 69.4] },
      bide: { w: 144.7, h: 202.7, ax: 72.3, head: [75.2, 26.3], hand: [115.7, 111.5] },
      victoire: { w: 146, h: 222, ax: 73, head: [75.9, 40], hand: [17.5, 13.3] },
      touche: { w: 144.3, h: 185.7, ax: 60.6, head: [63.5, 18.6] },
      vol: { w: 230, h: 120.7, ax: 115, head: [29.9, 43.4] },
      ko: { w: 235.3, h: 88, ax: 117.7, head: [47.1, 24.6] },
    },
    faces: {
      defi: { c: [0.5, 0.47], eye: [0.68, 0.42] },
      panique: { c: [0.52, 0.45] },
      impact: { c: [0.52, 0.45] },
      sonne: { c: [0.5, 0.5] },
      rire: { c: [0.5, 0.42] },
      blase: { c: [0.5, 0.44] },
    }
  }
};
