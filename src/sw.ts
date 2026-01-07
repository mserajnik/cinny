/// <reference lib="WebWorker" />

export type {};
declare const self: ServiceWorkerGlobalScope;

// Cache the access token in the service worker to avoid repeated messaging
let cachedAccessToken: string | undefined;
let tokenCacheTime = 0;
const TOKEN_CACHE_DURATION = 60000; // Cache token for 60 seconds

// Listen for token updates from the client
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'token-update' && typeof event.data?.token === 'string') {
    cachedAccessToken = event.data.token;
    tokenCacheTime = Date.now();
    console.log('[ServiceWorker] Token cache updated');
  }
});

async function askForAccessToken(client: Client, timeoutMs = 1000): Promise<string | undefined> {
  return new Promise((resolve) => {
    const responseKey = Math.random().toString(36);
    const timeout = setTimeout(() => {
      self.removeEventListener('message', listener);
      console.error('[ServiceWorker] Token request timeout for key:', responseKey);
      resolve(undefined);
    }, timeoutMs);

    const listener = (event: ExtendableMessageEvent) => {
      if (event.data.responseKey !== responseKey) return;
      clearTimeout(timeout);
      console.log('[ServiceWorker] Received token response for key:', responseKey);
      resolve(event.data.token);
      self.removeEventListener('message', listener);
    };
    self.addEventListener('message', listener);
    client.postMessage({ responseKey, type: 'token' });
  });
}

async function getAccessToken(clientId: string): Promise<string | undefined> {
  // Return cached token if it's still fresh
  const now = Date.now();
  if (cachedAccessToken && (now - tokenCacheTime) < TOKEN_CACHE_DURATION) {
    return cachedAccessToken;
  }

  console.log('[ServiceWorker] Token cache miss, requesting from client');

  // Try multiple times to get the client and token
  for (let attempt = 0; attempt < 3; attempt++) {
    const client = await self.clients.get(clientId);
    if (client) {
      const token = await askForAccessToken(client, 1000);
      if (token) {
        cachedAccessToken = token;
        tokenCacheTime = now;
        return token;
      }
    }
    // If we don't have a client yet or didn't get a token, wait a bit and retry
    if (attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // If all retries failed but we have a cached token, use it even if stale
  if (cachedAccessToken) {
    console.warn('[ServiceWorker] Using stale cached token');
    return cachedAccessToken;
  }

  return undefined;
}

function fetchConfig(token?: string): RequestInit | undefined {
  if (!token) return undefined;

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'default',
  };
}

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { url, method } = event.request;
  if (method !== 'GET') return;
  if (
    !url.includes('/_matrix/client/v1/media/download') &&
    !url.includes('/_matrix/client/v1/media/thumbnail')
  ) {
    return;
  }

  console.log('[ServiceWorker] Intercepting authenticated media request:', url);

  event.respondWith(
    (async (): Promise<Response> => {
      const token = await getAccessToken(event.clientId);

      if (!token) {
        console.error('[ServiceWorker] FAILED to get access token for:', url);
        console.error('[ServiceWorker] clientId:', event.clientId);
        // Notify the client about the failure
        const client = await self.clients.get(event.clientId);
        if (client) {
          client.postMessage({ type: 'token-fetch-failed', url });
        }
      } else {
        console.log('[ServiceWorker] Successfully added auth header to request');
      }

      return fetch(url, fetchConfig(token));
    })()
  );
});
