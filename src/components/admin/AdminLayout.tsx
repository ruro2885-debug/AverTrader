import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  UserCheck, 
  Ticket, 
  Activity, 
  Bell, 
  History, 
  PieChart, 
  Calendar,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AdminAuthGate from './AdminAuthGate';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminWallets from './AdminWallets';
import AdminDeposits from './AdminDeposits';
import AdminWithdrawals from './AdminWithdrawals';
import AdminKyc from './AdminKyc';
import AdminSupport from './AdminSupport';
import AdminTradingMonitor from './AdminTradingMonitor';
import AdminNotifications from './AdminNotifications';
import AdminAuditLogs from './AdminAuditLogs';
import AdminAnalytics from './AdminAnalytics';
import AdminCampaigns from './AdminCampaigns';
import AverLogo from '../AverLogo';

interface AdminLayoutProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

type AdminView = 
  | 'dashboard' 
  | 'users' 
  | 'wallets' 
  | 'deposits' 
  | 'withdrawals' 
  | 'kyc' 
  | 'support' 
  | 'trading' 
  | 'notifications' 
  | 'audit' 
  | 'analytics' 
  | 'campaigns';

export default function AdminLayout({ theme, onToggleTheme }: AdminLayoutProps) {
  const { user, signOutUser } = useAuth();
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'wallets', label: 'Linked Wallets', icon: Wallet },
    { id: 'deposits', label: 'Deposits', icon: ArrowDownCircle },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpCircle },
    { id: 'kyc', label: 'KYC Reviews', icon: UserCheck },
    { id: 'support', label: 'Support Tickets', icon: Ticket },
    { id: 'trading', label: 'Trading Monitor', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'audit', label: 'Audit Logs', icon: History },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'campaigns', label: 'Campaigns & Events', icon: Calendar },
  ];

  const handleLogout = async () => {
    await signOutUser();
    window.location.href = '/';
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <AdminDashboard theme={theme} />;
      case 'users': return <AdminUsers theme={theme} />;
      case 'wallets': return <AdminWallets theme={theme} />;
      case 'deposits': return <AdminDeposits theme={theme} />;
      case 'withdrawals': return <AdminWithdrawals theme={theme} />;
      case 'kyc': return <AdminKyc theme={theme} />;
      case 'support': return <AdminSupport theme={theme} />;
      case 'trading': return <AdminTradingMonitor theme={theme} />;
      case 'notifications': return <AdminNotifications theme={theme} />;
      case 'audit': return <AdminAuditLogs theme={theme} />;
      case 'analytics': return <AdminAnalytics theme={theme} />;
      case 'campaigns': return <AdminCampaigns theme={theme} />;
      default: return <AdminDashboard theme={theme} />;
    }
  };

  const currentTitle = menuItems.find(i => i.id === activeView)?.label || 'Admin Panel';

  return (
    <div className={`flex min-h-screen font-sans ${theme === 'dark' ? 'bg-[#05070A] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
        
        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 280 : 80 }}
          className={`fixed left-0 top-0 h-full z-40 border-r ${
            theme === 'dark' ? 'bg-[#0D1117] border-white/[0.05]' : 'bg-white border-slate-200'
          } overflow-hidden flex flex-col`}
        >
          {/* Sidebar Header */}
          <div className="h-20 flex items-center px-6 gap-4 border-b border-white/[0.03]">
            <AverLogo size={32} />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap"
                >
                  <span className="font-bold text-lg tracking-tight">Admin Terminal</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as AdminView)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative group ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'hover:bg-white/[0.03] text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-white'}`} />
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-pill"
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-l-full" 
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/[0.03] space-y-1">
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/[0.03] text-slate-400 hover:text-white transition-all"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isSidebarOpen && <span className="text-sm font-medium">Toggle Theme</span>}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all"
            >
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && <span className="text-sm font-medium">Log Out</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-[280px]' : 'ml-[80px]'}`}>
          {/* Top Navbar */}
          <header className={`h-20 sticky top-0 z-30 border-b flex items-center justify-between px-8 backdrop-blur-md ${
            theme === 'dark' ? 'bg-[#05070A]/80 border-white/[0.05]' : 'bg-white/80 border-slate-200'
          }`}>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h1 className="text-xl font-bold tracking-tight">{currentTitle}</h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Global terminal search..."
                  className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 w-64"
                />
              </div>

              <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white leading-none mb-1">{user?.displayName || 'Super Admin'}</p>
                  <p className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase">{user?.email === ADMIN_EMAIL ? 'Root Authority' : 'Administrator'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                  {user?.email?.[0].toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* View Container */}
          <div className="p-8 max-w-[1600px] mx-auto">
            {renderView()}
          </div>
        </main>

      </div>
  );
}

const ADMIN_EMAIL = 'ruro2885@gmail.com';
