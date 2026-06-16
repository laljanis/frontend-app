import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, BrainCircuit, SlidersHorizontal } from 'lucide-react';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

const TIER_COLOR = {
  Watch: 'text-yellow-200',
  Nudge: 'text-orange-200',
  Intervene: 'text-rose-200',
};

const TIER_BG = {
  Watch: 'bg-yellow-400/10 border-yellow-300/20',
  Nudge: 'bg-orange-400/10 border-orange-300/20',
  Intervene: 'bg-rose-400/10 border-rose-300/20',
};

function ScoreTile({ label, score, tier, highlighted }) {
  return (
    <div
      className={`rounded-3xl border p-4 ${
        highlighted
          ? 'border-cyan-300/25 bg-cyan-400/10 shadow-lg shadow-cyan-950/20'
          : 'border-white/10 bg-black/20'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <motion.p
        key={`${label}-${score}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-3 text-4xl font-semibold ${TIER_COLOR[tier] ?? 'text-cyan-200'}`}
      >
        {Math.round(score * 100)}%
      </motion.p>
      <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${TIER_BG[tier] ?? 'border-white/10 bg-white/5'} ${TIER_COLOR[tier] ?? 'text-slate-300'}`}>
        {tier}
      </span>
    </div>
  );
}

export default function WhatIfPanel({ accountId, originalScore, originalTier }) {
  const [sliders, setSliders] = useState(null);
  const [values, setValues] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [loadingSliders, setLoadingSliders] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState(null);

  const debouncedValues = useDebounce(values, 450);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingSliders(true);
    setUnavailable(false);
    setError(null);

    fetch(`/api/sliders/${accountId}`, { signal: controller.signal })
      .then(response => {
        if (response.status === 503) {
          setUnavailable(true);
          return null;
        }
        if (!response.ok) throw new Error(`Slider request failed with status ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!data) return;
        const initialValues = {};
        data.forEach(slider => {
          initialValues[slider.feature] = slider.current;
        });
        setSliders(data);
        setValues(initialValues);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSliders(false);
      });

    return () => controller.abort();
  }, [accountId]);

  useEffect(() => {
    if (!sliders || !Object.keys(debouncedValues).length) return;

    const overrides = {};
    sliders.forEach(slider => {
      const value = debouncedValues[slider.feature];
      if (value !== undefined && Math.abs(value - slider.current) > 1e-9) {
        overrides[slider.feature] = value;
      }
    });

    if (!Object.keys(overrides).length) {
      setPrediction(null);
      return;
    }

    const controller = new AbortController();
    setPredicting(true);
    setError(null);

    fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId, overrides }),
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error(`Prediction failed with status ${response.status}`);
        return response.json();
      })
      .then(setPrediction)
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setPredicting(false);
      });

    return () => controller.abort();
  }, [debouncedValues, sliders, accountId]);

  if (loadingSliders) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 animate-pulse rounded-3xl border border-white/10 bg-white/[0.05]" />
          <div className="h-32 animate-pulse rounded-3xl border border-white/10 bg-white/[0.05]" />
        </div>
        <div className="h-44 animate-pulse rounded-3xl border border-white/10 bg-white/[0.05]" />
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center">
        <BrainCircuit className="mx-auto mb-3 h-6 w-6 text-slate-500" />
        <p className="text-sm font-medium text-slate-300">Live model not loaded</p>
        <p className="mt-1 text-xs text-slate-500">The premium simulator will activate when model files are available.</p>
      </div>
    );
  }

  if (error && !sliders) {
    return (
      <div className="rounded-3xl border border-rose-300/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  if (!sliders) return null;

  const predicted = prediction ?? { score: originalScore, tier: originalTier };
  const delta = predicted.score - originalScore;
  const improving = delta < 0;
  const DeltaIcon = improving ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <ScoreTile label="Before Risk" score={originalScore} tier={originalTier} />
        <ScoreTile label="After Risk" score={predicted.score} tier={predicted.tier} highlighted />
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-cyan-200">
            <SlidersHorizontal className="h-4 w-4" />
            <p className="text-sm font-semibold text-white">Live risk recalculation</p>
          </div>
          {predicting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
          ) : (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] ${
              improving
                ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                : delta > 0
                  ? 'border-rose-300/20 bg-rose-400/10 text-rose-200'
                  : 'border-white/10 bg-white/5 text-slate-300'
            }`}
            >
              <DeltaIcon className="h-3 w-3" />
              {delta === 0 ? 'Baseline' : `${Math.abs(Math.round(delta * 100))}% ${improving ? 'lower' : 'higher'}`}
            </span>
          )}
        </div>

        <div className="space-y-5">
          {sliders.map(slider => {
            const value = values[slider.feature] ?? slider.current;
            const pct = ((value - slider.min) / (slider.max - slider.min)) * 100;

            return (
              <div key={slider.feature}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-slate-200">{slider.label}</p>
                  <span className="font-mono text-xs font-semibold text-cyan-200">
                    {Number(value).toFixed(slider.step < 1 ? 2 : 0)}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={value}
                    onChange={event =>
                      setValues(prev => ({
                        ...prev,
                        [slider.feature]: parseFloat(event.target.value),
                      }))
                    }
                    className="relative h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-300"
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                  <span>{slider.min}</span>
                  <span>{slider.max}</span>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
