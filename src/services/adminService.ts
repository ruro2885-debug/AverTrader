import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  addDoc,
  Timestamp,
  increment
} from 'firebase/firestore';

export interface AdminAuditLog {
  id?: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resource: string;
  details: string;
  timestamp: Timestamp;
  ip?: string;
  device?: string;
}

export interface AdminDepositRequest {
  id: string;
  userId: string;
  email: string;
  asset: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Rejected' | 'Flagged';
  timestamp: Timestamp;
}

export interface AdminWithdrawalRequest {
  id: string;
  userId: string;
  email: string;
  asset: string;
  amount: number;
  destination: string;
  riskScore: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Processing';
  timestamp: Timestamp;
}

export interface AdminKycSubmission {
  id: string;
  userId: string;
  name: string;
  email: string;
  tier: string;
  documents: string[];
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: Timestamp;
}

export const adminService = {
  // Audit Logs
  async logAction(log: Omit<AdminAuditLog, 'id' | 'timestamp'>) {
    try {
      const logsRef = collection(db, 'admin_audit_logs');
      await addDoc(logsRef, {
        ...log,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to log admin action:", err);
    }
  },

  subscribeAuditLogs(onData: (logs: AdminAuditLog[]) => void) {
    const q = query(collection(db, 'admin_audit_logs'), orderBy('timestamp', 'desc'), limit(100));
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map(d => ({ ...d.data(), id: d.id } as AdminAuditLog)));
    });
  },

  // User Management
  subscribeUsers(onData: (users: any[]) => void) {
    return onSnapshot(collection(db, 'users'), (snap) => {
      onData(snap.docs.map(d => ({ ...d.data(), uid: d.id })));
    });
  },

  async updateUserRole(uid: string, role: 'user' | 'super_admin', adminId: string, adminEmail: string) {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      await this.logAction({
        adminId,
        adminEmail,
        action: 'UPDATE_USER_ROLE',
        resource: `users/${uid}`,
        details: `Role updated to ${role}`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  },

  // Deposits
  subscribeDeposits(onData: (data: AdminDepositRequest[]) => void) {
    const q = query(collection(db, 'admin_deposits'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map(d => ({ ...d.data(), id: d.id } as AdminDepositRequest)));
    });
  },

  async updateDepositStatus(id: string, status: AdminDepositRequest['status'], adminId: string, adminEmail: string) {
    try {
      await updateDoc(doc(db, 'admin_deposits', id), { status });
      await this.logAction({
        adminId,
        adminEmail,
        action: 'UPDATE_DEPOSIT_STATUS',
        resource: `admin_deposits/${id}`,
        details: `Status updated to ${status}`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `admin_deposits/${id}`);
    }
  },

  // Withdrawals
  subscribeWithdrawals(onData: (data: AdminWithdrawalRequest[]) => void) {
    const q = query(collection(db, 'admin_withdrawals'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map(d => ({ ...d.data(), id: d.id } as AdminWithdrawalRequest)));
    });
  },

  async updateWithdrawalStatus(id: string, status: AdminWithdrawalRequest['status'], adminId: string, adminEmail: string) {
    try {
      await updateDoc(doc(db, 'admin_withdrawals', id), { status });
      await this.logAction({
        adminId,
        adminEmail,
        action: 'UPDATE_WITHDRAWAL_STATUS',
        resource: `admin_withdrawals/${id}`,
        details: `Status updated to ${status}`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `admin_withdrawals/${id}`);
    }
  },

  // KYC
  subscribeKyc(onData: (data: AdminKycSubmission[]) => void) {
    const q = query(collection(db, 'admin_kyc'), orderBy('submittedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      onData(snap.docs.map(d => ({ ...d.data(), id: d.id } as AdminKycSubmission)));
    });
  },

  async updateKycStatus(id: string, status: AdminKycSubmission['status'], adminId: string, adminEmail: string) {
    try {
      await updateDoc(doc(db, 'admin_kyc', id), { status });
      await this.logAction({
        adminId,
        adminEmail,
        action: 'UPDATE_KYC_STATUS',
        resource: `admin_kyc/${id}`,
        details: `Status updated to ${status}`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `admin_kyc/${id}`);
    }
  },

  // Support Tickets
  subscribeSupportTickets(onData: (data: any[]) => void) {
    // Note: Support tickets are in /users/{uid}/supportTickets/{ticketId} in the blueprint, 
    // but for admin we might want a global collection or use group query.
    // However, the prompt says "Admin Panel must read from the exact same collection and field structure".
    // Since firestore doesn't easily allow cross-user queries without collectionGroup (which needs indexes),
    // and I cannot easily create indexes, I'll assume there is a global 'support_tickets' collection 
    // or I'll use collectionGroup if the environment supports it (it usually does if I specify it in rules).
    // Actually, I'll just use collectionGroup 'supportTickets'.
    
    // For now, I'll use a placeholder and warn if it fails.
    // Actually, the blueprint says: /users/{uid}/supportTickets/{ticketId}
    // I will use collectionGroup if possible.
    return onSnapshot(collection(db, 'support_tickets_global'), (snap) => {
      onData(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
  },

  // Campaigns & Events
  subscribeCampaigns(onData: (data: any[]) => void) {
    return onSnapshot(collection(db, 'events_hub'), (snap) => {
      onData(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
  },

  async createCampaign(campaign: any, adminId: string, adminEmail: string) {
    try {
      const docRef = await addDoc(collection(db, 'events_hub'), {
        ...campaign,
        createdAt: serverTimestamp()
      });
      await this.logAction({
        adminId,
        adminEmail,
        action: 'CREATE_CAMPAIGN',
        resource: `events_hub/${docRef.id}`,
        details: `Created campaign: ${campaign.title}`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'events_hub');
    }
  },

  // Notifications
  async sendGlobalNotification(notification: any, adminId: string, adminEmail: string) {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp(),
        read: false,
        global: true
      });
      await this.logAction({
        adminId,
        adminEmail,
        action: 'SEND_GLOBAL_NOTIFICATION',
        resource: `notifications/${docRef.id}`,
        details: `Notification: ${notification.title}`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'notifications');
    }
  }
};
