import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

const TIER_COLORS = {
  Watch: '#FACC15',
  Nudge: '#FB923C',
  Intervene: '#F43F5E',
};

export default function Sparkline({ trend = [], tier, height = 36 }) {
  const color = TIER_COLORS[tier] ?? '#FACC15';
  const gradientId = `spark-${tier || 'default'}-${height}`;
  const data = trend.map((value, index) => ({ period: `P${index + 1}`, score: value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.45} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="score"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          animationDuration={800}
        />
        <Tooltip
          contentStyle={{
            background: '#020617',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            fontSize: 11,
          }}
          labelStyle={{ color: '#94A3B8' }}
          itemStyle={{ color }}
          formatter={value => [Number(value).toFixed(2), 'Risk score']}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
