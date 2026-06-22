/**
 * Deterministic AI Risk Analyst utilities.
 * Derives narratives, drivers, and recommendations from
 * model outputs and account data — no external LLM calls.
 */

const SLIDER_DEFAULTS = {
  EXT_MEAN: 0.5244,
  INST_MEAN_LATE: 0.0385,
  CC_UTIL_MEAN: 0.2524,
  BUR_DEBT_TO_CREDIT_RATIO: 0.5843,
  CREDIT_INCOME_RATIO: 3.2651,
  POS_STRESS_TREND: 0.0,
  CC_DRAW_TREND: -0.0116,
  INST_LATE_TREND: 0.0,
  BB_STATUS_TREND: 0.0,
  ANNUITY_INCOME_RATIO: 0.1628,
};

const TREND_FEATURES = new Set([
  'POS_STRESS_TREND',
  'CC_DRAW_TREND',
  'INST_LATE_TREND',
  'BB_STATUS_TREND',
  'CC_UTIL_TREND',
]);

const FEATURE_FORMATTERS = {
  EXT_MEAN: {
    format: v => `${Math.round(v * 850)} pts`,
    label: 'Credit score',
    higherIsBetter: true,
  },
  CC_UTIL_MEAN: {
    format: v => `${Math.round(v * 100)}%`,
    label: 'Credit utilization',
    higherIsBetter: false,
  },
  CC_UTIL_LAST3M: {
    format: v => `${Math.round(v * 100)}%`,
    label: 'Recent credit utilization',
    higherIsBetter: false,
  },
  BUR_DEBT_TO_CREDIT_RATIO: {
    format: v => `${Math.round(v * 100)}%`,
    label: 'Debt-to-credit ratio',
    higherIsBetter: false,
  },
  CREDIT_INCOME_RATIO: {
    format: v => `${v.toFixed(1)}x`,
    label: 'Debt-to-income ratio',
    higherIsBetter: false,
  },
  INST_MEAN_LATE: {
    format: v => `${v.toFixed(1)} days`,
    label: 'Avg days late',
    higherIsBetter: false,
  },
  INST_LATE_RATE: {
    format: v => `${Math.round(v * 6)} late payments in 6 months`,
    label: 'Late payment rate',
    higherIsBetter: false,
  },
  INST_LATE_MEAN_LAST90: {
    format: v => `${v.toFixed(1)} days avg late (90d)`,
    label: 'Recent payment lateness',
    higherIsBetter: false,
  },
  INST_LATE_TREND: {
    format: v => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)),
    label: 'Payment lateness trend',
    higherIsBetter: false,
    isTrend: true,
  },
  CC_DRAW_TREND: {
    format: v => (v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`),
    label: 'Credit draw trend',
    higherIsBetter: false,
    isTrend: true,
  },
  POS_STRESS_TREND: {
    format: v => (v > 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`),
    label: 'POS stress trend',
    higherIsBetter: false,
    isTrend: true,
  },
  BB_STATUS_TREND: {
    format: v => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)),
    label: 'Bureau status trend',
    higherIsBetter: false,
    isTrend: true,
  },
  ANNUITY_INCOME_RATIO: {
    format: v => `${Math.round(v * 100)}%`,
    label: 'Annuity-to-income ratio',
    higherIsBetter: false,
  },
};

const HIGH_EXPOSURE_THRESHOLD = 150000;

function getSliderMap(sliders) {
  if (!sliders?.length) return {};
  return Object.fromEntries(sliders.map(s => [s.feature, s]));
}

function getFeatureCurrent(feature, sliders) {
  const slider = getSliderMap(sliders)[feature];
  if (slider) return slider.current;
  return SLIDER_DEFAULTS[feature] ?? null;
}

function getFeatureBenchmark(feature, sliders) {
  const slider = getSliderMap(sliders)[feature];
  if (slider) {
    const mid = (slider.min + slider.max) / 2;
    return SLIDER_DEFAULTS[feature] ?? mid;
  }
  return SLIDER_DEFAULTS[feature] ?? null;
}

function formatFeatureValue(feature, value) {
  const formatter = FEATURE_FORMATTERS[feature];
  if (formatter) return formatter.format(value);
  if (value >= 0 && value <= 1) return `${Math.round(value * 100)}%`;
  return value.toFixed(2);
}

