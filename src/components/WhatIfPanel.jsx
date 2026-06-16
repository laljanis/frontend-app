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
  Watch: 'text-sky-700',
  Nudge: 'text-amber-700',
  Intervene: 'text-rose-700',
};

const TIER_BG = {
  Watch: 'bg-sky-50 border-sky-200',
  Nudge: 'bg-amber-50 border-amber-200',
  Intervene: 'bg-rose-50 border-rose-200',
};

function ScoreTile({ label, score, tier, highlighted }) {
  return (
    <div
      className={`rounded-2xl border p-2.5 ${
        highlighted
          ? 'border-cyan-200 bg-cyan-50/50 shadow-sm'
          : 'border-slate-200 bg-slate-50/40'
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <motion.p
        key={`${label}-${score}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-1 text-2xl font-extrabold ${TIER_COLOR[tier] ?? 'text-cyan-700'}`}
      >
        {Math.round(score * 100)}%
      </motion.p>
      <span className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${TIER_BG[tier] ?? 'border-slate-200 bg-slate-50'} ${TIER_COLOR[tier] ?? 'text-slate-600'}`}>
        {tier}
      </span>
    </div>
  );
}

const FEATURE_IMPACT = {
  EXT_MEAN: {
    better: 'high',
    badge: '✅ Higher score reduces risk',
    trackGradient: 'from-rose-500/80 via-yellow-500/50 to-emerald-500/80',
  },
};

function getFeatureImpact(feature) {
  return FEATURE_IMPACT[feature] ?? {
    better: 'low',
    badge: '⚠️ Lower value reduces risk',
    trackGradient: 'from-emerald-500/80 via-yellow-500/50 to-rose-500/80',
  };
}

