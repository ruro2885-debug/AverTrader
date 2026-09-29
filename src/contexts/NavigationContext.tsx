import React, { createContext, useContext, useState } from 'react';

interface Location {
  view: string;
  tab?: string;
  params?: Record<string, any>;
}

interface NavigationContextType {
  currentLocation: Location;
  navigate: (location: Location, options?: { replace?: boolean }) => void;
  navigateView: (view: string, params?: Record<string, any>, options?: { replace?: boolean }) => void;
  navigateTab: (tab: string) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<Location>({ view: 'home' });
  const [history, setHistory] = useState<Location[]>([{ view: 'home' }]);

  const navigate = (location: Location, options?: { replace?: boolean }) => {
    if (options?.replace) {
      setHistory(prev => [...prev.slice(0, -1), location]);
    } else {
      setHistory(prev => [...prev, location]);
    }
    setCurrentLocation(location);
  };

  const navigateView = (view: string, params?: Record<string, any>, options?: { replace?: boolean }) => {
    navigate({ view, params }, options);
  };

  const navigateTab = (tab: string) => {
    navigate({ ...currentLocation, tab });
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentLocation(newHistory[newHistory.length - 1]);
    } else {
      setCurrentLocation({ view: 'home' });
    }
  };

  return (
    <NavigationContext.Provider value={{ currentLocation, navigate, navigateView, navigateTab, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useAppNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useAppNavigation must be used within a NavigationProvider');
  return context;
};

export const parsePathToLocation = (path: string): Location => {
  if (path.includes('dashboard')) return { view: 'dashboard', tab: 'home' };
  if (path.includes('admin')) return { view: 'admin' };
  return { view: 'home' };
};

export const locationToPath = (loc: Location) => `/${loc.view}`;
