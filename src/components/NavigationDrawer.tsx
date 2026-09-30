import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cpu, Layout, Activity, Shield, ArrowRight, Home, User, BarChart2, Award } from 'lucide-react';
import AverLogo from './AverLogo';
import { usePreferences } from '../contexts/PreferencesContext';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onNavigate: (section: string) => void;
  activeSection?: string;
  onShowcase?: () => void;
  onAdminAccess?: () => void;
}

export default function NavigationDrawer({
  isOpen,
  onClose,
  theme,
  onNavigate,
  activeSection,
  onShowcase,
  onAdminAccess,
}: NavigationDrawerProps) {
  const isDark = theme === 'dark';
  const { t } = usePreferences();

  const navItems = [
    { name: t('nav.technology') || 'Technology', id: 'tech', icon: Cpu },
    { name: t('nav.platform') || 'Platform', id: 'features', icon: Layout },
    { name: t('nav.performance') || 'Performance', id: 'stats', icon: Activity },
    { name: t('show.title') || 'Preview', id: 'preview', icon: Shield },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Body */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] border-l flex flex-col justify-between p-6 shadow-2xl ${
              isDark ? 'bg-slate-950/95 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
            }`}
          >
            <div className="space-y-6">
              {/* Top Drawer Bar */}
              <div className="flex items-center justify-between">
                <AverLogo theme={theme} size={32} />
                <button
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-colors ${
                    isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <hr className={isDark ? 'border-white/5' : 'border-slate-100'} />

              {/* Nav links */}
              <nav className="flex flex-col space-y-2">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isDark
                          ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <item.icon className="w-4 h-4 text-emerald-400" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-3 pt-6 border-t border-white/5">
              {onShowcase && (
                <button
                  onClick={() => {
                    onShowcase();
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <span>{t('nav.access') || 'Launch Platform'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
