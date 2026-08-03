"use client";

import { SerwistProvider } from "@serwist/turbopack/react";

/**
 * Always register the service worker in the browser.
 * Chrome will not fire `beforeinstallprompt` (or allow install)
 * without an active SW + manifest.
 */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      register
      reloadOnOnline={false}
      cacheOnNavigation
    >
      {children}
    </SerwistProvider>
  );
}
