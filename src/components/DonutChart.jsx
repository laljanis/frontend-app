const TIER_COLORS = {
  Watch: '#0EA5E9',
  Nudge: '#F59E0B',
  Intervene: '#E11D48',
};

export default function DonutChart({ score, tier, size = 110, label = 'risk' }) {
  const pct = Math.round(score * 100);
  const color = TIER_COLORS[tier] ?? '#0EA5E9';
  const center = Math.round(size / 2);
  const strokeWidth = Math.max(10, Math.round(size * 0.16));
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (pct / 100) * circumference;
  const percentFontSize = Math.max(18, Math.round(size * 0.24));
  const labelFontSize = Math.max(9, Math.round(size * 0.1));

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="absolute inset-2 rounded-full blur-xl opacity-15"
        style={{ backgroundColor: color }}
      />
      <svg className="relative block" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 900ms ease-out',
          }}
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#1E293B"
          fontSize={percentFontSize}
          fontWeight="700"
        >
          {pct}%
        </text>
        <text
          x={center}
          y={center + percentFontSize * 0.62}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#64748B"
          fontSize={labelFontSize}
          fontWeight="600"
          letterSpacing={Math.max(1.3, size * 0.018)}
        >
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
