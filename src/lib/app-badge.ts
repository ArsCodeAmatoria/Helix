/**
 * App icon badges — progressive enhancement per
 * https://web.dev/articles/web-apps/badges
 *
 * 1. Installed PWA + Badging API → navigator.setAppBadge(n)
 * 2. Otherwise → draw the count onto the favicon (browser tab)
 */

const APP_TITLE = "Proven";
const FAVICON_SRC = "/icons/icon-192.png";
const FAVICON_LINK_ID = "proven-app-badge-favicon";

type BadgeCapable = {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

let baseIcon: HTMLImageElement | null = null;
let baseIconPromise: Promise<HTMLImageElement> | null = null;
let lastFaviconUrl: string | null = null;
let preferNative: boolean | null = null;

function supportsAppBadge(): boolean {
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || ios;
}

function shouldUseNativeBadge(): boolean {
  if (preferNative != null) return preferNative && supportsAppBadge();
  return isStandaloneDisplay() && supportsAppBadge();
}

/** After install, upgrade from favicon badge → native OS badge. */
export function upgradeToNativeAppBadge(): void {
  preferNative = supportsAppBadge();
  clearFaviconBadge();
}

function loadBaseIcon(): Promise<HTMLImageElement> {
  if (baseIcon?.complete) return Promise.resolve(baseIcon);
  if (baseIconPromise) return baseIconPromise;

  baseIconPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      baseIcon = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error("Failed to load badge favicon"));
    img.src = FAVICON_SRC;
  });

  return baseIconPromise;
}

function ensureFaviconLink(): HTMLLinkElement {
  let link = document.getElementById(
    FAVICON_LINK_ID
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = FAVICON_LINK_ID;
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
  }
  return link;
}

function clearFaviconBadge(): void {
  if (typeof document === "undefined") return;
  const link = document.getElementById(FAVICON_LINK_ID) as HTMLLinkElement | null;
  if (link) {
    link.href = FAVICON_SRC;
  }
  if (lastFaviconUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(lastFaviconUrl);
    lastFaviconUrl = null;
  }
}

/** Classic path: paint unread count onto the tab favicon. */
async function setFaviconBadge(count: number): Promise<void> {
  if (typeof document === "undefined") return;

  if (count <= 0) {
    clearFaviconBadge();
    return;
  }

  try {
    const img = await loadBaseIcon();
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);

    const label = count > 99 ? "99+" : String(count);
    const badgeR = size * 0.22;
    const cx = size - badgeR - 2;
    const cy = badgeR + 2;

    ctx.beginPath();
    ctx.arc(cx, cy, badgeR + 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = "#e11d48";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${label.length > 2 ? 16 : 20}px system-ui, sans-serif`;
    ctx.fillText(label, cx, cy + 0.5);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) return;

    if (lastFaviconUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(lastFaviconUrl);
    }
    const url = URL.createObjectURL(blob);
    lastFaviconUrl = url;
    ensureFaviconLink().href = url;
  } catch {
    /* ignore canvas / image failures */
  }
}

async function setNativeAppBadge(count: number): Promise<boolean> {
  const nav = navigator as Navigator & BadgeCapable;
  try {
    if (count > 0) {
      if (typeof nav.setAppBadge !== "function") return false;
      // web.dev: integer value becomes the OS app-icon badge
      await nav.setAppBadge(count);
    } else if (typeof nav.clearAppBadge === "function") {
      await nav.clearAppBadge();
    } else if (typeof nav.setAppBadge === "function") {
      // Spec: 0 also clears
      await nav.setAppBadge(0);
    } else {
      return false;
    }

    // Also set via service worker registration when available (Android).
    if ("serviceWorker" in navigator) {
      try {
        const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration &
          BadgeCapable;
        if (count > 0 && typeof reg.setAppBadge === "function") {
          await reg.setAppBadge(count);
        } else if (typeof reg.clearAppBadge === "function") {
          await reg.clearAppBadge();
        }
        reg.active?.postMessage({ type: "SET_APP_BADGE", count });
      } catch {
        /* ignore */
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function syncDocumentTitleBadge(count: number): void {
  if (typeof document === "undefined") return;
  document.title = count > 0 ? `(${count}) ${APP_TITLE}` : APP_TITLE;
}

/**
 * Progressive enhancement:
 * - Installed + Badging API → native OS badge (taskbar / home screen)
 * - Else → favicon badge in the browser tab
 */
export async function syncAppBadge(count: number): Promise<boolean> {
  if (typeof navigator === "undefined") return false;

  const value = Math.max(0, Math.floor(count));
  syncDocumentTitleBadge(value);

  if (shouldUseNativeBadge()) {
    clearFaviconBadge();
    return setNativeAppBadge(value);
  }

  await setFaviconBadge(value);
  // Still try native in case the browser supports it outside standalone
  // (some desktop Chromium builds badge the dock/taskbar from a tab).
  if (supportsAppBadge()) {
    void setNativeAppBadge(value);
  }
  return true;
}

export async function clearAppBadge(): Promise<void> {
  await syncAppBadge(0);
}

/** Call once from the client root to upgrade badge mode after install. */
export function listenForAppBadgeUpgrade(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onInstalled = () => {
    upgradeToNativeAppBadge();
  };
  const onDisplayChange = () => {
    if (isStandaloneDisplay() && supportsAppBadge()) {
      preferNative = true;
      clearFaviconBadge();
    }
  };

  window.addEventListener("appinstalled", onInstalled);
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener?.("change", onDisplayChange);

  if (isStandaloneDisplay() && supportsAppBadge()) {
    preferNative = true;
  }

  return () => {
    window.removeEventListener("appinstalled", onInstalled);
    mq.removeEventListener?.("change", onDisplayChange);
  };
}
