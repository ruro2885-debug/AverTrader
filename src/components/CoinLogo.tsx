import React, { useState } from 'react';
import AverLogo from './AverLogo';

interface CoinLogoProps {
  symbol: string;
  size?: number;
  className?: string;
  imgClassName?: string;
  isLoading?: boolean;
  isConnecting?: boolean;
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
  SHIB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png',
  DOT: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png',
  LINK: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png',
  AVAX: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
  MATIC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
  AAPL: 'https://api.iconify.design/logos:apple.svg',
  NVDA: 'https://api.iconify.design/logos:nvidia.svg',
  MSFT: 'https://api.iconify.design/logos:microsoft-icon.svg',
  META: 'https://api.iconify.design/logos:meta-icon.svg',
  NFLX: 'https://api.iconify.design/logos:netflix-icon.svg',
  AMD: 'https://api.iconify.design/logos:amd.svg',
  INTC: 'https://api.iconify.design/logos:intel.svg',
  PYPL: 'https://api.iconify.design/logos:paypal.svg',
  DIS: 'https://api.iconify.design/logos:disney.svg',
  V: 'https://api.iconify.design/logos:visa.svg',
  MA: 'https://api.iconify.design/logos:mastercard.svg',
};

const fallbacks: Record<string, { char: string; gradient: string }> = {
  BTC: { char: '₿', gradient: 'from-amber-400 to-orange-500' },
  ETH: { char: 'Ξ', gradient: 'from-blue-500 to-indigo-600' },
  SOL: { char: '🆂', gradient: 'from-emerald-400 to-teal-500' },
  BNB: { char: '🅑', gradient: 'from-yellow-400 to-amber-500' },
  XRP: { char: '✕', gradient: 'from-sky-400 to-blue-500' },
  ADA: { char: '₳', gradient: 'from-blue-600 to-indigo-700' },
  DOGE: { char: 'Ð', gradient: 'from-yellow-500 to-yellow-600' },
  SHIB: { char: '🐕', gradient: 'from-orange-500 to-amber-600' },
  AVR: { char: 'A', gradient: 'from-emerald-400 to-teal-400' },
  USDT: { char: '₮', gradient: 'from-teal-400 to-emerald-600' },
  USDC: { char: 'C', gradient: 'from-blue-400 to-blue-600' },
  USD: { char: '$', gradient: 'from-emerald-500 to-green-600' },
  GLD: { char: 'Au', gradient: 'from-amber-300 via-yellow-400 to-amber-600' },
};

export default function CoinLogo({ symbol, size = 24, className = '', imgClassName = '', isLoading, isConnecting }: CoinLogoProps) {
  const [hasError, setHasError] = useState(false);
  let normalizedSymbol = (symbol || '').toUpperCase().trim();

  // Determine shape: circular only when loading/connecting or explicitly requested via className
  const isCircle = isLoading || isConnecting || className.includes('rounded-full');
  const shapeClass = isCircle ? 'rounded-full' : (className.includes('rounded-') ? '' : 'rounded-xl');

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

  // Dedicated custom SVG logo for Tesla (TSLA)
  if (normalizedSymbol === 'TSLA') {
    return (
      <div 
        className={`shrink-0 flex items-center justify-center ${shapeClass} bg-[#E82127] shadow-sm select-none ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 100 100" fill="white">
          <path d="M50 24.3c-11.8 0-21.7 3.3-27.5 8.4l2.4 4.8c4.6-4 13.5-6.8 25.1-6.8 11.6 0 20.5 2.8 25.1 6.8l2.4-4.8C71.7 27.6 61.8 24.3 50 24.3z" />
          <path d="M50 36.3c-7.3 0-14.2 1.3-18.7 3.6l1.2 5.5c3.6-1.8 9.8-2.9 17.5-2.9 7.7 0 13.9 1.1 17.5 2.9l1.2-5.5C64.2 37.6 57.3 36.3 50 36.3z" />
          <path d="M44.5 45.3v30.4h11V45.3c-1.8.3-3.6.5-5.5.5-1.9 0-3.7-.2-5.5-.5z" />
        </svg>
      </div>
    );
  }

  // Dedicated custom SVG logo for Amazon (AMZN)
  if (normalizedSymbol === 'AMZN') {
    return (
      <div 
        className={`shrink-0 flex items-center justify-center ${shapeClass} bg-[#131921] border border-white/10 shadow-sm select-none ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 100 100">
          <text x="50%" y="42%" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="42" fontWeight="900" fontFamily="sans-serif">a</text>
          <path d="M25 65 Q50 82 75 62" fill="none" stroke="#FF9900" strokeWidth="7" strokeLinecap="round" />
          <path d="M71 58 L77 62 L73 69 Z" fill="#FF9900" />
        </svg>
      </div>
    );
  }

  // Dedicated custom SVG logo for Google (GOOGL)
  if (normalizedSymbol === 'GOOGL' || normalizedSymbol === 'GOOGLE') {
    return (
      <div 
        className={`shrink-0 flex items-center justify-center ${shapeClass} bg-white shadow-sm select-none ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <svg width={size * 0.75} height={size * 0.75} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
      </div>
    );
  }

  // Dedicated custom SVG logo for Gold (GLD)
  if (normalizedSymbol === 'GLD' || normalizedSymbol === 'GOLD') {
    return (
      <div 
        className={`shrink-0 flex items-center justify-center ${shapeClass} bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-slate-950 font-black shadow-md select-none border border-yellow-200/50 ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    );
  }

  // Dedicated custom SVG logo for Invesco QQQ (QQQ)
  if (normalizedSymbol === 'QQQ') {
    return (
      <div 
        className={`shrink-0 flex items-center justify-center ${shapeClass} bg-gradient-to-tr from-cyan-600 to-blue-700 text-white font-black shadow-sm select-none border border-cyan-400/30 ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <span style={{ fontSize: Math.max(9, size * 0.42) }} className="tracking-tighter font-black">QQQ</span>
      </div>
    );
  }

  // Dedicated custom SVG logo for SPDR S&P 500 (SPY)
  if (normalizedSymbol === 'SPY') {
    return (
      <div 
        className={`shrink-0 flex items-center justify-center ${shapeClass} bg-gradient-to-tr from-blue-700 to-indigo-900 text-white font-black shadow-sm select-none border border-blue-400/30 ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <span style={{ fontSize: Math.max(9, size * 0.42) }} className="tracking-tighter font-black">SPY</span>
      </div>
    );
  }

  const logoUrl = logoUrls[normalizedSymbol];
  const shortChar = normalizedSymbol.length > 3 ? normalizedSymbol.slice(0, 3) : (normalizedSymbol || '?');
  const fallback = fallbacks[normalizedSymbol] || { char: shortChar, gradient: 'from-slate-600 to-slate-800' };

  if (logoUrl && !hasError) {
    return (
      <div 
        className={`shrink-0 relative flex items-center justify-center ${shapeClass} bg-white/5 select-none overflow-hidden ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <img
          src={logoUrl}
          alt={`${symbol} logo`}
          className={`w-full h-full object-contain p-0.5 ${shapeClass} ${imgClassName}`}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Fallback rendering using clean CSS gradient square and character
  return (
    <div
      className={`shrink-0 flex items-center justify-center ${shapeClass} bg-gradient-to-br ${fallback.gradient} text-white font-bold select-none shadow-sm ${className}`}
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

