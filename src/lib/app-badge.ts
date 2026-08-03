/** Sync unread count to the installed PWA home-screen icon (Badging API). */

type BadgeCapable = {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

const APP_TITLE = "Proven";

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || ios;
}

async function getSwRegistration(): Promise<
  (ServiceWorkerRegistration & BadgeCapable) | null
> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return (await navigator.serviceWorker.ready) as ServiceWorkerRegistration &
      BadgeCapable;
  } catch {
    return null;
  }
}

async function applyBadge(target: BadgeCapable, count: number): Promise<boolean> {
  try {
    if (count > 0) {
      if (typeof target.setAppBadge !== "function") return false;
      await target.setAppBadge(count);
      return true;
    }
    if (typeof target.clearAppBadge === "function") {
      await target.clearAppBadge();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Mirror unread count in the document title when OS badges are unavailable. */
export function syncDocumentTitleBadge(count: number): void {
  if (typeof document === "undefined") return;
  document.title = count > 0 ? `(${count}) ${APP_TITLE}` : APP_TITLE;
}

/**
 * Set / clear the home-screen app icon badge.
 * Works on installed PWAs (Chrome Android, Safari/Chrome iOS 16.4+).
 */
export async function syncAppBadge(count: number): Promise<boolean> {
  if (typeof navigator === "undefined") return false;

  syncDocumentTitleBadge(count);

  const nav = navigator as Navigator & BadgeCapable;
  let applied = await applyBadge(nav, count);

  const reg = await getSwRegistration();
  if (reg) {
    const fromSw = await applyBadge(reg, count);
    applied = applied || fromSw;

    // Keep a SW-side copy so Android can refresh the badge when clients close.
    try {
      reg.active?.postMessage({ type: "SET_APP_BADGE", count });
    } catch {
      /* ignore */
    }
  }

  // Retry once after SW settles (common on first PWA launch).
  if (!applied && isStandalonePwa()) {
    await new Promise((r) => setTimeout(r, 600));
    const retryNav = await applyBadge(nav, count);
    const retryReg = await getSwRegistration();
    const retrySw = retryReg ? await applyBadge(retryReg, count) : false;
    applied = retryNav || retrySw;
  }

  return applied;
}

export async function clearAppBadge(): Promise<void> {
  await syncAppBadge(0);
}
