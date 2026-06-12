import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const TIER_COLOR = { Watch: 'text-amber-400', Nudge: 'text-orange-400', Intervene: 'text-red-400' };
const TIER_BG = { Watch: 'bg-amber-500/20', Nudge: 'bg-orange-500/20', Intervene: 'bg-red-500/20' };

export default function WhatIfPanel({ accountId, originalScore, originalTier }) {
  const [sliders, setSliders] = useState(null);
  const [values, setValues] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [loadingSliders, setLoadingSliders] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const debouncedValues = useDebounce(values, 450);

  // Load slider definitions with current account values
  useEffect(() => {
    fetch(`/api/sliders/${accountId}`)
      .then(r => {
        if (r.status === 503) { setUnavailable(true); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setSliders(data);
        const init = {};
        data.forEach(s => { init[s.feature] = s.current; });
        setValues(init);
      })
      .finally(() => setLoadingSliders(false));
  }, [accountId]);

  // Re-predict on debounced slider changes — only when values differ from baseline
  useEffect(() => {
    if (!sliders || !Object.keys(debouncedValues).length) return;

    const overrides = {};
    sliders.forEach(s => {
      const v = debouncedValues[s.feature];
      if (v !== undefined && Math.abs(v - s.current) > 1e-9) overrides[s.feature] = v;
    });

    if (!Object.keys(overrides).length) {
      setPrediction(null);
      return;
    }

    setPredicting(true);
    fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId, overrides }),
    })
      .then(r => r.json())
      .then(setPrediction)
      .finally(() => setPredicting(false));
  }, [debouncedValues, sliders, accountId]);

  if (loadingSliders) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="bg-gray-700/30 border border-gray-700 rounded-lg px-4 py-3 text-center">
        <p className="text-gray-500 text-xs">Live model not loaded — what-if simulator unavailable</p>
      </div>
    );
  }

  if (!sliders) return null;

  const predicted = prediction ?? { score: originalScore, tier: originalTier };
  const delta = prediction ? prediction.score - originalScore : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          What-If Simulator
        </h3>
        {predicting && (
          <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {sliders.map(s => {
          const val = values[s.feature] ?? s.current;
          return (
            <div key={s.feature}>
              <div className="flex justify-between items-baseline text-xs mb-1.5">
                <span className="text-gray-300">{s.label}</span>
                <span className="text-amber-400 font-mono font-medium ml-2 flex-shrink-0">
                  {Number(val).toFixed(s.step < 1 ? 2 : 0)}{' '}
                  <span className="text-gray-500">{s.unit}</span>
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={val}
                onChange={e =>
                  setValues(prev => ({ ...prev, [s.feature]: parseFloat(e.target.value) }))
                }
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-600 accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                <span>{s.min}</span>
                <span>{s.max}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="rounded-lg px-3 py-2.5 border border-gray-700 bg-gray-700/30">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Original</p>
          <p className={`text-xl font-bold ${TIER_COLOR[originalTier]}`}>
            {Math.round(originalScore * 100)}%
          </p>
          <span
            className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 ${TIER_BG[originalTier]} ${TIER_COLOR[originalTier]}`}
          >
            {originalTier}
          </span>
        </div>
        <div
          className={`rounded-lg px-3 py-2.5 border ${
            prediction
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-gray-700 bg-gray-700/30'
          }`}
        >
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Predicted</p>
          <p className={`text-xl font-bold ${TIER_COLOR[predicted.tier]}`}>
            {Math.round(predicted.score * 100)}%
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${TIER_BG[predicted.tier]} ${TIER_COLOR[predicted.tier]}`}
            >
              {predicted.tier}
            </span>
            {delta !== 0 && (
              <span
                className={`text-[10px] font-mono font-semibold ${
                  delta > 0 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {delta > 0 ? '▲' : '▼'} {Math.abs(Math.round(delta * 100))}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