function getDriverSentiment(driver, sliders) {
  const feature = driver.feature;
  if (!feature) {
    return driver.direction === 'up' ? 'worsening' : 'improving';
  }

  const current = getFeatureCurrent(feature, sliders);
  const benchmark = getFeatureBenchmark(feature, sliders);
  const formatter = FEATURE_FORMATTERS[feature];

  if (current === null || benchmark === null) {
    return driver.direction === 'up' ? 'worsening' : 'improving';
  }

  if (formatter?.isTrend || TREND_FEATURES.has(feature)) {
    if (current > 0.05) return 'worsening';
    if (current < -0.05) return 'improving';
    return 'neutral';
  }

  const higherIsBetter = formatter?.higherIsBetter ?? false;
  const delta = current - benchmark;

  if (Math.abs(delta) < 0.02) return driver.direction === 'up' ? 'worsening' : 'improving';

  if (higherIsBetter) {
    return delta < 0 ? 'worsening' : 'improving';
  }
  return delta > 0 ? 'worsening' : 'improving';
}

/**
 * Rank risk drivers by SHAP impact, preferring risk-increasing factors.
 */
export function rankRiskDrivers(drivers = [], limit = 5) {
  const sorted = [...drivers].sort((a, b) => {
    const aWeight = (a.direction === 'up' ? 1.2 : 0.8) * (a.impact ?? 0);
    const bWeight = (b.direction === 'up' ? 1.2 : 0.8) * (b.impact ?? 0);
    return bWeight - aWeight;
  });

  return sorted.slice(0, limit);
}

/**
 * Build key driver lines with before/after values where available.
 */
export function buildKeyDrivers(drivers = [], sliders = [], limit = 5) {
  const ranked = rankRiskDrivers(drivers, limit);

  return ranked.map(driver => {
    const feature = driver.feature;
    const sentiment = getDriverSentiment(driver, sliders);
    const formatter = feature ? FEATURE_FORMATTERS[feature] : null;

    if (feature && formatter && !formatter.isTrend) {
      const current = getFeatureCurrent(feature, sliders);
      const benchmark = getFeatureBenchmark(feature, sliders);

      if (current !== null && benchmark !== null && Math.abs(current - benchmark) > 0.01) {
        const label = formatter.label;
        const before = formatFeatureValue(feature, benchmark);
        const after = formatFeatureValue(feature, current);
        return {
          text: `${label} shifted from ${before} → ${after}`,
          sentiment,
          impact: driver.impact,
          feature,
        };
      }
    }

    if (feature && formatter?.isTrend) {
      const current = getFeatureCurrent(feature, sliders);
      if (current !== null && Math.abs(current) > 0.02) {
        const direction = current > 0 ? 'increasing' : 'decreasing';
        return {
          text: `${formatter.label} ${direction} (${formatFeatureValue(feature, current)} recent vs historical)`,
          sentiment,
          impact: driver.impact,
          feature,
        };
      }
    }

    const shapPct = driver.shap != null ? ` (${(Math.abs(driver.shap) * 100).toFixed(1)}% model contribution)` : '';
    return {
      text: `${driver.label}${shapPct}`,
      sentiment,
      impact: driver.impact,
      feature,
    };
  });
}

/**
 * Compute risk score trend from 6-month history.
 */
export function computeRiskTrend(trend = [], currentScore) {
  const series = trend?.length ? trend : [currentScore];
  const previous = series[0] ?? currentScore;
  const current = series[series.length - 1] ?? currentScore;
  const previousPct = Math.round(previous * 100);
  const currentPct = Math.round(current * 100);
  const change = currentPct - previousPct;

  let direction = 'stable';
  if (change >= 4) direction = 'up';
  else if (change <= -4) direction = 'down';

  return { previousPct, currentPct, change, direction };
}

/**
 * Generate a dynamic risk narrative from account conditions.
 */
