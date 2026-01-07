/// <reference lib="WebWorker" />

export type {};
declare const self: ServiceWorkerGlobalScope;

async function askForAccessToken(client: Client, timeoutMs = 1000): Promise<string | undefined> {
  return new Promise((resolve) => {
    const responseKey = Math.random().toString(36);
    const timeout = setTimeout(() => {
      self.removeEventListener('message', listener);
      resolve(undefined);
    }, timeoutMs);

    const listener = (event: ExtendableMessageEvent) => {
      if (event.data.responseKey !== responseKey) return;
      clearTimeout(timeout);
      resolve(event.data.token);
      self.removeEventListener('message', listener);
    };
    self.addEventListener('message', listener);
    client.postMessage({ responseKey, type: 'token' });
  });
}

async function getAccessToken(clientId: string): Promise<string | undefined> {
  // Try multiple times to get the client and token
  for (let attempt = 0; attempt < 3; attempt++) {
    const client = await self.clients.get(clientId);
    if (client) {
      const token = await askForAccessToken(client, 1000);
      if (token) {
        return token;
      }
    }
    // If we don't have a client yet or didn't get a token, wait a bit and retry
    if (attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
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
  event.respondWith(
    (async (): Promise<Response> => {
      const token = await getAccessToken(event.clientId);

      // If we couldn't get a token, log the issue but still attempt the request
      // The server will return an error if authentication is required
      if (!token) {
        console.warn('[ServiceWorker] Failed to get access token for authenticated media request:', url);
      }

      return fetch(url, fetchConfig(token));
    })()
  );
});
