/** Courbe de tendance (trait) et pesées (points), en kg ou en % selon la confidentialité. */
export function TrendChart({ series, startWeight, pudique, label }: {
  series: { date: string; weight: number | null; trend: number | null }[];
  startWeight: number | null;
  pudique: boolean;
  label: string;
}) {
  const pts = series.slice(-28);
  const val = (v: number | null) => (v === null || !startWeight ? null : pudique ? ((startWeight - v) / startWeight) * 100 : v);
  const vals = pts.flatMap((p) => [val(p.trend), val(p.weight)]).filter((v): v is number => v !== null);
  if (vals.length < 2) return <p className="text-sm text-lilas">La courbe apparaît après quelques pesées.</p>;
  const min = Math.min(...vals), max = Math.max(...vals), span = Math.max(0.3, max - min);
  const W = 320, H = 96, n = pts.length;
  const x = (i: number) => Math.round(10 + (i * (W - 20)) / Math.max(1, n - 1));
  // en % : plus on perd, plus on monte ; en kg : plus on perd, plus on descend
  const y = (v: number) => Math.round(pudique ? 86 - ((v - min) / span) * 76 : 10 + ((max - v) / span) * 76);
  let d = '';
  pts.forEach((p, i) => { const v = val(p.trend); if (v !== null) d += `${d ? 'L' : 'M'} ${x(i)} ${y(v)} `; });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
      <path d="M 0 16 H 320 M 0 48 H 320 M 0 80 H 320" stroke="#3A1F5E" strokeWidth="1" />
      {pts.map((p, i) => { const v = val(p.weight); return v === null ? null : <circle key={p.date} cx={x(i)} cy={y(v)} r={4} fill="#5A2A7A" stroke="#140A22" strokeWidth={2} />; })}
      <path d={d} fill="none" stroke="#FFD23D" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
