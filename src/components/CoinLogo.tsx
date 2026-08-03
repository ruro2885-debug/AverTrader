import React, { useState } from 'react';
import AverLogo from './AverLogo';

interface CoinLogoProps {
  symbol: string;
  size?: number;
  className?: string;
  imgClassName?: string;
}

const logoUrls: Record<string, string> = {
  BTC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
  ETH: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
  BNB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
  XRP: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png',
  ADA: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png',
  DOGE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
  USDT: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
  USDC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
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
  USDT: { char: '₮', gradient: 'from-teal-400 to-emerald-600' },
  USDC: { char: 'C', gradient: 'from-blue-400 to-blue-600' },
};

export default function CoinLogo({ symbol, size = 24, className = '', imgClassName = '' }: CoinLogoProps) {
  const [hasError, setHasError] = useState(false);
  let normalizedSymbol = (symbol || '').toUpperCase();

  // Normalize network/protocol specific suffix symbols
  if (normalizedSymbol.startsWith('USDT')) {
    normalizedSymbol = 'USDT';
  } else if (normalizedSymbol.startsWith('USDC')) {
    normalizedSymbol = 'USDC';
  }

  // For AVR (Aver Token), render our custom brand 3D logo
  if (normalizedSymbol === 'AVR') {
    return (
      <div className={`shrink-0 flex items-center justify-center ${className}`} style={{ width: size, height: size, minWidth: size, minHeight: size }}>
        <AverLogo size={size} showText={false} />
      </div>
    );
  }

  const logoUrl = logoUrls[normalizedSymbol];
  const shortChar = normalizedSymbol.length > 3 ? normalizedSymbol.slice(0, 3) : (normalizedSymbol || '?');
  const fallback = fallbacks[normalizedSymbol] || { char: shortChar, gradient: 'from-slate-400 to-slate-500' };

  if (logoUrl && !hasError) {
    return (
      <div 
        className={`shrink-0 relative flex items-center justify-center rounded-full bg-slate-900/40 select-none overflow-hidden ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
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
      className={`shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br ${fallback.gradient} text-white font-bold select-none shadow-sm ${className}`}
      style={{ 
        width: size, 
        height: size,
        minWidth: size,
        minHeight: size,
        fontSize: Math.min(size * 0.45, 14),
      }}
    >
      <span className="notranslate uppercase" translate="no">{fallback.char}</span>
    </div>
  );
}
