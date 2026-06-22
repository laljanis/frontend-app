import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  CircleDollarSign,
  Gauge,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  buildKeyDrivers,
  calculateBusinessImpact,
  computeRiskTrend,
  generateRecommendations,
  generateRiskNarrative,
} from '../utils/riskAnalyst';

const URGENCY_STYLES = {
  high: 'border-rose-200 bg-rose-50/60 text-rose-700',
  medium: 'border-amber-200 bg-amber-50/60 text-amber-700',
  low: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
};

const SENTIMENT_STYLES = {
  worsening: 'text-rose-600',
  improving: 'text-emerald-600',
  neutral: 'text-slate-600',
};

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
      {children}
    </p>
  );
}

function StatTile({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent ?? 'text-slate-900'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

function TrendIndicator({ direction, change }) {
  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
        <TrendingUp className="h-3 w-3" />
        +{change}
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
        <TrendingDown className="h-3 w-3" />
        {change}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500">
      <Minus className="h-3 w-3" />
      Stable
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-16 rounded-2xl bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-2xl bg-slate-100" />
      </div>
      <div className="h-20 rounded-2xl bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-16 rounded-2xl bg-slate-100" />
        <div className="h-16 rounded-2xl bg-slate-100" />
        <div className="h-16 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function AIRiskAnalystCard({ account }) {
  const [sliders, setSliders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!account?.id) return undefined;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setUnavailable(false);

    fetch(`/api/sliders/${account.id}`, { credentials: 'same-origin', signal: controller.signal })
      .then(response => {
        if (response.status === 503) {
          setUnavailable(true);
          return null;
        }
        if (!response.ok) throw new Error(`Feature data unavailable (${response.status})`);
        return response.json();
      })
      .then(data => {
        if (data) setSliders(data);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [account?.id]);

  const drivers = account?.drivers ?? [];
  const hasDrivers = drivers.length > 0;

  const analysis = useMemo(() => {
    if (!account || !hasDrivers) return null;

    return {
      narrative: generateRiskNarrative(account, drivers, sliders ?? []),
      keyDrivers: buildKeyDrivers(drivers, sliders ?? []),
      riskTrend: computeRiskTrend(account.trend, account.score),
      recommendations: generateRecommendations(account, drivers),
      businessImpact: calculateBusinessImpact(account),
    };
  }, [account, drivers, sliders, hasDrivers]);

  if (!account) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md shadow-slate-100">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">Select an account to generate risk analysis.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-md shadow-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-cyan-50/80 via-violet-50/40 to-transparent" />

      <div className="relative p-6">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-violet-50 p-2.5 text-cyan-600 shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">AI Risk Analyst</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Model-driven risk assessment and recommended intervention
            </p>
          </div>
        </div>

        {loading && <LoadingSkeleton />}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-500" />
              <div>
                <p className="text-sm font-semibold text-rose-700">Analysis partially unavailable</p>
                <p className="mt-1 text-xs text-rose-600">{error}</p>
                {analysis && (
                  <p className="mt-2 text-xs text-slate-500">
                    Showing analysis from model drivers. Feature-level comparisons require slider data.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && !hasDrivers && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-center">
            <Gauge className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">No model drivers available</p>
            <p className="mt-1 text-xs text-slate-400">
              Risk analysis requires SHAP-derived feature contributions for this account.
            </p>
          </div>
        )}

        {!loading && hasDrivers && analysis && (
          <div className="space-y-5">
            {/* Section 1: Risk Narrative */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50/40 to-violet-50/30 p-4"
            >
              <SectionLabel>Risk Narrative</SectionLabel>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{analysis.narrative}</p>
              {unavailable && (
                <p className="mt-2 text-[10px] text-slate-400">
                  Feature benchmarks unavailable — narrative based on model drivers and trend data.
                </p>
              )}
            </motion.div>

            <div className="grid gap-5 lg:grid-cols-2">
              {/* Section 2: Key Drivers */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-4">
                <SectionLabel>Key Drivers</SectionLabel>
                <ul className="mt-3 space-y-2.5">
                  {analysis.keyDrivers.map((driver, index) => (
                    <motion.li
                      key={`${driver.feature ?? driver.text}-${index}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                        driver.sentiment === 'worsening'
                          ? 'bg-rose-500'
                          : driver.sentiment === 'improving'
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`} />
                      <span className={SENTIMENT_STYLES[driver.sentiment] ?? 'text-slate-600'}>
                        {driver.text}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Section 3: Risk Trend */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-4">
                <SectionLabel>Risk Trend</SectionLabel>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-2xl font-semibold text-slate-400">
                      {analysis.riskTrend.previousPct}
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="text-3xl font-bold text-slate-900">
                      {analysis.riskTrend.currentPct}
                    </span>
                    <span className={`text-sm font-semibold ${
                      analysis.riskTrend.change > 0
                        ? 'text-rose-600'
                        : analysis.riskTrend.change < 0
                        ? 'text-emerald-600'
                        : 'text-slate-500'
                    }`}>
                      ({analysis.riskTrend.change > 0 ? '+' : ''}{analysis.riskTrend.change})
                    </span>
                  </div>
                  <TrendIndicator
                    direction={analysis.riskTrend.direction}
                    change={analysis.riskTrend.change}
                  />
                </div>
                <p className="mt-2 text-[10px] text-slate-400">6-month risk score comparison</p>
              </div>
            </div>

            {/* Section 4: Recommended Action */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-600" />
                <SectionLabel>Recommended Action</SectionLabel>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {analysis.recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.action}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{rec.action}</p>
                      <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${URGENCY_STYLES[rec.urgency]}`}>
                        {rec.urgency}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{rec.detail}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Section 5: Potential Business Impact */}
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50/80 to-cyan-50/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-cyan-600" />
                <SectionLabel>Potential Business Impact</SectionLabel>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                  label="Expected Loss Exposure"
                  value={`$${analysis.businessImpact.potentialExposure.toLocaleString()}`}
                  sub="Exposure × probability × 18% LGD"
                  accent="text-rose-600"
                />
                <StatTile
                  label="Probability of Delinquency"
                  value={`${analysis.businessImpact.delinquencyProbability}%`}
                  sub="Calibrated model output"
                  accent="text-amber-600"
                />
                <StatTile
                  label="Estimated Risk Window"
                  value={`${analysis.businessImpact.riskWindowDays} days`}
                  sub={`Based on ${account.tier} tier`}
                  accent="text-slate-800"
                />
                <StatTile
                  label="Portfolio Impact"
                  value={analysis.businessImpact.portfolioImpact}
                  sub={`$${(account.exposure ?? 0).toLocaleString()} account exposure`}
                  accent="text-cyan-700"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
