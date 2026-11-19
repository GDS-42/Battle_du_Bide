import { describe, expect, it } from 'vitest';
import { CHART, chartModel, shortDate, type ChartDay } from './weight-chart';
import { addDays } from './time';

/** Une pesée par jour (sauf jours sautés), tendance = pesée pour simplifier. */
function days(from: string, weights: (number | null)[]): ChartDay[] {
  let trend: number | null = null;
  return weights.map((w, i) => {
    if (w !== null) trend = w;
    return { date: addDays(from, i), weight: w, trend };
  });
}

describe('chartModel', () => {
  it('signale une série vide', () => {
    expect(chartModel([], 30).empty).toBe(true);
  });

  it('affiche une pesée unique au centre, sans tracé', () => {
    const m = chartModel(days('2026-11-09', [137.6]), 30);
    expect(m.empty).toBe(false);
    expect(m.count).toBe(1);
    expect(m.points).toHaveLength(1);
    expect(m.points[0].x).toBeCloseTo((CHART.left + CHART.W - CHART.right) / 2, 0);
    expect(m.path).not.toContain('L');
    expect(m.last?.value).toBe(137.6);
  });

  it('cale l’axe sur des demi-kilos avec au moins 1 kg d’amplitude', () => {
    const m = chartModel(days('2026-11-09', [137.6, 137.4, 137.5]), 30);
    const values = m.ticks.map((t) => t.value);
    expect(values).toHaveLength(3);
    for (const v of values) expect((v * 2) % 1).toBe(0);
    expect(values[0] - values[2]).toBeGreaterThanOrEqual(1);
    expect(values[0]).toBeGreaterThan(137.6);
    expect(values[2]).toBeLessThan(137.4);
    // plus lourd = plus haut : la courbe descend quand on maigrit
    expect(m.ticks[0].y).toBeLessThan(m.ticks[2].y);
    expect(m.points[1].y).toBeGreaterThan(m.points[0].y);
  });

  it('garde tous les points dans la zone de dessin', () => {
    const m = chartModel(days('2026-10-01', [100, 99.2, null, 101.5, 98, null, null, 97.4]), null);
    for (const p of m.points) {
      expect(p.x).toBeGreaterThanOrEqual(CHART.left);
      expect(p.x).toBeLessThanOrEqual(CHART.W - CHART.right);
      expect(p.y).toBeGreaterThanOrEqual(CHART.top);
      expect(p.y).toBeLessThanOrEqual(CHART.H - CHART.bottom);
    }
    expect(m.count).toBe(5);
    expect(m.from).toBe('2026-10-01');
    expect(m.to).toBe('2026-10-08');
    expect(m.firstWeight).toBe(100);
    expect(m.lastWeight).toBe(97.4);
  });

  it('ne garde que la période demandée', () => {
    const all = days('2026-09-01', Array.from({ length: 60 }, (_, i) => 100 - i * 0.1));
    const m = chartModel(all, 30);
    expect(m.from).toBe(addDays('2026-09-01', 30));
    expect(m.points).toHaveLength(30);
    expect(chartModel(all, null).points).toHaveLength(60);
  });

  it('place le repère de début de battle seulement s’il est dans la période', () => {
    const all = days('2026-11-01', [100, 99.9, 99.8, 99.7, 99.6]);
    const inside = chartModel(all, 30, { date: '2026-11-03', label: 'Début' });
    expect(inside.marker).toEqual({ x: inside.points[2].x, label: 'Début' });
    expect(chartModel(all, 30, { date: '2026-11-20', label: 'Début' }).marker).toBeNull();
  });

  it('écrit les dates en court', () => {
    expect(shortDate('2026-11-12')).toBe('12 nov.');
    expect(shortDate('2026-03-01')).toBe('1er mars');
  });
});

describe('trait du prochain palier', () => {
  const series = days('2026-11-01', [88, 87.8, 87.5, 87.3, 87, 86.7]);

  it('étend l’axe jusqu’à un palier proche, sans sortir de la zone de dessin', () => {
    const m = chartModel(series, 30, null, { weight: 85.7, label: 'IMC 27' });
    expect(m.target).toMatchObject({ weight: 85.7, label: 'IMC 27', side: 'left' });
    expect(m.ticks[2].value).toBeLessThanOrEqual(85.7);
    expect(m.target!.y).toBeLessThanOrEqual(CHART.H - CHART.bottom);
    // le palier est sous toutes les pesées
    for (const p of m.points) expect(p.y).toBeLessThan(m.target!.y);
  });

  it('ne trace pas un palier lointain et laisse alors l’axe tel quel', () => {
    const plain = chartModel(series, 30);
    const far = chartModel(series, 30, null, { weight: 79.3, label: 'IMC 25' });
    expect(plain.target).toBeNull();
    expect(far.target).toBeNull();
    expect(far.ticks).toEqual(plain.ticks);
    expect(far.points).toEqual(plain.points);
  });

  it('trace sans toucher à l’axe un palier déjà dans les valeurs affichées (poids remonté)', () => {
    const up = days('2026-11-01', [85, 85.4, 85.9, 86.3, 86.6]);
    const plain = chartModel(up, 30);
    const m = chartModel(up, 30, null, { weight: 85.7, label: 'IMC 27' });
    expect(m.ticks).toEqual(plain.ticks);
    expect(m.target!.y).toBeGreaterThan(m.points[4].y);
    expect(m.target!.y).toBeLessThan(m.points[0].y);
  });

  it('avec une courbe plate, descend d’un kilo au plus pour montrer le palier', () => {
    const flat = days('2026-11-01', [86.7, 86.7, 86.7, 86.7]);
    expect(chartModel(flat, 30, null, { weight: 85.7, label: 'IMC 27' }).target).not.toBeNull();
    expect(chartModel(flat, 30, null, { weight: 85.5, label: 'IMC 27' }).target).toBeNull();
  });

  it('pose l’étiquette à droite quand les pesées occupent la gauche du trait', () => {
    // Poids remonté : les premières pesées sont au niveau du palier, à gauche
    const up = days('2026-11-01', [85.8, 85.9, 86.4, 86.9, 87.3, 87.6, 87.9, 88.2]);
    expect(chartModel(up, 30, null, { weight: 85.7, label: 'IMC 27' }).target!.side).toBe('right');
  });
});

describe('étiquette de la dernière valeur', () => {
  it('reste au-dessus du point quand la tendance est plate ou remonte', () => {
    expect(chartModel(days('2026-11-01', Array.from({ length: 20 }, () => 90)), 30).last?.labelBelow).toBe(false);
    expect(chartModel(days('2026-11-01', Array.from({ length: 20 }, (_, i) => 90 + i * 0.2)), 30).last?.labelBelow).toBe(false);
  });

  it('passe dessous quand le trait descend fort juste avant le dernier point', () => {
    expect(chartModel(days('2026-11-01', Array.from({ length: 20 }, (_, i) => 100 - i * 0.5)), 30).last?.labelBelow).toBe(true);
  });
});
