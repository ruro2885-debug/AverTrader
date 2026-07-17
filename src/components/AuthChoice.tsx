import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, LogIn, ArrowLeft } from 'lucide-react';
import WelcomeBonusCard from './WelcomeBonusCard';

interface AuthChoiceProps {
  theme: 'light' | 'dark';
  onBack: () => void;
  onSelect: (view: 'register' | 'login') => void;
}

export default function AuthChoice({ theme, onBack, onSelect }: AuthChoiceProps) {
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#000000] text-white">
      {/* Fixed Back Button */}
      <button 
        onClick={onBack}
        className="fixed top-6 left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="w-full max-w-2xl space-y-10">
        
        {/* Hero Section: Welcome Bonus */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <WelcomeBonusCard theme="dark" onCtaClick={() => onSelect('register')} />
        </motion.div>

        {/* Premium Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
            <button
                onClick={() => onSelect('register')}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
                Create Account
                <ArrowRight className="w-4 h-4" />
            </button>
            <button
                onClick={() => onSelect('login')}
                className="flex-1 py-4 font-bold rounded-xl transition-all border bg-slate-900 border-white/10 hover:bg-slate-800 flex items-center justify-center gap-2"
            >
                Log In
                <LogIn className="w-4 h-4" />
            </button>
        </div>

      </div>
    </div>
  );
}
