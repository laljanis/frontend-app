import { useState } from 'react';
import DonutChart from './DonutChart';
import DriversBarChart from './DriversBarChart';
import RiskFactorsSection from './RiskFactorsSection';
import Sparkline from './Sparkline';
import WhatIfPanel from './WhatIfPanel';

const TIER_STYLES = {
  Watch: {
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    border: 'border-amber-500/20',
    hover: 'hover:border-amber-500/40',
  },
  Nudge: {
    badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    border: 'border-orange-500/20',
    hover: 'hover:border-orange-500/40',
  },
  Intervene: {
    badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
    border: 'border-red-500/20',
    hover: 'hover:border-red-500/40',
  },
};

const ACTION_STYLES = {
  Watch: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
  Nudge: 'bg-orange-500/10 border-orange-500/20 text-orange-300',
  Intervene: 'bg-red-500/10 border-red-500/20 text-red-300',
};

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function AccountCard({ account }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const styles = TIER_STYLES[account.tier] ?? TIER_STYLES.Watch;

  const toggle = async () => {
    if (!expanded && !detail) {
      setLoading(true);
      try {
        const res = await fetch(`/api/accounts/${account.id}`);
        const data = await res.json();
        setDetail(data);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(e => !e);
  };

  return (
    <div
      className={`bg-gray-800 rounded-xl border ${styles.border} ${styles.hover} transition-colors duration-200 overflow-hidden`}
    >
      {/* Clickable header */}
      <button
        onClick={toggle}
        className="w-full text-left p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
      >
        {/* Top row: ID + tier badge + chevron */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-0.5">Account</p>
            <p className="text-white font-mono font-semibold text-sm">{account.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${styles.badge}`}>
              {account.tier}
            </span>
            <span className="text-gray-500">
              <ChevronIcon open={expanded} />
            </span>
          </div>
        </div>

        {/* Donut + meta */}
        <div className="flex items-center gap-4">
          <DonutChart score={account.score} tier={account.tier} />
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Top Driver</p>
              <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">{account.top_driver}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Trend (6 periods)</p>
              <Sparkline trend={account.trend} tier={account.tier} />
            </div>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-700/60 p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : detail ? (
            <>
              <DriversBarChart drivers={detail.drivers} />
              <div className="border-t border-gray-700/60 pt-4">
                <RiskFactorsSection drivers={detail.drivers} />
              </div>
              <div className={`border rounded-lg px-4 py-3 ${ACTION_STYLES[detail.tier]}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-70">
                  Recommended Action
                </p>
                <p className="font-semibold text-sm">{detail.action.title}</p>
                <p className="text-xs mt-1 opacity-80 leading-relaxed">{detail.action.detail}</p>
              </div>
              <div className="border-t border-gray-700/60 pt-4">
                <WhatIfPanel
                  accountId={account.id}
                  originalScore={account.score}
                  originalTier={account.tier}
                />
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
