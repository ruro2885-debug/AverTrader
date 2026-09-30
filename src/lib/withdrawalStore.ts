export const WITHDRAWALS_STORAGE_KEY = 'aver_admin_withdrawals_local';

export function getLocalWithdrawals(): any[] {
  const map = new Map<string, any>();
  try {
    const raw = localStorage.getItem(WITHDRAWALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(w => { 
          if (w && w.id) {
            map.set(w.id, {
              ...w,
              status: (w.status || 'pending').toLowerCase()
            }); 
          }
        });
      }
    }
  } catch (e) {
    console.warn("Failed to parse local withdrawals:", e);
  }

  // Scan all localStorage keys for any user withdrawal items or transactions
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith('aver_txs_') ||
        key.startsWith('aver_user_transactions_') || 
        key.startsWith('aver_transactions') || 
        key === 'aver_active_user' || 
        key.startsWith('user_profile_')
      ) {
        try {
          const itemRaw = localStorage.getItem(key);
          if (!itemRaw) continue;
          const parsed = JSON.parse(itemRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach(t => {
              if (t && (t.type === 'withdrawal' || t.category === 'withdrawal' || t.refId?.startsWith('WTH-') || t.id?.startsWith('wth-'))) {
                if (t.id && !map.has(t.id)) {
                  map.set(t.id, {
                    ...t,
                    status: (t.status || 'pending').toLowerCase()
                  });
                }
              }
            });
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.withdrawals)) {
              parsed.withdrawals.forEach((w: any) => {
                if (w && w.id && !map.has(w.id)) {
                  map.set(w.id, {
                    ...w,
                    email: parsed.email || w.email || 'User',
                    userName: parsed.displayName || parsed.username || w.userName || 'User',
                    userId: parsed.uid || w.userId,
                    status: (w.status || 'pending').toLowerCase()
                  });
                }
              });
            }
          }
        } catch (err) {}
      }
    }
  } catch (err) {}

  return Array.from(map.values());
}

export function saveLocalWithdrawal(withdrawal: any) {
  try {
    const current = getLocalWithdrawals();
    const rawStatus = (withdrawal.status || 'pending').toLowerCase();
    const cleanWithdrawal = {
      ...withdrawal,
      status: rawStatus,
      createdAt: typeof withdrawal.createdAt === 'string' ? withdrawal.createdAt : new Date().toISOString(),
      updatedAt: typeof withdrawal.updatedAt === 'string' ? withdrawal.updatedAt : new Date().toISOString()
    };
    const map = new Map<string, any>();
    current.forEach(w => map.set(w.id, w));
    map.set(cleanWithdrawal.id, cleanWithdrawal);
    localStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(Array.from(map.values())));

    // Determine normalized transaction status for history display
    const txStatus = (rawStatus === 'completed' || rawStatus === 'approved' || rawStatus === 'successful') ? 'Completed' :
                     (rawStatus === 'failed' || rawStatus === 'rejected') ? 'Failed' :
                     (rawStatus === 'reversed') ? 'Reversed' : 'Pending';

    // Synchronize status across all aver_txs_* transaction keys in localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('aver_txs_') || key.startsWith('aver_transactions') || key.startsWith('aver_user_transactions_'))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              let updated = false;
              const newList = parsed.map((item: any) => {
                if (item && (item.id === cleanWithdrawal.id || item.refId === cleanWithdrawal.id || (cleanWithdrawal.refId && item.refId === cleanWithdrawal.refId))) {
                  updated = true;
                  return {
                    ...item,
                    status: txStatus,
                    ...(cleanWithdrawal.reversalReason ? { reversalReason: cleanWithdrawal.reversalReason } : {}),
                    updatedAt: new Date().toISOString()
                  };
                }
                return item;
              });
              if (updated) {
                localStorage.setItem(key, JSON.stringify(newList));
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed syncing local transaction keys:", e);
    }

    window.dispatchEvent(new CustomEvent('withdrawal_updated', { detail: cleanWithdrawal.id }));
    window.dispatchEvent(new CustomEvent('aver_transaction_created', { detail: cleanWithdrawal.id }));
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
  
  localWithdrawals.forEach(w => {
    if (w && w.id) {
      map.set(w.id, {
        ...w,
        status: (w.status || 'pending').toLowerCase()
      });
    }
  });

  firestoreWithdrawals.forEach(w => {
    if (!w || !w.id) return;
    const normalized = {
      ...w,
      status: (w.status || 'pending').toLowerCase()
    };
    const existing = map.get(w.id);
    if (existing) {
      const fsTime = getMs(w.updatedAt) || getMs(w.timestamp) || getMs(w.createdAt);
      const locTime = getMs(existing.updatedAt) || getMs(existing.timestamp) || getMs(existing.createdAt);
      map.set(w.id, {
        ...existing,
        ...normalized,
        status: normalized.status || existing.status || 'pending'
      });
    } else {
      map.set(w.id, {
        ...normalized,
        createdAt: typeof w.createdAt === 'string' ? w.createdAt : (w.timestamp || new Date().toISOString()),
        updatedAt: typeof w.updatedAt === 'string' ? w.updatedAt : (w.timestamp || new Date().toISOString())
      });
    }
  });
  
  return Array.from(map.values()).sort((a, b) => {
    const timeA = getMs(a.timestamp) || getMs(a.createdAt) || getMs(a.updatedAt);
    const timeB = getMs(b.timestamp) || getMs(b.createdAt) || getMs(b.updatedAt);
    return timeB - timeA;
  });
}
