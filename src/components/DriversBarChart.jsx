export default function DriversBarChart({ drivers }) {
  const max = Math.max(...drivers.map(d => d.impact));

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Driver Impact
      </h3>
      <div className="space-y-3">
        {drivers.map((d, i) => (
          <div key={i}>
            <div className="flex items-center justify-between text-xs mb-1 gap-2">
              <span className="text-gray-300 truncate">{d.label}</span>
              <span
                className={`font-mono font-semibold flex-shrink-0 ${
                  d.direction === 'up' ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {d.direction === 'up' ? '+' : '-'}{d.impact}
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  d.direction === 'up' ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${(d.impact / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
