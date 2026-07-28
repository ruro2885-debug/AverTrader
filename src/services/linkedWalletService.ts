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
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LinkedWallet } from '../types';

export const linkedWalletService = {
  /**
   * Links a new wallet to the user's account and saves it to the 'linked_wallets' collection.
   */
  async linkWallet(data: Omit<LinkedWallet, 'id' | 'linkedAt' | 'updatedAt' | 'status'>): Promise<string> {
    const walletsRef = collection(db, 'linked_wallets');
    
    // Check for duplicates
    const q = query(
      walletsRef, 
      where('userId', '==', data.userId),
      where('address', '==', data.address)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error('This wallet is already linked to your account.');
    }

    const now = new Date().toISOString();
    const newWalletDoc = await addDoc(walletsRef, {
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
    const walletsRef = collection(db, 'linked_wallets');
    const q = query(
      walletsRef, 
      where('userId', '==', userId),
      orderBy('linkedAt', 'desc')
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as LinkedWallet));
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
