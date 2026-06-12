function ArrowUp() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function RiskFactorsSection({ drivers }) {
  const riskFactors = drivers.filter(d => d.direction === 'up');
  const protective = drivers.filter(d => d.direction === 'down');

  return (
    <div className="space-y-4">
      {riskFactors.length > 0 && (
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
            <ArrowUp /> Risk Factors
          </h4>
          <div className="space-y-1.5">
            {riskFactors.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                <span className="text-gray-300 text-xs">{d.label}</span>
                <span className="text-red-400 text-xs font-mono font-semibold ml-3 flex-shrink-0">
                  +{d.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {protective.length > 0 && (
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            <ArrowDown /> Protective Factors
          </h4>
          <div className="space-y-1.5">
            {protective.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2"
              >
                <span className="text-gray-300 text-xs">{d.label}</span>
                <span className="text-emerald-400 text-xs font-mono font-semibold ml-3 flex-shrink-0">
                  -{d.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
