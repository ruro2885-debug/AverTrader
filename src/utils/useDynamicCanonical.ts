import { useEffect } from 'react';
import { NavigationLocation } from '../contexts/NavigationContext';

const PRIMARY_DOMAIN = 'https://www.avertrader.space';

export interface RouteMetadata {
  title: string;
  description: string;
}

/**
 * Route metadata mapping for deep-linked views and tabs
 */
const ROUTE_METADATA_MAP: Record<string, RouteMetadata> = {
  home: {
    title: 'AverTrader | Professional Trading Workspace & AI Execution Platform',
    description:
      'AverTrader (avertrader.space) is an advanced financial workspace and AI-powered execution platform engineered for intelligent market telemetry, automated trading session management, multi-asset portfolio tracking, and institutional-grade risk controls.',
  },
  'market-highlights': {
    title: 'Market Highlights & Real-Time Telemetry | AverTrader',
    description:
      'Track live crypto asset metrics, volume surges, 24-hour price dynamics, and quantitative market telemetry on the AverTrader platform.',
  },
  showcase: {
    title: 'Platform Showcase & Terminal Features | AverTrader',
    description:
      'Explore AverTrader\'s institutional execution engine, automated risk guardrails, AI strategy studio, and multi-tier vault management architecture.',
  },
  'bonus-center': {
    title: 'Bonus Center & Trader Rewards Hub | AverTrader',
    description:
      'Unlock exclusive trading bonuses, complete daily trading missions, and redeem volume vouchers on the official AverTrader rewards hub.',
  },
  'events-promos': {
    title: 'Events, Campaigns & Trading Competitions | AverTrader',
    description:
      'Participate in active trading tournaments, competitive liquidity leaderboards, and seasonal trading promotions on AverTrader.',
  },
  'referral-centre': {
    title: 'Referral Program & Partner Network | AverTrader',
    description:
      'Join the AverTrader Partner Network to earn multi-tier commission rebates, referral revenue share, and exclusive community incentives.',
  },
  auth: {
    title: 'Secure Account Access & Verification | AverTrader',
    description:
      'Sign in to your AverTrader workspace or register an account with cryptographic multi-factor security and encrypted session protection.',
  },
  preferences: {
    title: 'Account Preferences & Security Settings | AverTrader',
    description:
      'Configure terminal themes, order execution confirmation tolerances, two-factor authentication, and custom alert notifications on AverTrader.',
  },
  'kyc-verification': {
    title: 'Identity & KYC Verification | AverTrader',
    description:
      'Complete compliant identity verification to unlock enhanced withdrawal tiers, institutional custody, and elevated trading volume quotas on AverTrader.',
  },
  history: {
    title: 'Trade History & Audit Logs | AverTrader',
    description:
      'Review complete execution records, realized session P/L, historical order books, and cryptographic audit logs on AverTrader.',
  },
  dashboard: {
    title: 'Trading Terminal & Portfolio Dashboard | AverTrader',
    description:
      'Access real-time charting, order execution, asset allocation, and multi-tier vault intelligence on the AverTrader terminal dashboard.',
  },
};

/**
 * Normalizes a URL path to a clean canonical format:
 * - Strips query parameters and hash fragments
 * - Resolves double slashes
 * - Keeps trailing slash for root ('/'), removes trailing slash for subpaths ('/pricing')
 */
