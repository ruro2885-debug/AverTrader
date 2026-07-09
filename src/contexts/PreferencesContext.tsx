import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Theme, Currency, Preferences } from '../types';
import { translations } from '../i18n/translations';
import { useAuth } from './AuthContext';

interface PreferencesContextType {
  preferences: Preferences;
  updatePreference: (key: keyof Preferences, value: any) => void;
  t: (key: string) => string;
  formatCurrency: (usdValue: number, compact?: boolean) => string;
}

const defaultPreferences: Preferences = {
  language: 'EN',
  theme: 'dark',
  currency: 'USD',
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
    if (user && user.preferences) {
      const validLanguages: Language[] = ['EN', 'ES', 'ZH', 'DE', 'FR'];
      const validThemes: Theme[] = ['light', 'dark'];
      const validCurrencies: Currency[] = ['USD', 'EUR', 'GBP', 'BTC', 'USDT'];

      const userLang = user.preferences.language as Language;
      const userTheme = user.preferences.theme as Theme;
      const userCurrency = user.preferences.currency as Currency;

      setPreferences({
        ...user.preferences,
        language: validLanguages.includes(userLang) ? userLang : 'EN',
        theme: validThemes.includes(userTheme) ? userTheme : 'dark',
        currency: validCurrencies.includes(userCurrency) ? userCurrency : 'USD',
      });
    } else {
      const savedLanguage = localStorage.getItem('aver_language') as Language;
      const savedTheme = localStorage.getItem('aver_theme') as Theme;
      const savedCurrency = localStorage.getItem('aver_currency') as Currency;
      
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
  }, [user]);

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
  }, [user]);

  const updatePreference = (key: keyof Preferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(`aver_${key}`, value);
    
    // Save to user profile persistently if logged in
    if (user && updateUserPreferences) {
      updateUserPreferences({ [key]: value });
    }
  };

  const t = (key: string): string => {
    const langDict = translations[preferences.language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    const fallbackDict = translations['EN'];
    return fallbackDict[key] || key;
  };

  const formatCurrency = (usdValue: number, compact: boolean = false): string => {
    const rate = EXCHANGE_RATES[preferences.currency];
    const convertedValue = usdValue * rate;

    // Use Intl.NumberFormat for proper localization based on the selected language
    let locale = 'en-US';
    switch (preferences.language) {
      case 'ES': locale = 'es-ES'; break;
      case 'FR': locale = 'fr-FR'; break;
      case 'DE': locale = 'de-DE'; break;
      case 'ZH': locale = 'zh-CN'; break;
    }

    // Crypto doesn't work with Intl.NumberFormat(..., { style: 'currency' })
    if (preferences.currency === 'BTC' || preferences.currency === 'USDT') {
       const formatter = new Intl.NumberFormat(locale, {
           notation: compact ? 'compact' : 'standard',
           maximumFractionDigits: preferences.currency === 'BTC' ? 4 : 2,
       });
       return `${CURRENCY_SYMBOLS[preferences.currency]}${formatter.format(convertedValue)}`;
    }

    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: preferences.currency,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: 2,
    });

    return formatter.format(convertedValue);
  };

  if (!isLoaded) return null;

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference, t, formatCurrency }}>
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