export function generateRiskNarrative(account, drivers = [], sliders = []) {
  const scorePct = Math.round(account.score * 100);
  const { change, direction } = computeRiskTrend(account.trend, account.score);
  const topDrivers = rankRiskDrivers(drivers, 3).filter(d => d.direction === 'up');
  const protective = drivers.filter(d => d.direction === 'down').slice(0, 1);

  const parts = [];

  if (account.riskMovement === 'Escalating' || direction === 'up') {
    parts.push(
      `Customer risk has increased over the last 6 months (${change > 0 ? `+${change}` : change} pts)`,
    );
  } else if (account.riskMovement === 'Improving' || direction === 'down') {
    parts.push(
      `Customer risk has improved over the last 6 months (${change} pts)`,
    );
  } else {
    parts.push(`Customer risk has remained stable at ${scorePct}% delinquency probability`);
  }

  if (topDrivers.length > 0) {
    const driverPhrases = topDrivers.map(d => d.label.toLowerCase());
    const last = driverPhrases.pop();
    const driverList = driverPhrases.length
      ? `${driverPhrases.join(', ')} and ${last}`
      : last;
    parts.push(`primarily driven by ${driverList}`);
  }

  const worseningTrends = buildKeyDrivers(drivers, sliders, 10)
    .filter(d => d.sentiment === 'worsening' && d.text.includes('trend'));
  if (worseningTrends.length > 0) {
    parts.push(`with ${worseningTrends[0].text.toLowerCase()}`);
  }

  if (account.segment === 'Critical' || account.tier === 'Intervene') {
    parts.push(
      `placing this account in the ${account.tier} tier requiring immediate attention`,
    );
  } else if (account.tier === 'Nudge') {
    parts.push('warranting proactive outreach before conditions deteriorate');
  }

  if (protective.length > 0 && account.riskMovement !== 'Escalating') {
    parts.push(`partially offset by ${protective[0].label.toLowerCase()}`);
  }

  let narrative = parts.join(', ') + '.';
  narrative = narrative.charAt(0).toUpperCase() + narrative.slice(1);

  return narrative;
}

/**
 * Business-rule recommendations from tier, drivers, segment, and exposure.
 */
export function generateRecommendations(account, drivers = []) {
  const recommendations = [];
  const topRiskDriver = drivers.find(d => d.direction === 'up');
  const exposure = account.exposure ?? 0;

  if (account.tier === 'Watch') {
    recommendations.push({
      action: 'Continue monitoring',
      detail: 'No immediate intervention required. Re-score at next cycle and track for utilization or payment shifts.',
      urgency: 'low',
    });
  } else if (account.tier === 'Nudge') {
    recommendations.push({
      action: 'Send reminder communication',
      detail: 'Trigger proactive SMS/email ahead of the next due date. Surface to agent queue for a light-touch check-in.',
      urgency: 'medium',
    });
  } else {
    recommendations.push({
      action: 'Contact customer within 48 hours',
      detail: 'Route to collections specialist for direct outreach. Discuss payment plan or restructuring before past-due status.',
      urgency: 'high',
    });
  }

  if (exposure >= HIGH_EXPOSURE_THRESHOLD) {
    recommendations.push({
      action: 'Escalate to collections specialist',
      detail: `High exposure of $${exposure.toLocaleString()} warrants senior review and structured recovery planning.`,
      urgency: 'high',
    });
  }

  if (topRiskDriver?.feature?.includes('UTIL') || topRiskDriver?.feature === 'BUR_DEBT_TO_CREDIT_RATIO') {
    recommendations.push({
      action: 'Address utilization pressure',
      detail: 'Offer credit counseling or limit-increase review to reduce bureau utilization driving elevated risk.',
      urgency: account.tier === 'Intervene' ? 'high' : 'medium',
    });
  }

  if (topRiskDriver?.feature?.includes('LATE') || topRiskDriver?.feature?.includes('INST')) {
    recommendations.push({
      action: 'Stabilize payment behavior',
      detail: 'Set up autopay enrollment or payment-date adjustment to reverse deteriorating installment patterns.',
      urgency: 'high',
    });
  }

  if (account.riskMovement === 'Escalating') {
    recommendations.push({
      action: 'Increase monitoring frequency',
      detail: 'Risk trajectory is escalating — move to weekly score refresh until trend stabilizes.',
      urgency: 'medium',
    });
  }

  if (account.action?.title && !recommendations.some(r => r.action === account.action.title)) {
    recommendations.unshift({
      action: account.action.title,
      detail: account.action.detail,
      urgency: account.tier === 'Intervene' ? 'high' : 'medium',
    });
  }

  const seen = new Set();
  return recommendations.filter(r => {
    if (seen.has(r.action)) return false;
    seen.add(r.action);
    return true;
  }).slice(0, 4);
}

/**
 * Estimate business impact from exposure and model score.
 */
export function calculateBusinessImpact(account) {
  const exposure = account.exposure ?? Math.round((45000 + account.score * 255000) / 1000) * 1000;
  const delinquencyProb = account.score;
  const expectedLoss = Math.round(exposure * delinquencyProb * 0.18);

  let riskWindowDays = 90;
  if (account.tier === 'Intervene') riskWindowDays = 30;
  else if (account.tier === 'Nudge') riskWindowDays = 60;

  const portfolioWeight = ((delinquencyProb * exposure) / 1_000_000).toFixed(2);

  return {
    potentialExposure: expectedLoss,
    delinquencyProbability: Math.round(delinquencyProb * 100),
    riskWindowDays,
    portfolioImpact: `${portfolioWeight}% of $1M reference portfolio`,
  };
}