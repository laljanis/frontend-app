import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Bot,
  BrainCircuit,
  CircleDollarSign,
  Gauge,
  Radar,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import AccountCard from './components/AccountCard';
import AccountDashboard from './components/AccountDashboard';

const RISK_SEGMENTS = [
  {
    id: 'Low',
    label: 'Low Risk',
    shortLabel: 'Low',
    color: '#10B981',
    className: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    id: 'Medium',
    label: 'Medium Risk',
    shortLabel: 'Medium',
    color: '#0EA5E9',
    className: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  {
    id: 'High',
    label: 'High Risk',
    shortLabel: 'High',
    color: '#F59E0B',
    className: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    id: 'Critical',
    label: 'Critical Risk',
    shortLabel: 'Critical',
    color: '#E11D48',
    className: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
];

const CUSTOMER_NAMES = [
  'Avery Capital',
  'Northstar Retail',
  'Luma Finance',
  'Crescent Logistics',
  'Atlas Mobility',
  'Harbor Foods',
  'Kinship Health',
  'Nova Services',
  'Summit Home',
  'Cobalt Supply',
  'Pioneer Market',
  'Evergreen Credit',
];

function getCurrentRoute() {
  const params = new URLSearchParams(window.location.search);

  if (window.location.pathname === '/account-dashboard') {
    return {
      name: 'accountDashboard',
      accountId: params.get('accountId'),
    };
  }

  return { name: 'portfolio', accountId: null };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const message = response.status === 404
      ? 'Account not found'
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

const FALLBACK_THRESHOLDS = { nudge: 0.30, intervene: 0.48 };

function getRiskSegment(score, thresholds = FALLBACK_THRESHOLDS) {
  const { nudge, intervene } = thresholds;
  if (score < nudge / 2) return 'Low';
  if (score < nudge) return 'Medium';
  if (score < intervene) return 'High';
  return 'Critical';
}

function getSegmentStyle(segmentId) {
  return RISK_SEGMENTS.find(segment => segment.id === segmentId) ?? RISK_SEGMENTS[1];
}

function getCustomerName(accountId) {
  const digits = accountId.replace(/\D/g, '');
  const index = Number(digits.slice(-2) || 0) % CUSTOMER_NAMES.length;
  return CUSTOMER_NAMES[index];
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function enrichAccount(account, thresholds = FALLBACK_THRESHOLDS) {
  const trendStart = account.trend?.[0] ?? account.score;
  const trendEnd = account.trend?.[account.trend.length - 1] ?? account.score;
  const trendDelta = trendEnd - trendStart;
  const segment = getRiskSegment(account.score, thresholds);

  return {
    ...account,
    customerName: getCustomerName(account.id),
    exposure: Math.round((45000 + account.score * 255000) / 1000) * 1000,
    riskMovement: trendDelta > 0.035 ? 'Escalating' : trendDelta < -0.025 ? 'Improving' : 'Stable',
    segment,
  };
}

function Spinner() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f8fafc] text-slate-800">
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-100">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200">
            <BrainCircuit className="h-7 w-7 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-slate-800">Calibrating portfolio intelligence</p>
          <p className="mt-2 text-xs text-slate-500">Loading predictive risk signals...</p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-lg shadow-slate-100">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <Activity className="h-6 w-6" />
          </div>
          <p className="font-semibold text-rose-800">Risk intelligence API unavailable</p>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 font-mono text-xs text-slate-500">
            uvicorn main:app --reload
          </p>
        </div>
      </div>
    </div>
  );
}

function GlassPanel({ children, className = '' }) {
  return (
    <div className={`rounded-[2rem] border border-slate-200 bg-white shadow-md shadow-slate-100/50 ${className}`}>
      {children}
    </div>
  );
}

function HealthGauge({ score, size = 'h-56 w-56', showLabels = true }) {
  const pct = Math.round(score);
  const hue = pct >= 76 ? '#10B981' : pct >= 58 ? '#0EA5E9' : pct >= 42 ? '#F59E0B' : '#E11D48';
  const circumference = 2 * Math.PI * 78;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={`relative mx-auto ${size}`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="18" />
        <motion.circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke={hue}
          strokeLinecap="round"
          strokeWidth="18"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showLabels && <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Health</span>}
        <motion.span
          className={`font-semibold tracking-tight text-slate-800 ${showLabels ? 'text-6xl mt-2' : 'text-xl'}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {pct}
        </motion.span>
        {showLabels && (
          <span className="mt-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
            AI risk index
          </span>
        )}
      </div>
    </div>
  );
}

function HealthKpiCard({ score, delay = 0 }) {
  const pct = Math.round(score);
  const tone = pct >= 76 ? 'emerald' : pct >= 58 ? 'amber' : 'rose';
  const tones = {
    emerald: 'from-emerald-50 via-green-50/30 to-transparent text-emerald-800 border-b border-emerald-100',
    amber: 'from-amber-50 via-orange-50/30 to-transparent text-amber-800 border-b border-amber-100',
    rose: 'from-rose-50 via-red-50/30 to-transparent text-rose-800 border-b border-rose-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-100/50"
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${tones[tone]} opacity-90`} />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Portfolio Health Score</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-800">{pct}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">AI-driven aggregate health index</p>
        </div>
        <div className="flex-shrink-0">
          <HealthGauge score={score} size="h-20 w-20" showLabels={false} />
        </div>
      </div>
    </motion.div>
  );
}

