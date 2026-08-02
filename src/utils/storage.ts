/**
 * Safe wrapper for localStorage to handle QuotaExceededError and other storage issues.
 */

const memoryFallbackStore = new Map<string, string>();

export const safeStorage = {
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error: any) {
      if (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        error.code === 22 ||
        error.number === -2147024882
      ) {
        console.warn(`[Storage] Quota exceeded for key: ${key}. Performing storage cleanup...`);
        
        // 1. Clear ALL old sim_traders versions & non-essential cached keys
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k !== key) {
              if (
                k.startsWith('aver_sim_traders_v') ||
                k.startsWith('aver_copytraders') ||
                k.startsWith('aver_copytrade_events') ||
                k.startsWith('aver_activity_') ||
                k.startsWith('aver_recommendations_') ||
                k.startsWith('aver_trades_') ||
                k.startsWith('user_profile_') ||
                k === 'portfolio_vault_balance' ||
                k === 'portfolio_active_offset'
              ) {
                localStorage.removeItem(k);
              }
            }
          }
        } catch (cleanErr) {
          console.warn("[Storage] Cleanup notice:", cleanErr);
        }

        // 2. Retry setting in localStorage
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          // 3. Fallback to sessionStorage
          try {
            sessionStorage.setItem(key, value);
            return true;
          } catch (sessionErr) {
            // 4. Fallback to memory store so state is preserved during current session
            memoryFallbackStore.set(key, value);
            return true;
          }
        }
      }
      // Non-quota error fallback
      memoryFallbackStore.set(key, value);
      return false;
    }
  },

  getItem: (key: string): string | null => {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
      const sessionVal = sessionStorage.getItem(key);
      if (sessionVal !== null) return sessionVal;
      return memoryFallbackStore.get(key) || null;
    } catch (error) {
      return memoryFallbackStore.get(key) || null;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
    try {
      sessionStorage.removeItem(key);
    } catch (e) {}
    memoryFallbackStore.delete(key);
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (e) {}
    try {
      sessionStorage.clear();
    } catch (e) {}
    memoryFallbackStore.clear();
  }
};
