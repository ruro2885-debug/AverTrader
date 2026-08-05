export const WITHDRAWALS_STORAGE_KEY = 'aver_admin_withdrawals_local';

export function getLocalWithdrawals(): any[] {
  try {
    const raw = localStorage.getItem(WITHDRAWALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse local withdrawals:", e);
  }
  return [];
}

export function saveLocalWithdrawal(withdrawal: any) {
  try {
    const current = getLocalWithdrawals();
    const cleanWithdrawal = {
      ...withdrawal,
      createdAt: typeof withdrawal.createdAt === 'string' ? withdrawal.createdAt : new Date().toISOString(),
      updatedAt: withdrawal.updatedAt || new Date().toISOString()
    };
    const map = new Map<string, any>();
    current.forEach(w => map.set(w.id, w));
    map.set(cleanWithdrawal.id, cleanWithdrawal);
    localStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(Array.from(map.values())));
    window.dispatchEvent(new CustomEvent('withdrawal_updated', { detail: cleanWithdrawal.id }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.warn("Local storage update notice:", e);
  }
}

function getMs(val: any): number {
  if (!val) return 0;
  if (typeof val === 'string') return new Date(val).getTime();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (typeof val.seconds === 'number') return val.seconds * 1000;
  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export function mergeWithdrawalsWithLocal(firestoreWithdrawals: any[]): any[] {
  const localWithdrawals = getLocalWithdrawals();
  const map = new Map<string, any>();
  
  localWithdrawals.forEach(w => map.set(w.id, w));
  firestoreWithdrawals.forEach(w => {
    const existing = map.get(w.id);
    if (existing) {
      const fsTime = getMs(w.updatedAt) || getMs(w.timestamp);
      const locTime = getMs(existing.updatedAt) || getMs(existing.timestamp);
      map.set(w.id, fsTime > locTime ? w : existing);
    } else {
      map.set(w.id, {
        ...w,
        createdAt: typeof w.createdAt === 'string' ? w.createdAt : new Date().toISOString(),
        updatedAt: w.updatedAt || new Date().toISOString()
      });
    }
  });
  
  return Array.from(map.values()).sort((a, b) => {
    const timeA = getMs(a.timestamp) || getMs(a.createdAt);
    const timeB = getMs(b.timestamp) || getMs(b.createdAt);
    return timeB - timeA;
  });
}
