"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  /** Native install prompt is available (Chromium). */
  canPrompt: boolean;
  /** Running as installed PWA / standalone. */
  isInstalled: boolean;
  /** iOS Safari (needs Add to Home Screen guide). */
  isIos: boolean;
  /** Not installed — show prominent download UI. */
  showInstallUi: boolean;
  install: () => Promise<InstallOutcome>;
}

const InstallAppContext = createContext<InstallAppContextValue | null>(null);

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

export function InstallAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneDisplay());
    setIsIos(isIosDevice());
    setHydrated(true);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setIsInstalled(true);
    };
    const onDisplayChange = () => setIsInstalled(isStandaloneDisplay());

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", onDisplayChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  const install = useCallback(async (): Promise<InstallOutcome> => {
    if (isInstalled) return "unavailable";
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        return "accepted";
      }
      return "dismissed";
    }
    if (isIos) return "ios-guide";
    return "manual-guide";
  }, [deferred, isInstalled, isIos]);

  const canPrompt = Boolean(deferred) && !isInstalled;
  const showInstallUi = hydrated && !isInstalled;

  const value = useMemo(
    () => ({
      canPrompt,
      isInstalled,
      isIos,
      showInstallUi,
      install,
    }),
    [canPrompt, isInstalled, isIos, showInstallUi, install]
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
