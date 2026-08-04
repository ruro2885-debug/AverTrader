import React from 'react';

interface WalletLogoProps {
  name: string;
  className?: string;
}

export function WalletLogo({ name, className = "w-6 h-6" }: WalletLogoProps) {
  const normalizedName = name.trim().toLowerCase();

  // Strip existing w- and h- classes to allow custom sizing for specific logos
  const baseClassName = className.replace(/\bw-\S+/g, '').replace(/\bh-\S+/g, '').trim();

  if (normalizedName.includes('metamask')) {
    return (
      <img 
        src="https://api.iconify.design/logos:metamask-icon.svg" 
        alt="MetaMask" 
        className={`${className} object-contain`} 
      />
    );
  }

  if (normalizedName.includes('walletconnect')) {
    return (
      <img 
        src="/icons/walletconnect.svg" 
        alt="WalletConnect" 
        className={`${baseClassName} w-9 h-9 object-contain rounded-full`} 
        onError={(e) => console.error('WalletConnect logo failed to load', e)}
      />
    );
  }

  if (normalizedName.includes('coinbase')) {
    return (
      <img 
        src="/icons/coinbase.svg" 
        alt="Coinbase Wallet" 
        className={`${baseClassName} w-9 h-9 object-contain rounded-[8px]`} 
        onError={(e) => console.error('Coinbase Wallet logo failed to load', e)}
      />
    );
  }

  if (normalizedName.includes('phantom')) {
    return (
      <img 
        src="/icons/phantom.svg" 
        alt="Phantom" 
        className={`${baseClassName} w-9 h-9 object-contain rounded-[8px]`} 
        onError={(e) => console.error('Phantom logo failed to load', e)}
      />
    );
  }

  if (normalizedName.includes('trust')) {
    return (
      <img 
        src="/icons/trustwallet.svg" 
        alt="Trust Wallet" 
        className={`${baseClassName} w-9 h-9 object-contain rounded-[8px]`} 
        onError={(e) => console.error('Trust Wallet logo failed to load', e)}
      />
    );
  }

  if (normalizedName.includes('rabby')) {
    return (
      <img 
        src="/icons/rabby.svg" 
        alt="Rabby Wallet" 
        className={`${baseClassName} w-9 h-9 object-contain rounded-[8px]`} 
        onError={(e) => console.error('Rabby Wallet logo failed to load', e)}
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7.5" cy="15.5" r="5.5"/>
        <path d="m21 2-9.6 9.6"/>
        <path d="m15.5 7.5 3 3"/>
        <path d="m18 5 3 3"/>
      </svg>
    </div>
  );
}

