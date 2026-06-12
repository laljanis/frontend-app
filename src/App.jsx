import { useState, useEffect } from 'react';
import AccountCard from './components/AccountCard';
import PortfolioSummary from './components/PortfolioSummary';

const TIERS = ['All', 'Watch', 'Nudge', 'Intervene'];

const TIER_ACTIVE_STYLES = {
  All: 'bg-gray-600 text-white',
  Watch: 'bg-amber-500/25 text-amber-300 border border-amber-500/40',
  Nudge: 'bg-orange-500/25 text-orange-300 border border-orange-500/40',
  Intervene: 'bg-red-500/25 text-red-300 border border-red-500/40',
};

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading portfolio data…</p>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <p className="text-red-400 font-semibold mb-2">Could not connect to API</p>
        <p className="text-gray-500 text-sm mb-3">{message}</p>
        <p className="text-gray-600 text-xs bg-gray-800 rounded-lg px-4 py-2 font-mono">
          uvicorn main:app --reload
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeTier, setActiveTier] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/portfolio/summary').then(r => r.json()),
      fetch('/api/accounts').then(r => r.json()),
    ])
      .then(([sum, accs]) => {
        setSummary(sum);
        setAccounts(accs);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  const filtered =
    activeTier === 'All' ? accounts : accounts.filter(a => a.tier === activeTier);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Pre-Delinquency Risk Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Account-level risk scores, SHAP drivers, and recommended actions
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>

        {/* Portfolio summary stat cards */}
        <PortfolioSummary summary={summary} />

        {/* Tier filter tabs */}
        <div className="flex flex-wrap gap-2">
          {TIERS.map(tier => (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
                activeTier === tier
                  ? TIER_ACTIVE_STYLES[tier]
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-transparent'
              }`}
            >
              {tier}
              {tier !== 'All' && summary?.tiers[tier] && (
                <span className="ml-1.5 opacity-60 text-xs">{summary.tiers[tier].count}</span>
              )}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-600 self-center">
            {filtered.length} account{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Account cards grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(account => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-600">
            No accounts in the <span className="text-gray-500">{activeTier}</span> tier
          </div>
        )}

      </div>
    </div>
  );
}
