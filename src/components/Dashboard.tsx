import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import BottomNavigation from './BottomNavigation';

export default function Dashboard({ theme }: { theme: 'light' | 'dark' }) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen pb-24">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          <h1 className="text-2xl font-bold text-white mb-4 capitalize">{activeTab}</h1>
          <div className="grid gap-4">
            <div className="h-40 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-center text-gray-500">
              Dashboard Content for {activeTab}
            </div>
            <div className="h-40 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-center text-gray-500">
              Widget Placeholder
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
