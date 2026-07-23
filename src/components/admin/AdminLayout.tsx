import React, { useState } from 'react';
import { LayoutDashboard, HelpCircle, ShieldCheck, ArrowDownLeft, ArrowUpRight, LogOut, Sun, Moon, Shield, ExternalLink, Menu, X } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminSupport from './AdminSupport';
import AdminKyc from './AdminKyc';
import AdminDeposits from './AdminDeposits';
import AdminWithdrawals from './AdminWithdrawals';

interface AdminLayoutProps {
  theme: string;
  onToggleTheme: () => void;
}

export default function AdminLayout({ theme, onToggleTheme }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'support' | 'kyc' | 'deposits' | 'withdrawals'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarBg = theme === 'dark' ? 'bg-[#0a0d12] border-slate-800' : 'bg-white border-slate-200';
  const mainBg = theme === 'dark' ? 'bg-[#05070a] text-slate-100' : 'bg-slate-50 text-slate-900';
  const cardBg = theme === 'dark' ? 'bg-[#12161c] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'support', label: 'Support Queue', icon: HelpCircle },
    { id: 'kyc', label: 'KYC Reviews', icon: ShieldCheck },
    { id: 'deposits', label: 'Deposits', icon: ArrowDownLeft },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
  ];

  return (
    <div className={`min-h-screen flex ${mainBg}`}>
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 shadow-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 border-r ${sidebarBg} flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand / Header */}
        <div className="p-6 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base tracking-tight">Aver Admin</h2>
              <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">Secure Console</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : `${textSecondary} hover:bg-slate-500/10 hover:text-white`
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-emerald-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer / Exit to User App */}
        <div className="p-4 border-t border-inherit space-y-3">
          <button
            onClick={onToggleTheme}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border ${cardBg} text-xs font-bold hover:opacity-80 transition-opacity`}
          >
            <span>Theme Mode</span>
            {theme === 'dark' ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.pathname = '/';
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit to User App</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className={`h-20 border-b ${sidebarBg} px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md bg-opacity-80`}>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
              Protected Admin Route: /admin
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold">Administrator</div>
              <div className={`text-[10px] ${textSecondary}`}>system-root@aver.io</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md">
              SA
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <AdminDashboard theme={theme} />}
          {activeTab === 'support' && <AdminSupport theme={theme} />}
          {activeTab === 'kyc' && <AdminKyc theme={theme} />}
          {activeTab === 'deposits' && <AdminDeposits theme={theme} />}
          {activeTab === 'withdrawals' && <AdminWithdrawals theme={theme} />}
        </div>
      </main>
    </div>
  );
}
