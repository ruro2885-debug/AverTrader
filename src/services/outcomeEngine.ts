import { SessionAdminControl, SessionControlMode, normalizeSessionMode } from '../types/aiTrading';

export interface OutcomeParams {
  sessionId: string;
  mode: SessionControlMode;
  forceNextTrade?: 'AUTO' | 'WIN' | 'LOSS';
  customWinRate?: number; // e.g. 85 for 85%
  customTargetPnl?: number;
  currentSessionPnL?: number;
  riskScore?: number; // 0 - 100
  entryPrice: number;
  quantity: number;
  asset: string;
}

export interface GeneratedOutcome {
  isWin: boolean;
  returnPct: number;
  exitPrice: number;
  pnl: number;
  reason: 'TARGET_HIT' | 'STOP_LOSS_HIT';
  distributionBucket: string;
}

/**
 * Helper to generate a random float between min and max with dynamic variance
 */
function randomBetween(min: number, max: number, decimals: number = 2): number {
  const rand = Math.random() * (max - min) + min;
  return parseFloat(rand.toFixed(decimals));
}

/**
 * Generates an independent, non-deterministic simulated trade outcome based on weighted probability distributions.
 * Strictly avoids arithmetic staircase progressions (+1, +2, +3 or -1, -2, -3), identical repeating amounts,
 * or deterministic increments.
 */
