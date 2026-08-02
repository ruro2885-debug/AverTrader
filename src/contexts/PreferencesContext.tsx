import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Theme, Currency, Preferences } from '../types';
import { translations } from '../i18n/translations';
import { useAuth } from './AuthContext';
import { safeStorage } from '../utils/storage';

interface PreferencesContextType {
  preferences: Preferences;
  updatePreference: (key: keyof Preferences, value: any) => void;
  resetPreferences: () => void;
  t: (key: string) => string;
  formatCurrency: (usdValue: number, compact?: boolean) => string;
}

const defaultPreferences: Preferences = {
  language: 'EN',
  theme: 'dark',
  currency: 'USD',
  rememberMeEnabled: false,
  biometricsEnabled: false,
};

// Mock exchange rates relative to USD
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  BTC: 0.000014,
  USDT: 1,
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BTC: '₿',
  USDT: '₮',
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, updateUserPreferences } = useAuth();

  // Synchronize preferences with currently logged in user or global fallback
  useEffect(() => {
    const isAdminSession = safeStorage.getItem('admin_session_active') === 'true' || user?.role === 'admin' || user?.role === 'super_admin';

    if (isAdminSession) {
      setPreferences({
        language: 'EN',
        theme: 'dark',
        currency: 'USD',
        rememberMeEnabled: false,
        biometricsEnabled: false,
      });

      // Clear translation cookies for sovereign Admin view
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
      
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select && select.value !== 'en') {
        select.value = 'en';
        select.dispatchEvent(new Event('change'));
      }
      setIsLoaded(true);
      return;
    }

    if (user) {
      const validLanguages: Language[] = ['EN', 'ES', 'ZH', 'DE', 'FR'];
      const validThemes: Theme[] = ['light', 'dark'];
      const validCurrencies: Currency[] = ['USD', 'EUR', 'GBP', 'BTC', 'USDT'];

      const userLang = user.preferredLanguage as Language;
      const userTheme = user.theme as Theme;
      const userCurrency = user.currency as Currency;

      setPreferences({
        language: validLanguages.includes(userLang) ? userLang : 'EN',
        theme: validThemes.includes(userTheme) ? userTheme : 'dark',
        currency: validCurrencies.includes(userCurrency) ? userCurrency : 'USD',
        biometricsEnabled: user.biometricEnabled,
        rememberMeEnabled: user.rememberMeEnabled,
        notifications: user.notificationSettings,
      });
    } else {
      const savedLanguage = safeStorage.getItem('aver_language') as Language;
      const savedTheme = safeStorage.getItem('aver_theme') as Theme;
      const savedCurrency = safeStorage.getItem('aver_currency') as Currency;
      
      const validLanguages: Language[] = ['EN', 'ES', 'ZH', 'DE', 'FR'];
      const validThemes: Theme[] = ['light', 'dark'];
      const validCurrencies: Currency[] = ['USD', 'EUR', 'GBP', 'BTC', 'USDT'];

      setPreferences(prev => ({
        language: validLanguages.includes(savedLanguage) ? savedLanguage : prev.language,
        theme: validThemes.includes(savedTheme) ? savedTheme : prev.theme,
        currency: validCurrencies.includes(savedCurrency) ? savedCurrency : prev.currency,
      }));
    }
    setIsLoaded(true);
  }, [user?.uid, user?.role]);

  // Keep a local storage listener to synchronize across tabs for global settings
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (user) return; // Ignore global storage events if a user is explicitly logged in
      
      if (e.key === 'aver_language') {
        setPreferences(prev => ({ ...prev, language: e.newValue as Language || prev.language }));
      }
      if (e.key === 'aver_theme') {
        setPreferences(prev => ({ ...prev, theme: e.newValue as Theme || prev.theme }));
      }
      if (e.key === 'aver_currency') {
        setPreferences(prev => ({ ...prev, currency: e.newValue as Currency || prev.currency }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user?.uid]);

  const updatePreference = React.useCallback((key: keyof Preferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    safeStorage.setItem(`aver_${key}`, typeof value === 'object' ? JSON.stringify(value) : value);
    
    // Save to user profile persistently if logged in
    if (user && updateUserPreferences) {
      updateUserPreferences({ [key]: value });
    }

    // Google Translate Integration for Instant Full-App Translation
    if (key === 'language') {
      let gtCode = (value as string).toLowerCase();
      if (value === 'ZH') gtCode = 'zh-CN';
      
      const setGoogleCookie = (val: string) => {
        document.cookie = `googtrans=${val}; path=/`;
        document.cookie = `googtrans=${val}; domain=${window.location.hostname}; path=/`;
        if (window.location.hostname !== 'localhost') {
            const domainParts = window.location.hostname.split('.');
            if (domainParts.length > 2) {
                const rootDomain = domainParts.slice(-2).join('.');
                document.cookie = `googtrans=${val}; domain=${rootDomain}; path=/`;
            }
        }
      };

      if (value === 'EN') {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
      } else {
        setGoogleCookie(`/en/${gtCode}`);
      }

      // Automatically trigger translation if widget is loaded
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        select.value = value === 'EN' ? 'en' : gtCode;
        select.dispatchEvent(new Event('change'));
      } else {
        window.location.reload();
      }
    }
  }, [user, updateUserPreferences]);

  const resetPreferences = React.useCallback(() => {
    setPreferences(defaultPreferences);
    
    // Clear individual local storage items
    Object.keys(defaultPreferences).forEach(key => {
      safeStorage.removeItem(`aver_${key}`);
    });

    if (user && updateUserPreferences) {
      updateUserPreferences(defaultPreferences);
    }
  }, [user, updateUserPreferences]);

  const t = React.useCallback((key: string): string => {
    const langDict = translations[preferences.language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    const fallbackDict = translations['EN'];
    return fallbackDict[key] || key;
  }, [preferences.language]);

  const formatCurrency = React.useCallback((usdValue: number, compact: boolean = false): string => {
    const rate = EXCHANGE_RATES[preferences.currency];
    const convertedValue = usdValue * rate;

    // Use Intl.NumberFormat for proper localization based on the selected language
    let locale = 'en-US';
    switch (preferences.language) {
      case 'ES': locale = 'es-ES'; break;
      case 'FR': locale = 'fr-FR'; break;
      case 'DE': locale = 'de-DE'; break;
      case 'ZH': locale = 'zh-CN'; break;
      case 'PT': locale = 'pt-PT'; break;
    }

    // Custom handling for BTC to ensure 8 decimal places and symbol at front
    if (preferences.currency === 'BTC') {
       const formatter = new Intl.NumberFormat(locale, {
           minimumFractionDigits: 8,
           maximumFractionDigits: 8,
           notation: compact ? 'compact' : 'standard',
       });
       return `${CURRENCY_SYMBOLS[preferences.currency]}${formatter.format(convertedValue)}`;
    }

    // Standard currencies (USD, EUR, GBP)
    // We explicitly set currencyDisplay: 'symbol' to ensure we get $, €, £
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: preferences.currency,
      currencyDisplay: 'symbol',
      notation: compact ? 'compact' : 'standard',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    let result = formatter.format(convertedValue);

    // Ensure symbol is at the front for USD, EUR, GBP regardless of locale defaults
    // Some European locales put the symbol at the end by default.
    // The user specifically requested symbol before the number for these.
    if (['USD', 'EUR', 'GBP'].includes(preferences.currency)) {
        const symbol = CURRENCY_SYMBOLS[preferences.currency];
        // If the symbol is not at the start, move it.
        if (!result.startsWith(symbol)) {
            // Remove the symbol from wherever it is (and any non-breaking spaces)
            const numericPart = result.replace(symbol, '').replace(/\u00A0/g, ' ').trim();
            result = `${symbol}${numericPart}`;
        }
    }

    return result;
  }, [preferences.currency, preferences.language]);

  const contextValue = React.useMemo(() => ({ 
    preferences, 
    updatePreference, 
    resetPreferences, 
    t, 
    formatCurrency 
  }), [preferences, updatePreference, resetPreferences, t, formatCurrency]);

  if (!isLoaded) return null;

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
