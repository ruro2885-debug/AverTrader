import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { AuthProvider } from './contexts/AuthContext';

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

// Resilience handler for IndexedDB connection loss and iframe storage drops
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = reason?.message || String(reason || '');
  if (
    msg.toLowerCase().includes('indexed database') || 
    msg.toLowerCase().includes('indexeddb') || 
    msg.toLowerCase().includes('connection to indexed')
  ) {
    console.warn('[Global] Suppressed IndexedDB event:', msg);
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  const msg = event.message || '';
  if (
    msg.toLowerCase().includes('indexed database') || 
    msg.toLowerCase().includes('indexeddb') || 
    msg.toLowerCase().includes('connection to indexed')
  ) {
    console.warn('[Global] Suppressed IndexedDB window error:', msg);
    event.preventDefault();
  }
});

import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <PreferencesProvider>
          <App />
        </PreferencesProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
