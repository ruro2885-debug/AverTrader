export const DEPOSITS_STORAGE_KEY = 'aver_admin_deposits_local';

export function getLocalDeposits(): any[] {
  try {
    const raw = localStorage.getItem(DEPOSITS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to parse local deposits:", e);
  }
  return [];
}

export function saveLocalDeposit(deposit: any) {
  try {
    const current = getLocalDeposits();
    const map = new Map<string, any>();
    current.forEach(d => map.set(d.id, d));
    map.set(deposit.id, deposit);
    localStorage.setItem(DEPOSITS_STORAGE_KEY, JSON.stringify(Array.from(map.values())));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.warn("Local storage update notice:", e);
  }
}

export function mergeDepositsWithLocal(firestoreDeposits: any[]): any[] {
  const localDeposits = getLocalDeposits();
  const map = new Map<string, any>();
  
  localDeposits.forEach(d => map.set(d.id, d));
  firestoreDeposits.forEach(d => {
    const existing = map.get(d.id);
    if (existing) {
      const fsTime = new Date(d.updatedAt || d.timestamp || 0).getTime();
      const locTime = new Date(existing.updatedAt || existing.timestamp || 0).getTime();
      map.set(d.id, fsTime > locTime ? d : existing);
    } else {
      map.set(d.id, d);
    }
  });
  
  return Array.from(map.values()).sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
}
