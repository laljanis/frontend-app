import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronRight, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import DonutChart from './DonutChart';
import Sparkline from './Sparkline';

const SEGMENT_STYLES = {
  Low: {
    badge: 'bg-emerald-400/10 text-emerald-200 border-emerald-300/20',
    glow: 'from-emerald-400/20',
    text: 'text-emerald-200',
  },
  Medium: {
    badge: 'bg-yellow-400/10 text-yellow-200 border-yellow-300/20',
    glow: 'from-yellow-400/20',
    text: 'text-yellow-200',
  },
  High: {
    badge: 'bg-orange-400/10 text-orange-200 border-orange-300/20',
    glow: 'from-orange-400/20',
    text: 'text-orange-200',
  },
  Critical: {
    badge: 'bg-rose-400/10 text-rose-200 border-rose-300/20',
    glow: 'from-rose-400/20',
    text: 'text-rose-200',
  },
};

function MovementBadge({ movement }) {
  const improving = movement === 'Improving';
  const escalating = movement === 'Escalating';
  const Icon = improving ? TrendingDown : TrendingUp;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        improving
          ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
          : escalating
            ? 'border-rose-300/20 bg-rose-400/10 text-rose-200'
            : 'border-white/10 bg-white/5 text-slate-300'
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
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] p-4 text-left shadow-xl shadow-slate-950/30 backdrop-blur-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
      aria-label={`Open dashboard for ${account.customerName}`}
    >
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${styles.glow} via-white/[0.025] to-transparent opacity-90`} />
      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-white">{account.customerName}</p>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-white" />
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
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Score</p>
                <p className={`mt-1 text-xl font-semibold ${styles.text}`}>{Math.round(account.score * 100)}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Tier</p>
                <p className={`mt-1 text-xl font-semibold ${styles.text}`}>{account.tier}</p>
              </div>
            </div>
            <Sparkline trend={account.trend} tier={account.tier} height={42} />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-200/70">
              <Sparkles className="h-3.5 w-3.5" />
              Top Driver
            </span>
            <MovementBadge movement={account.riskMovement} />
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-300">{account.top_driver}</p>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Predicted movement</span>
          <span className="inline-flex items-center gap-1 text-slate-300 transition group-hover:text-white">
            Open dashboard
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}
