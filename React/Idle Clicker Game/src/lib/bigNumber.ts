import Decimal from 'break_infinity.js';

export type NotationType = 'scientific' | 'engineering' | 'standard';

const STANDARD_SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
  'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod',
  'Vg', 'Uvg', 'Dvg', 'Tvg', 'Qavg', 'Qivg', 'Sxvg', 'Spvg', 'Ocvg', 'Novg',
  'Tg', 'Utg', 'Dtg', 'Ttg', 'Qatg', 'Qitg', 'Sxtg', 'Sptg', 'Octg', 'Notg',
  'Qag', 'Uqag', 'Dqag', 'Tqag', 'Qaqag', 'Qiqag', 'Sxqag', 'Spqag', 'Ocqag', 'Noqag',
  'Cent',
];

export function toDecimal(val: Decimal | string | number | undefined): Decimal {
  if (val instanceof Decimal) return val;
  if (typeof val === 'number') return new Decimal(val);
  if (!val || typeof val !== 'string') return new Decimal(0);
  try {
    return new Decimal(val);
  } catch {
    return new Decimal(0);
  }
}

export function formatBigNumber(val: Decimal | string | number, notation: NotationType = 'standard', decimals = 2): string {
  const dec = toDecimal(val);

  if (Number.isNaN(dec.m) || !Number.isFinite(dec.m) || Number.isNaN(dec.e) || !Number.isFinite(dec.e)) return '0';
  if (dec.lt(0)) return '-' + formatBigNumber(dec.abs(), notation, decimals);
  if (dec.lt(1000) && dec.gte(0)) {
    // For small numbers below 1000, display clean float or integer
    return dec.toNumber().toLocaleString('en-US', {
      maximumFractionDigits: dec.lt(10) && dec.gt(0) && !dec.floor().equals(dec) ? 1 : 0,
    });
  }

  const exp = dec.e;

  if (notation === 'scientific') {
    const mantissa = dec.m;
    return `${mantissa.toFixed(decimals)}e+${exp}`;
  }

  if (notation === 'engineering') {
    const remainder = exp % 3;
    const engineeringExp = exp - remainder;
    const adjustedMantissa = dec.m * Math.pow(10, remainder);
    return `${adjustedMantissa.toFixed(decimals)}e+${engineeringExp}`;
  }

  // Standard notation with game tier abbreviations
  const suffixIndex = Math.floor(exp / 3);
  if (suffixIndex < STANDARD_SUFFIXES.length) {
    const remainder = exp % 3;
    const adjustedMantissa = dec.m * Math.pow(10, remainder);
    const suffix = STANDARD_SUFFIXES[suffixIndex];
    return `${adjustedMantissa.toFixed(decimals)} ${suffix}`.trim();
  }

  // Exceeding standard suffixes fallback to scientific
  return `${dec.m.toFixed(decimals)}e+${exp}`;
}

/**
 * Calculates the exact cumulative cost for buying 'count' generators at once
 * Geometric Series Formula: C = baseCost * r^owned * (r^count - 1) / (r - 1)
 */
export function calculateBulkGeneratorCost(
  baseCost: Decimal | string | number,
  costExponent: number,
  owned: number,
  count: number
): Decimal {
  if (count <= 0) return new Decimal(0);
  const base = toDecimal(baseCost);
  const r = costExponent;

  if (count === 1) {
    // Single unit: base * r^owned
    return base.times(Decimal.pow(r, owned));
  }

  const rMinusOne = r - 1;
  const currentCostMultiplier = Decimal.pow(r, owned);
  const bulkFactor = Decimal.pow(r, count).minus(1).div(rMinusOne);

  return base.times(currentCostMultiplier).times(bulkFactor);
}

/**
 * Solves the maximum number of generators affordable with current balance
 * k = floor( log_r( (currency * (r - 1) / (base * r^owned)) + 1 ) )
 */
export function calculateMaxAffordableGenerators(
  baseCost: Decimal | string | number,
  costExponent: number,
  owned: number,
  currency: Decimal | string | number
): { maxCount: number; totalCost: Decimal } {
  const cur = toDecimal(currency);
  const base = toDecimal(baseCost);
  const r = costExponent;
  const currentSingleCost = base.times(Decimal.pow(r, owned));

  if (cur.lt(currentSingleCost)) {
    return { maxCount: 0, totalCost: new Decimal(0) };
  }

  const rMinusOne = r - 1;
  // ratio = (cur * (r - 1)) / (base * r^owned) + 1
  const ratio = cur.times(rMinusOne).div(currentSingleCost).plus(1);
  if (ratio.lte(1)) {
    return { maxCount: 1, totalCost: currentSingleCost };
  }

  // maxCount = floor( log(ratio) / log(r) )
  const logRatio = ratio.log10();
  const logR = Math.log10(r);
  const maxCount = Math.max(1, Math.floor(logRatio / logR));

  // Compute exact cost for maxCount
  const totalCost = calculateBulkGeneratorCost(base, r, owned, maxCount);

  return { maxCount, totalCost };
}
