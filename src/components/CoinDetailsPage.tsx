import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Share2, X, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import CoinLogo from './CoinLogo';
import { useAuth } from '../contexts/AuthContext';
import { doc, collection, setDoc, updateDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { walletService } from '../services/walletService';
import { AnimatePresence, motion } from 'framer-motion';

export default function CoinDetailsPage({ asset, theme, onBack }: { asset: any, theme: 'light' | 'dark', onBack: () => void }) {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const { user } = useAuth();
  
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [amountUsd, setAmountUsd] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [userAvailableUsd, setUserAvailableUsd] = useState(0);
  const [userAssetHolding, setUserAssetHolding] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      walletService.getOrCreateWallet(user.uid).then(w => {
        setUserAvailableUsd(w.availableBalance);
      });
      if (user.holdings) {
        const h = user.holdings.find(x => x.ticker === asset.symbol || x.symbol === asset.symbol);
        if (h) setUserAssetHolding(h);
      }
    }
  }, [user, asset]);

  const handleTrade = async () => {
    if (!user) {
      setErrorMsg("Please login to trade.");
      return;
    }
    const val = parseFloat(amountUsd);
    if (isNaN(val) || val <= 0) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }
    
    // Parse price
    let currentPrice = typeof asset.price === 'number' ? asset.price : parseFloat(asset.price.toString().replace(/[^0-9.-]+/g,""));
    if (isNaN(currentPrice) || currentPrice <= 0) currentPrice = 100;
    
    const quantity = val / currentPrice;

    if (tradeType === 'BUY' && val > userAvailableUsd) {
      setErrorMsg("Insufficient USD balance.");
      return;
    }
    
    if (tradeType === 'SELL') {
      if (!userAssetHolding || (userAssetHolding.quantity * currentPrice) < val * 0.99) { // allow small float diff
        setErrorMsg(`Insufficient ${asset.symbol} balance.`);
        return;
      }
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const uid = user.uid;
      
      // Update Wallet
      const w = await walletService.getOrCreateWallet(uid);
      const newAvailable = tradeType === 'BUY' ? w.availableBalance - val : w.availableBalance + val;
      await walletService.updateWallet(uid, { availableBalance: newAvailable });
      
      // Update User Doc directly just in case it's used elsewhere
      await updateDoc(doc(db, 'users', uid), {
        availableBalance: newAvailable
      });

      // Update or Create Holding
      const holdingRef = doc(collection(db, 'users', uid, 'holdings'), asset.symbol);
      const snap = await getDoc(holdingRef);
      
      if (tradeType === 'BUY') {
        if (snap.exists()) {
          const prev = snap.data();
          const newQty = prev.quantity + quantity;
          const newAvg = ((prev.quantity * prev.avgEntry) + (quantity * currentPrice)) / newQty;
          await updateDoc(holdingRef, {
            quantity: newQty,
            avgEntry: newAvg,
            currentPrice: currentPrice,
            marketValue: newQty * currentPrice
          });
        } else {
          await setDoc(holdingRef, {
            id: asset.symbol,
            ticker: asset.symbol,
            name: asset.name,
            quantity: quantity,
            avgEntry: currentPrice,
            currentPrice: currentPrice,
            marketValue: quantity * currentPrice,
            trend: [0, 0, 0],
            riskRating: 'Medium',
            confidenceScore: 80,
            lastAiDecision: 'MANUAL_BUY'
          });
        }
      } else {
        // SELL
        if (snap.exists()) {
          const prev = snap.data();
          const newQty = Math.max(0, prev.quantity - quantity);
          if (newQty <= 0.000001) {
            // Delete or set to 0
            await updateDoc(holdingRef, {
              quantity: 0,
              marketValue: 0
            });
          } else {
            await updateDoc(holdingRef, {
              quantity: newQty,
              currentPrice: currentPrice,
              marketValue: newQty * currentPrice
            });
          }
        }
      }

      // Add Trade History Item
      const tradeRef = doc(collection(db, 'users', uid, 'trades'));
      await setDoc(tradeRef, {
        id: tradeRef.id,
        ticker: asset.symbol,
        side: tradeType.toLowerCase(),
        quantity: quantity,
        price: currentPrice,
        amount: val,
        timestamp: serverTimestamp(),
        type: 'manual',
        status: 'Completed'
      });

      // Close modal
      setAmountUsd('');
      setShowTradeModal(false);
      
      // Force refresh user available state locally
      setUserAvailableUsd(newAvailable);
      
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Trade failed: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#000000]' : 'bg-slate-50'}`}>
      <header className="p-4 flex justify-between items-center">
        <button onClick={onBack} className="p-2 rounded-full bg-slate-800/50">
          <ArrowLeft size={20} className={textPrimary} />
        </button>
        <div className="flex gap-4">
          <Star size={20} className={textSecondary} />
          <Share2 size={20} className={textSecondary} />
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <CoinLogo symbol={asset.symbol} size={64} />
          <div>
            <h1 className={`text-2xl font-black ${textPrimary}`}>{asset.name}</h1>
            <p className={`text-lg font-bold ${textSecondary}`}>{asset.symbol}</p>
          </div>
        </div>
        <p className={`text-3xl font-black ${textPrimary} mb-1`}>{asset.price}</p>
        <p className={`text-sm font-bold ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>{asset.change}</p>
      </div>

      <div className="px-6 py-4">
        <div className={`h-48 rounded-2xl flex flex-col items-center justify-center ${isDark ? 'bg-slate-900/50' : 'bg-slate-200/50'}`}>
          <div className="text-slate-500 text-sm font-medium mb-2">Live Interactive Chart</div>
          <div className="w-full h-24 flex items-end justify-between px-4 gap-1 opacity-50">
            {Array.from({length: 20}).map((_, i) => (
              <div key={i} className={`w-full rounded-t-sm ${asset.isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ height: `${Math.max(10, Math.random() * 100)}%` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <h3 className={`text-lg font-bold mb-4 ${textPrimary}`}>Market Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          {['Market Cap', '24h Volume', 'Circulating Supply', 'Max Supply'].map(stat => (
            <div key={stat} className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
              <p className={`text-[10px] uppercase font-bold ${textSecondary}`}>{stat}</p>
              <p className={`text-sm font-black ${textPrimary} mt-1`}>{stat === 'Max Supply' ? 'Infinite' : '$1.2B'}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Wallet Balance Display for user context */}
      <div className="px-6 pb-20">
         <div className={`p-4 rounded-2xl ${isDark ? 'bg-emerald-900/20 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
            <p className={`text-xs font-bold uppercase ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Your Available USD</p>
            <p className={`text-xl font-black ${textPrimary}`}>${userAvailableUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            {userAssetHolding && userAssetHolding.quantity > 0 && (
              <p className={`text-sm font-bold mt-2 ${textSecondary}`}>You own {userAssetHolding.quantity.toFixed(4)} {asset.symbol}</p>
            )}
         </div>
      </div>

      <div className={`fixed bottom-0 left-0 right-0 p-6 ${isDark ? 'bg-black/90' : 'bg-white/90'} backdrop-blur-md border-t ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
        <button 
          onClick={() => setShowTradeModal(true)}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 transition-colors rounded-2xl text-white font-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          Trade {asset.symbol}
        </button>
      </div>

      <AnimatePresence>
        {showTradeModal && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4 lg:p-0">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowTradeModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`relative w-full max-w-md p-6 rounded-3xl shadow-2xl ${isDark ? 'bg-[#111111] border border-white/10' : 'bg-white'} z-10`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-black ${textPrimary}`}>Trade {asset.symbol}</h2>
                <button onClick={() => setShowTradeModal(false)} className={`p-2 rounded-full ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                  <X size={20} />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500 text-sm font-bold">
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              {/* BUY / SELL Toggle */}
              <div className={`flex p-1 rounded-xl mb-6 ${isDark ? 'bg-black border border-white/5' : 'bg-slate-100'}`}>
                <button 
                  onClick={() => setTradeType('BUY')}
                  className={`flex-1 py-3 text-sm font-black rounded-lg flex items-center justify-center gap-2 transition-all ${tradeType === 'BUY' ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white text-emerald-600 shadow-sm') : textSecondary}`}
                >
                  <ArrowDownRight size={16} /> Buy
                </button>
                <button 
                  onClick={() => setTradeType('SELL')}
                  className={`flex-1 py-3 text-sm font-black rounded-lg flex items-center justify-center gap-2 transition-all ${tradeType === 'SELL' ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-white text-red-600 shadow-sm') : textSecondary}`}
                >
                  <ArrowUpRight size={16} /> Sell
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <div className={`flex justify-between text-xs font-bold mb-2 ${textSecondary}`}>
                  <span>Amount (USD)</span>
                  {tradeType === 'BUY' ? (
                    <span>Available: ${userAvailableUsd.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  ) : (
                    <span>Available: {userAssetHolding?.quantity?.toFixed(4) || 0} {asset.symbol}</span>
                  )}
                </div>
                <div className={`relative flex items-center rounded-2xl border ${isDark ? 'bg-black border-white/10' : 'bg-slate-50 border-slate-200'} p-1`}>
                  <span className={`pl-4 font-black ${textSecondary}`}>$</span>
                  <input 
                    type="number" 
                    value={amountUsd}
                    onChange={e => setAmountUsd(e.target.value)}
                    placeholder="0.00"
                    className={`w-full bg-transparent p-3 outline-none font-black text-2xl ${textPrimary}`}
                  />
                  <button 
                    onClick={() => {
                      if (tradeType === 'BUY') {
                        setAmountUsd(userAvailableUsd.toString());
                      } else {
                        // Max sell value
                        if (userAssetHolding) {
                          const currentPrice = typeof asset.price === 'number' ? asset.price : parseFloat(asset.price.toString().replace(/[^0-9.-]+/g,""));
                          setAmountUsd((userAssetHolding.quantity * (isNaN(currentPrice) ? 100 : currentPrice)).toFixed(2));
                        }
                      }
                    }}
                    className={`px-4 py-2 mr-2 text-xs font-black rounded-lg ${isDark ? 'bg-white/5 text-white' : 'bg-slate-200 text-slate-800'}`}>
                    MAX
                  </button>
                </div>
              </div>

              <button 
                onClick={handleTrade}
                disabled={isProcessing}
                className={`w-full py-4 rounded-2xl font-black text-lg text-white transition-all ${tradeType === 'BUY' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-red-500 hover:bg-red-400'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? 'Processing...' : `Confirm ${tradeType}`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
