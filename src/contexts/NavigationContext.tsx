import React, { createContext, useContext, useState, useCallback } from 'react';

export interface NavigationContextType {
  currentView: string;
  navigateToView: (view: string, data?: any) => void;
  goBackView: () => void;
  viewStack: string[];
  viewData: any;
  setNavigationData: (data: any) => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  currentView: 'dashboard',
  navigateToView: () => {},
  goBackView: () => {},
  viewStack: ['dashboard'],
  viewData: null,
  setNavigationData: () => {},
});

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [viewStack, setViewStack] = useState<string[]>(['dashboard']);
  const [viewData, setViewData] = useState<any>(null);

  const navigateToView = useCallback((view: string, data?: any) => {
    setCurrentView(view);
    setViewStack(prev => [...prev, view]);
    if (data !== undefined) setViewData(data);
  }, []);

  const goBackView = useCallback(() => {
    setViewStack(prev => {
      if (prev.length <= 1) return prev;
      const newStack = prev.slice(0, -1);
      setCurrentView(newStack[newStack.length - 1]);
      return newStack;
    });
  }, []);

  const setNavigationData = useCallback((data: any) => {
    setViewData(data);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        currentView,
        navigateToView,
        goBackView,
        viewStack,
        viewData,
        setNavigationData,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
export default NavigationContext;
