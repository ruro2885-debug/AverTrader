import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { EquityHistoryRecord } from '../types/aiTrading';

const COLLECTION_NAME = 'equityHistory';

export const equityService = {
  async recordEquity(record: Omit<EquityHistoryRecord, 'id'>): Promise<void> {
    try {
      if (record.userId.startsWith('local-')) {
        // Handle local user persistence if needed, or just skip
        console.log('[equityService] Skipping record for local user');
        return;
      }
      const colRef = collection(db, 'users', record.userId, COLLECTION_NAME);
      await addDoc(colRef, {
        ...record,
        timestamp: record.timestamp || Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${record.userId}/${COLLECTION_NAME}`);
    }
  },

  async getHistory(userId: string, range: '1D' | '1W' | '1M'): Promise<EquityHistoryRecord[]> {
    try {
      if (userId.startsWith('local-')) return [];

      const now = new Date();
      let startTime = new Date();
      if (range === '1D') startTime.setDate(now.getDate() - 1);
      else if (range === '1W') startTime.setDate(now.getDate() - 7);
      else if (range === '1M') startTime.setMonth(now.getMonth() - 1);

      const q = query(
        collection(db, 'users', userId, COLLECTION_NAME),
        where('timestamp', '>=', Timestamp.fromDate(startTime)),
        orderBy('timestamp', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EquityHistoryRecord[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/${COLLECTION_NAME}`);
      return [];
    }
  },

  subscribeHistory(userId: string, range: '1D' | '1W' | '1M', callback: (records: EquityHistoryRecord[]) => void) {
    if (userId.startsWith('local-')) {
      callback([]);
      return () => {};
    }

    const now = new Date();
    let startTime = new Date();
    if (range === '1D') startTime.setDate(now.getDate() - 1);
    else if (range === '1W') startTime.setDate(now.getDate() - 7);
    else if (range === '1M') startTime.setMonth(now.getMonth() - 1);

    const q = query(
      collection(db, 'users', userId, COLLECTION_NAME),
      where('timestamp', '>=', Timestamp.fromDate(startTime)),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EquityHistoryRecord[];
      callback(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/${COLLECTION_NAME}`);
    });
  }
};
