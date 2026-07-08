import React, { useState } from 'react';
import AverLogo from './AverLogo';

interface CoinLogoProps {
  symbol: string;
  size?: number;
  className?: string;
  imgClassName?: string;
}

const logoUrls: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/325/large/dogecoin.png',
};

const fallbacks: Record<string, { char: string; gradient: string }> = {
  BTC: { char: '₿', gradient: 'from-amber-400 to-orange-500' },
  ETH: { char: 'Ξ', gradient: 'from-blue-500 to-indigo-600' },
  SOL: { char: '🆂', gradient: 'from-emerald-400 to-teal-500' },
  BNB: { char: '🅑', gradient: 'from-yellow-400 to-amber-500' },
  XRP: { char: '✕', gradient: 'from-sky-400 to-blue-500' },
  ADA: { char: '₳', gradient: 'from-blue-600 to-indigo-700' },
  DOGE: { char: 'Ð', gradient: 'from-yellow-500 to-yellow-600' },
  AVR: { char: 'A', gradient: 'from-emerald-400 to-teal-400' },
};

export default function CoinLogo({ symbol, size = 24, className = '', imgClassName = '' }: CoinLogoProps) {
  const [hasError, setHasError] = useState(false);
  const normalizedSymbol = symbol.toUpperCase();

  // For AVR (Aver Token), render our custom brand 3D logo
  if (normalizedSymbol === 'AVR') {
    return (
      <div className={`flex-shrink-0 flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <AverLogo size={size} showText={false} />
      </div>
    );
  }

  const logoUrl = logoUrls[normalizedSymbol];
  const fallback = fallbacks[normalizedSymbol] || { char: symbol[0], gradient: 'from-slate-400 to-slate-500' };

  if (logoUrl && !hasError) {
    return (
      <div 
        className={`flex-shrink-0 relative flex items-center justify-center rounded-full bg-slate-900/40 select-none overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={logoUrl}
          alt={`${symbol} logo`}
          className={`w-full h-full object-contain ${imgClassName}`}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Fallback rendering using clean CSS gradient circle and character
  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br ${fallback.gradient} text-white font-bold select-none shadow-sm ${className}`}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.5,
      }}
    >
      {fallback.char}
    </div>
  );
}
