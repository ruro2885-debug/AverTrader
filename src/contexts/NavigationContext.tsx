import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { safeStorage } from '../utils/storage';

export interface NavigationLocation {
  id: string;
  view: string; // 'home' | 'dashboard' | 'preferences' | 'bonus-center' | 'kyc-verification' | 'history' | 'referral-centre' | 'market-highlights' | 'events-promos' | 'showcase' | 'admin' | 'auth' | 'not-found'
  tab?: string; // inside dashboard: 'home', 'markets', 'coin-details', 'discover', 'ai', 'portfolio', 'profile', 'events', 'support', 'copy-trading'
  subView?: string; // 'portfolio' | 'vault' | 'asset-stats' | trader profile | event details | task details | trade details
  aiView?: string; // 'HOME' | 'CONFIGS' | 'SCANNER' | 'RECOMMENDATIONS' | 'TRADES' | 'HISTORY' | 'PERFORMANCE' | 'NOTIFICATIONS'
  asset?: any; // For coin-details or asset views
  modal?: string | null; // 'deposit' | 'withdraw' | 'transfer' | 'notifications' | 'strategies' | etc.
  params?: Record<string, any>;
}

export interface NavigateOptions {
  replace?: boolean;
}

interface OverlayEntry {
  id: string;
  onClose: () => boolean | void;
}

