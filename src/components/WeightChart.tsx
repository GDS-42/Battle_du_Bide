import { CHART, chartModel, shortDate, type ChartDay } from '@/lib/weight-chart';

const kg = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Courbe de pesées du joueur, en kilos : points = pesées, trait jaune = tendance lissée.
 * Toujours réservée à son propriétaire (les autres joueurs ne voient que des %).
 */
export function WeightChart({ days, range = 30, marker = null, label = 'Courbe de tes pesées' }: {
  days: ChartDay[];
  /** Nombre de jours affichés ; null = tout l'historique. */
  range?: number | null;
  /** Repère vertical, par exemple le début de la battle. */
  marker?: { date: string; label: string } | null;
  label?: string;
}) {
  const m = chartModel(days, range, marker);
  if (m.empty) return <p className="text-sm text-lilas">Ta courbe démarre à ta première pesée.</p>;
  const { W, H, left, right, bottom } = CHART;
  const aria = `${label} : ${m.count} pesée${m.count > 1 ? 's' : ''} du ${shortDate(m.from)} au ${shortDate(m.to)}, de ${kg(m.firstWeight!)} à ${kg(m.lastWeight!)} kg${m.last ? `, tendance ${kg(m.last.value)} kg` : ''}.`;
  const line = m.path.includes('L');
  // Sur un long historique, des points plus petits pour ne pas noyer la tendance
  const dot = m.count > 60 ? { r: 1.7, sw: 0.8 } : m.count > 35 ? { r: 2.4, sw: 1.1 } : { r: 3.2, sw: 1.5 };
  // Étiquette de la dernière valeur : au-dessus du point, ou dessous si le trait occupe déjà la place
  const below = !!m.last && line && m.last.labelBelow && m.last.y + 18 < H - bottom;
  const lastLabelY = m.last ? (below ? m.last.y + 17 : m.last.y - 9) : 0;
  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={aria}>
        {m.ticks.map((t) => (
          <g key={t.value}>
            <path d={`M ${left} ${t.y} H ${W - right}`} stroke="#3A1F5E" strokeWidth="1" />
            <text x={left - 6} y={t.y + 3.5} textAnchor="end" fontSize="10" fill="#CDB8F0">{kg(t.value)}</text>
          </g>
        ))}
        {m.marker ? (
          <g>
            <path d={`M ${m.marker.x} 8 V ${H - bottom}`} stroke="#2BB5FF" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x={Math.min(Math.max(m.marker.x, left + 14), W - right - 14)} y={7} textAnchor="middle" fontSize="9" fontWeight="700" fill="#2BB5FF">{m.marker.label}</text>
          </g>
        ) : null}
        {m.points.map((p) => <circle key={p.date} cx={p.x} cy={p.y} r={line ? dot.r : 5} fill="#CDB8F0" stroke="#140A22" strokeWidth={line ? dot.sw : 2} />)}
        {line ? <path d={m.path} fill="none" stroke="#FFD23D" strokeWidth={m.count > 60 ? 2.6 : 3.5} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {m.last ? (
          <g>
            {line ? <circle cx={m.last.x} cy={m.last.y} r={5} fill="#FFD23D" stroke="#140A22" strokeWidth={2} /> : null}
            <text x={line ? m.last.x - 2 : m.last.x} y={lastLabelY} textAnchor={line ? 'end' : 'middle'} fontSize="11" fontWeight="800"
              fill={line ? '#FFD23D' : '#FFF4E3'} stroke="#2A1548" strokeWidth="3.5" paintOrder="stroke">{kg(m.last.value)}</text>
          </g>
        ) : null}
        <text x={left} y={H - 7} fontSize="10" fill="#CDB8F0">{shortDate(m.from)}</text>
        {m.to !== m.from ? <text x={W - right} y={H - 7} textAnchor="end" fontSize="10" fill="#CDB8F0">{shortDate(m.to)}</text> : null}
      </svg>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-lilas">
        <span className="flex items-center gap-1.5"><span aria-hidden className="inline-block size-2.5 rounded-full border border-encre bg-lilas" /> tes pesées</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="inline-block h-1 w-5 rounded bg-soleil" /> ta tendance (kg)</span>
        {m.count < 2 ? <span className="text-creme">Encore une pesée et ta courbe se dessine.</span> : null}
      </div>
    </div>
  );
}
