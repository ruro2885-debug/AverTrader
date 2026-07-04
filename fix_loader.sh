#!/bin/bash
cat << 'APP' > src/components/Loader.tsx
import { useEffect, useState } from 'react';
import { Cpu, Radio, ShieldAlert, Sparkles } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const { t } = usePreferences();

  const statuses = [
    { text: t('load.s1') || 'Initializing AverCore AI™ Neural Core...', icon: Cpu },
    { text: t('load.s2') || 'Establishing secure decentralized nodes...', icon: Radio },
    { text: t('load.s3') || 'Calibrating Precision Entry Optimizer™ (PEO™)...', icon: Sparkles },
    { text: t('load.s4') || 'Structuring adaptive security layers...', icon: ShieldAlert },
    { text: t('load.s5') || 'Synchronizing institutional analytics streams...', icon: Cpu },
    { text: t('load.s6') || 'Ecosystem fully synchronized. Ready.', icon: Sparkles }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = prev > 80 ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + increment, 100);
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 20) setStatusIndex(0);
    else if (progress < 45) setStatusIndex(1);
    else if (progress < 70) setStatusIndex(2);
    else if (progress < 85) setStatusIndex(3);
    else if (progress < 98) setStatusIndex(4);
    else setStatusIndex(5);

    if (progress === 100) {
      const delay = setTimeout(() => {
        setFadeOut(true);
        const completeDelay = setTimeout(() => {
          onComplete();
        }, 600);
        return () => clearTimeout(completeDelay);
      }, 500);
      return () => clearTimeout(delay);
    }
  }, [progress, onComplete]);

  const StatusIcon = statuses[statusIndex].icon;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 transition-opacity duration-500 ease-in-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl animate-pulse duration-3000" />
          <svg
            className="w-24 h-24 text-emerald-400 animate-pulse duration-2000"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4, 4"
              className="opacity-40 animate-[spin_40s_linear_infinite]"
            />
            <path
              d="M50 18 L80 78 L65 78 L50 48 L35 78 L20 78 Z"
              fill="url(#averGrad)"
              className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            />
            <circle cx="50" cy="48" r="4" fill="#34d399" className="animate-ping" />
            <circle cx="50" cy="48" r="3.5" fill="#10b981" />
            <defs>
              <linearGradient id="averGrad" x1="50" y1="18" x2="50" y2="78" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <h1 className="font-display text-4xl font-bold tracking-widest text-white mb-2">
          AVER<span className="text-emerald-400">.</span>
        </h1>
        <p className="text-xs font-bold tracking-[0.2em] text-gray-500 font-mono uppercase mb-8">
          INTELLIGENT ECOSYSTEM
        </p>
        
        <div className="h-12 flex flex-col items-center justify-center mb-6">
          <div className="flex items-center space-x-2 text-emerald-400 font-mono text-sm">
            <StatusIcon className="w-4 h-4 animate-spin" />
            <span>{statuses[statusIndex].text}</span>
          </div>
        </div>
        
        <div className="w-64 h-[2px] bg-gray-900 rounded-full overflow-hidden mb-3 relative">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-150 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_#10b981]" />
          </div>
        </div>
        
        <span className="font-mono text-xs text-gray-400 tracking-wider">
          {progress}% SECURED
        </span>
      </div>
    </div>
  );
}
APP