interface NavigationContextType {
  currentLocation: NavigationLocation;
  stack: NavigationLocation[];
  navigate: (to: Partial<NavigationLocation> | string, options?: NavigateOptions) => void;
  navigateTab: (tab: string, extra?: Partial<NavigationLocation>, options?: NavigateOptions) => void;
  navigateView: (view: string, extra?: Partial<NavigationLocation>, options?: NavigateOptions) => void;
  navigateSubView: (subView: string, extra?: Partial<NavigationLocation>, options?: NavigateOptions) => void;
  navigateAiView: (aiView: string) => void;
  openModal: (modal: string, params?: any) => void;
  closeModal: () => void;
  goBack: (fallback?: Partial<NavigationLocation>) => void;
  close: () => void;
  registerOverlay: (id: string, onClose: () => boolean | void) => () => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

const STORAGE_STACK_KEY = 'aver_real_nav_stack_v2';

const DEFAULT_LOCATION: NavigationLocation = {
  id: 'root-home',
  view: 'home',
  tab: 'home',
  subView: undefined,
  aiView: 'HOME',
  modal: null,
};

function getInitialStack(initialView?: string): NavigationLocation[] {
  try {
    const raw = safeStorage.getItem(STORAGE_STACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore parse errors and use default
  }

  const hasActiveUser = safeStorage.getItem('aver_active_user') && safeStorage.getItem('aver_logged_out') !== 'true';
  const initV = initialView || (hasActiveUser ? 'dashboard' : 'home');
  return [
    {
      id: `root-${Date.now()}`,
      view: initV,
      tab: 'home',
      aiView: 'HOME',
      modal: null,
    },
  ];
}

export function NavigationProvider({
  children,
  initialView,
}: {
  children: React.ReactNode;
  initialView?: string;
}) {
  const [stack, setStack] = useState<NavigationLocation[]>(() => getInitialStack(initialView));

  const currentLocation = stack[stack.length - 1] || DEFAULT_LOCATION;
  const isNavigatingBackRef = useRef(false);
  const overlaysRef = useRef<OverlayEntry[]>([]);

  // Persist stack to sessionStorage so refreshes preserve actual history without duplicate fake entries
  useEffect(() => {
    try {
      safeStorage.setItem(STORAGE_STACK_KEY, JSON.stringify(stack));
    } catch (e) {}
  }, [stack]);

  // Synchronize browser history entry with top of stack
  useEffect(() => {
    try {
      if (!window.history.state || !window.history.state.id) {
        window.history.replaceState(currentLocation, '', window.location.pathname);
      }
    } catch (e) {}
  }, []);

  // Listen to browser / hardware popstate
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      isNavigatingBackRef.current = true;

      // First check if any active overlay / modal registered a close handler
      if (overlaysRef.current.length > 0) {
        const topOverlay = overlaysRef.current.pop();
        if (topOverlay) {
          const handled = topOverlay.onClose();
          if (handled !== false) {
            setTimeout(() => {
              isNavigatingBackRef.current = false;
            }, 50);
            return;
          }
        }
      }

      if (e.state && e.state.id) {
        const targetState = e.state as NavigationLocation;
        setStack(prev => {
          const existingIdx = prev.findIndex(item => item.id === targetState.id);
          if (existingIdx !== -1) {
            return prev.slice(0, existingIdx + 1);
          }
          if (prev.length > 1) {
            return prev.slice(0, -1);
          }
          return [targetState];
        });
      } else {
        setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
      }

      setTimeout(() => {
        isNavigatingBackRef.current = false;
      }, 50);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const registerOverlay = useCallback((id: string, onClose: () => boolean | void) => {
    overlaysRef.current = overlaysRef.current.filter(o => o.id !== id);
    overlaysRef.current.push({ id, onClose });
    return () => {
      overlaysRef.current = overlaysRef.current.filter(o => o.id !== id);
    };
  }, []);

  const navigate = useCallback(
    (to: Partial<NavigationLocation> | string, options?: NavigateOptions) => {
      const toObj: Partial<NavigationLocation> = typeof to === 'string' ? { view: to } : to;

      setStack(prev => {
        const current = prev[prev.length - 1] || DEFAULT_LOCATION;

        const nextView = toObj.view !== undefined ? toObj.view : current.view;
        const nextTab =
          toObj.tab !== undefined
            ? toObj.tab
            : nextView === 'dashboard'
            ? current.tab || 'home'
            : undefined;
        const nextSubView = toObj.subView !== undefined ? toObj.subView : undefined;
        const nextAiView =
          toObj.aiView !== undefined
            ? toObj.aiView
            : nextTab === 'ai'
            ? current.aiView || 'HOME'
            : 'HOME';
        const nextModal = toObj.modal !== undefined ? toObj.modal : null;
        const nextAsset =
          toObj.asset !== undefined
            ? toObj.asset
            : nextTab === 'coin-details'
            ? current.asset
            : undefined;
        const nextParams = toObj.params !== undefined ? toObj.params : current.params;

        // Duplicate prevention: If identical to current top of stack, do not push duplicate
        if (
          !options?.replace &&
          nextView === current.view &&
          nextTab === current.tab &&
          nextSubView === current.subView &&
          nextAiView === current.aiView &&
          nextModal === current.modal &&
          JSON.stringify(nextAsset) === JSON.stringify(current.asset) &&
          JSON.stringify(nextParams) === JSON.stringify(current.params)
        ) {
          return prev;
        }

        const newEntry: NavigationLocation = {
          id: `nav-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          view: nextView,
          tab: nextTab,
          subView: nextSubView,
          aiView: nextAiView,
          modal: nextModal,
          asset: nextAsset,
          params: nextParams,
        };

        try {
          if (options?.replace) {
            window.history.replaceState(newEntry, '', window.location.pathname);
          } else {
            window.history.pushState(newEntry, '', window.location.pathname);
          }
        } catch (e) {}

        if (options?.replace) {
          return [...prev.slice(0, -1), newEntry];
        }

        return [...prev, newEntry];
      });
    },
    []
  );

  const goBack = useCallback((fallback?: Partial<NavigationLocation>) => {
    // If an overlay is registered (e.g. popup/drawer), close it first without navigating away
    if (overlaysRef.current.length > 0) {
      const topOverlay = overlaysRef.current.pop();
      if (topOverlay) {
        const handled = topOverlay.onClose();
        if (handled !== false) {
          return;
        }
      }
    }

    setStack(prev => {
      let isAuthenticated = false;
      try {
        const u1 = safeStorage.getItem('aver_user_session');
        const u2 = safeStorage.getItem('aver_user');
        const u3 = localStorage.getItem('aver_user') || sessionStorage.getItem('aver_user');
        if (u1 || u2 || u3) isAuthenticated = true;
      } catch (e) {}

      if (prev.length > 1) {
        let targetIdx = prev.length - 2;

        // Skip unauthenticated screens if user is authenticated
        if (isAuthenticated) {
          while (targetIdx >= 0 && (prev[targetIdx].view === 'auth' || prev[targetIdx].view === 'home')) {
            targetIdx--;
          }
        }

        if (targetIdx >= 0) {
          const nextStack = prev.slice(0, targetIdx + 1);
          const prevTop = nextStack[nextStack.length - 1];

          try {
            window.history.replaceState(prevTop, '', window.location.pathname);
          } catch (e) {}

          return nextStack;
        }
      }

      // No previous valid stack item exists — route to fallback or dashboard
      if (isAuthenticated) {
        const rootDashboard: NavigationLocation = {
          id: `root-${Date.now()}`,
          view: fallback?.view || 'dashboard',
          tab: fallback?.tab || 'home',
          subView: fallback?.subView,
          aiView: fallback?.aiView || 'HOME',
          modal: null,
          asset: fallback?.asset,
          params: fallback?.params,
        };
        try {
          window.history.replaceState(rootDashboard, '', window.location.pathname);
        } catch (e) {}
        return [rootDashboard];
      }

      if (fallback) {
        const fallbackEntry: NavigationLocation = {
          id: `root-${Date.now()}`,
          view: fallback.view || 'dashboard',
          tab: fallback.tab || 'home',
          subView: fallback.subView,
          aiView: fallback.aiView || 'HOME',
          modal: null,
          asset: fallback.asset,
          params: fallback.params,
        };
        try {
          window.history.replaceState(fallbackEntry, '', window.location.pathname);
        } catch (e) {}
        return [fallbackEntry];
      }

      const rootEntry: NavigationLocation = {
        id: `root-${Date.now()}`,
        view: 'home',
        tab: 'home',
        aiView: 'HOME',
        modal: null,
      };
      try {
        window.history.replaceState(rootEntry, '', window.location.pathname);
      } catch (e) {}
      return [rootEntry];
    });
  }, []);

  const close = useCallback(() => {
    // 1. Close overlay / popup / drawer first if open
    if (overlaysRef.current.length > 0) {
      const topOverlay = overlaysRef.current.pop();
      if (topOverlay) {
        const handled = topOverlay.onClose();
        if (handled !== false) {
          return;
        }
      }
    }

    // 2. If top of stack is a modal, pop it
    if (currentLocation.modal) {
      goBack();
      return;
    }

    // 3. Otherwise navigate to immediate previous page in history
    goBack();
  }, [currentLocation.modal, goBack]);

  const navigateTab = useCallback(
    (tab: string, extra?: Partial<NavigationLocation>, options?: NavigateOptions) => {
      navigate({ view: 'dashboard', tab, ...extra }, options);
    },
    [navigate]
  );

  const navigateView = useCallback(
    (view: string, extra?: Partial<NavigationLocation>, options?: NavigateOptions) => {
      navigate({ view, ...extra }, options);
    },
    [navigate]
  );

  const navigateSubView = useCallback(
    (subView: string, extra?: Partial<NavigationLocation>, options?: NavigateOptions) => {
      navigate({ subView, ...extra }, options);
    },
    [navigate]
  );

  const navigateAiView = useCallback(
    (aiView: string) => {
      navigate({ view: 'dashboard', tab: 'ai', aiView });
    },
    [navigate]
  );

  const openModal = useCallback(
    (modal: string, params?: any) => {
      navigate({ modal, params });
    },
    [navigate]
  );

  const closeModal = useCallback(() => {
    if (currentLocation.modal) {
      goBack();
    } else {
      navigate({ modal: null });
    }
  }, [currentLocation.modal, goBack, navigate]);

  return (
    <NavigationContext.Provider
      value={{
        currentLocation,
        stack,
        navigate,
        navigateTab,
        navigateView,
        navigateSubView,
        navigateAiView,
        openModal,
        closeModal,
        goBack,
        close,
        registerOverlay,
        canGoBack: stack.length > 1,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within a NavigationProvider');
  }
  return context;
}
