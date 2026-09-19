import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { AuthProvider } from './contexts/AuthContext';
import { synchronizePreRenderMetadata, markPrerenderComplete } from './utils/useDynamicCanonical';

// 1. Synchronously pre-populate head metadata before React initialization begins
// This guarantees search engine and social bot crawlers receive populated tags immediately.
try {
  synchronizePreRenderMetadata();
} catch (err) {
  console.warn('[Pre-render] Failed initial head metadata synchronization:', err);
}

// Monkey patch for Google Translate to prevent React unmount crashes
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child: any) {
    if (child.parentNode !== this) {
      if (console) console.warn('Google Translate React Fix: Ignored removeChild');
      return child;
    }
    return originalRemoveChild.apply(this, arguments as any);
  };
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode: any, referenceNode: any) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) console.warn('Google Translate React Fix: Ignored insertBefore');
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments as any);
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Fatal: #root element missing from DOM.');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <AuthProvider>
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </AuthProvider>
  </StrictMode>,
);

// Fallback prerender readiness signal
if (typeof window !== 'undefined') {
  requestAnimationFrame(() => {
    markPrerenderComplete();
  });
}

