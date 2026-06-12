const TIER_STYLES = {
  Watch: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
  },
  Nudge: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    dot: 'bg-orange-500',
  },
  Intervene: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: 'bg-red-500',
  },
};

export default function PortfolioSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Total Accounts</p>
        <p className="text-3xl font-bold text-white">{summary.total_accounts}</p>
        <p className="text-xs text-gray-500 mt-1">in portfolio</p>
      </div>

      {Object.entries(summary.tiers).map(([tier, stats]) => {
        const s = TIER_STYLES[tier];
        if (!s) return null;
        return (
          <div key={tier} className={`rounded-xl border ${s.bg} ${s.border} p-4`}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${s.color}`}>{tier}</p>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{stats.count}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.pct}% of portfolio</p>
          </div>
        );
      })}
    </div>
  );
}
