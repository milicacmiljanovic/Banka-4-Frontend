export const MIN_SNAPSHOTS = 3;

export function computeMetrics(performanceHistory) {
  if (!Array.isArray(performanceHistory) || performanceHistory.length < MIN_SNAPSHOTS) {
    return { annualReturn: null, rewardToVariability: null, maxDrawdown: null, volatility: null };
  }

  const sorted = [...performanceHistory]
    .map(p => ({ date: new Date(p.date), value: Number(p.value) }))
    .filter(p => !isNaN(p.date.getTime()) && isFinite(p.value) && p.value > 0)
    .sort((a, b) => a.date - b.date);

  if (sorted.length < MIN_SNAPSHOTS) {
    return { annualReturn: null, rewardToVariability: null, maxDrawdown: null, volatility: null };
  }

  const values = sorted.map(p => p.value);

  const returns = [];
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i - 1]) / values[i - 1]);
  }

  if (returns.length === 0) {
    return { annualReturn: null, rewardToVariability: null, maxDrawdown: null, volatility: null };
  }

  const firstVal = values[0];
  const lastVal = values[values.length - 1];
  const daysDiff = (sorted[sorted.length - 1].date - sorted[0].date) / 86400000;
  const years = daysDiff > 1 ? daysDiff / 365 : returns.length / 12;

  const annualReturn = firstVal > 0 && years > 0
    ? Math.pow(lastVal / firstVal, 1 / years) - 1
    : (returns.reduce((a, b) => a + b, 0) / returns.length) * 12;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  const periodsPerYear = years > 0 ? returns.length / years : 12;
  const volatility = Math.sqrt(variance) * Math.sqrt(periodsPerYear);

  const rewardToVariability = volatility > 0 ? annualReturn / volatility : null;

  let peak = values[0];
  let maxDrawdown = 0;
  for (const v of values) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return { annualReturn, rewardToVariability, maxDrawdown, volatility };
}

export function fmtPct(val, decimals = 1) {
  if (val == null || !isFinite(val)) return '—';
  return `${(val * 100).toFixed(decimals)}%`;
}

export function fmtRatio(val, decimals = 2) {
  if (val == null || !isFinite(val)) return '—';
  return val.toFixed(decimals);
}
