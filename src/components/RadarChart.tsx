'use client';

import type { Dimension } from '@/lib/parseScores';

const CX = 110, CY = 110, MAX_R = 78;

function polar(idx: number, total: number, r: number): [number, number] {
  const angle = (2 * Math.PI * idx) / total - Math.PI / 2;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function toPoints(n: number, r: number): string {
  return Array.from({ length: n }, (_, i) => polar(i, n, r).join(',')).join(' ');
}

export function RadarChart({ dimensions }: { dimensions: Dimension[] }) {
  const n = dimensions.length;
  if (n < 3) return null;

  const dataPoints = dimensions.map((d, i) =>
    polar(i, n, MAX_R * Math.min(Math.max(d.score, 0), 100) / 100)
  );

  return (
    <svg width={220} height={220} viewBox="0 0 220 220" aria-hidden="true">
      {/* Background grid rings */}
      {[0.25, 0.5, 0.75, 1].map((level) => (
        <polygon
          key={level}
          points={toPoints(n, MAX_R * level)}
          fill={level === 1 ? 'none' : 'none'}
          stroke={level === 1 ? '#e2e8f0' : '#f1f5f9'}
          strokeWidth={level === 1 ? 1.5 : 1}
        />
      ))}

      {/* Axis lines */}
      {dimensions.map((_, i) => {
        const [x, y] = polar(i, n, MAX_R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#e2e8f0" strokeWidth={1} />;
      })}

      {/* Score polygon */}
      <polygon
        points={dataPoints.map((p) => p.join(',')).join(' ')}
        fill="rgba(99,102,241,0.12)"
        stroke="rgb(99,102,241)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="white" stroke="rgb(99,102,241)" strokeWidth={2} />
      ))}

      {/* Axis labels */}
      {dimensions.map((d, i) => {
        const [x, y] = polar(i, n, MAX_R + 20);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9.5}
            fill="#64748b"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="500"
          >
            {d.name}
          </text>
        );
      })}
    </svg>
  );
}
