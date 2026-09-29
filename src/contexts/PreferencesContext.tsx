import React, { createContext, useContext, useState } from 'react';

interface Preferences {
  theme: 'dark' | 'light';
  language: string;
  currency: string;
}

interface PreferencesContextType {
  preferences: Preferences;
  updatePreference: (key: keyof Preferences, value: any) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<Preferences>({
    theme: 'dark',
    language: 'en',
    currency: 'USD',
  });

  const updatePreference = (key: keyof Preferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within a PreferencesProvider');
  return context;
};
