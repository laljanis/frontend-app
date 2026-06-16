import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronRight, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import DonutChart from './DonutChart';
import Sparkline from './Sparkline';

const SEGMENT_STYLES = {
  Low: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    glow: 'from-emerald-50/50',
    text: 'text-emerald-700',
  },
  Medium: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    glow: 'from-sky-50/50',
    text: 'text-sky-700',
  },
  High: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    glow: 'from-amber-50/50',
    text: 'text-amber-700',
  },
  Critical: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    glow: 'from-rose-50/50',
    text: 'text-rose-700',
  },
};

function MovementBadge({ movement }) {
  const improving = movement === 'Improving';
  const escalating = movement === 'Escalating';
  const Icon = improving ? TrendingDown : TrendingUp;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        improving
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : escalating
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      <Icon className="h-3 w-3" />
      {movement}
    </span>
  );
}

export default function AccountCard({ account, index = 0, onOpenAccount }) {
  const styles = SEGMENT_STYLES[account.segment] ?? SEGMENT_STYLES.Medium;

  const openDashboard = () => {
    try {
      onOpenAccount(account.id);
    } catch (err) {
      console.error('Failed to open account dashboard', err);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.045, 0.28), duration: 0.4 }}
      whileHover={{ y: -5, scale: 1.01 }}
      onClick={openDashboard}
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-md shadow-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 hover:shadow-lg hover:shadow-slate-200/40 hover:border-slate-300"
      aria-label={`Open dashboard for ${account.customerName}`}
    >
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${styles.glow} via-white/[0.025] to-transparent opacity-90`} />
      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-800">{account.customerName}</p>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-slate-800" />
            </div>
            <p className="mt-1 font-mono text-[11px] text-slate-500">{account.id}</p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles.badge}`}>
            {account.segment}
          </span>
        </div>
 
        <div className="grid grid-cols-[90px,1fr] gap-4">
          <DonutChart score={account.score} tier={account.tier} size={90} label="Risk" />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Score</p>
                <p className={`mt-1 text-xl font-semibold ${styles.text}`}>{Math.round(account.score * 100)}%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Tier</p>
                <p className={`mt-1 text-xl font-semibold ${styles.text}`}>{account.tier}</p>
              </div>
            </div>
            <Sparkline trend={account.trend} tier={account.tier} height={42} />
          </div>
        </div>
 
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/30 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-600">
              <Sparkles className="h-3.5 w-3.5" />
              Top Driver
            </span>
            <MovementBadge movement={account.riskMovement} />
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{account.top_driver}</p>
        </div>
 
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Predicted movement</span>
          <span className="inline-flex items-center gap-1 text-slate-500 transition group-hover:text-slate-800">
            Open dashboard
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}
