import { PieChart, Pie, Cell } from 'recharts';

const TIER_COLORS = {
  Watch: '#F59E0B',
  Nudge: '#F97316',
  Intervene: '#EF4444',
};

export default function DonutChart({ score, tier }) {
  const pct = Math.round(score * 100);
  const color = TIER_COLORS[tier] ?? '#F59E0B';
  const data = [{ value: pct }, { value: 100 - pct }];

  return (
    <div className="relative w-[110px] h-[110px] flex-shrink-0">
      <PieChart width={110} height={110}>
        <Pie
          data={data}
          cx={50}
          cy={50}
          innerRadius={34}
          outerRadius={50}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
          isAnimationActive={false}
        >
          <Cell fill={color} />
          <Cell fill="#374151" />
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-lg font-bold text-white leading-none">{pct}%</span>
        <span className="text-[10px] text-gray-400 mt-0.5">risk</span>
      </div>
    </div>
  );
}
