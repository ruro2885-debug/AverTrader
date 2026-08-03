import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, CheckCircle2, Send, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFinancials } from '../../hooks/useFinancials';

interface InstitutionalWithdrawalPageProps {
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export type CryptoAsset = 'BTC' | 'ETH' | 'USDT' | 'USDC' | 'SOL' | 'AVR';
export type FiatCurrency = 'USD' | 'GBP' | 'EUR';

interface CryptoInfo {
  symbol: CryptoAsset;
  name: string;
  iconChar: string;
  decimals: number;
  defaultPriceUsd: number;
}

interface FiatInfo {
  code: FiatCurrency;
  symbol: string;
  flag: string;
  name: string;
  defaultUsdRate: number; // units of fiat per 1 USD
}

const SUPPORTED_FIAT: FiatInfo[] = [
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar', defaultUsdRate: 1.0 },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound', defaultUsdRate: 0.79 },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro', defaultUsdRate: 0.92 },
];

const SUPPORTED_CRYPTO: CryptoInfo[] = [
  { symbol: 'BTC', name: 'Bitcoin', iconChar: '₿', decimals: 8, defaultPriceUsd: 67420.50 },
  { symbol: 'ETH', name: 'Ethereum', iconChar: '◈', decimals: 6, defaultPriceUsd: 3450.20 },
  { symbol: 'USDT', name: 'Tether USD', iconChar: '₮', decimals: 2, defaultPriceUsd: 1.00 },
  { symbol: 'USDC', name: 'USD Coin', iconChar: '💵', decimals: 2, defaultPriceUsd: 1.00 },
  { symbol: 'SOL', name: 'Solana', iconChar: '🆂', decimals: 4, defaultPriceUsd: 145.60 },
  { symbol: 'AVR', name: 'Aver Token', iconChar: 'A', decimals: 4, defaultPriceUsd: 12.40 }
];

const MIN_WITHDRAWAL_USD = 10.00;
const MAX_WITHDRAWAL_USD = 9000000.00;

