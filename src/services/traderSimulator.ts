import { collection, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TraderProfile } from '../types/trading';
import { getAvatarDataUrl } from '../utils/avatarGenerator';

const INITIAL_TRADERS: TraderProfile[] = Array.from({ length: 50 }, (_, i) => ({
  id: `trader-${i}`,
  rank: i + 1,
  username: `Trader${i + 1}`,
  avatar: getAvatarDataUrl(`trader-${i}`),
  return30d: Math.floor(Math.random() * 50) + 5,
  overallReturn: Math.floor(Math.random() * 200) + 10,
  winRate: Math.floor(Math.random() * 40) + 50,
  lossRate: Math.floor(Math.random() * 30) + 10,
  strategy: ['Scalping', 'Swing', 'Trend Following', 'Arbitrage'][i % 4],
  verified: i < 15,
  followers: Math.floor(Math.random() * 20000) + 1000,
  riskRating: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as 'Low' | 'Medium' | 'High',
  equityCurve: Array.from({ length: 30 }, () => Math.random() * 100)
}));

export const seedTraders = async () => {
    const tradersRef = collection(db, 'traderProfiles');
    const snapshot = await getDocs(tradersRef);
    if (snapshot.empty) {
        for (const trader of INITIAL_TRADERS) {
            await setDoc(doc(tradersRef, trader.id), trader);
        }
    } else {
        // Force update avatars to new system if they are using old stock photo URLs
        for (const d of snapshot.docs) {
            const data = d.data();
            const isStock = (url?: string) => {
                if (!url) return false;
                return ['dicebear.com', 'unsplash.com', 'pravatar.cc', 'i.pravatar.cc'].some(p => url.includes(p));
            };
            
            if (data.avatar && isStock(data.avatar)) {
                await updateDoc(doc(tradersRef, d.id), {
                    avatar: getAvatarDataUrl(d.id)
                });
            }
        }
    }
};

export const startTraderSimulator = () => {
    const interval = setInterval(async () => {
        const tradersRef = collection(db, 'traderProfiles');
        const snapshot = await getDocs(tradersRef);
        
        snapshot.docs.forEach(async (d) => {
            const data = d.data() as TraderProfile;
            
            // 1. Simulate performance changes
            const newReturn = Math.max(-50, Math.min(500, data.return30d + (Math.random() - 0.5) * 2));
            const newWinRate = Math.max(30, Math.min(95, data.winRate + (Math.random() - 0.5) * 1));
            const newFollowers = Math.max(0, data.followers + Math.floor((Math.random() - 0.5) * 10));
            const newEquityCurve = [...data.equityCurve.slice(1), data.equityCurve[data.equityCurve.length - 1] + (Math.random() - 0.5) * 5];

            await updateDoc(doc(tradersRef, d.id), {
                return30d: newReturn,
                winRate: newWinRate,
                followers: newFollowers,
                equityCurve: newEquityCurve
            });
        });
    }, 10000); // 10 seconds simulation

    return () => clearInterval(interval);
};
