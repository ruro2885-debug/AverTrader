import { collection, getDocs, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TraderProfile } from '../types/trading';
import { getAvatarDataUrl } from '../utils/avatarGenerator';
import { 
  initSimulatedTraders, 
  runSimulationTick, 
  getTraderEquityCurve,
  SimulatedTrader 
} from '../utils/traderSimulation';

const mapSimulatedTraderToFirestore = (t: SimulatedTrader): any => {
  const ret30 = t.return30D || (12 + (parseInt(t.id.replace(/\D/g, '')) || 1) % 50);
  return {
    ...t, // Keep all high-fidelity SimulatedTrader fields so CopyTradeDashboard works perfectly
    return30D: ret30,
    return30d: ret30,
    overallReturn: t.returnAllTime || ret30 * 2.5 || 120,
    lossRate: 100 - (t.winRate || 75),
    strategy: t.strategyName || 'Algorithmic Alpha Engine',
    riskRating: t.riskLevel === 'HIGH' ? 'High' : t.riskLevel === 'MEDIUM' ? 'Medium' : 'Low',
    avatar: t.avatarUrl || getAvatarDataUrl(t.avatarSeed),
    equityCurve: getTraderEquityCurve(t, '30d').dataPoints
  };
};

export const seedTraders = async () => {
    try {
        const tradersRef = collection(db, 'traderProfiles');
        const snapshot = await getDocs(tradersRef);
        
        // Check if we need to re-seed (if empty, or if we have old style traders lacking strategyName)
        let needsReseed = snapshot.empty;
        if (!snapshot.empty) {
            const firstDoc = snapshot.docs[0].data();
            if (!firstDoc.strategyName) {
                needsReseed = true;
            }
        }
        
        if (needsReseed) {
            console.log("Seeding high-fidelity procedurally-generated copy traders to Firestore...");
            
            // Delete all existing documents to ensure clean seed
            for (const d of snapshot.docs) {
                await deleteDoc(d.ref);
            }
            
            // Generate high-fidelity traders from traderSimulation
            const simulatedTraders = initSimulatedTraders();
            
            for (const t of simulatedTraders) {
                const mapped = mapSimulatedTraderToFirestore(t);
                await setDoc(doc(tradersRef, t.id), mapped);
            }
            console.log("High-fidelity copy traders seeded successfully.");
        }
    } catch (error) {
        console.error("Error in seedTraders:", error);
    }
};

export const startTraderSimulator = () => {
    const interval = setInterval(async () => {
        try {
            const tradersRef = collection(db, 'traderProfiles');
            const snapshot = await getDocs(tradersRef);
            if (snapshot.empty) return;
            
            // 1. Read all SimulatedTrader documents from Firestore
            const tradersList = snapshot.docs.map(d => d.data() as SimulatedTrader);
            
            // 2. Run simulation tick on the retrieved traders list
            const { updatedTraders } = runSimulationTick(tradersList);
            
            // 3. Save the updated high-fidelity traders back to Firestore with correct mapped fields
            for (const t of updatedTraders) {
                const mapped = mapSimulatedTraderToFirestore(t);
                const traderDocRef = doc(db, 'traderProfiles', t.id);
                await setDoc(traderDocRef, mapped);
            }
            console.log("High-fidelity copy trading simulation tick completed in Firestore.");
        } catch (error) {
            console.error("Error in startTraderSimulator tick:", error);
        }
    }, 10000); // 10 seconds simulation

    return () => clearInterval(interval);
};

