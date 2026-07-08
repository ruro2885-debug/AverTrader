import { motion } from 'motion/react';
import { Newspaper } from 'lucide-react';

const headlines = [
  "Bitcoin price surges past $65k, eyeing new all-time high.",
  "Ethereum layer 2 scaling solution gains traction with institutional users.",
  "New DeFi protocol launches on Solana, promising high yield farming.",
  "Global markets react cautiously to latest inflation data release.",
  "Top AI-focused cryptocurrency tokens experience significant volatility.",
  "Regulatory landscape shifts as new crypto bills head to committee.",
  "NFT marketplace volume reaches a six-month peak."
];

export default function MarketNewsTicker({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';
  const containerClasses = isDark 
    ? "bg-slate-900/50 border border-white/5" 
    : "bg-white border border-slate-200/50 shadow-sm";

  return (
    <div className={`overflow-hidden rounded-full ${containerClasses} py-2 px-4 flex items-center mb-6`}>
      <Newspaper className={`w-4 h-4 mr-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'} flex-shrink-0`} />
      <div className="relative flex overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ["100%", "-100%"] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {headlines.map((headline, index) => (
            <span 
              key={index} 
              className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'} mx-4`}
            >
              {headline}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
