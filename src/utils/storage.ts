/**
 * Safe wrapper for localStorage to handle QuotaExceededError and other storage issues.
 */

export const safeStorage = {
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error: any) {
      if (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        error.code === 22
      ) {
        console.warn(`[Storage] Quota exceeded for key: ${key}. Attempting to clear non-essential data...`);
        
        // Attempt to clear some non-essential data
        const nonEssentialKeys = [
          'aver_copytraders',
          'aver_sim_traders_v4',
          'aver_copytrade_events',
          'aver_active_user',
          'portfolio_vault_balance',
          'portfolio_active_offset'
        ];
        
        nonEssentialKeys.forEach(k => {
          if (k !== key) localStorage.removeItem(k);
        });

        // Try one more time
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error(`[Storage] Persistent quota error for key: ${key}`, retryError);
          return false;
        }
      }
      console.error(`[Storage] Error setting key: ${key}`, error);
      return false;
    }
  },

  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`[Storage] Error getting key: ${key}`, error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Error removing key: ${key}`, error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[Storage] Error clearing storage', error);
    }
  }
};
