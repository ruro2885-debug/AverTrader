import { db, safeSetDoc } from './firebase';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';

export interface SupportMessage {
  isAdmin?: boolean;
  senderRole?: 'user' | 'admin';
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'document' | 'file' | 'pdf';
  isVoice?: boolean;
  reactions?: Record<string, number>;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  title: string;
  category: string;
  description: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
  transactionId?: string;
  tradingSessionId?: string;
  attachmentUrl?: string;
  adminNotes?: string;
}

const STORAGE_KEY = 'aver_support_tickets_v2';

/**
 * Merges Firestore ticket data with local localStorage backup.
 * Deduplicates by ticket ID, preferring the newer or combined message history.
 */
export function mergeTicketsWithLocal(firestoreTickets: SupportTicket[]): SupportTicket[] {
  let localTickets: SupportTicket[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      localTickets = Array.isArray(parsed) ? parsed.filter(t => t.id !== 'TCK-892104' && t.id !== 'TCK-401982') : [];
    }
  } catch (e) {
    console.warn("Failed to parse local support tickets:", e);
  }

  const map = new Map<string, SupportTicket>();

  // 1. Seed with local tickets
  if (Array.isArray(localTickets)) {
    localTickets.forEach(t => {
      if (t && t.id) map.set(t.id, t);
    });
  }

  // 2. Overwrite / merge with Firestore tickets
  if (Array.isArray(firestoreTickets)) {
    firestoreTickets.forEach(t => {
      if (t && t.id) {
        const existing = map.get(t.id);
        const tTime = new Date(t.updatedAt || t.createdAt || 0).getTime();
        const eTime = existing ? new Date(existing.updatedAt || existing.createdAt || 0).getTime() : -1;

        if (!existing || tTime >= eTime) {
          map.set(t.id, t);
        } else if (existing) {
          // Merge messages if local has optimistic messages
          const combinedMsgsMap = new Map<string, SupportMessage>();
          (t.messages || []).forEach(m => combinedMsgsMap.set(m.id, m));
          (existing.messages || []).forEach(m => combinedMsgsMap.set(m.id, m));
          const mergedMsgs = Array.from(combinedMsgsMap.values()).sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          map.set(t.id, {
            ...existing,
            ...t,
            messages: mergedMsgs,
            updatedAt: new Date(Math.max(tTime, eTime)).toISOString()
          });
        }
      }
    });
  }

  const merged = Array.from(map.values());
  merged.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

  // Save back to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    // ignore
  }

  return merged;
}

/**
 * Saves a ticket document to both Firestore AND local storage.
 * Broadcasts real-time events to all tabs and listeners instantly.
 */
export async function saveSupportTicket(ticket: SupportTicket): Promise<void> {
  const now = new Date().toISOString();
  const ticketToSave: SupportTicket = {
    ...ticket,
    updatedAt: ticket.updatedAt || now,
    messages: ticket.messages || []
  };

  // 1. Local Storage Instant Update
  try {
    const current = mergeTicketsWithLocal([]);
    const map = new Map<string, SupportTicket>();
    current.forEach(t => map.set(t.id, t));
    map.set(ticketToSave.id, ticketToSave);
    const updated = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Local storage update notice:", e);
  }

  // 2. Dispatch real-time events for instant UI synchronization
  window.dispatchEvent(new CustomEvent('support_ticket_updated', { detail: ticketToSave.id }));
  window.dispatchEvent(new Event('storage'));

  // 3. Persist to Firestore DB (fire and forget)
  safeSetDoc(doc(db, 'support_tickets', ticketToSave.id), ticketToSave, { merge: true }).catch(err => {
    console.error("Firestore setDoc support ticket error:", err);
  });
}
