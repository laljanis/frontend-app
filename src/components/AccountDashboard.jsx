import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Gauge,
  HandCoins,
  Landmark,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DonutChart from './DonutChart';
import Sparkline from './Sparkline';
import WhatIfPanel from './WhatIfPanel';

const SEGMENT_STYLES = {
  Low: {
    badge: 'bg-emerald-400/10 text-emerald-200 border-emerald-300/20',
    accent: 'text-emerald-200',
    border: 'border-emerald-300/20',
    gradient: 'from-emerald-400/20',
  },
  Medium: {
    badge: 'bg-yellow-400/10 text-yellow-200 border-yellow-300/20',
    accent: 'text-yellow-200',
    border: 'border-yellow-300/20',
    gradient: 'from-yellow-400/20',
  },
  High: {
    badge: 'bg-orange-400/10 text-orange-200 border-orange-300/20',
    accent: 'text-orange-200',
    border: 'border-orange-300/20',
    gradient: 'from-orange-400/20',
  },
  Critical: {
    badge: 'bg-rose-400/10 text-rose-200 border-rose-300/20',
    accent: 'text-rose-200',
    border: 'border-rose-300/20',
    gradient: 'from-rose-400/20',
  },
};

function Shell({ children, className = '' }) {
  return (
    <section className={`rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-slate-950/40 backdrop-blur-2xl ${className}`}>
      {children}
    </section>
  );
}

function DashboardSpinner({ onBack }) {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portfolio
        </button>
        <div className="grid gap-5 lg:grid-cols-[380px,1fr]">
          <div className="h-80 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.05]" />
          <div className="h-80 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}

function DashboardError({ message, onBack }) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 text-white">
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center">
        <Shell className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <p className="font-semibold text-white">Account dashboard unavailable</p>
          <p className="mt-2 text-sm text-slate-400">{message}</p>
          <button
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </button>
        </Shell>
      </div>
    </div>
  );
}

function getLastSixMonthLabels() {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const currentMonth = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (5 - index), 1);
    return formatter.format(date);
  });
}

function buildTimeline(account) {
  const monthLabels = getLastSixMonthLabels();
  const events = [
    { period: monthLabels[0], score: account.trend?.[0] ?? account.score, event: 'Baseline score recalibrated', icon: BadgeCheck },
    { period: monthLabels[1], score: account.trend?.[1] ?? account.score, event: 'Credit utilization spike', icon: CreditCard },
    { period: monthLabels[2], score: account.trend?.[2] ?? account.score, event: 'New loan activity detected', icon: Landmark },
    { period: monthLabels[3], score: account.trend?.[3] ?? account.score, event: 'Installment behavior changed', icon: CalendarClock },
    { period: monthLabels[4], score: account.trend?.[4] ?? account.score, event: 'AI confidence increased', icon: Sparkles },
    { period: monthLabels[5], score: account.trend?.[5] ?? account.score, event: 'Next-cycle risk forecast', icon: Gauge },
  ];

  return events.map(item => ({
    ...item,
    risk: Math.round(item.score * 100),
  }));
}

