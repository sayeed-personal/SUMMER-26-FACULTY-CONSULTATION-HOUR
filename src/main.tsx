import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for offline functionality with automatic updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registered successfully:', reg.scope);

        // Check for service worker updates
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update is available, reload the client to activate
                  console.log('New content/update found! Reloading page to apply...');
                  window.location.reload();
                } else {
                  console.log('App is ready for offline use.');
                }
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}
