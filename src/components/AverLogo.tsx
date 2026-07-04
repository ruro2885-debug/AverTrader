interface AverLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  theme?: 'light' | 'dark';
}

export default function AverLogo({ className = '', size = 32, showText = true, theme = 'dark' }: AverLogoProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  
  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      {/* High-Fidelity Custom "Aver TRADING BOT" Logo SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          {/* Metallic Silver Gradients */}
          <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#F1F5F9" />
            <stop offset="70%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          
          <linearGradient id="silverGloss" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Emerald Green Gradient */}
          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Green Glow filter */}
          <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Ambient Background Glow */}
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#064e3b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Back Glow */}
        <circle cx="60" cy="60" r="50" fill="url(#bgGlow)" />

        {/* Outer Tech Glowing Ring */}
        <circle
          cx="60"
          cy="60"
          r="48"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeOpacity="0.8"
          strokeDasharray="8 4 2 4 12 6"
          filter="url(#greenGlow)"
          className="animate-[spin_40s_linear_infinite]"
        />

        {/* Inner Tech Accent Ring */}
        <circle
          cx="60"
          cy="60"
          r="42"
          stroke="#047857"
          strokeWidth="0.75"
          strokeOpacity="0.4"
          strokeDasharray="3 3"
        />

        {/* Candlestick Chart Pattern (Top Arc Background) */}
        <g opacity="0.35" stroke="#10b981" strokeWidth="0.75">
          {/* Bar 1 */}
          <line x1="38" y1="26" x2="38" y2="34" />
          <rect x="36" y="28" width="4" height="4" fill="#047857" stroke="none" />
          {/* Bar 2 */}
          <line x1="46" y1="21" x2="46" y2="31" />
          <rect x="44" y="23" width="4" height="5" fill="#10b981" stroke="none" />
          {/* Bar 3 */}
          <line x1="54" y1="18" x2="54" y2="29" />
          <rect x="52" y="20" width="4" height="6" fill="#10b981" stroke="none" />
          {/* Bar 4 */}
          <line x1="62" y1="16" x2="62" y2="26" />
          <rect x="60" y="17" width="4" height="6" fill="#10b981" stroke="none" />
          {/* Bar 5 */}
          <line x1="70" y1="13" x2="70" y2="23" />
          <rect x="68" y="15" width="4" height="5" fill="#10b981" stroke="none" />
          {/* Bar 6 */}
          <line x1="78" y1="10" x2="78" y2="20" />
          <rect x="76" y="11" width="4" height="6" fill="#10b981" stroke="none" />
        </g>

        {/* Dynamic Upward Trend Arrow */}
        <path
          d="M 46 44 L 80 16 M 80 16 L 70 16 M 80 16 L 80 26"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#greenGlow)"
        />

        {/* Coin Medallions (Bottom Layer) */}
        {/* Left Coin: Ethereum */}
        <circle cx="44" cy="88" r="8" fill="#0b1329" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.5" />
        <path d="M 44 83 L 47 87 L 44 89 L 41 87 Z" fill="#94a3b8" />
        <path d="M 44 93 L 47 90 L 44 89 L 41 90 Z" fill="#64748b" />

        {/* Right Coin: BNB Grid */}
        <circle cx="76" cy="88" r="8" fill="#0b1329" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.5" />
        <path d="M 76 83.5 L 79.5 87 L 76 90.5 L 72.5 87 Z" fill="#f59e0b" opacity="0.6" />
        <circle cx="76" cy="87" r="1.5" fill="#0b1329" />

        {/* Central Glowing Bitcoin Medallion */}
        <circle cx="60" cy="88" r="11" fill="#022c22" stroke="#34d399" strokeWidth="1.2" filter="url(#greenGlow)" />
        <text
          x="60"
          y="92"
          fill="#34d399"
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor="middle"
        >
          ₿
        </text>

        {/* Stylized "AVer" Text Layer */}
        {/* A: Metallic */}
        <path
          d="M 22 66 L 31 46 L 39 46 L 43 55 L 38 55 L 34 49 L 29 66 Z"
          fill="url(#silverGrad)"
        />
        <path d="M 26 61 L 34 61 L 35 63 L 25 63 Z" fill="url(#silverGloss)" />
        
        {/* V: Futuristic Green Arrow Extension */}
        <path
          d="M 41 46 L 47 66 L 53 66 L 64 39 L 59 39 L 50 59 L 46 46 Z"
          fill="url(#emeraldGrad)"
          filter="url(#greenGlow)"
        />

        {/* E: Metallic */}
        <path
          d="M 60 46 L 73 46 L 73 49 L 65 49 L 65 53 L 71 53 L 71 56 L 65 56 L 65 62 L 74 62 L 74 66 L 60 66 Z"
          fill="url(#silverGrad)"
        />

        {/* R: Metallic */}
        <path
          d="M 77 46 L 88 46 C 92 46 94 48 94 51 C 94 54 92 56 88 56 L 82 56 L 82 66 L 77 66 Z M 82 50 L 82 53 L 87 53 C 88.5 53 89 52.5 89 51.5 C 89 50.5 88.5 50 L 87 50 Z"
          fill="url(#silverGrad)"
        />
        <path d="M 84 55 L 91 66 L 96 66 L 88 55 Z" fill="url(#silverGloss)" />

        {/* "TRADING BOT" functional labels */}
        <text
          x="60"
          y="74"
          fill="#34d399"
          fontSize="5"
          fontFamily="monospace"
          fontWeight="bold"
          letterSpacing="1"
          textAnchor="middle"
          filter="url(#greenGlow)"
        >
          TRADING BOT
        </text>
      </svg>
      
      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col items-start leading-none">
          <span className={`font-sans font-extrabold tracking-widest text-lg ${textColor}`}>
            AVER<span className="text-emerald-400">.</span>
          </span>
          <span className="text-[8px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
            TRADING BOT
          </span>
        </div>
      )}
    </div>
  );
}
