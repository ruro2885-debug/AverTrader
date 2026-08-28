import { SessionAdminControl, SessionControlMode } from '../types/aiTrading';

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
    mode,
    forceNextTrade = 'AUTO',
    customWinRate = 85,
    customTargetPnl = 500,
    currentSessionPnL = 0,
    riskScore = 50,
    entryPrice,
    quantity,
    asset
  } = params;

  let isWin = false;
  let returnPct = 0;
  let distributionBucket = 'NORMAL';

  // 1. Check for single-trade forced directives ('WIN' | 'LOSS')
  if (forceNextTrade === 'WIN') {
    isWin = true;
    // Varied positive return
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
    // Varied negative return
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
  // Overall ~82% Win Bias, ~18% Loss / Neutral to ensure realistic non-staircase equity curve
  else if (mode === 'FORCE_PROFIT') {
    const roll = Math.random();

    if (roll < 0.65) {
      // 65%: Small/Medium Win (+1.2% to +4.8%)
      isWin = true;
      returnPct = randomBetween(1.2, 4.8);
      distributionBucket = 'HIGH_PROFIT_MEDIUM_WIN';
    } else if (roll < 0.80) {
      // 15%: Small Loss (-0.6% to -2.4%) - Essential to prevent artificial 100% win streaks & staircases!
      isWin = false;
      returnPct = -randomBetween(0.6, 2.4);
      distributionBucket = 'HIGH_PROFIT_REALISTIC_LOSS';
    } else if (roll < 0.93) {
      // 13%: Larger Win (+5.2% to +11.8%)
      isWin = true;
      returnPct = randomBetween(5.2, 11.8);
      distributionBucket = 'HIGH_PROFIT_LARGE_WIN';
    } else if (roll < 0.98) {
      // 5%: Micro Win (+0.3% to +0.9%)
      isWin = true;
      returnPct = randomBetween(0.3, 0.9);
      distributionBucket = 'HIGH_PROFIT_MICRO_WIN';
    } else {
      // 2%: Rare Surge Win (+12.5% to +19.5%)
      isWin = true;
      returnPct = randomBetween(12.5, 19.5);
      distributionBucket = 'HIGH_PROFIT_SURGE_EVENT';
    }
  } 
  // 3. FORCE DRAWDOWN MODE (Randomized, Weighted, Non-Reverse-Staircase)
  // Overall ~78% Loss Bias, ~22% Win / Neutral to simulate authentic market drawdown
  else if (mode === 'FORCE_LOSS') {
    const roll = Math.random();

    if (roll < 0.62) {
      // 62%: Small/Medium Loss (-1.2% to -4.8%)
      isWin = false;
      returnPct = -randomBetween(1.2, 4.8);
      distributionBucket = 'DRAWDOWN_MEDIUM_LOSS';
    } else if (roll < 0.80) {
      // 18%: Small Counter-Trend Win (+0.6% to +2.8%) - Essential to prevent artificial 100% loss streaks!
      isWin = true;
      returnPct = randomBetween(0.6, 2.8);
      distributionBucket = 'DRAWDOWN_BOUNCE_WIN';
    } else if (roll < 0.93) {
      // 13%: Larger Loss (-5.2% to -11.5%)
      isWin = false;
      returnPct = -randomBetween(5.2, 11.5);
      distributionBucket = 'DRAWDOWN_LARGE_LOSS';
    } else if (roll < 0.98) {
      // 5%: Micro Loss (-0.2% to -0.8%)
      isWin = false;
      returnPct = -randomBetween(0.2, 0.8);
      distributionBucket = 'DRAWDOWN_MICRO_LOSS';
    } else {
      // 2%: Rare Severe Breakdown Event (-12.0% to -18.5%)
      isWin = false;
      returnPct = -randomBetween(12.0, 18.5);
      distributionBucket = 'DRAWDOWN_BREAKDOWN_EVENT';
    }
  } 
  // 4. WIN RATE LOCK MODE
  else if (mode === 'CUSTOM_WIN_RATE') {
    const targetWinRate = Math.max(0.1, Math.min(0.95, customWinRate / 100));
    isWin = Math.random() < targetWinRate;

    if (isWin) {
      const winRoll = Math.random();
      if (winRoll < 0.75) {
        returnPct = randomBetween(1.0, 4.5);
        distributionBucket = 'LOCKED_WIN_RATE_STANDARD_WIN';
      } else if (winRoll < 0.93) {
        returnPct = randomBetween(4.5, 9.5);
        distributionBucket = 'LOCKED_WIN_RATE_LARGE_WIN';
      } else {
        returnPct = randomBetween(9.5, 16.0);
        distributionBucket = 'LOCKED_WIN_RATE_SURGE_WIN';
      }
    } else {
      const lossRoll = Math.random();
      if (lossRoll < 0.75) {
        returnPct = -randomBetween(0.8, 3.8);
        distributionBucket = 'LOCKED_WIN_RATE_STANDARD_LOSS';
      } else if (lossRoll < 0.93) {
        returnPct = -randomBetween(3.8, 8.2);
        distributionBucket = 'LOCKED_WIN_RATE_LARGE_LOSS';
      } else {
        returnPct = -randomBetween(8.2, 14.5);
        distributionBucket = 'LOCKED_WIN_RATE_SPIKE_LOSS';
      }
    }
  } 
  // 5. TARGET P&L MODE
  else if (mode === 'CUSTOM_TARGET_PNL') {
    const isBelowTarget = currentSessionPnL < customTargetPnl;
    const targetWinRate = isBelowTarget ? 0.78 : 0.45;
    isWin = Math.random() < targetWinRate;

    if (isWin) {
      returnPct = randomBetween(1.2, isBelowTarget ? 5.8 : 3.2);
      distributionBucket = isBelowTarget ? 'TARGET_PNL_CATCHUP_WIN' : 'TARGET_PNL_PROTECTION_WIN';
    } else {
      returnPct = -randomBetween(0.6, isBelowTarget ? 2.5 : 4.2);
      distributionBucket = isBelowTarget ? 'TARGET_PNL_MINOR_PULLBACK' : 'TARGET_PNL_PROTECTION_LOSS';
    }
  } 
  // 6. NATURAL / NORMAL SIMULATION MODE
  else {
    // Calibrated natural model based on risk score
    const baseWinProbability = Math.max(0.40, Math.min(0.72, 0.62 - ((riskScore - 50) * 0.002)));
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

  console.log(`[TRADE GENERATION]
sessionId: ${sessionId}
modeUsed: ${mode}
forceNextTrade: ${forceNextTrade}
isWin: ${isWin}
returnPct: ${returnPct > 0 ? '+' : ''}${returnPct}%
generatedPnL: ${pnl >= 0 ? '+' : ''}$${pnl}
bucket: ${distributionBucket}
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
