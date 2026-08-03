/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

/** Keep home-screen icon badge in sync when the page posts unread counts. */
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string; count?: number } | undefined;
  if (!data || data.type !== "SET_APP_BADGE") return;

  const count = typeof data.count === "number" ? data.count : 0;
  const reg = self.registration as ServiceWorkerRegistration & {
    setAppBadge?: (contents?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };

  event.waitUntil(
    (async () => {
      try {
        if (count > 0 && typeof reg.setAppBadge === "function") {
          await reg.setAppBadge(count);
        } else if (typeof reg.clearAppBadge === "function") {
          await reg.clearAppBadge();
        }
      } catch {
        /* Badging unsupported in this browser */
      }
    })()
  );
});
