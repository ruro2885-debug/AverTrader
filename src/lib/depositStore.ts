export const DEPOSITS_STORAGE_KEY = 'aver_admin_deposits_local';

export function getLocalDeposits(): any[] {
  try {
    const raw = localStorage.getItem(DEPOSITS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse local deposits:", e);
  }

  // Default active pending deposit so admin Deposit Inflow & Audit is populated
  const defaultDeposits = [
    {
      id: 'DEP-USDT-ERC20',
      displayId: 'DEP-USDT-ERC20',
      userId: 'user_institutional_01',
      email: 'ruro2885@gmail.com',
      userName: 'Ruro Trader',
      fundingMethod: 'crypto',
      currency: 'USDT',
      amount: 4754,
      network: 'Ethereum (ERC-20)',
      walletAddress: '0x8372...DF36',
      cryptoSymbol: 'ETH',
      cryptoNetwork: 'ERC-20',
      txHash: '0x837291a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
      status: 'pending',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  try {
    localStorage.setItem(DEPOSITS_STORAGE_KEY, JSON.stringify(defaultDeposits));
  } catch (e) {}

  return defaultDeposits;
}

export function saveLocalDeposit(deposit: any) {
  try {
    const current = getLocalDeposits();
    const cleanDeposit = {
      ...deposit,
      createdAt: typeof deposit.createdAt === 'string' ? deposit.createdAt : new Date().toISOString(),
      updatedAt: deposit.updatedAt || new Date().toISOString()
    };
    const map = new Map<string, any>();
    current.forEach(d => map.set(d.id, d));
    map.set(cleanDeposit.id, cleanDeposit);
    localStorage.setItem(DEPOSITS_STORAGE_KEY, JSON.stringify(Array.from(map.values())));
    window.dispatchEvent(new CustomEvent('deposit_updated', { detail: cleanDeposit.id }));
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
      map.set(d.id, {
        ...d,
        createdAt: typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
        updatedAt: d.updatedAt || new Date().toISOString()
      });
    }
  });
  
  return Array.from(map.values()).sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
}
