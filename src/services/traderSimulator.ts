import { collection, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TraderProfile } from '../types/trading';
import { getAvatarDataUrl } from '../utils/avatarGenerator';

const getInitialReturn30d = (i: number) => {
  // Rank 1 (i = 0): around 241% to 243.5% (strictly capped below +243.99%)
  if (i === 0) return 241.2 + Math.random() * 2;
  
  // Progressively lower returns down to occasional negative returns for lower-ranked traders
  const maxVal = 241.0;
  const minVal = -15.0;
  const factor = i / 49; // 0 to 1
  const base = Math.pow(1 - factor, 0.8) * (maxVal - minVal) + minVal;
  const noise = (Math.random() - 0.5) * 3;
  return parseFloat(Math.min(243.99, Math.max(-50, base + noise)).toFixed(2));
};

const INITIAL_TRADERS: TraderProfile[] = Array.from({ length: 50 }, (_, i) => ({
  id: `trader-${i}`,
  rank: i + 1,
  username: `Trader${i + 1}`,
  avatar: getAvatarDataUrl(`trader-${i}`),
  return30d: getInitialReturn30d(i),
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
        // Force establish realistic 30-day history returns and avatars
        const sortedDocs = [...snapshot.docs].sort((a, b) => {
            const aData = a.data();
            const bData = b.data();
            return (aData.rank || 50) - (bData.rank || 50);
        });

        for (let i = 0; i < sortedDocs.length; i++) {
            const d = sortedDocs[i];
            const data = d.data();
            const isStock = (url?: string) => {
                if (!url) return false;
                return ['dicebear.com', 'unsplash.com', 'pravatar.cc', 'i.pravatar.cc'].some(p => url.includes(p));
            };
            
            const updates: any = {
                return30d: getInitialReturn30d(i),
                rank: i + 1
            };

            if (data.avatar && isStock(data.avatar)) {
                updates.avatar = getAvatarDataUrl(d.id);
            }
            
            await updateDoc(doc(tradersRef, d.id), updates);
        }
    }
};

export const startTraderSimulator = () => {
    const interval = setInterval(async () => {
        const tradersRef = collection(db, 'traderProfiles');
        const snapshot = await getDocs(tradersRef);
        if (snapshot.empty) return;
        
        // 1. Map and update returns dynamically simulating real active rolling 30d trades
        const updatedTraders = snapshot.docs.map(d => {
            const data = d.data() as TraderProfile;
            const isWin = Math.random() * 100 < data.winRate;
            const tradeChange = isWin 
                ? (Math.random() * 1.8) // positive trade outcome
                : -(Math.random() * 1.5); // negative trade outcome
            
            let newReturn = data.return30d + tradeChange;
            const newWinRate = Math.max(30, Math.min(95, data.winRate + (Math.random() - 0.5) * 1));
            // Growth is proportional to performance and win rate
            const followerChange = isWin 
                ? Math.floor(Math.random() * 25 + 5) 
                : -Math.floor(Math.random() * 15 + 2);
            const newFollowers = Math.max(500, data.followers + followerChange);
            const newEquityCurve = [...data.equityCurve.slice(1), data.equityCurve[data.equityCurve.length - 1] + (Math.random() - 0.5) * 5];

            return {
                id: d.id,
                ...data,
                return30d: newReturn,
                winRate: newWinRate,
                followers: newFollowers,
                equityCurve: newEquityCurve
            };
        });

        // 2. Sort by updated return30d descending for live ranking battle
        updatedTraders.sort((a, b) => b.return30d - a.return30d);

        // 3. Enforce the strict +243.99% cap on the leader
        if (updatedTraders[0].return30d > 243.99) {
            updatedTraders[0].return30d = 243.99 - Math.random() * 0.5;
        }

        // 4. Batch persist updates with their dynamic rank
        for (let i = 0; i < updatedTraders.length; i++) {
            const trader = updatedTraders[i];
            const traderDocRef = doc(db, 'traderProfiles', trader.id);
            await updateDoc(traderDocRef, {
                rank: i + 1,
                return30d: parseFloat(trader.return30d.toFixed(2)),
                winRate: parseFloat(trader.winRate.toFixed(2)),
                followers: trader.followers,
                equityCurve: trader.equityCurve
            });
        }
    }, 10000); // 10 seconds simulation

    return () => clearInterval(interval);
};