function ContributionBars({ drivers }) {
  const maxImpact = Math.max(...drivers.map(driver => driver.impact), 1);
  const riskFactors = drivers.filter(driver => driver.direction === 'up');
  const protectiveFactors = drivers.filter(driver => driver.direction === 'down');

  const renderBar = driver => {
    const risky = driver.direction === 'up';
    const width = `${Math.max(8, (driver.impact / maxImpact) * 100)}%`;

    return (
      <div key={`${driver.label}-${driver.direction}`} className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="truncate text-slate-300">{driver.label}</span>
          <span className={`font-mono font-semibold ${risky ? 'text-rose-200' : 'text-emerald-200'}`}>
            {risky ? '+' : '-'}{driver.impact}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className={`h-full rounded-full ${risky ? 'bg-gradient-to-r from-rose-500 to-orange-400' : 'bg-gradient-to-r from-emerald-500 to-cyan-300'}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-3xl border border-rose-300/15 bg-rose-500/5 p-5">
        <div className="mb-4 flex items-center gap-2 text-rose-200">
          <TrendingUp className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Top Positive Factors</h3>
        </div>
        <div className="space-y-4">
          {riskFactors.map(renderBar)}
        </div>
      </div>
      <div className="rounded-3xl border border-emerald-300/15 bg-emerald-500/5 p-5">
        <div className="mb-4 flex items-center gap-2 text-emerald-200">
          <TrendingDown className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Top Negative Factors</h3>
        </div>
        <div className="space-y-4">
          {protectiveFactors.map(renderBar)}
        </div>
      </div>
    </div>
  );
}

function Recommendations({ account }) {
  const recommendations = [
    {
      title: 'Reduce credit utilization below 40%',
      priority: account.score > 0.58 ? 'High' : 'Medium',
      reduction: '8-12%',
      confidence: '91%',
      icon: CreditCard,
    },
    {
      title: account.segment === 'Critical' ? 'Offer restructuring plan' : 'Send proactive payment reminder',
      priority: account.segment === 'Critical' ? 'Critical' : 'Medium',
      reduction: '5-9%',
      confidence: '87%',
      icon: HandCoins,
    },
    {
      title: 'Monitor behavior for 30 days',
      priority: 'Low',
      reduction: '2-4%',
      confidence: '78%',
      icon: CheckCircle2,
    },
  ];

  return (
    <Shell className="p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Recommendations</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Next best actions</h2>
      </div>
      <div className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <motion.div
            key={recommendation.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className="group rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.075]"
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-200">
                <recommendation.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{recommendation.title}</p>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-slate-300">
                    {recommendation.priority} priority
                  </span>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-emerald-200">
                    {recommendation.reduction} reduction
                  </span>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-cyan-200">
                    {recommendation.confidence} confidence
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Shell>
  );
}

export default function AccountDashboard({ account, loading, error, onBack }) {
  if (loading) return <DashboardSpinner onBack={onBack} />;

  if (error || !account) {
    return (
      <DashboardError
        message={error || 'Select an account from the portfolio to view details.'}
        onBack={onBack}
      />
    );
  }

  const styles = SEGMENT_STYLES[account.segment] ?? SEGMENT_STYLES.Medium;
  const timeline = buildTimeline(account);
  const riskSummary = `${account.customerName} is most sensitive to ${account.drivers?.[0]?.label?.toLowerCase() || 'payment behavior'}. The model expects ${account.riskMovement.toLowerCase()} movement unless utilization and repayment patterns improve before the next scoring cycle.`;

  return (
    <div className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-12%] top-[-16%] h-[560px] w-[560px] rounded-full bg-cyan-500/20 blur-[150px]" />
        <div className="absolute right-[-14%] top-[10%] h-[520px] w-[520px] rounded-full bg-violet-500/20 blur-[150px]" />
        <div className="absolute bottom-[-18%] left-[25%] h-[520px] w-[520px] rounded-full bg-rose-500/10 blur-[150px]" />
      </div>

      <main className="relative mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portfolio
        </button>

        <section className={`relative overflow-hidden rounded-[2.25rem] border ${styles.border} bg-white/[0.055] p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-2xl`}>
          <div className={`absolute inset-x-0 top-0 h-72 bg-gradient-to-br ${styles.gradient} via-cyan-400/10 to-transparent`} />
          <div className="relative grid gap-8 lg:grid-cols-[320px,1fr] lg:items-center">
            <DonutChart score={account.score} tier={account.tier} size={240} label="Risk" />
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                  {account.segment} Risk
                </span>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                  AI monitored
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Account Dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                {account.customerName}
              </h1>
              <p className="mt-3 font-mono text-sm text-slate-500">{account.id}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-slate-500">Risk Score</p>
                  <p className={`mt-1 text-3xl font-semibold ${styles.accent}`}>{Math.round(account.score * 100)}%</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-slate-500">Risk Tier</p>
                  <p className={`mt-1 text-3xl font-semibold ${styles.accent}`}>{account.tier}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <Shell className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-2.5 text-cyan-200">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Explainable AI</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Why this customer is risky</h2>
              </div>
            </div>
            <div className="mb-5 rounded-3xl border border-cyan-300/15 bg-cyan-400/10 p-5">
              <div className="flex gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-200" />
                <p className="text-sm leading-relaxed text-slate-300">{riskSummary}</p>
              </div>
            </div>
            <ContributionBars drivers={account.drivers || []} />
          </Shell>

          <Recommendations account={account} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr,420px]">
          <Shell className="p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200/70">Risk Timeline</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Six-month risk score trend</h2>
              </div>
              <div className="w-full sm:w-52">
                <Sparkline trend={account.trend} tier={account.tier} height={48} />
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="timelineRisk" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="period" stroke="#64748B" tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14 }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke="#A78BFA"
                    strokeWidth={3}
                    fill="url(#timelineRisk)"
                    dot={{ r: 4, fill: '#A78BFA', stroke: '#020617', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {timeline.slice(1, 4).map(item => (
                <div key={item.period} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-violet-200">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-white">{item.event}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.period} risk score: {item.risk}%</p>
                </div>
              ))}
            </div>
          </Shell>

          <Shell className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Simulator</p>
                <h2 className="mt-2 text-xl font-semibold text-white">What-if prediction</h2>
              </div>
              <CircleDollarSign className="h-5 w-5 text-cyan-200" />
            </div>
            <WhatIfPanel
              accountId={account.id}
              originalScore={account.score}
              originalTier={account.tier}
            />
          </Shell>
        </section>
      </main>
    </div>
  );
}
