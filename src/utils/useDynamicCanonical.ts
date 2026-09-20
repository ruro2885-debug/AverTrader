import { useEffect } from 'react';
import { NavigationLocation } from '../contexts/NavigationContext';

const PRIMARY_DOMAIN = 'https://www.avertrader.space';

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
 * Dynamic Canonical Link Hook
 * Automatically updates or injects `<link rel="canonical" href="..." />` in <head>
 * ensuring search engines attribute all content to the primary custom domain.
 */
export function useDynamicCanonical(currentLocation?: NavigationLocation) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const canonicalUrl = getCanonicalUrl(currentLocation);

    // Locate or create the canonical link tag in document head
    let linkTag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.setAttribute('rel', 'canonical');
      document.head.appendChild(linkTag);
    }

    if (linkTag.getAttribute('href') !== canonicalUrl) {
      linkTag.setAttribute('href', canonicalUrl);
    }

    // Also synchronize og:url to maintain consistency
    const ogUrlTag = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrlTag && ogUrlTag.getAttribute('content') !== canonicalUrl) {
      ogUrlTag.setAttribute('content', canonicalUrl);
    }
  }, [currentLocation?.view, currentLocation?.tab, currentLocation?.subView]);
}
