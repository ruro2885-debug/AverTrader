import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LinkedWallet } from '../types';

export const linkedWalletService = {
  /**
   * Links a new wallet to the user's account and saves it to the 'linked_wallets' collection.
   */
  async linkWallet(data: Omit<LinkedWallet, 'id' | 'linkedAt' | 'updatedAt' | 'status'>): Promise<string> {
    const walletsRef = collection(db, 'linked_wallets');
    const normalizedAddress = data.address.trim().toLowerCase();
    
    // Check for duplicates in a case-insensitive manner without multi-field composite index queries
    try {
      const q = query(walletsRef, where('userId', '==', data.userId));
      const snap = await getDocs(q);
      const existingDoc = snap.docs.find(d => d.data().address?.toLowerCase() === normalizedAddress);
      if (existingDoc) {
        // Update existing document status to Connected
        await updateDoc(doc(db, 'linked_wallets', existingDoc.id), {
          status: 'Connected',
          updatedAt: new Date().toISOString()
        });
        return existingDoc.id;
      }
    } catch (err) {
      console.warn("Duplicate wallet check notice:", err);
    }

    const now = new Date().toISOString();
    const newWalletDoc = await addDoc(walletsRef, {
      walletType: 'Browser Extension',
      verificationStatus: 'Verified',
      ...data,
      status: 'Connected',
      linkedAt: now,
      updatedAt: now,
      serverCreatedAt: serverTimestamp()
    });

    // Update the ID in the document
    await updateDoc(newWalletDoc, { id: newWalletDoc.id });
    
    return newWalletDoc.id;
  },

  /**
   * Unlinks a wallet by its ID.
   */
  async unlinkWallet(walletId: string): Promise<void> {
    try {
      const walletRef = doc(db, 'linked_wallets', walletId);
      await deleteDoc(walletRef);
    } catch (err) {
      console.warn('Direct delete failed, searching linked_wallets collection by id field:', err);
    }
    // Also cleanup any document matching id or address matching walletId
    try {
      const walletsRef = collection(db, 'linked_wallets');
      const q = query(walletsRef, where('id', '==', walletId));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await deleteDoc(doc(db, 'linked_wallets', d.id));
      });
    } catch (err) {
      console.warn('Secondary delete search error:', err);
    }
  },

  /**
   * Updates the status of a linked wallet (e.g., Enable/Disable).
   */
  async updateWalletStatus(walletId: string, status: 'Connected' | 'Disconnected'): Promise<void> {
    const walletRef = doc(db, 'linked_wallets', walletId);
    await updateDoc(walletRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Fetches all linked wallets for a specific user.
   */
  async getLinkedWallets(userId: string): Promise<LinkedWallet[]> {
    try {
      const walletsRef = collection(db, 'linked_wallets');
      const q = query(
        walletsRef, 
        where('userId', '==', userId)
      );
      
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as LinkedWallet));
      return list.sort((a, b) => new Date(b.linkedAt || 0).getTime() - new Date(a.linkedAt || 0).getTime());
    } catch (err) {
      console.warn("Failed to getLinkedWallets from Firestore:", err);
      return [];
    }
  },

  /**
   * Subscribes to real-time updates for a specific user's linked wallets.
   */
  subscribeUserWallets(userId: string, callback: (wallets: LinkedWallet[]) => void) {
    const walletsRef = collection(db, 'linked_wallets');
    const q = query(walletsRef, where('userId', '==', userId));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as LinkedWallet));
      list.sort((a, b) => new Date(b.linkedAt || 0).getTime() - new Date(a.linkedAt || 0).getTime());
      callback(list);
    }, (err) => {
      console.warn("Realtime linked_wallets listener notice:", err);
    });
  },

  /**
   * Fetches all linked wallets across all users (Admin only).
   */
  async getAllLinkedWallets(): Promise<LinkedWallet[]> {
    const walletsRef = collection(db, 'linked_wallets');
    const q = query(walletsRef, orderBy('linkedAt', 'desc'));
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as LinkedWallet));
  }
};
