import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { CROWD_BASE, CROWD_FILES, CROWD_LOOP, type CrowdName } from './crowd-files';

const PUBLIC = path.resolve(__dirname, '../../public');
const all = (Object.keys(CROWD_FILES) as CrowdName[]).flatMap((name) => CROWD_FILES[name].map((file) => ({ name, file, full: path.join(PUBLIC, CROWD_BASE, file) })));

/** Durée d'un MP3 à débit constant, lue dans son premier en-tête de trame (MPEG-1 couche 3). */
function mp3Seconds(file: string): number {
  const b = readFileSync(file);
  let i = 0;
  while (i < b.length - 4 && !(b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0)) i++;
  const kbps = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320][b[i + 2] >> 4];
  return ((b.length - i) * 8) / (kbps * 1000);
}

describe('sons de la salle', () => {
  it('chaque son a au moins un fichier, et chaque fichier cité existe dans public/', () => {
    for (const name of Object.keys(CROWD_FILES) as CrowdName[]) expect(CROWD_FILES[name].length, name).toBeGreaterThan(0);
    expect(all.filter((f) => !existsSync(f.full)).map((f) => f.file)).toEqual([]);
  });

  it('les fichiers restent légers : moins de 150 Ko chacun, moins de 400 Ko en tout', () => {
    let total = 0;
    for (const f of all) {
      const size = statSync(f.full).size;
      expect(size, f.file).toBeGreaterThan(8_000); // pas un fichier vide
      expect(size, f.file).toBeLessThan(150_000);
      total += size;
    }
    expect(total).toBeLessThan(400_000);
  });

  it('la boucle du fond tient dans son fichier, avec de la marge de chaque côté', () => {
    const seconds = mp3Seconds(all.find((f) => f.name === 'fond')!.full);
    expect(CROWD_LOOP.start).toBeGreaterThanOrEqual(0.3);
    expect(CROWD_LOOP.end).toBeGreaterThan(CROWD_LOOP.start + 4);
    expect(seconds - CROWD_LOOP.end).toBeGreaterThanOrEqual(0.3);
  });

  it('les réactions sont courtes : jamais plus de 7 secondes', () => {
    for (const f of all.filter((x) => x.name !== 'fond')) expect(mp3Seconds(f.full), f.file).toBeLessThan(7);
  });
});
