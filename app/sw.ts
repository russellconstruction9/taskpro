// @ts-nocheck
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, StaleWhileRevalidate, ExpirationPlugin, NetworkOnly } from "serwist";
import { defaultCache } from "@serwist/next/worker";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Never cache auth or push endpoints
    {
      matcher: /\/api\/(auth|push)\//,
      handler: new NetworkOnly(),
    },
    // Network-first for jobs, tasks, workers API
    {
      matcher: /\/api\/(jobs|tasks|workers)\//,
      handler: new NetworkFirst({
        cacheName: "api-data",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 5 * 60 }),
        ],
      }),
    },
    // Stale-while-revalidate for live time entries
    {
      matcher: /\/api\/time-entries/,
      handler: new StaleWhileRevalidate({
        cacheName: "time-entries",
        plugins: [
          new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 }),
        ],
      }),
    },
    // Cache-first for icons and static assets
    {
      matcher: /\/icons\//,
      handler: new CacheFirst({
        cacheName: "icons",
        plugins: [
          new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
        ],
      }),
    },
    // Include default caching from @serwist/next (Next.js static assets, fonts, etc.)
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Push notification handler
// @ts-ignore
self.addEventListener("push", (event: any) => {
  const data = event.data?.json() ?? { title: "TaskPro", body: "New notification" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      data: { url: data.url || "/dashboard" },
      tag: data.tag || "taskpro-notification",
    })
  );
});

// Notification click handler
// @ts-ignore
self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
