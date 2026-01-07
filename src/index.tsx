/* eslint-disable import/first */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { enableMapSet } from 'immer';
import '@fontsource/inter/variable.css';
import 'folds/dist/style.css';
import { configClass, varsClass } from 'folds';

enableMapSet();

import './index.css';

import { trimTrailingSlash } from './app/utils/common';
import App from './app/pages/App';

// import i18n (needs to be bundled ;))
import './app/i18n';

document.body.classList.add(configClass, varsClass);

// Register Service Worker
if ('serviceWorker' in navigator) {
  const swUrl =
    import.meta.env.MODE === 'production'
      ? `${trimTrailingSlash(import.meta.env.BASE_URL)}/sw.js`
      : `/dev-sw.js?dev-sw`;

  // Set up message listener BEFORE registering service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'token' && event.data?.responseKey) {
      // Get the token for SW.
      const token = localStorage.getItem('cinny_access_token') ?? undefined;
      console.log('[Cinny] Responding to SW token request:', event.data.responseKey, 'has token:', !!token);

      // event.source might be null, so we need to respond via the service worker controller
      const target = event.source || navigator.serviceWorker.controller;
      if (target) {
        target.postMessage({
          responseKey: event.data.responseKey,
          token,
        });
      } else {
        console.error('[Cinny] Cannot respond to SW token request: no message target available');
      }
    } else if (event.data?.type === 'token-fetch-failed') {
      console.error('[Cinny] Service Worker failed to get token for:', event.data.url);
      console.error('[Cinny] This will cause M_MISSING_TOKEN errors');
    }
  });

  // Function to send token updates to service worker
  const updateServiceWorkerToken = () => {
    const token = localStorage.getItem('cinny_access_token');
    if (token && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'token-update',
        token,
      });
      console.log('[Cinny] Sent token update to service worker');
    }
  };

  navigator.serviceWorker.register(swUrl).then((registration) => {
    console.log('[Cinny] Service Worker registered successfully');

    // Send initial token when SW is ready
    if (navigator.serviceWorker.controller) {
      updateServiceWorkerToken();
    }

    // Send token when SW becomes active
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            updateServiceWorkerToken();
          }
        });
      }
    });
  }).catch((error) => {
    console.error('[Cinny] Service Worker registration failed:', error);
  });

  // Also send token update when SW controller changes (new SW takes over)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[Cinny] Service Worker controller changed');
    updateServiceWorkerToken();
  });

  // Periodically refresh the token in the service worker cache
  setInterval(updateServiceWorkerToken, 30000); // Every 30 seconds
}

const mountApp = () => {
  const rootContainer = document.getElementById('root');

  if (rootContainer === null) {
    console.error('Root container element not found!');
    return;
  }

  const root = createRoot(rootContainer);
  root.render(<App />);
};

mountApp();