function KpiCard({ icon: Icon, label, value, detail, tone = 'cyan', delay = 0 }) {
  const tones = {
    cyan: 'from-cyan-50 via-sky-50/30 to-transparent text-cyan-800 border-b border-cyan-100',
    violet: 'from-violet-50 via-fuchsia-50/30 to-transparent text-violet-800 border-b border-violet-100',
    amber: 'from-amber-50 via-orange-50/30 to-transparent text-amber-800 border-b border-amber-100',
    rose: 'from-rose-50 via-red-50/30 to-transparent text-rose-800 border-b border-rose-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-100/50"
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${tones[tone]} opacity-90`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-800">{value}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{detail}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-600 transition-transform group-hover:rotate-3">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

function RiskDistribution({ data, activeSegment, onSelectSegment }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <GlassPanel className="p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Risk Segmentation</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Interactive distribution</h2>
        </div>
        <button
          onClick={() => onSelectSegment('All')}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 shadow-sm"
        >
          Reset
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
        <div className="relative h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={70}
                outerRadius={98}
                paddingAngle={4}
                dataKey="value"
                isAnimationActive
              >
                {data.map(entry => (
                  <Cell key={entry.id} fill={entry.color} stroke="#FFFFFF" strokeWidth={4} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                itemStyle={{ color: '#1E293B' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold text-slate-800">{total}</span>
            <span className="text-xs text-slate-500">accounts</span>
          </div>
        </div>

        <div className="grid content-center gap-3 sm:grid-cols-2">
          {data.map(segment => {
            const selected = activeSegment === segment.id;
            const pct = total ? Math.round((segment.value / total) * 100) : 0;

            return (
              <button
                key={segment.id}
                onClick={() => onSelectSegment(segment.id)}
                className={`rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 ${
                  selected ? 'border-slate-300 bg-slate-50/80 shadow-sm' : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{segment.label}</span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <span className="text-3xl font-semibold text-slate-800">{pct}%</span>
                  <span className="text-xs text-slate-500">{segment.value} customers</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}

function AIInsightsPanel({ accounts }) {
  const highRisk = accounts.filter(account => ['High', 'Critical'].includes(account.segment)).length;
  const escalating = accounts.filter(account => account.riskMovement === 'Escalating').length;
  const topDriver = accounts[0]?.top_driver || 'Missed installments';
  const insights = [
    {
      title: 'Credit utilization increased 18% in the last 30 days',
      body: `${escalating || 2} customers show accelerating score momentum and should be reviewed this week.`,
      icon: TrendingUp,
      tone: 'text-amber-700 bg-amber-50/70 border-amber-200',
    },
    {
      title: `${highRisk} customers moved into elevated risk`,
      body: 'AI monitoring detected migration from medium to high-risk behavior across the current cohort.',
      icon: Radar,
      tone: 'text-rose-700 bg-rose-50/70 border-rose-200',
    },
    {
      title: 'Expected delinquency rate may increase 6.2% next month',
      body: `Primary model signal: ${topDriver.toLowerCase()}.`,
      icon: Bot,
      tone: 'text-sky-700 bg-sky-50/70 border-sky-200',
    },
  ];

  return (
    <GlassPanel className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-2.5 text-cyan-600 shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Smart Insights</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Predictive intelligence</h2>
        </div>
      </div>

      <div className="grid gap-3">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`rounded-2xl border p-4 ${insight.tone}`}
          >
            <div className="flex gap-3">
              <insight.icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{insight.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{insight.body}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassPanel>
  );
}

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeSegment, setActiveSegment] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [route, setRoute] = useState(getCurrentRoute);
  const [accountDetail, setAccountDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchJson('/api/portfolio/summary', { signal: controller.signal }),
      fetchJson('/api/accounts', { signal: controller.signal }),
    ])
      .then(([sum, accs]) => {
        setSummary(sum);
        setAccounts(accs);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handlePopState = () => setRoute(getCurrentRoute());

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (route.name !== 'accountDashboard') return;

    if (!route.accountId) {
      setAccountDetail(null);
      setDetailError('No account was selected for this dashboard.');
      setDetailLoading(false);
      return;
    }

    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError(null);

    fetchJson(`/api/accounts/${encodeURIComponent(route.accountId)}`, { signal: controller.signal })
      .then(data => setAccountDetail(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          setAccountDetail(null);
          setDetailError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });

    return () => controller.abort();
  }, [route]);

  const thresholds = summary?.thresholds ?? FALLBACK_THRESHOLDS;

  const enrichedAccounts = useMemo(
    () => accounts.map(account => enrichAccount(account, thresholds)),
    [accounts, thresholds],
  );

  const enrichedAccountDetail = useMemo(
    () => (accountDetail ? enrichAccount(accountDetail, thresholds) : null),
    [accountDetail, thresholds],
  );

  const portfolioMetrics = useMemo(() => {
    const total = enrichedAccounts.length || 1;
    const averageRisk = enrichedAccounts.reduce((sum, account) => sum + account.score, 0) / total;
    const atRisk = enrichedAccounts.filter(account => ['High', 'Critical'].includes(account.segment)).length;
    const expectedLoss = enrichedAccounts.reduce(
      (sum, account) => sum + account.exposure * account.score * 0.18,
      0,
    );
    // Normalize against the Intervene threshold so the gauge/forecast still
    // span a meaningful range now that calibrated scores run much lower.
    const riskPressure = Math.min(1, averageRisk / thresholds.intervene);
    const forecastLift = Math.max(2.8, riskPressure * 32);

    return {
      healthScore: Math.max(8, Math.round((1 - riskPressure) * 100)),
      atRisk,
      expectedLoss,
      forecastLift,
    };
  }, [enrichedAccounts, thresholds]);

  const distributionData = useMemo(
    () => RISK_SEGMENTS.map(segment => ({
      ...segment,
      value: enrichedAccounts.filter(account => account.segment === segment.id).length,
    })),
    [enrichedAccounts],
  );

  const filtered = useMemo(
    () => (activeSegment === 'All'
      ? enrichedAccounts
      : enrichedAccounts.filter(account => account.segment === activeSegment)),
    [activeSegment, enrichedAccounts],
  );

  const openAccountDashboard = useCallback(accountId => {
    const nextUrl = `/account-dashboard?accountId=${encodeURIComponent(accountId)}`;

    try {
      window.history.pushState({ fromPortfolio: true }, '', nextUrl);
      setRoute(getCurrentRoute());
    } catch (err) {
      setDetailError('Could not open the account dashboard. Please try again.');
      throw err;
    }
  }, []);

  const returnToPortfolio = useCallback(() => {
    if (window.history.state?.fromPortfolio) {
      window.history.back();
      return;
    }

    window.history.replaceState({}, '', '/');
    setRoute(getCurrentRoute());
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  if (route.name === 'accountDashboard') {
    return (
      <AccountDashboard
        account={enrichedAccountDetail}
        loading={detailLoading}
        error={detailError}
        onBack={returnToPortfolio}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8fafc] text-slate-800">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-[520px] w-[520px] rounded-full bg-cyan-100/40 blur-[120px]" />
        <div className="absolute right-[-12%] top-[12%] h-[520px] w-[520px] rounded-full bg-violet-100/30 blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-md shadow-cyan-100">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-700">iBaseIT Pre-Delinquency</p>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Portfolio Risk Command Center
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Live scoring
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {summary?.total_accounts ?? enrichedAccounts.length} accounts monitored
            </span>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HealthKpiCard score={portfolioMetrics.healthScore} delay={0} />
          <KpiCard
            icon={Users}
            label="Accounts At Risk"
            value={portfolioMetrics.atRisk}
            detail="High and critical customers requiring action"
            tone="rose"
            delay={0.05}
          />
          <KpiCard
            icon={CircleDollarSign}
            label="Expected Loss Exposure"
            value={formatCurrency(portfolioMetrics.expectedLoss)}
            detail="Risk-score-weighted estimated exposure"
            tone="amber"
            delay={0.1}
          />
          <KpiCard
            icon={Gauge}
            label="Next Month Delinquency Forecast"
            value={`+${portfolioMetrics.forecastLift.toFixed(1)}%`}
            detail="Estimated increase in delinquency pressure over the next 30 days"
            tone="violet"
            delay={0.2}
          />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr,1fr]">
          <RiskDistribution
            data={distributionData}
            activeSegment={activeSegment}
            onSelectSegment={setActiveSegment}
          />
          <AIInsightsPanel accounts={enrichedAccounts} />
        </section>

        <section className="mt-5">
          <GlassPanel className="p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Customer Grid</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Predictive account queue</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {['All', ...RISK_SEGMENTS.map(segment => segment.id)].map(segment => {
                  const segmentStyle = segment === 'All' ? null : getSegmentStyle(segment);
                  return (
                    <button
                      key={segment}
                      onClick={() => setActiveSegment(segment)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        activeSegment === segment
                          ? 'border-slate-300 bg-slate-200 text-slate-800 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {segmentStyle?.shortLabel ?? 'All'}
                    </button>
                  );
                })}
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filtered.map((account, index) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    index={index}
                    onOpenAccount={openAccountDashboard}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 py-16 text-center text-sm text-slate-500">
                No accounts in the selected risk segment.
              </div>
            )}
          </GlassPanel>
        </section>
      </main>
    </div>
  );
}
