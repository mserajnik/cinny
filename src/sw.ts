/// <reference lib="WebWorker" />

export type {};
declare const self: ServiceWorkerGlobalScope;

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(clients.claim());
});