function RiskThresholdRuler({ beforeScore, afterScore }) {
  const nudge = 0.30;
  const intervene = 0.48;

  function getVisualPosition(score) {
    if (score <= nudge) {
      return (score / nudge) * 33.3;
    } else if (score <= intervene) {
      return 33.3 + ((score - nudge) / (intervene - nudge)) * 33.3;
    } else {
      return 66.6 + ((score - intervene) / (1.0 - intervene)) * 33.4;
    }
  }

  const beforePos = getVisualPosition(beforeScore);
  const afterPos = getVisualPosition(afterScore);

  const isIdentical = Math.round(beforeScore * 100) === Math.round(afterScore * 100);
  const isClose = Math.abs(beforeScore - afterScore) < 0.08;
  const beforeOffset = isClose && !isIdentical ? -36 : 0;
  const afterOffset = isClose && !isIdentical ? 36 : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Risk Zones & Cutoffs</p>
        <span className="text-[9px] text-rose-600 font-semibold">Intervene threshold is 48.0%</span>
      </div>

      <div className="pl-6 pr-2">
        <div className="relative pt-6 pb-2">
          {/* Three colored segments */}
          <div className="h-3.5 w-full rounded-full flex overflow-hidden border border-slate-200/80">
            <div className="w-1/3 bg-sky-500/90 border-r border-slate-200/20 flex items-center justify-center text-[8px] font-extrabold text-white uppercase tracking-wider">
              Watch
            </div>
            <div className="w-1/3 bg-amber-500/90 border-r border-slate-200/20 flex items-center justify-center text-[8px] font-extrabold text-amber-950 uppercase tracking-wider">
              Nudge
            </div>
            <div className="w-1/3 bg-rose-500/90 flex items-center justify-center text-[8px] font-extrabold text-white uppercase tracking-wider">
              Intervene
            </div>
          </div>

          {/* Combined Pin when identical */}
          {isIdentical && (
            <div
              className="absolute top-0 flex flex-col items-center -translate-x-1/2 transition-all duration-300 z-10"
              style={{ left: `${afterPos}%` }}
            >
              <span className="rounded bg-cyan-600 px-1.5 py-0.5 text-[8px] font-extrabold text-white shadow-md shadow-cyan-100 whitespace-nowrap">
                Before & After: {Math.round(afterScore * 100)}%
              </span>
              <div className="h-2.5 w-[1px] bg-cyan-600 mt-0.5" />
            </div>
          )}

          {/* Separate Pins when different */}
          {!isIdentical && (
            <>
              {/* Before Score Pin */}
              <div
                className="absolute top-0 flex flex-col items-center -translate-x-1/2 transition-all duration-300"
                style={{ left: `${beforePos}%` }}
              >
                <span 
                  className="rounded bg-slate-600 px-1 py-0.5 text-[8px] font-bold text-white shadow whitespace-nowrap transition-transform duration-300"
                  style={{ transform: `translateX(${beforeOffset}px)` }}
                >
                  Before: {Math.round(beforeScore * 100)}%
                </span>
                <div className="h-2 w-[1px] bg-slate-500 mt-0.5" />
              </div>

              {/* After Score Pin */}
              <div
                className="absolute top-0 flex flex-col items-center -translate-x-1/2 transition-all duration-300 z-10"
                style={{ left: `${afterPos}%` }}
              >
                <span 
                  className="rounded bg-cyan-600 px-1.5 py-0.5 text-[8px] font-extrabold text-white shadow-md shadow-cyan-100 whitespace-nowrap transition-transform duration-300"
                  style={{ transform: `translateX(${afterOffset}px)` }}
                >
                  After: {Math.round(afterScore * 100)}%
                </span>
                <div className="h-2.5 w-[1px] bg-cyan-600 mt-0.5" />
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-between text-[8px] text-slate-400 font-mono">
          <span>0%</span>
          <span>Watch Limit: 30%</span>
          <span>Nudge Limit: 48%</span>
          <span>100%</span>
        </div>
      </div>
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

    fetch(`/api/sliders/${accountId}`, { credentials: 'same-origin', signal: controller.signal })
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
        
        let cached = null;
        try {
          const stored = localStorage.getItem(`whatif-values-${accountId}`);
          if (stored) cached = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to load cached what-if values", e);
        }

        const initialValues = {};
        data.forEach(slider => {
          initialValues[slider.feature] = (cached && cached[slider.feature] !== undefined)
            ? cached[slider.feature]
            : slider.current;
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
      credentials: 'same-origin',
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

  useEffect(() => {
    if (!sliders || !Object.keys(values).length) return;
    try {
      localStorage.setItem(`whatif-values-${accountId}`, JSON.stringify(values));
    } catch (e) {
      console.error("Failed to save what-if values to localStorage", e);
    }
  }, [values, sliders, accountId]);

  if (loadingSliders) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        </div>
        <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 text-center shadow-sm">
        <BrainCircuit className="mx-auto mb-3 h-6 w-6 text-slate-400" />
        <p className="text-sm font-semibold text-slate-800">Live model not loaded</p>
        <p className="mt-1 text-xs text-slate-500">The premium simulator will activate when model files are available.</p>
      </div>
    );
  }

  if (error && !sliders) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 font-semibold shadow-sm">
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <ScoreTile label="Before Risk" score={originalScore} tier={originalTier} />
        <ScoreTile label="After Risk" score={predicted.score} tier={predicted.tier} highlighted />
      </div>

      {/* Visual threshold status bar */}
      <RiskThresholdRuler beforeScore={originalScore} afterScore={predicted.score} />

      <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
        <style dangerouslySetInnerHTML={{__html: `
          .custom-slider::-webkit-slider-runnable-track {
            background: transparent;
            border: none;
          }
          .custom-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #ffffff;
            border: 2.5px solid #0ea5e9;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
            cursor: pointer;
            margin-top: 0px;
          }
          .custom-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #ffffff;
            border: 2.5px solid #0ea5e9;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
            cursor: pointer;
          }
          .slider-scroll-container::-webkit-scrollbar {
            width: 6px;
          }
          .slider-scroll-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.02);
            border-radius: 9999px;
          }
          .slider-scroll-container::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.15);
            border-radius: 9999px;
          }
          .slider-scroll-container::-webkit-scrollbar-thumb:hover {
            background: rgba(14, 165, 233, 0.4);
          }
        `}} />

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-cyan-600">
            <SlidersHorizontal className="h-4 w-4" />
            <p className="text-sm font-semibold text-slate-800">Live risk recalculation</p>
          </div>
          {predicting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
          ) : (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              improving
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : delta > 0
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-slate-100 text-slate-600'
            }`}
            >
              <DeltaIcon className="h-3 w-3" />
              {delta === 0 ? 'Baseline' : `${Math.abs(Math.round(delta * 100))}% ${improving ? 'lower' : 'higher'}`}
            </span>
          )}
        </div>

        {/* Preset Scenarios */}
        <div className="mb-3.5 flex flex-wrap gap-2 items-center border-b border-slate-200/60 pb-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mr-1">Presets:</span>
          <button
            onClick={() => {
              const resetValues = {};
              sliders.forEach(s => {
                resetValues[s.feature] = s.current;
              });
              setValues(resetValues);
              try {
                localStorage.removeItem(`whatif-values-${accountId}`);
              } catch (e) {}
            }}
            className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-800 active:bg-slate-300 transition-colors shadow-sm"
          >
            🔄 Reset
          </button>
          <button
            onClick={() => {
              const bestValues = {};
              sliders.forEach(s => {
                const imp = getFeatureImpact(s.feature);
                bestValues[s.feature] = imp.better === 'high' ? s.max : s.min;
              });
              setValues(bestValues);
            }}
            className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 active:bg-emerald-200 transition-colors shadow-sm"
          >
            🌟 Best Case
          </button>
          <button
            onClick={() => {
              const worstValues = {};
              sliders.forEach(s => {
                const imp = getFeatureImpact(s.feature);
                worstValues[s.feature] = imp.better === 'high' ? s.min : s.max;
              });
              setValues(worstValues);
            }}
            className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800 active:bg-rose-200 transition-colors shadow-sm"
          >
            ⚡ Worst Case
          </button>
        </div>

        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 slider-scroll-container">
          {sliders.map(slider => {
            const value = values[slider.feature] ?? slider.current;
            const pct = ((value - slider.min) / (slider.max - slider.min)) * 100;
            const impact = getFeatureImpact(slider.feature);
            const baselinePct = ((slider.current - slider.min) / (slider.max - slider.min)) * 100;
            const isBetter = impact.better === 'high' ? value > slider.current : value < slider.current;
            const isSame = Math.abs(value - slider.current) < 1e-9;

            return (
              <div key={slider.feature} className="border-b border-slate-200/40 pb-2.5 last:border-0 last:pb-0">
                <div className="mb-1.5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{slider.label}</p>
                    <span className={`text-[9.5px] font-semibold tracking-wide ${impact.better === 'high' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {impact.badge}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-cyan-700">
                      {Number(value).toFixed(slider.step < 1 ? 2 : 0)}
                    </span>
                    {!isSame && (
                      <span className={`block text-[8.5px] font-bold ${isBetter ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isBetter ? '↓ LOWER RISK' : '↑ HIGHER RISK'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative h-6 flex items-center">
                  {/* Color-coded track */}
                  <div className={`absolute left-0 right-0 h-2 rounded-full bg-gradient-to-r ${impact.trackGradient} opacity-60`} />

                  {/* Baseline indicator tick */}
                  <div 
                    className="absolute h-5 w-[4px] bg-slate-700 border border-white rounded-sm shadow pointer-events-none z-10"
                    style={{ left: `calc(${baselinePct}% - 2px)` }}
                  />
                  <span 
                    className="absolute text-[8px] text-slate-500 font-bold tracking-wider pointer-events-none z-10"
                    style={{ left: `calc(${baselinePct}% - 12px)`, top: '-11px' }}
                  >
                    BASE
                  </span>

                  {/* Range input */}
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
                    className="custom-slider relative w-full h-full bg-transparent appearance-none cursor-pointer focus:outline-none z-20"
                  />
                </div>
                <div className="mt-0.5 flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>Min: {slider.min}</span>
                  <span>Max: {slider.max}</span>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 font-semibold">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
