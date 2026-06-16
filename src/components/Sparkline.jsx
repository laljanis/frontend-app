import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

const TIER_COLORS = {
  Watch: '#0EA5E9',
  Nudge: '#F59E0B',
  Intervene: '#E11D48',
};

export default function Sparkline({ trend = [], tier, height = 36 }) {
  const color = TIER_COLORS[tier] ?? '#0EA5E9';
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
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            fontSize: 11,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}
          labelStyle={{ color: '#64748B' }}
          itemStyle={{ color }}
          formatter={value => [Number(value).toFixed(2), 'Risk score']}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
