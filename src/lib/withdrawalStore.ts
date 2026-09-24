export const WITHDRAWALS_STORAGE_KEY = 'aver_admin_withdrawals_local';

export function getStatusPriority(status?: string): number {
  const s = (status || '').toLowerCase();
  if (s === 'reversed') return 4;
  if (s === 'completed' || s === 'approved' || s === 'successful' || s === 'success') return 3;
  if (s === 'failed' || s === 'rejected' || s === 'declined' || s === 'cancelled') return 2;
  if (s === 'processing' || s === 'verifying') return 1;
  return 0; // 'pending' or unknown
}

export function resolveStatus(currentStatus?: string, incomingStatus?: string): string {
  const curPri = getStatusPriority(currentStatus);
  const incPri = getStatusPriority(incomingStatus);
  if (incPri >= curPri) {
    return (incomingStatus || 'pending').toLowerCase();
  }
  return (currentStatus || 'pending').toLowerCase();
}

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
        key.startsWith('user_profile_')
      ) {
        try {
          const itemRaw = localStorage.getItem(key);
          if (!itemRaw) continue;
          const parsed = JSON.parse(itemRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach(t => {
              if (t && (t.type === 'withdrawal' || t.category === 'withdrawal' || t.refId?.startsWith('WTH-') || t.id?.startsWith('wth-'))) {
                const id = t.id || t.refId || t.txHash;
                if (id) {
                  const existing = map.get(id);
                  if (existing) {
                    existing.status = resolveStatus(existing.status, t.status);
                  } else {
                    map.set(id, {
                      ...t,
                      status: (t.status || 'pending').toLowerCase()
                    });
                  }
                }
              }
            });
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.withdrawals)) {
              parsed.withdrawals.forEach((w: any) => {
                const id = w.id || w.refId || w.txHash;
                if (id) {
                  const existing = map.get(id);
                  if (existing) {
                    existing.status = resolveStatus(existing.status, w.status);
                  } else {
                    map.set(id, {
                      ...w,
                      email: parsed.email || w.email || 'User',
                      userName: parsed.displayName || parsed.username || w.userName || 'User',
                      userId: parsed.uid || w.userId,
                      status: (w.status || 'pending').toLowerCase()
                    });
                  }
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
    current.forEach(w => {
      if (w && w.id) map.set(w.id, w);
    });

    // Check for existing by id, refId, or txHash
    let matchedExistingId: string | null = null;
    for (const [key, existing] of map.entries()) {
      if (
        key === cleanWithdrawal.id ||
        (cleanWithdrawal.refId && (key === cleanWithdrawal.refId || existing.refId === cleanWithdrawal.refId)) ||
        (cleanWithdrawal.txHash && (key === cleanWithdrawal.txHash || existing.txHash === cleanWithdrawal.txHash))
      ) {
        matchedExistingId = key;
        break;
      }
    }

    if (matchedExistingId) {
      const existing = map.get(matchedExistingId);
      map.set(matchedExistingId, {
        ...existing,
        ...cleanWithdrawal,
        id: matchedExistingId,
        status: resolveStatus(existing?.status, rawStatus)
      });
    } else {
      map.set(cleanWithdrawal.id, cleanWithdrawal);
    }

    localStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(Array.from(map.values())));

    // Determine normalized transaction status for history display
    const txStatus = (rawStatus === 'completed' || rawStatus === 'approved' || rawStatus === 'successful') ? 'Completed' :
                     (rawStatus === 'failed' || rawStatus === 'rejected') ? 'Failed' :
                     (rawStatus === 'reversed') ? 'Reversed' : 'Pending';

    // Synchronize status across all aver_txs_* and user profile keys in localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // 1. Transaction collections
        if (key.startsWith('aver_txs_') || key.startsWith('aver_transactions') || key.startsWith('aver_user_transactions_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              let updated = false;
              const newList = parsed.map((item: any) => {
                if (
                  item &&
                  (item.id === cleanWithdrawal.id ||
                   item.refId === cleanWithdrawal.id ||
                   (cleanWithdrawal.refId && (item.refId === cleanWithdrawal.refId || item.id === cleanWithdrawal.refId)) ||
                   (cleanWithdrawal.txHash && (item.txHash === cleanWithdrawal.txHash || item.id === cleanWithdrawal.txHash)))
                ) {
                  updated = true;
                  const newPri = getStatusPriority(txStatus);
                  const curPri = getStatusPriority(item.status);
                  return {
                    ...item,
                    status: newPri >= curPri ? txStatus : item.status,
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

        // 2. User profile records (aver_active_user & user_profile_*)
        if (key === 'aver_active_user' || key.startsWith('user_profile_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const u = JSON.parse(raw);
              if (u && Array.isArray(u.withdrawals)) {
                let userUpdated = false;
                const newWithdrawals = u.withdrawals.map((w: any) => {
                  const isMatch = w && (
                    w.id === cleanWithdrawal.id ||
                    w.refId === cleanWithdrawal.id ||
                    w.txHash === cleanWithdrawal.id ||
                    (cleanWithdrawal.refId && (w.refId === cleanWithdrawal.refId || w.id === cleanWithdrawal.refId)) ||
                    (cleanWithdrawal.txHash && (w.txHash === cleanWithdrawal.txHash || w.id === cleanWithdrawal.txHash))
                  );
                  if (isMatch) {
                    userUpdated = true;
                    const newPri = getStatusPriority(txStatus);
                    const curPri = getStatusPriority(w.status);
                    return {
                      ...w,
                      status: newPri >= curPri ? txStatus : w.status,
                      ...(cleanWithdrawal.reversalReason ? { reversalReason: cleanWithdrawal.reversalReason } : {}),
                      updatedAt: new Date().toISOString()
                    };
                  }
                  return w;
                });

                if (userUpdated) {
                  const updatedU = {
                    ...u,
                    withdrawals: newWithdrawals,
                    lastUpdated: new Date().toISOString()
                  };
                  localStorage.setItem(key, JSON.stringify(updatedU));
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.warn("Failed syncing local transaction & profile keys:", e);
    }

    window.dispatchEvent(new CustomEvent('withdrawal_updated', { detail: cleanWithdrawal.id }));
    window.dispatchEvent(new CustomEvent('aver_transaction_created', { detail: cleanWithdrawal.id }));
    window.dispatchEvent(new Event('aver_user_updated'));
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

    // Find existing match by id, refId, or txHash
    let matchedId: string | null = null;
    if (map.has(w.id)) {
      matchedId = w.id;
    } else {
      for (const [key, existing] of map.entries()) {
        if (
          (w.refId && (key === w.refId || existing.refId === w.refId)) ||
          (w.txHash && (key === w.txHash || existing.txHash === w.txHash))
        ) {
          matchedId = key;
          break;
        }
      }
    }

    if (matchedId) {
      const existing = map.get(matchedId);
      const resolved = resolveStatus(existing?.status, normalized.status);
      map.set(matchedId, {
        ...existing,
        ...normalized,
        id: matchedId,
        status: resolved,
        reversalReason: normalized.reversalReason || existing.reversalReason
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
