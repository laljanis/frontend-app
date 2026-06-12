import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const TIER_COLORS = {
  Watch: '#F59E0B',
  Nudge: '#F97316',
  Intervene: '#EF4444',
};

export default function Sparkline({ trend, tier }) {
  const color = TIER_COLORS[tier] ?? '#F59E0B';
  const data = trend.map((v, i) => ({ period: `P${i + 1}`, score: v }));

  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="score"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }}
          labelStyle={{ color: '#9CA3AF' }}
          itemStyle={{ color: color }}
          formatter={v => [v.toFixed(2), 'Score']}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
