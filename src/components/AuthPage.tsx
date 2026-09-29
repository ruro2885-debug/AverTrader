import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppNavigation } from '../contexts/NavigationContext';
import AverLogo from './AverLogo';
import { ArrowLeft, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export default function AuthPage({ theme, onBack, onSuccess }: { theme: 'light' | 'dark'; onBack: () => void; onSuccess: () => void }) {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      await signup(email, password, name);
    } else {
      await login(email, password);
    }
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col justify-between p-6">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-300 font-extrabold hover:text-white cursor-pointer">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <AverLogo theme={theme} size={32} />
      </header>

      <main className="max-w-md mx-auto w-full my-auto space-y-8 p-8 rounded-3xl border border-white/15 bg-slate-900/90 shadow-2xl backdrop-blur-2xl">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black">{isSignUp ? 'Create Sovereign Account' : 'Access Terminal'}</h2>
          <p className="text-sm font-extrabold text-slate-300">
            {isSignUp ? 'Join institutional quantitative network' : 'Authenticate your trader session'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">Display Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sovereign Trader"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-white/20 text-white font-bold text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@averplatform.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-white/20 text-white font-bold text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">Passcode</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-white/20 text-white font-bold text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Complete Registration' : 'Sign In To Terminal'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-extrabold text-emerald-400 hover:underline cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </main>

      <footer className="text-center text-xs font-mono font-bold text-slate-400">
        © 2026 AVER TECHNOLOGIES. SECURE QUANTUM ENCRYPTION.
      </footer>
    </div>
  );
}
