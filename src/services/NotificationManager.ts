import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, onSnapshot, getDoc, runTransaction, Timestamp, arrayRemove } from 'firebase/firestore';
import { NotificationItem, NotificationCategory, NotificationPriority } from '../types/notifications';
import { safeStorage } from '../utils/storage';

export class NotificationManager {
  private userId: string | null;
  private unsubscribe: (() => void) | null = null;

  constructor(userId: string | null) {
    this.userId = userId;
  }

  public subscribe(onUpdate: (notifications: NotificationItem[]) => void) {
    if (!this.userId) {
      // Local storage fallback for anonymous
      const activeLocalUserStr = safeStorage.getItem('aver_active_user');
      if (activeLocalUserStr) {
        const activeLocalUser = JSON.parse(activeLocalUserStr);
        onUpdate(activeLocalUser.notificationsList || []);
      }
      return;
    }

    const userDocRef = doc(db, 'users', this.userId);
    this.unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const notifs = data.notificationsList || [];
        notifs.sort((a: NotificationItem, b: NotificationItem) => b.createdAtTimestamp - a.createdAtTimestamp);
        onUpdate(notifs);
      }
    }, (error) => {
      console.error("[NotificationManager] Snapshot error:", error);
    });
  }

  public unsubscribeAll() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  public async addNotification(
    category: NotificationCategory,
    priority: NotificationPriority,
    title: string,
    body: string,
    actionUrl?: string,
    action?: string,
    metadata?: Record<string, any>
  ) {
    const newNotif: NotificationItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      category,
      priority,
      title,
      body,
      read: false,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      createdAtTimestamp: Date.now(),
      actionUrl: actionUrl || '',
      action: action || null,
      metadata: metadata || {},
      pinned: false,
      archived: false,
    };

    if (!this.userId) {
      // Local storage fallback
      const activeLocalUserStr = safeStorage.getItem('aver_active_user');
      if (activeLocalUserStr) {
        const user = JSON.parse(activeLocalUserStr);
        const notifs = user.notificationsList || [];
        const isDuplicate = notifs.some((n: NotificationItem) => n.category === category && n.title === title && n.body === body);
        if (isDuplicate) {
          console.log("[NotificationManager] Duplicate local notification blocked:", title);
          return;
        }
        user.notificationsList = [newNotif, ...(user.notificationsList || [])];
        safeStorage.setItem('aver_active_user', JSON.stringify(user));
      }
      return;
    }

    const userDocRef = doc(db, 'users', this.userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const notifs = data.notificationsList || [];
      const isDuplicate = notifs.some((n: NotificationItem) => n.category === category && n.title === title && n.body === body);
      if (isDuplicate) {
        console.log("[NotificationManager] Duplicate firestore notification blocked:", title);
        return;
      }
    }

    await updateDoc(userDocRef, {
      notificationsList: arrayUnion(newNotif)
    });
  }

  public async markAsRead(id: string, readState?: boolean) {
    if (!this.userId) {
      // Local storage fallback
      const activeLocalUserStr = safeStorage.getItem('aver_active_user');
      if (activeLocalUserStr) {
        const user = JSON.parse(activeLocalUserStr);
        const notifs = user.notificationsList || [];
        user.notificationsList = notifs.map((n: NotificationItem) => n.id === id ? { ...n, read: readState !== undefined ? readState : !n.read } : n);
        safeStorage.setItem('aver_active_user', JSON.stringify(user));
      }
      return;
    }

    await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, 'users', this.userId!);
      const docSnap = await transaction.get(userDocRef);
      if (!docSnap.exists()) throw new Error("User document not found");

      const notifs = docSnap.data().notificationsList || [];
      const updatedNotifs = notifs.map((n: NotificationItem) => n.id === id ? { ...n, read: readState !== undefined ? readState : !n.read } : n);
      transaction.update(userDocRef, { notificationsList: updatedNotifs });
    });
  }
}
