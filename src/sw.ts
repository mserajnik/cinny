/// <reference lib="WebWorker" />

export type {};
declare const self: ServiceWorkerGlobalScope;

const pendingRequests = new Map<string, (token: string | undefined) => void>();

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { responseKey, token } = event.data || {};

  if (responseKey && pendingRequests.has(responseKey)) {
    const resolve = pendingRequests.get(responseKey);
    pendingRequests.delete(responseKey);

    if (resolve) {
      resolve(token);
    }
  }
});

async function askForAccessToken(client: Client): Promise<string | undefined> {
  return new Promise((resolve) => {
    const responseKey = Math.random().toString(36);
    pendingRequests.set(responseKey, resolve);
    client.postMessage({ responseKey, type: 'token' });
  });
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
  event.waitUntil(self.clients.claim());
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
      const client = await self.clients.get(event.clientId);
      let token: string | undefined;
      if (client) token = await askForAccessToken(client);

      return fetch(url, fetchConfig(token));
    })()
  );
});
