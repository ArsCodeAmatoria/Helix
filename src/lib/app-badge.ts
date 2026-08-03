/** Sync unread count to the installed PWA home-screen icon (Badging API). */

export async function syncAppBadge(count: number): Promise<void> {
  if (typeof navigator === "undefined") return;

  const nav = navigator as Navigator & {
    setAppBadge?: (contents?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };

  try {
    if (count > 0) {
      if (typeof nav.setAppBadge === "function") {
        await nav.setAppBadge(count);
      }
      // Some Android builds prefer the service worker registration API.
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready.catch(() => null);
        const swReg = reg as
          | (ServiceWorkerRegistration & {
              setAppBadge?: (contents?: number) => Promise<void>;
            })
          | null;
        if (swReg && typeof swReg.setAppBadge === "function") {
          await swReg.setAppBadge(count);
        }
      }
      return;
    }

    if (typeof nav.clearAppBadge === "function") {
      await nav.clearAppBadge();
    }
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      const swReg = reg as
        | (ServiceWorkerRegistration & {
            clearAppBadge?: () => Promise<void>;
          })
        | null;
      if (swReg && typeof swReg.clearAppBadge === "function") {
        await swReg.clearAppBadge();
      }
    }
  } catch {
    /* Unsupported, denied, or not an installed PWA — ignore */
  }
}

export async function clearAppBadge(): Promise<void> {
  await syncAppBadge(0);
}