export function generateSimulatedOutcome(params: {
  sessionId: string;
  mode: SessionControlMode;
  forceNextTrade?: 'AUTO' | 'WIN' | 'LOSS';
  customWinRate?: number;
  customTargetPnl?: number;
  currentSessionPnL?: number;
  riskScore?: number;
  entryPrice: number;
  quantity: number;
  asset: string;
}): GeneratedOutcome {
  const {
    sessionId,
    mode: rawMode,
    forceNextTrade = 'AUTO',
    riskScore = 50,
    entryPrice,
    quantity
  } = params;

  const { canonical: mode } = normalizeSessionMode(rawMode);

  let isWin = false;
  let returnPct = 0;
  let distributionBucket = 'NORMAL';

  // 1. Check for single-trade forced directives ('WIN' | 'LOSS')
  if (forceNextTrade === 'WIN') {
    isWin = true;
    const roll = Math.random();
    if (roll < 0.70) {
      returnPct = randomBetween(1.8, 5.2);
      distributionBucket = 'FORCE_NEXT_WIN_STANDARD';
    } else if (roll < 0.92) {
      returnPct = randomBetween(5.2, 9.8);
      distributionBucket = 'FORCE_NEXT_WIN_LARGE';
    } else {
      returnPct = randomBetween(0.8, 1.8);
      distributionBucket = 'FORCE_NEXT_WIN_SMALL';
    }
  } else if (forceNextTrade === 'LOSS') {
    isWin = false;
    const roll = Math.random();
    if (roll < 0.70) {
      returnPct = -randomBetween(1.5, 4.8);
      distributionBucket = 'FORCE_NEXT_LOSS_STANDARD';
    } else if (roll < 0.92) {
      returnPct = -randomBetween(4.8, 9.2);
      distributionBucket = 'FORCE_NEXT_LOSS_LARGE';
    } else {
      returnPct = -randomBetween(0.6, 1.5);
      distributionBucket = 'FORCE_NEXT_LOSS_SMALL';
    }
  } 
  // 2. FORCE HIGH PROFIT MODE (Randomized, Weighted, Non-Staircase)
  // Overall ~85% Win Bias, ~15% Loss / Neutral to ensure realistic non-staircase equity curve
  else if (mode === 'force_high_profit') {
    const roll = Math.random();

    if (roll < 0.65) {
      // 65%: Medium Win (+1.5% to +5.2%)
      isWin = true;
      returnPct = randomBetween(1.5, 5.2);
      distributionBucket = 'HIGH_PROFIT_MEDIUM_WIN';
    } else if (roll < 0.80) {
      // 15%: Small Realistic Market Loss (-0.6% to -2.2%) - Essential to prevent artificial 100% win streaks & staircases!
      isWin = false;
      returnPct = -randomBetween(0.6, 2.2);
      distributionBucket = 'HIGH_PROFIT_REALISTIC_LOSS';
    } else if (roll < 0.94) {
      // 14%: Large Alpha Win (+5.5% to +12.5%)
      isWin = true;
      returnPct = randomBetween(5.5, 12.5);
      distributionBucket = 'HIGH_PROFIT_LARGE_WIN';
    } else {
      // 6%: Surge Event (+12.8% to +18.5%)
      isWin = true;
      returnPct = randomBetween(12.8, 18.5);
      distributionBucket = 'HIGH_PROFIT_SURGE_EVENT';
    }
  } 
  // 3. FORCE DRAWDOWN MODE (Randomized, Weighted, Non-Reverse-Staircase)
  // Overall ~82% Loss Bias, ~18% Win / Neutral to simulate authentic market drawdown
  else if (mode === 'force_drawdown') {
    const roll = Math.random();

    if (roll < 0.65) {
      // 65%: Small/Medium Loss (-1.5% to -5.2%)
      isWin = false;
      returnPct = -randomBetween(1.5, 5.2);
      distributionBucket = 'DRAWDOWN_MEDIUM_LOSS';
    } else if (roll < 0.80) {
      // 15%: Small Counter-Trend Bounce Win (+0.6% to +2.5%)
      isWin = true;
      returnPct = randomBetween(0.6, 2.5);
      distributionBucket = 'DRAWDOWN_BOUNCE_WIN';
    } else if (roll < 0.94) {
      // 14%: Larger Loss (-5.2% to -11.8%)
      isWin = false;
      returnPct = -randomBetween(5.2, 11.8);
      distributionBucket = 'DRAWDOWN_LARGE_LOSS';
    } else {
      // 6%: Severe Breakdown Event (-12.0% to -18.5%)
      isWin = false;
      returnPct = -randomBetween(12.0, 18.5);
      distributionBucket = 'DRAWDOWN_BREAKDOWN_EVENT';
    }
  } 
  // 4. NATURAL / NORMAL SIMULATION MODE (Zero manipulation, real market model)
  else {
    // Calibrated natural model based on risk score
    const baseWinProbability = Math.max(0.42, Math.min(0.70, 0.60 - ((riskScore - 50) * 0.002)));
    isWin = Math.random() < baseWinProbability;

    const volatilityFactor = Math.max(0.6, Math.min(1.8, riskScore / 50));

    if (isWin) {
      const roll = Math.random();
      if (roll < 0.75) {
        returnPct = randomBetween(0.8 * volatilityFactor, 3.8 * volatilityFactor);
        distributionBucket = 'NATURAL_STANDARD_WIN';
      } else if (roll < 0.94) {
        returnPct = randomBetween(3.8 * volatilityFactor, 7.5 * volatilityFactor);
        distributionBucket = 'NATURAL_EXPANDED_WIN';
      } else {
        returnPct = randomBetween(7.5 * volatilityFactor, 13.0 * volatilityFactor);
        distributionBucket = 'NATURAL_BREAKOUT_WIN';
      }
    } else {
      const roll = Math.random();
      if (roll < 0.75) {
        returnPct = -randomBetween(0.6 * volatilityFactor, 3.2 * volatilityFactor);
        distributionBucket = 'NATURAL_STANDARD_LOSS';
      } else if (roll < 0.94) {
        returnPct = -randomBetween(3.2 * volatilityFactor, 6.8 * volatilityFactor);
        distributionBucket = 'NATURAL_STOP_LOSS';
      } else {
        returnPct = -randomBetween(6.8 * volatilityFactor, 11.5 * volatilityFactor);
        distributionBucket = 'NATURAL_VOLATILITY_LOSS';
      }
    }
  }

  // Calculate actual exit price and raw trade P&L
  const exitMultiplier = 1 + (returnPct / 100);
  const exitPrice = parseFloat((entryPrice * exitMultiplier).toFixed(2));
  const rawPnl = (exitPrice - entryPrice) * quantity;
  const pnl = parseFloat(rawPnl.toFixed(2));
  const reason = isWin ? 'TARGET_HIT' : 'STOP_LOSS_HIT';

  console.log(`[TRADE_RESULT]
sessionId: ${sessionId}
executionMode: ${mode}
isWin: ${isWin}
returnPct: ${returnPct > 0 ? '+' : ''}${returnPct}%
pnl: ${pnl >= 0 ? '+' : ''}$${pnl}
distributionBucket: ${distributionBucket}
timestamp: ${new Date().toISOString()}`);

  return {
    isWin,
    returnPct,
    exitPrice,
    pnl,
    reason,
    distributionBucket
  };
}
