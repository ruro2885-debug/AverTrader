import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Search, Globe, ExternalLink, Trash2, CheckCircle2, User, Activity, Filter, ArrowUpDown, X, Shield, ShieldCheck } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { LinkedWallet } from '../../../types';
import { safeStorage } from '../../../utils/storage';

export default function AdminWallets({ theme }: { theme: 'light' | 'dark' }) {
  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const [search, setSearch] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedWalletForDetails, setSelectedWalletForDetails] = useState<LinkedWallet | null>(null);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    let collectionWallets: LinkedWallet[] = [];
    let userProfileWallets: LinkedWallet[] = [];

    const updateCombined = () => {
      const map = new Map<string, LinkedWallet>();
      
      // 1. Add wallets from Firestore linked_wallets collection
      collectionWallets.forEach(w => {
        if (w.address) {
          map.set(w.address.toLowerCase(), w);
        }
      });

      // 2. Add wallets from Firestore user profiles if not already present
      userProfileWallets.forEach(w => {
        if (w.address && !map.has(w.address.toLowerCase())) {
          map.set(w.address.toLowerCase(), w);
        }
      });

      // 3. Add wallets from Local Storage (guest / local active user)
      try {
        const localWalletsList: LinkedWallet[] = [];
        
        // Active user from local storage
        const activeUserStr = safeStorage.getItem('aver_active_user') || localStorage.getItem('aver_active_user');
        if (activeUserStr) {
          try {
            const activeUser = JSON.parse(activeUserStr);
            if (Array.isArray(activeUser.linkedWallets)) {
              activeUser.linkedWallets.forEach((w: any) => {
                if (w && w.address) {
                  localWalletsList.push({
                    id: w.id || `loc-${activeUser.uid || 'active'}-${w.address}`,
                    userId: activeUser.uid || 'guest',
                    userName: activeUser.displayName || activeUser.username || 'Trader',
                    userEmail: activeUser.email || '',
                    address: w.address,
                    network: w.network || 'Ethereum',
                    provider: w.provider || 'Manual Connection',
                    walletType: w.walletType || 'Browser Extension',
                    verificationStatus: w.verificationStatus || 'Verified',
                    status: w.status || 'Connected',
                    linkedAt: w.linkedAt || new Date().toISOString(),
                    updatedAt: w.updatedAt || new Date().toISOString()
                  });
                }
              });
            }
          } catch (e) {}
        }

        // Local DB users from local storage
        const localDbStr = safeStorage.getItem('aver_local_db') || localStorage.getItem('aver_local_db');
        if (localDbStr) {
          try {
            const localDb = JSON.parse(localDbStr);
            if (Array.isArray(localDb)) {
              localDb.forEach((item: any) => {
                const p = item.profile || item;
                if (Array.isArray(p.linkedWallets)) {
                  p.linkedWallets.forEach((w: any) => {
                    if (w && w.address) {
                      localWalletsList.push({
                        id: w.id || `locdb-${p.uid || item.email}-${w.address}`,
                        userId: p.uid || item.email || 'guest',
                        userName: p.displayName || p.username || 'Trader',
                        userEmail: p.email || item.email || '',
                        address: w.address,
                        network: w.network || 'Ethereum',
                        provider: w.provider || 'Manual Connection',
                        walletType: w.walletType || 'Browser Extension',
                        verificationStatus: w.verificationStatus || 'Verified',
                        status: w.status || 'Connected',
                        linkedAt: w.linkedAt || new Date().toISOString(),
                        updatedAt: w.updatedAt || new Date().toISOString()
                      });
                    }
                  });
                }
              });
            }
          } catch (e) {}
        }

        // Cached user profiles from local storage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('user_profile_')) {
            try {
              const u = JSON.parse(localStorage.getItem(key) || '{}');
              if (Array.isArray(u.linkedWallets)) {
                u.linkedWallets.forEach((w: any) => {
                  if (w && w.address) {
                    localWalletsList.push({
                      id: w.id || `usrkey-${key}-${w.address}`,
                      userId: u.uid || key,
                      userName: u.displayName || u.username || 'Trader',
                      userEmail: u.email || '',
                      address: w.address,
                      network: w.network || 'Ethereum',
                      provider: w.provider || 'Manual Connection',
                      walletType: w.walletType || 'Browser Extension',
                      verificationStatus: w.verificationStatus || 'Verified',
                      status: w.status || 'Connected',
                      linkedAt: w.linkedAt || new Date().toISOString(),
                      updatedAt: w.updatedAt || new Date().toISOString()
                    });
                  }
                });
              }
            } catch (e) {}
          }
        }

        localWalletsList.forEach(w => {
          if (w.address && !map.has(w.address.toLowerCase())) {
            map.set(w.address.toLowerCase(), w);
          }
        });
      } catch (err) {
        console.warn("Local storage wallets check notice:", err);
      }

      const list = Array.from(map.values()).sort((a, b) => 
        new Date(b.linkedAt || 0).getTime() - new Date(a.linkedAt || 0).getTime()
      );
      setWallets(list);
      setLoading(false);
    };

    // 1. Listen to linked_wallets collection
    const unsubWallets = onSnapshot(collection(db, 'linked_wallets'), (snap) => {
      collectionWallets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkedWallet));
      updateCombined();
    }, (err) => {
      console.error("Failed to load linked_wallets collection:", err);
      setLoading(false);
    });

    // 2. Listen to users collection for any embedded linkedWallets
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const userWalletsList: LinkedWallet[] = [];
      snap.docs.forEach(docSnap => {
        const u = docSnap.data();
        if (Array.isArray(u.linkedWallets)) {
          u.linkedWallets.forEach((w: any) => {
            if (w && w.address) {
              userWalletsList.push({
                id: w.id || `usr-${docSnap.id}-${w.address}`,
                userId: u.uid || docSnap.id,
                userName: u.displayName || u.username || 'Trader',
                userEmail: u.email || '',
                address: w.address,
                network: w.network || 'Ethereum',
                provider: w.provider || 'Manual Connection',
                walletType: w.walletType || 'Browser Extension',
                verificationStatus: w.verificationStatus || 'Verified',
                status: w.status || 'Connected',
                linkedAt: w.linkedAt || u.createdAt || new Date().toISOString(),
                updatedAt: w.updatedAt || new Date().toISOString()
              });
            }
          });
        }
      });
      userProfileWallets = userWalletsList;
      updateCombined();
    }, (err) => {
      console.error("Failed to load users for linkedWallets:", err);
    });

    // 3. Listen to local storage & custom wallet events for instant real-time sync
    window.addEventListener('aver_wallet_updated', updateCombined);
    window.addEventListener('storage', updateCombined);
    const interval = setInterval(updateCombined, 3000);

    return () => {
      unsubWallets();
      unsubUsers();
      window.removeEventListener('aver_wallet_updated', updateCombined);
      window.removeEventListener('storage', updateCombined);
      clearInterval(interval);
    };
  }, []);

  const toggleStatus = async (id: string, current: string) => {
    try {
      const nextStatus = current === 'Connected' ? 'Disconnected' : 'Connected';
      await updateDoc(doc(db, 'linked_wallets', id), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to toggle wallet status:", err);
    }
  };

  const deleteWallet = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to unlink this wallet?')) return;
    try {
      await deleteDoc(doc(db, 'linked_wallets', id));
    } catch (err) {
      console.error("Failed to delete wallet:", err);
    }
  };

  // Filter & Search logic
  const filtered = wallets.filter(w => {
    const matchesSearch = 
      w.address?.toLowerCase().includes(search.toLowerCase()) || 
      w.userId?.toLowerCase().includes(search.toLowerCase()) ||
      w.userName?.toLowerCase().includes(search.toLowerCase()) ||
      w.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      w.network?.toLowerCase().includes(search.toLowerCase()) ||
      w.provider?.toLowerCase().includes(search.toLowerCase()) ||
      (w.walletType && w.walletType.toLowerCase().includes(search.toLowerCase()));

    const matchesNetwork = selectedNetwork === 'All' || w.network?.toLowerCase() === selectedNetwork.toLowerCase();
    const matchesType = selectedType === 'All' || (w.walletType || 'Browser Extension').toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesNetwork && matchesType;
  }).sort((a, b) => {
    const dateA = new Date(a.linkedAt || 0).getTime();
    const dateB = new Date(b.linkedAt || 0).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Custody Network</h1>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Audit and manage all external institutional wallets linked to the platform ecosystem.
        </p>
      </div>

      {/* Search, Filters and Sorting Bar */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className={`flex-1 w-full max-w-md flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search address, email, user name, or UID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`bg-transparent border-none focus:ring-0 text-sm w-full outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Network Filter */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
            <Globe className="w-4 h-4 text-emerald-500" />
            <select 
              value={selectedNetwork} 
              onChange={(e) => setSelectedNetwork(e.target.value)}
              className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Networks</option>
              <option value="Ethereum" className="bg-slate-900">Ethereum</option>
              <option value="Solana" className="bg-slate-900">Solana</option>
              <option value="Bitcoin" className="bg-slate-900">Bitcoin</option>
              <option value="Polygon" className="bg-slate-900">Polygon</option>
              <option value="Binance Smart Chain" className="bg-slate-900">BSC</option>
            </select>
          </div>

          {/* Wallet Type Filter */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
            <Wallet className="w-4 h-4 text-emerald-500" />
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Wallet Types</option>
              <option value="Browser Extension" className="bg-slate-900">Browser Extension</option>
              <option value="Hardware" className="bg-slate-900">Hardware</option>
              <option value="Mobile" className="bg-slate-900">Mobile</option>
              <option value="Web3" className="bg-slate-900">Web3</option>
            </select>
          </div>

          {/* Sort Order */}
          <button 
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
              isDark ? 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" />
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((wallet) => (
          <motion.div
            key={wallet.id}
            layout
            onClick={() => setSelectedWalletForDetails(wallet)}
            className={`p-6 rounded-[2rem] border transition-all cursor-pointer group ${
              isDark ? 'bg-white/5 border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.07]' : 'bg-white border-slate-200 shadow-sm hover:border-emerald-500/30'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base group-hover:text-emerald-400 transition-colors">{wallet.provider || 'External Wallet'}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-white/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full">{wallet.network}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{wallet.walletType || 'Browser Extension'}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatus(wallet.id, wallet.status);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                  wallet.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                }`}
                title="Toggle Active Status"
              >
                {wallet.status || 'Connected'}
              </button>
            </div>

            <div className={`p-4 rounded-2xl mb-4 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Public Address</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> {wallet.verificationStatus || 'Verified'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-300 break-all leading-relaxed">
                {wallet.address}
              </p>
            </div>

            <div className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-white/5' : 'bg-slate-50'} space-y-3`}>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">User & Ownership</span>
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{wallet.userName || 'Unknown User'}</span>
                <span className="text-xs text-slate-400">{wallet.userEmail || 'No email provided'}</span>
                <span className="text-[10px] font-mono text-slate-500 mt-1">UID: {wallet.userId}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-500/20 pt-2 mt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date Linked</span>
                <span className="text-xs text-slate-400">{formatDate(wallet.linkedAt)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-500/20">
              <span className="text-xs text-emerald-400 font-bold group-hover:underline flex items-center gap-1">
                View Full Details <ExternalLink className="w-3 h-3" />
              </span>
              <button 
                onClick={(e) => deleteWallet(wallet.id, e)}
                className={`p-2 rounded-xl transition-all ${
                  isDark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                }`}
                title="Unlink Wallet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Globe className="w-16 h-16 text-emerald-500" />
            <div className="space-y-1">
              <p className="font-bold text-lg">No linked wallets found.</p>
              <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Details Modal */}
      <AnimatePresence>
        {selectedWalletForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-2xl rounded-[32px] border p-8 shadow-2xl relative ${
                isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <button 
                onClick={() => setSelectedWalletForDetails(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Wallet className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">{selectedWalletForDetails.provider || 'External Wallet'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {selectedWalletForDetails.network}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      {selectedWalletForDetails.walletType || 'Browser Extension'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Public Wallet Address</span>
                  <p className="text-sm font-mono text-emerald-400 break-all select-all">{selectedWalletForDetails.address}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'} space-y-2`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Owning User Information</span>
                    <div>
                      <p className="text-sm font-bold">{selectedWalletForDetails.userName || 'Unknown User'}</p>
                      <p className="text-xs text-slate-400">{selectedWalletForDetails.userEmail || 'No email provided'}</p>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">UID: {selectedWalletForDetails.userId}</p>
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'} space-y-3`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Status & Metadata</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Active Status:</span>
                      <span className={`font-bold uppercase ${selectedWalletForDetails.status === 'Connected' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {selectedWalletForDetails.status || 'Connected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Verification:</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> {selectedWalletForDetails.verificationStatus || 'Verified'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Date Linked:</span>
                      <span className="font-bold text-slate-300">{formatDate(selectedWalletForDetails.linkedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-500/20">
                <button
                  onClick={() => {
                    deleteWallet(selectedWalletForDetails.id);
                    setSelectedWalletForDetails(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Unlink Wallet
                </button>
                <button
                  onClick={() => setSelectedWalletForDetails(null)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
