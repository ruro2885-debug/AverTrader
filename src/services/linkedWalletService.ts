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
    const walletRef = doc(db, 'linked_wallets', walletId);
    await deleteDoc(walletRef);
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
