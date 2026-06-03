const PAD = { top: 20, right: 20, bottom: 36, left: 64 };
const VW = 700;

export default function LineChart({ series = [], height = 200 }) {
  const VH = height;
  const CW = VW - PAD.left - PAD.right;
  const CH = VH - PAD.top - PAD.bottom;

  const allPts = series
    .flatMap(s => (s.data ?? []).map(p => ({ t: new Date(p.date).getTime(), v: Number(p.value) })))
    .filter(p => isFinite(p.t) && isFinite(p.v));

  if (allPts.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--tx-3)', fontSize: 13 }}>
        Nema dovoljno podataka za grafikon.
      </div>
    );
  }

  const minV = Math.min(...allPts.map(p => p.v));
  const maxV = Math.max(...allPts.map(p => p.v));
  const minT = Math.min(...allPts.map(p => p.t));
  const maxT = Math.max(...allPts.map(p => p.t));

  const xs = t => PAD.left + ((t - minT) / (maxT - minT || 1)) * CW;
  const ys = v => PAD.top + (1 - (v - minV) / (maxV - minV || 1)) * CH;

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const v = minV + (i / 4) * (maxV - minV);
    return { v, y: ys(v) };
  });

  const xCount = Math.min(5, allPts.length);
  const xTicks = Array.from({ length: xCount }, (_, i) => {
    const t = minT + (i / (xCount - 1 || 1)) * (maxT - minT);
    return {
      t,
      x: xs(t),
      label: new Date(t).toLocaleDateString('sr-RS', { month: 'short', year: '2-digit' }),
    };
  });

  const LEGEND_H = series.length > 0 ? 22 : 0;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH + LEGEND_H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-hidden="true"
    >
      {yTicks.map(({ v, y }, i) => (
        <g key={i}>
          <line
            x1={PAD.left} x2={VW - PAD.right} y1={y} y2={y}
            stroke="var(--border)" strokeWidth="0.8" strokeDasharray="4 3"
          />
          <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--tx-3)">
            {v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : v.toFixed(0)}
          </text>
        </g>
      ))}

      {xTicks.map(({ x, label }, i) => (
        <text key={i} x={x} y={VH - 6} textAnchor="middle" fontSize="10" fill="var(--tx-3)">
          {label}
        </text>
      ))}

      {series.map(({ label, color, data, dashed }) => {
        const pts = (data ?? [])
          .filter(p => p.value != null && isFinite(Number(p.value)))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map(p => `${xs(new Date(p.date).getTime()).toFixed(1)},${ys(Number(p.value)).toFixed(1)}`)
          .join(' ');
        return pts ? (
          <polyline
            key={label}
            points={pts}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={dashed ? '6 4' : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null;
      })}

      {series.map(({ label, color }, i) => (
        <g key={label} transform={`translate(${PAD.left + i * 190}, ${VH + 8})`}>
          <line x1={0} y1={6} x2={14} y2={6} stroke={color} strokeWidth="2.5" />
          <text x={19} y={10} fontSize="11" fill="var(--tx-2)">{label}</text>
        </g>
      ))}
    </svg>
  );
}
