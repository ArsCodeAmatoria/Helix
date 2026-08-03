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
  type DevicePlatform,
  type InstallProfile,
} from "@/lib/browser";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable" | "guide";

interface InstallAppContextValue {
  canPrompt: boolean;
  isInstalled: boolean;
  showInstallUi: boolean;
  profile: InstallProfile;
  browserKind: BrowserKind;
  browserLabel: string;
  platform: DevicePlatform;
  isChromium: boolean;
  isIos: boolean;
  swReady: boolean;
  install: () => Promise<InstallOutcome>;
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

const fallbackProfile: InstallProfile = {
  kind: "other",
  platform: "desktop",
  label: "Browser",
  shortLabel: "Browser",
  isChromium: false,
  supportsNativeInstall: false,
  steps: [],
  summary: "",
};

export function InstallAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const promptingRef = useRef(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [swReady, setSwReady] = useState(false);
  const [profile, setProfile] = useState<InstallProfile>(fallbackProfile);
  const [userDismissed, setUserDismissed] = useState(false);

  useEffect(() => {
    const detected = detectBrowser();
    setProfile(detected);
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

  const runNativePrompt = useCallback(async (): Promise<InstallOutcome> => {
    const bip = deferredRef.current;
    if (!bip || promptingRef.current) return "unavailable";
    promptingRef.current = true;
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
      return "guide";
    } finally {
      promptingRef.current = false;
    }
  }, []);

  const install = useCallback(async (): Promise<InstallOutcome> => {
    if (isInstalled) return "unavailable";
    if (deferredRef.current ?? deferred) {
      return runNativePrompt();
    }
    return "guide";
  }, [deferred, isInstalled, runNativePrompt]);

  const dismissInstall = useCallback(() => {
    setUserDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Auto native install on next tap once Chrome/Edge Android is ready.
  useEffect(() => {
    if (!deferred || isInstalled || userDismissed) return;
    if (!profile.supportsNativeInstall) return;

    const onGesture = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("[data-install-skip]")) return;
      if (!deferredRef.current || promptingRef.current) return;
      void runNativePrompt();
    };

    window.addEventListener("pointerdown", onGesture, true);
    return () => window.removeEventListener("pointerdown", onGesture, true);
  }, [
    deferred,
    isInstalled,
    userDismissed,
    profile.supportsNativeInstall,
    runNativePrompt,
  ]);

  const canPrompt = Boolean(deferred) && !isInstalled;
  const showInstallUi = hydrated && !isInstalled;

  const value = useMemo(
    () => ({
      canPrompt,
      isInstalled,
      showInstallUi,
      profile,
      browserKind: profile.kind,
      browserLabel: profile.label,
      platform: profile.platform,
      isChromium: profile.isChromium,
      isIos: profile.platform === "ios",
      swReady,
      install,
      dismissInstall,
    }),
    [
      canPrompt,
      isInstalled,
      showInstallUi,
      profile,
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
