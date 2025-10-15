import React from 'react';

// Shared color palettes
export const chartColors = [
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#22d3ee',
  '#c084fc',
];

export const chartBgClasses = [
  'bg-blue-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-red-400',
  'bg-cyan-400',
  'bg-fuchsia-400',
];

export const LegendDot: React.FC<{ index: string | number; className?: string }> = React.memo(({ index, className }) => {
  const i =
    Math.abs(
      typeof index === 'number'
        ? index
        : [...String(index)].reduce((a, c) => a + c.charCodeAt(0), 0)
    ) % chartColors.length;
  const bg = chartBgClasses[i];
  return <span aria-hidden className={`inline-block w-2.5 h-2.5 rounded-full ${bg} ${className || ''}`} />;
});
LegendDot.displayName = 'LegendDot';

export type BarDatum = { label: string; fullLabel?: string; value: number };

interface BarChartHorizontalProps {
  data: BarDatum[];
  width?: number;
  height?: number;
  padding?: number;
  barGap?: number;
  maxBars?: number;
  ariaLabel?: string;
}

export const BarChartHorizontal: React.FC<BarChartHorizontalProps> = React.memo(({
  data,
  width = 520,
  height = 240,
  padding = 24,
  barGap = 6,
  maxBars = 10,
  ariaLabel,
}) => {
  const trimmed = data.slice(0, maxBars);
  const max = Math.max(1, ...trimmed.map((d) => d.value));
  const innerW = width - padding * 2;
  const barAreaH = height - padding * 2;
  const barH = Math.max(
    8,
    Math.floor(
      (barAreaH - barGap * (trimmed.length - 1)) / Math.max(1, trimmed.length)
    )
  );

  return (
    <svg role="img" aria-label={ariaLabel} width="100%" viewBox={`0 0 ${width} ${height}`}>
      <title>{ariaLabel}</title>
      {trimmed.map((d, i) => {
        const y = padding + i * (barH + barGap);
        const w = Math.max(1, Math.round((d.value / max) * innerW));
        const color = chartColors[i % chartColors.length];
        return (
          <g key={i} transform={`translate(${padding}, ${y})`}>
            <rect x={0} y={0} width={innerW} height={barH} fill="rgba(255,255,255,0.06)" rx={6} />
            <rect x={0} y={0} width={w} height={barH} fill={color} rx={6} />
            <text x={8} y={barH / 2 + 4} fontSize="10" fill="#0b1020">
              {d.label}
            </text>
            <text x={innerW - 8} y={barH / 2 + 4} fontSize="10" fill="#0b1020" textAnchor="end">
              {d.value.toLocaleString()}
            </text>
          </g>
        );
      })}
    </svg>
  );
});
BarChartHorizontal.displayName = 'BarChartHorizontal';

export type DonutDatum = { label: string; value: number };

interface DonutChartProps {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  ariaLabel?: string;
  centerLabel?: string;
}

export const DonutChart: React.FC<DonutChartProps> = React.memo(({ data, size = 240, thickness = 24, ariaLabel, centerLabel }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let acc = 0;

  return (
    <svg role="img" aria-label={ariaLabel} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <title>{ariaLabel}</title>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={thickness}
      />
      {data.map((d, i) => {
        const fraction = d.value / total;
        const dash = fraction * circumference;
        const gap = circumference - dash;
        const rotation = (acc / total) * 360 - 90; // start from top
        acc += d.value;
        const color = chartColors[i % chartColors.length];
        return (
          <g key={i} transform={`rotate(${rotation} ${cx} ${cy})`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="butt"
            />
          </g>
        );
      })}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fill="#e5e7eb"
      >
        {centerLabel || `${total.toLocaleString()} views`}
      </text>
    </svg>
  );
});
DonutChart.displayName = 'DonutChart';

interface CreationTrendChartProps { data: { date: string; count: number }[]; ariaLabel?: string; }

export const CreationTrendChart: React.FC<CreationTrendChartProps> = React.memo(({ data, ariaLabel }) => {
  const width = 600;
  const height = 160;
  const pad = 24;
  const max = Math.max(1, ...data.map(d => d.count));
  const stepX = (width - pad * 2) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = height - pad - (d.count / max) * (height - pad * 2);
    return { x, y };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${pad + (data.length - 1) * stepX},${height - pad} L${pad},${height - pad} Z`;
  return (
    <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <title>{ariaLabel}</title>
      <defs>
        <linearGradient id="gradCreation" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={width} height={height} fill="rgba(255,255,255,0.03)" rx={12} />
      <path d={areaD} fill="url(#gradCreation)" />
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} />
      {points.filter((_, i) => i % 5 === 0 || i === points.length - 1).map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
        </g>
      ))}
      {[0, max].map((v, i) => {
        const y = height - pad - (v / max) * (height - pad * 2);
        return <text key={i} x={width - pad + 4} y={y + 4} fontSize={10} fill="#94a3b8">{v}</text>;
      })}
    </svg>
  );
});
CreationTrendChart.displayName = 'CreationTrendChart';