export default function InstitutionalWithdrawalPage({ onClose }: InstitutionalWithdrawalPageProps) {
  const { user, addWithdrawal } = useAuth();
  const { homeNetBalance, tokenBalance } = useFinancials();

  // Step state: 1 = Amount Entry, 2 = Destination Address, 3 = Complete
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Active Fiat Currency
  const [activeFiat, setActiveFiat] = useState<FiatCurrency>('USD');

  // Selected crypto for conversion
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>('BTC');
  const [showAssetSelector, setShowAssetSelector] = useState(false);

  // Real-time rates
  const [fiatRates, setFiatRates] = useState<Record<FiatCurrency, number>>({
    USD: 1.0,
    GBP: 0.79,
    EUR: 0.92,
  });

  const [cryptoPricesUsd, setCryptoPricesUsd] = useState<Record<CryptoAsset, number>>(() => {
    const init: Record<string, number> = {};
    SUPPORTED_CRYPTO.forEach(c => { init[c.symbol] = c.defaultPriceUsd; });
    return init as Record<CryptoAsset, number>;
  });

  // Amount String in current fiat currency
  const [amountString, setAmountString] = useState<string>('');
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Step 2 Destination State
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string>('');

  // 1. REAL-TIME AVAILABLE BALANCE FROM FIRESTORE / FINANCIALS
  // Strictly no hardcoded fallback! Defaults to 0 if account has 0 funds.
  const rawUsdBalance = useMemo(() => {
    if (typeof user?.availableBalance === 'number') return user.availableBalance;
    if (typeof homeNetBalance === 'number' && homeNetBalance > 0) return homeNetBalance;
    if (typeof user?.portfolioBalance === 'number' && user.portfolioBalance > 0) return user.portfolioBalance;
    if (typeof tokenBalance === 'number' && tokenBalance > 0) return tokenBalance;
    return 0;
  }, [user?.availableBalance, user?.portfolioBalance, homeNetBalance, tokenBalance]);

  // Active Fiat Details
  const activeFiatInfo = useMemo(() => {
    return SUPPORTED_FIAT.find(f => f.code === activeFiat) || SUPPORTED_FIAT[0];
  }, [activeFiat]);

  const activeFiatRate = fiatRates[activeFiat] || activeFiatInfo.defaultUsdRate;

  // Available balance converted to current active fiat
  const convertedAvailableBalance = useMemo(() => {
    return rawUsdBalance * activeFiatRate;
  }, [rawUsdBalance, activeFiatRate]);

  // 2. FETCH LIVE RATES
  useEffect(() => {
    let isMounted = true;
    const fetchRates = async () => {
      try {
        // Fetch Crypto Prices from server-side proxy
        const [btcRes, ethRes, solRes] = await Promise.all([
          fetch('/api/crypto/price?symbol=BTC').then(r => r.json()).catch(() => ({ price: 64850 })),
          fetch('/api/crypto/price?symbol=ETH').then(r => r.json()).catch(() => ({ price: 3480.5 })),
          fetch('/api/crypto/price?symbol=SOL').then(r => r.json()).catch(() => ({ price: 148.2 }))
        ]);
        
        if (isMounted) {
          setCryptoPricesUsd({
            BTC: parseFloat(btcRes.price) || 64850,
            ETH: parseFloat(ethRes.price) || 3480.5,
            SOL: parseFloat(solRes.price) || 148.2
          });
        }
        
        // Fetch Forex Rates
        const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
        if (fxRes.ok) {
          const fxData = await fxRes.json();
          if (fxData && fxData.rates && isMounted) {
            setFiatRates({
              USD: 1.0,
              GBP: fxData.rates.GBP || 0.79,
              EUR: fxData.rates.EUR || 0.92,
            });
          }
        }
      } catch (e) {
        // Fallback to initial defaults if offline
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handle Switching Fiat Currency with Instant Recalculation
  const handleFiatSwitch = (newFiat: FiatCurrency) => {
    if (newFiat === activeFiat) return;
    const oldRate = activeFiatRate;
    const newRate = fiatRates[newFiat] || SUPPORTED_FIAT.find(f => f.code === newFiat)?.defaultUsdRate || 1.0;
    
    // Convert currently entered amount to new currency
    const currentNumeric = parseFloat(amountString) || 0;
    if (currentNumeric > 0 && oldRate > 0) {
      const amountInUsd = currentNumeric / oldRate;
      const convertedAmount = amountInUsd * newRate;
      const maxInNewFiat = MAX_WITHDRAWAL_USD * newRate;
      if (convertedAmount > maxInNewFiat) {
        setAmountString(Math.floor(maxInNewFiat).toString());
      } else {
        setAmountString(convertedAmount.toFixed(2));
      }
    }

    setActiveFiat(newFiat);
  };

  // Amount Calculations
  const numericAmountInActiveFiat = parseFloat(amountString) || 0;
  const numericAmountInUsd = useMemo(() => {
    return activeFiatRate > 0 ? numericAmountInActiveFiat / activeFiatRate : 0;
  }, [numericAmountInActiveFiat, activeFiatRate]);

  const currentAssetInfo = useMemo(() => {
    return SUPPORTED_CRYPTO.find(c => c.symbol === selectedAsset) || SUPPORTED_CRYPTO[0];
  }, [selectedAsset]);

  const cryptoUsdPrice = cryptoPricesUsd[selectedAsset] || currentAssetInfo.defaultPriceUsd;

  const cryptoEquivalent = useMemo(() => {
    if (numericAmountInUsd <= 0 || cryptoUsdPrice <= 0) return '0.00000000';
    return (numericAmountInUsd / cryptoUsdPrice).toFixed(currentAssetInfo.decimals);
  }, [numericAmountInUsd, cryptoUsdPrice, currentAssetInfo.decimals]);

  // Format display amount with comma thousands separator (e.g., 10,001)
  const formattedDisplayAmount = useMemo(() => {
    if (!amountString) return '0.00';
    const parts = amountString.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }, [amountString]);

  // Validation Logic
  const minLimitInActiveFiat = MIN_WITHDRAWAL_USD * activeFiatRate;
  const maxLimitInActiveFiat = MAX_WITHDRAWAL_USD * activeFiatRate;
  const isZeroBalance = rawUsdBalance <= 0;
  const isZeroAmount = numericAmountInActiveFiat <= 0;
  const isExceedingMax = numericAmountInUsd > MAX_WITHDRAWAL_USD;
  const isExceeding = numericAmountInActiveFiat > convertedAvailableBalance;
  const isBelowMin = numericAmountInActiveFiat > 0 && numericAmountInActiveFiat < minLimitInActiveFiat;

  const isValid = !isZeroBalance && !isZeroAmount && !isExceeding && !isBelowMin && !isExceedingMax;

  const validationMessage = useMemo(() => {
    if (isExceedingMax) {
      return {
        title: 'TRANSACTION LIMIT EXCEEDED',
        desc: `The maximum withdrawal limit per transaction is ${activeFiatInfo.symbol}${maxLimitInActiveFiat.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${activeFiat} ($9,000,000 USD).`
      };
    }
    if (isZeroBalance) {
      return {
        title: 'Insufficient Balance',
        desc: 'Your available balance is insufficient to complete this withdrawal.'
      };
    }
    if (isExceeding) {
      return {
        title: 'Amount Exceeds Available Balance',
        desc: 'Please enter an amount less than or equal to your available balance.'
      };
    }
    if (isBelowMin) {
      return {
        title: 'Minimum Limit Required',
        desc: `Please enter an amount equal to or greater than ${activeFiatInfo.symbol}${minLimitInActiveFiat.toFixed(2)} ${activeFiat}.`
      };
    }
    return null;
  }, [isExceedingMax, isZeroBalance, isExceeding, isBelowMin, activeFiatInfo.symbol, maxLimitInActiveFiat, activeFiat, minLimitInActiveFiat]);

  // Focus hidden input
  const handleContainerClick = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      const numVal = parseFloat(val) || 0;
      const usdVal = activeFiatRate > 0 ? numVal / activeFiatRate : 0;
      if (usdVal > MAX_WITHDRAWAL_USD) {
        const maxActiveFiat = Math.floor(MAX_WITHDRAWAL_USD * activeFiatRate);
        setAmountString(maxActiveFiat.toString());
        return;
      }
      setAmountString(val);
    }
  };

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Submit action in Firestore (converts to USD for database record)
  const handleAuthorize = async () => {
    if (!destinationAddress.trim()) {
      setAddressError(`Please enter a valid ${selectedAsset} payout address.`);
      return;
    }
    setAddressError(null);
    setIsSubmitting(true);
    try {
      await addWithdrawal(numericAmountInUsd, destinationAddress);
      const hash = '0x' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTxHash(hash);
      setStep(3);
    } catch (err: any) {
      setAddressError(err?.message || 'Withdrawal failed. Please check network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedConvertedBalance = `${activeFiatInfo.symbol}${convertedAvailableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between overflow-hidden h-[100dvh] w-screen select-none font-sans"
      onClick={handleContainerClick}
    >
      {/* Hidden input to catch keyboard seamlessly */}
      <input
        ref={hiddenInputRef}
        type="text"
        inputMode="decimal"
        value={amountString}
        onChange={handleInputChange}
        className="absolute opacity-0 pointer-events-none w-1 h-1 top-0 left-0"
        autoFocus
      />

      {/* TOP NAVIGATION */}
      <nav className="relative z-20 w-full max-w-2xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white transition cursor-pointer active:scale-90"
          aria-label="Close"
        >
          <X className="w-5 h-5 stroke-[1.5]" />
        </button>

        <div className="text-center">
          <h1 className="text-xs font-semibold tracking-[0.25em] text-neutral-300 uppercase">
            Withdraw Funds
          </h1>
        </div>

        <div className="w-5" />
      </nav>

      {/* MAIN VERTICALLY BALANCED CONTENT */}
      <main className="relative z-10 flex-1 w-full max-w-xl mx-auto px-6 flex flex-col items-center justify-center text-center my-auto">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: AMOUNT ENTRY & CONVERSION */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full space-y-8 flex flex-col items-center justify-center"
            >
              {/* PRIMARY AMOUNT & CURRENCY SELECTOR */}
              <div className="space-y-4 flex flex-col items-center w-full">
                
                {/* ELEGANT HORIZONTAL CURRENCY SELECTOR */}
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-md">
                  {SUPPORTED_FIAT.map((fiat) => {
                    const isActive = activeFiat === fiat.code;
                    return (
                      <button
                        key={fiat.code}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFiatSwitch(fiat.code);
                        }}
                        className={`relative px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                          isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeFiatBg"
                            className="absolute inset-0 bg-neutral-800 rounded-full border border-neutral-700/60 shadow-sm"
                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                          />
                        )}
                        <span className="relative z-10 text-xs">{fiat.flag}</span>
                        <span className="relative z-10">({fiat.code})</span>
                      </button>
                    );
                  })}
                </div>

                {/* ENORMOUS EDITABLE AMOUNT DISPLAY */}
                <div className="relative flex items-baseline justify-center w-full">
                  <span className="text-5xl sm:text-7xl lg:text-8xl font-light text-neutral-400 mr-1.5 select-none font-sans">
                    {activeFiatInfo.symbol}
                  </span>
                  <span className="text-6xl sm:text-8xl lg:text-9xl font-extralight text-white tracking-tight select-none font-sans">
                    {formattedDisplayAmount}
                  </span>
                  
                  {/* CURSOR */}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="inline-block w-[3px] h-12 sm:h-20 bg-emerald-400 ml-1.5 rounded-full"
                  />
                </div>
              </div>

              {/* CRYPTO EQUIVALENT */}
              <div className="space-y-2 flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-normal text-neutral-300 tracking-wide">
                    {currentAssetInfo.iconChar} {cryptoEquivalent} ({selectedAsset})
                  </span>

                  {/* ASSET SELECTOR */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAssetSelector(!showAssetSelector);
                      }}
                      className="text-neutral-500 hover:text-white transition p-1 text-xs uppercase flex items-center gap-0.5 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {showAssetSelector && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl py-2 w-36 shadow-2xl z-30">
                        {SUPPORTED_CRYPTO.map((c) => (
                          <button
                            key={c.symbol}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAsset(c.symbol);
                              setShowAssetSelector(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs hover:bg-neutral-800 transition flex items-center justify-between ${
                              selectedAsset === c.symbol ? 'text-emerald-400 font-semibold' : 'text-neutral-300'
                            }`}
                          >
                            <span>{c.iconChar} ({c.symbol})</span>
                            <span className="text-[10px] text-neutral-500">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LIVE AVAILABLE BALANCE IN SELECTED FIAT */}
              <div className="space-y-1 text-center pt-2">
                <div className="text-xs tracking-widest uppercase text-neutral-500 font-medium">
                  Available Balance
                </div>
                <div className="text-xl sm:text-2xl font-light text-neutral-200 tracking-tight">
                  {formattedConvertedBalance}
                </div>
              </div>

              {/* VALIDATION: ELEGANT TEXT FADE IN (NO CARDS) */}
              <div className="min-h-[48px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {validationMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.2 }}
                      className="text-center space-y-1 max-w-sm px-4"
                    >
                      <div className="text-xs font-semibold tracking-wider text-rose-400 uppercase">
                        {validationMessage.title}
                      </div>
                      <div className="text-xs text-rose-300/80 leading-relaxed font-normal">
                        {validationMessage.desc}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}

          {/* STEP 2: DESTINATION ADDRESS */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full space-y-6 flex flex-col items-center text-center"
            >
              <div className="space-y-1">
                <div className="text-xs text-neutral-500 uppercase tracking-widest font-medium">Target Address</div>
                <div className="text-3xl font-light text-white">
                  {activeFiatInfo.symbol}{numericAmountInActiveFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-neutral-400">≈ {cryptoEquivalent} {selectedAsset}</div>
              </div>

              <div className="w-full space-y-2 max-w-md pt-4">
                <input
                  type="text"
                  placeholder={`Paste ${selectedAsset} Destination Address`}
                  value={destinationAddress}
                  onChange={(e) => {
                    setDestinationAddress(e.target.value);
                    if (addressError) setAddressError(null);
                  }}
                  className="w-full bg-transparent border-b border-neutral-700 focus:border-white px-2 py-3 text-center text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors"
                />

                {addressError && (
                  <div className="text-xs text-rose-400 font-medium text-center pt-2">
                    {addressError}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-light tracking-tight text-white uppercase">
                  Withdrawal Initiated
                </h2>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  Your payout of <span className="text-white font-medium">{activeFiatInfo.symbol}{numericAmountInActiveFiat.toFixed(2)} {activeFiat}</span> ({cryptoEquivalent} {selectedAsset}) has been broadcast.
                </p>
              </div>

              <div className="text-xs text-neutral-500 pt-2 font-mono">
                Ref: {txHash.slice(0, 18)}...
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* CONTINUATION BUTTON PINNED AT BOTTOM */}
      <footer className="relative z-20 w-full max-w-xl mx-auto px-6 pb-10 pt-4">
        {step === 1 && (
          <button
            onClick={() => isValid && setStep(2)}
            disabled={!isValid}
            className={`w-full py-5 rounded-full text-xs font-semibold uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-2 ${
              isValid
                ? 'bg-white text-black opacity-100 shadow-2xl hover:bg-neutral-200 cursor-pointer active:scale-[0.98]'
                : 'bg-neutral-900 text-neutral-600 opacity-30 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 stroke-[1.5]" />
          </button>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleAuthorize}
              disabled={isSubmitting || !destinationAddress.trim()}
              className={`w-full py-5 rounded-full text-xs font-semibold uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-2 ${
                destinationAddress.trim() && !isSubmitting
                  ? 'bg-white text-black opacity-100 shadow-2xl hover:bg-neutral-200 cursor-pointer active:scale-[0.98]'
                  : 'bg-neutral-900 text-neutral-600 opacity-30 cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? (
                <span className="animate-pulse">Authorizing...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[1.5]" />
                  <span>Authorize Withdrawal</span>
                </>
              )}
            </button>

            <button
              onClick={() => setStep(1)}
              className="text-xs text-neutral-500 hover:text-white transition uppercase tracking-widest py-2"
            >
              Modify Amount
            </button>
          </div>
        )}

        {step === 3 && (
          <button
            onClick={onClose}
            className="w-full py-5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.25em] transition hover:bg-neutral-200 cursor-pointer active:scale-[0.98]"
          >
            Done
          </button>
        )}
      </footer>
    </motion.div>
  );
}
