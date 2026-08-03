"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  detectBrowser,
  type BrowserKind,
} from "@/lib/browser";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallOutcome =
  | "accepted"
  | "dismissed"
  | "unavailable"
  | "ios-guide"
  | "manual-guide";

interface InstallAppContextValue {
  canPrompt: boolean;
  isInstalled: boolean;
  isIos: boolean;
  showInstallUi: boolean;
  /** Detected browser for install copy / routing. */
  browserKind: BrowserKind;
  browserLabel: string;
  isChromium: boolean;
  /** True after SW registration attempt finishes. */
  swReady: boolean;
  install: () => Promise<InstallOutcome>;
  /** Stop auto-install gestures (user chose Not now). */
  dismissInstall: () => void;
}

const InstallAppContext = createContext<InstallAppContextValue | null>(null);

const DISMISS_KEY = "proven-install-auto-dismissed";

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

export function InstallAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [swReady, setSwReady] = useState(false);
  const [browserKind, setBrowserKind] = useState<BrowserKind>("other");
  const [browserLabel, setBrowserLabel] = useState("Browser");
  const [isChromium, setIsChromium] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);

  useEffect(() => {
    const browser = detectBrowser();
    setBrowserKind(browser.kind);
    setBrowserLabel(browser.label);
    setIsChromium(browser.isChromium);
    setIsIos(browser.isIos);
    setIsInstalled(isStandaloneDisplay());
    try {
      setUserDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setUserDismissed(false);
    }
    setHydrated(true);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      const bip = event as BeforeInstallPromptEvent;
      deferredRef.current = bip;
      setDeferred(bip);
    };
    const onInstalled = () => {
      deferredRef.current = null;
      setDeferred(null);
      setIsInstalled(true);
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    };
    const onDisplayChange = () => setIsInstalled(isStandaloneDisplay());

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", onDisplayChange);

    // Wait for SW — required for Chrome installability.
    let cancelled = false;
    (async () => {
      if (!("serviceWorker" in navigator)) {
        if (!cancelled) setSwReady(true);
        return;
      }
      try {
        await navigator.serviceWorker.ready;
      } catch {
        /* ignore */
      }
      // Give Serwist a moment to finish activate + claim.
      await new Promise((r) => setTimeout(r, 400));
      if (!cancelled) setSwReady(true);
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  const install = useCallback(async (): Promise<InstallOutcome> => {
    if (isInstalled) return "unavailable";
    const bip = deferredRef.current ?? deferred;
    if (bip) {
      try {
        await bip.prompt();
        const choice = await bip.userChoice;
        deferredRef.current = null;
        setDeferred(null);
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          try {
            localStorage.setItem(DISMISS_KEY, "1");
          } catch {
            /* ignore */
          }
          return "accepted";
        }
        return "dismissed";
      } catch {
        if (isIos) return "ios-guide";
        return "manual-guide";
      }
    }
    if (isIos || browserKind === "safari") return "ios-guide";
    return "manual-guide";
  }, [deferred, isInstalled, isIos, browserKind]);

  const dismissInstall = useCallback(() => {
    setUserDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  // When Chrome is ready, auto-install on the next tap/key (gesture required).
  useEffect(() => {
    if (!deferred || isInstalled || userDismissed) return;

    let used = false;
    const onGesture = (event: Event) => {
      if (used) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("[data-install-skip]")) return;

      const bip = deferredRef.current;
      if (!bip) return;
      used = true;
      void (async () => {
        try {
          await bip.prompt();
          const choice = await bip.userChoice;
          deferredRef.current = null;
          setDeferred(null);
          if (choice.outcome === "accepted") {
            setIsInstalled(true);
            try {
              localStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
          } else {
            used = false;
          }
        } catch {
          used = false;
        }
      })();
    };

    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
    return () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
    };
  }, [deferred, isInstalled, userDismissed]);

  const canPrompt = Boolean(deferred) && !isInstalled;
  const showInstallUi = hydrated && !isInstalled;

  const value = useMemo(
    () => ({
      canPrompt,
      isInstalled,
      isIos,
      showInstallUi,
      browserKind,
      browserLabel,
      isChromium,
      swReady,
      install,
      dismissInstall,
    }),
    [
      canPrompt,
      isInstalled,
      isIos,
      showInstallUi,
      browserKind,
      browserLabel,
      isChromium,
      swReady,
      install,
      dismissInstall,
    ]
  );

  return (
    <InstallAppContext.Provider value={value}>
      {children}
    </InstallAppContext.Provider>
  );
}

export function useInstallApp() {
  const ctx = useContext(InstallAppContext);
  if (!ctx) {
    throw new Error("useInstallApp must be used within InstallAppProvider");
  }
  return ctx;
}

export function useInstallAppOptional() {
  return useContext(InstallAppContext);
}

export function markInstallDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}