export function getCleanPathname(pathname: string = '/'): string {
  if (!pathname || pathname === '' || pathname === '/') {
    return '/';
  }
  const clean = pathname.split('?')[0].split('#')[0];
  const normalized = clean.replace(/\/+/g, '/');
  return normalized.length > 1 && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

/**
 * Computes canonical URL for the current location state and browser pathname.
 */
export function getCanonicalUrl(currentLocation?: NavigationLocation): string {
  if (typeof window === 'undefined') {
    return `${PRIMARY_DOMAIN}/`;
  }

  // Get base clean path from browser
  let path = getCleanPathname(window.location.pathname);

  // If on root but in a specific sub-view route state, map it cleanly if applicable
  if (path === '/' && currentLocation?.view && currentLocation.view !== 'home' && currentLocation.view !== 'dashboard') {
    path = `/${currentLocation.view}`;
  }

  return `${PRIMARY_DOMAIN}${path === '/' ? '/' : path}`;
}

/**
 * Resolves context-specific title and description based on active view, tab, and asset.
 */
export function resolveRouteMetadata(currentLocation?: NavigationLocation): RouteMetadata {
  const viewKey = currentLocation?.view || 'home';

  // Check if inside dashboard with specific tabs
  if (viewKey === 'dashboard' && currentLocation?.tab) {
    const tab = currentLocation.tab;
    if (tab === 'ai') {
      return {
        title: 'AI Strategy Studio & Autonomous Execution | AverTrader',
        description: 'Configure intelligent algorithmic trading strategies, backtest risk parameters, and automate trade execution with neural market scanners on AverTrader.',
      };
    }
    if (tab === 'markets') {
      return {
        title: 'Live Markets & Crypto Quotations | AverTrader',
        description: 'Explore live spot and perpetual contract pricing, market depth, volume leaders, and 24-hour momentum across global digital assets on AverTrader.',
      };
    }
    if (tab === 'portfolio') {
      return {
        title: 'Institutional Portfolio & Vault Tracker | AverTrader',
        description: 'Monitor multi-asset wallet balances, net equity valuations, collateral allocations, and live portfolio telemetry on AverTrader.',
      };
    }
    if (tab === 'copy-trading') {
      return {
        title: 'Copy Trading & Strategy Leaderboards | AverTrader',
        description: 'Follow top-performing verified algorithmic traders, replicate quantitative execution strategies, and track real-time yield analytics on AverTrader.',
      };
    }
    if (tab === 'coin-details' && currentLocation?.asset?.symbol) {
      const sym = currentLocation.asset.symbol.toUpperCase();
      const name = currentLocation.asset.name || sym;
      return {
        title: `${name} (${sym}) Price, Chart & Telemetry | AverTrader`,
        description: `View real-time ${name} (${sym}) interactive candlestick charts, order book liquidity, recent trade flows, and algorithmic indicators on AverTrader.`,
      };
    }
  }

  return ROUTE_METADATA_MAP[viewKey] || ROUTE_METADATA_MAP.home;
}

/**
 * Helper to update or create a <meta> tag in document.head
 */
function setMetaTag(selector: { property?: string; name?: string }, content: string) {
  const query = selector.property ? `meta[property="${selector.property}"]` : `meta[name="${selector.name}"]`;
  let element = document.querySelector<HTMLMetaElement>(query);
  if (!element) {
    element = document.createElement('meta');
    if (selector.property) element.setAttribute('property', selector.property);
    if (selector.name) element.setAttribute('name', selector.name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Synchronous Pre-render Initialization
 * Pre-populates all <head> metadata (canonical, title, og:*, twitter:*) immediately on script evaluation
 * before React mounts the root tree, ensuring crawlers and snapshot services read populated tags instantaneously.
 */
export function synchronizePreRenderMetadata(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const pathname = getCleanPathname(window.location.pathname);
  let view = 'home';

  // Map direct path to corresponding view
  if (pathname.startsWith('/market-highlights')) view = 'market-highlights';
  else if (pathname.startsWith('/showcase')) view = 'showcase';
  else if (pathname.startsWith('/bonus-center')) view = 'bonus-center';
  else if (pathname.startsWith('/events-promos')) view = 'events-promos';
  else if (pathname.startsWith('/referral-centre')) view = 'referral-centre';
  else if (pathname.startsWith('/auth')) view = 'auth';
  else if (pathname.startsWith('/preferences')) view = 'preferences';
  else if (pathname.startsWith('/kyc-verification')) view = 'kyc-verification';
  else if (pathname.startsWith('/history')) view = 'history';
  else if (pathname.startsWith('/dashboard')) view = 'dashboard';

  const mockLocation: NavigationLocation = { id: 'pre-mount', view };
  const canonicalUrl = `${PRIMARY_DOMAIN}${pathname === '/' ? '/' : pathname}`;
  const { title, description } = resolveRouteMetadata(mockLocation);

  // 1. Title
  if (document.title !== title) {
    document.title = title;
  }

  // 2. Canonical
  let linkTag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!linkTag) {
    linkTag = document.createElement('link');
    linkTag.setAttribute('rel', 'canonical');
    document.head.appendChild(linkTag);
  }
  linkTag.setAttribute('href', canonicalUrl);

  // 3. Meta Title & Description
  setMetaTag({ name: 'title' }, title);
  setMetaTag({ name: 'description' }, description);

  // 4. OpenGraph
  setMetaTag({ property: 'og:url' }, canonicalUrl);
  setMetaTag({ property: 'og:title' }, title);
  setMetaTag({ property: 'og:description' }, description);

  // 5. Twitter
  setMetaTag({ name: 'twitter:url' }, canonicalUrl);
  setMetaTag({ name: 'twitter:title' }, title);
  setMetaTag({ name: 'twitter:description' }, description);
}

/**
 * Marks prerender lifecycle as complete for headless browsers / crawler snapshots
 */
export function markPrerenderComplete(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    (window as any).__PRERENDER_STATUS__ = 200;
    (window as any).__PRERENDER_READY__ = true;
    document.documentElement.dataset.rendered = 'true';
    document.body.dataset.prerender = 'ready';
    
    // Dispatch standard crawler completion events
    window.dispatchEvent(new CustomEvent('render-complete'));
    document.dispatchEvent(new CustomEvent('render-complete'));
    document.dispatchEvent(new Event('render-event'));
  } catch (err) {
    // Ignore in unsupported environments
  }
}

/**
 * Dynamic Canonical Link & Social Metadata Hook
 * Synchronizes:
 * - <link rel="canonical">
 * - document.title
 * - <meta name="description">
 * - <meta property="og:title">
 * - <meta property="og:description">
 * - <meta property="og:url">
 * - <meta name="twitter:title">
 * - <meta name="twitter:description">
 * - <meta name="twitter:url">
 */
export function useDynamicCanonical(currentLocation?: NavigationLocation) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const canonicalUrl = getCanonicalUrl(currentLocation);
    const { title, description } = resolveRouteMetadata(currentLocation);

    // 1. Update Document Title
    if (document.title !== title) {
      document.title = title;
    }

    // 2. Update / Create Canonical Link Tag
    let linkTag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.setAttribute('rel', 'canonical');
      document.head.appendChild(linkTag);
    }
    if (linkTag.getAttribute('href') !== canonicalUrl) {
      linkTag.setAttribute('href', canonicalUrl);
    }

    // 3. Update Standard Meta Description & Title
    setMetaTag({ name: 'description' }, description);
    setMetaTag({ name: 'title' }, title);

    // 4. Update Open Graph Meta Tags
    setMetaTag({ property: 'og:url' }, canonicalUrl);
    setMetaTag({ property: 'og:title' }, title);
    setMetaTag({ property: 'og:description' }, description);

    // 5. Update Twitter Card Meta Tags
    setMetaTag({ name: 'twitter:url' }, canonicalUrl);
    setMetaTag({ name: 'twitter:title' }, title);
    setMetaTag({ name: 'twitter:description' }, description);

    // Notify crawlers that DOM & metadata hydration are complete
    markPrerenderComplete();

  }, [
    currentLocation?.view,
    currentLocation?.tab,
    currentLocation?.subView,
    currentLocation?.asset?.symbol,
  ]);
}
