import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TransactionRecord, TransactionType } from '../types';

export const getExplorerUrl = (txHash?: string, network?: string): string | undefined => {
  if (!txHash) return undefined;
  const net = (network || '').toLowerCase();
  if (net.includes('trc') || net.includes('tron')) {
    return `https://tronscan.org/#/transaction/${txHash}`;
  }
  if (net.includes('sol')) {
    return `https://solscan.io/tx/${txHash}`;
  }
  if (net.includes('bep') || net.includes('bsc') || net.includes('binance')) {
    return `https://bscscan.com/tx/${txHash}`;
  }
  if (net.includes('btc') || net.includes('bitcoin')) {
    return `https://mempool.space/tx/${txHash}`;
  }
  if (net.includes('erc') || net.includes('eth') || net.includes('ethereum')) {
    return `https://etherscan.io/tx/${txHash}`;
  }
  return `https://etherscan.io/tx/${txHash}`;
};

export const transactionService = {
  /**
   * Record a new financial operation into Firestore & localStorage
   */
  async recordTransaction(params: Omit<TransactionRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<TransactionRecord> {
    const userId = params.userId || 'guest';
    const id = params.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = params.timestamp || new Date().toISOString();

    let category = params.category;
    if (!category) {
      if (params.type === 'order_creation' && params.status === 'Pending') {
        category = 'orders';
      } else if (['order_completion', 'order_cancellation', 'ai_trade_close', 'trade'].includes(params.type)) {
        category = 'order-history';
      } else {
        category = 'transactions';
      }
    }

    const explorerUrl = params.explorerUrl || getExplorerUrl(params.txHash, params.network);

    const record: TransactionRecord = {
      ...params,
      id,
      timestamp,
      category,
      explorerUrl: explorerUrl || undefined
    };

    // 1. Save locally in localStorage for instant offline / local sync
    try {
      const storageKey = `aver_txs_${userId}`;
      const existingStr = localStorage.getItem(storageKey);
      let list: TransactionRecord[] = [];
      if (existingStr) {
        try {
          list = JSON.parse(existingStr);
        } catch (e) {}
      }
      list = [record, ...list.filter(t => t.id !== id)];
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (err) {
      console.warn("Failed saving transaction to localStorage:", err);
    }

    // 2. Write to Firestore 'transactions' collection
    try {
      const firestoreDoc = {
        ...record,
        serverCreatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'transactions', id), firestoreDoc);
      await addDoc(collection(db, 'user_transactions'), firestoreDoc).catch(() => {});
    } catch (err) {
      console.warn("Failed saving transaction to Firestore:", err);
    }

    // 3. Dispatch real-time local custom event
    window.dispatchEvent(new CustomEvent('aver_transaction_created', { detail: record }));

    return record;
  },

  /**
   * Helper method for deposits
   */
  async recordDeposit(userId: string, amount: number, asset: string = 'USDT', network: string = 'TRC20', txHash?: string) {
    return this.recordTransaction({
      userId,
      type: 'deposit',
      category: 'transactions',
      title: `${asset} Deposit`,
      amount,
      asset,
      network,
      status: 'Completed',
      txHash
    });
  },

  /**
   * Helper method for withdrawals
   */
  async recordWithdrawal(userId: string, amount: number, asset: string = 'USDT', network: string = 'TRC20', txHash?: string) {
    return this.recordTransaction({
      userId,
      type: 'withdrawal',
      category: 'transactions',
      title: `${asset} Withdrawal`,
      amount,
      asset,
      network,
      status: 'Processing',
      txHash
    });
  },

  /**
   * Helper method for transfers
   */
  async recordTransfer(userId: string, amount: number, asset: string = 'USDT', network: string = 'Internal', title?: string) {
    return this.recordTransaction({
      userId,
      type: 'internal_transfer',
      category: 'transactions',
      title: title || `${asset} Internal Transfer`,
      amount,
      asset,
      network,
      status: 'Completed'
    });
  },

  /**
   * Helper method for orders & trades
   */
  async recordOrder(
    userId: string, 
    ticker: string, 
    side: 'buy' | 'sell', 
    price: number, 
    quantity: number, 
    status: 'Pending' | 'Completed' | 'Cancelled' = 'Pending'
  ) {
    const isPending = status === 'Pending';
    return this.recordTransaction({
      userId,
      type: isPending ? 'order_creation' : 'trade',
      category: isPending ? 'orders' : 'order-history',
      title: `${side.toUpperCase()} ${ticker}`,
      asset: ticker,
      amount: price * quantity,
      price,
      quantity,
      side,
      network: 'Trading Engine',
      status
    });
  },

  /**
   * Fetch all transactions for a user from Firestore + localStorage + profile fields
   */
  async getUserTransactions(userId: string, userProfile?: any): Promise<TransactionRecord[]> {
    const map = new Map<string, TransactionRecord>();

    // 1. Read from localStorage
    try {
      const storageKey = `aver_txs_${userId}`;
      const localStr = localStorage.getItem(storageKey);
      if (localStr) {
        const localList: TransactionRecord[] = JSON.parse(localStr);
        localList.forEach(item => {
          if (item.id) map.set(item.id, item);
        });
      }
    } catch (err) {}

    // 2. Map user legacy arrays (deposits, withdrawals, trades, history)
    if (userProfile) {
      if (Array.isArray(userProfile.deposits)) {
        userProfile.deposits.forEach((d: any, idx: number) => {
          const id = d.id || `dep-${d.timestamp || d.date || idx}`;
          if (!map.has(id)) {
            map.set(id, {
              id,
              userId,
              type: 'deposit',
              category: 'transactions',
              title: 'USDT Deposit',
              amount: Number(d.amount) || 0,
              asset: d.asset || 'USDT',
              network: d.network || 'TRC20',
              status: d.status || 'Completed',
              timestamp: d.timestamp || d.date || new Date().toISOString(),
              txHash: d.txHash || d.hash || undefined
            });
          }
        });
      }

      if (Array.isArray(userProfile.withdrawals)) {
        userProfile.withdrawals.forEach((w: any, idx: number) => {
          const id = w.id || `wd-${w.timestamp || w.date || idx}`;
          if (!map.has(id)) {
            map.set(id, {
              id,
              userId,
              type: 'withdrawal',
              category: 'transactions',
              title: 'USDT Withdrawal',
              amount: Number(w.amount) || 0,
              asset: w.asset || 'USDT',
              network: w.network || 'TRC20',
              status: w.status || 'Processing',
              timestamp: w.timestamp || w.date || new Date().toISOString(),
              txHash: w.txHash || w.hash || undefined
            });
          }
        });
      }

      if (Array.isArray(userProfile.trades)) {
        userProfile.trades.forEach((t: any, idx: number) => {
          const id = t.id || `trd-${t.timestamp || idx}`;
          const isPending = t.status === 'Pending';
          if (!map.has(id)) {
            map.set(id, {
              id,
              userId,
              type: isPending ? 'order_creation' : 'trade',
              category: isPending ? 'orders' : 'order-history',
              title: `${(t.side || 'BUY').toUpperCase()} ${t.ticker || 'Crypto'}`,
              asset: t.ticker || 'USDT',
              amount: Number(t.amount) || ((t.quantity || 1) * (t.price || 0)),
              price: t.price,
              quantity: t.quantity,
              side: t.side,
              network: 'Trading Engine',
              status: t.status || 'Completed',
              timestamp: t.timestamp || new Date().toISOString()
            });
          }
        });
      }

      if (Array.isArray(userProfile.history)) {
        userProfile.history.forEach((h: any, idx: number) => {
          const id = h.id || `hist-${h.timestamp || h.date || idx}`;
          if (!map.has(id)) {
            map.set(id, {
              id,
              userId,
              type: h.type || 'internal_transfer',
              category: 'transactions',
              title: h.title || h.description || 'Account Movement',
              amount: Number(h.amount) || 0,
              asset: h.asset || 'USDT',
              network: h.network || 'Internal',
              status: h.status || 'Completed',
              timestamp: h.timestamp || h.date || new Date().toISOString(),
              txHash: h.txHash || undefined
            });
          }
        });
      }
    }

    // 3. Query Firestore 'transactions'
    try {
      const q = query(collection(db, 'transactions'), where('userId', '==', userId));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const data = d.data() as TransactionRecord;
        map.set(d.id, { ...data, id: d.id });
      });
    } catch (err) {
      console.warn("Firestore transactions query notice:", err);
    }

    const list = Array.from(map.values());
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  /**
   * Real-time listener for user transactions
   */
  subscribeUserTransactions(userId: string, callback: (txs: TransactionRecord[]) => void, userProfile?: any) {
    const fetchAndCallback = async () => {
      const txs = await this.getUserTransactions(userId, userProfile);
      callback(txs);
    };

    // Initial fetch
    fetchAndCallback();

    // Event listener for local updates
    const handleLocalUpdate = () => {
      fetchAndCallback();
    };
    window.addEventListener('aver_transaction_created', handleLocalUpdate);

    // Firestore listener
    let unsubFirestore = () => {};
    try {
      const q = query(collection(db, 'transactions'), where('userId', '==', userId));
      unsubFirestore = onSnapshot(q, () => {
        fetchAndCallback();
      }, (err) => {
        console.warn("Realtime transactions listener notice:", err);
      });
    } catch (err) {}

    return () => {
      window.removeEventListener('aver_transaction_created', handleLocalUpdate);
      unsubFirestore();
    };
  }
};
