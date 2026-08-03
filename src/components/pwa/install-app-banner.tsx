"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { InstallGuideDialog } from "@/components/pwa/install-app-button";
import { useInstallAppOptional } from "@/components/pwa/install-app-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "proven-install-banner-dismissed";

/** Full-width home CTA — hard to miss. */
export function InstallAppBanner({ className }: { className?: string }) {
  const installCtx = useInstallAppOptional();
  const [dismissed, setDismissed] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!installCtx?.showInstallUi || dismissed) return null;

  async function onInstall() {
    if (!installCtx || busy) return;
    setBusy(true);
    try {
      const outcome = await installCtx.install();
      if (outcome === "guide" || outcome === "dismissed") setGuideOpen(true);
      if (outcome === "accepted") {
        try {
          localStorage.setItem(DISMISS_KEY, "1");
        } catch {
          /* ignore */
        }
      }
    } finally {
      setBusy(false);
    }
  }

  function onDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#2f6bff] to-[#0ea5e9] p-5 text-white shadow-lg",
          className
        )}
      >
        <div className="pointer-events-none absolute -right-6 -top-8 size-36 rounded-full bg-white/15 blur-2xl" />
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/20 text-white/90"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>

        <div className="relative flex items-start gap-3 pr-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={56}
            height={56}
            className="size-14 rounded-2xl bg-white shadow-md ring-2 ring-white/30"
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[11px] font-bold tracking-wide text-sky-100 uppercase">
              Install for the field
            </p>
            <h2 className="mt-0.5 text-xl font-bold leading-tight tracking-tight">
              Download the Proven app
            </h2>
            <p className="mt-1.5 text-sm leading-snug text-sky-50/95">
              Home-screen icon, full-screen mode, and offline safety forms when
              the site signal drops.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onInstall}
          disabled={busy}
          className="relative mt-4 h-14 w-full rounded-2xl bg-white text-base font-bold text-[#1e3a8a] shadow-md hover:bg-sky-50"
        >
          <Download className="size-5" />
          {busy
            ? "Opening…"
            : `Install with ${installCtx.profile.shortLabel}`}
        </Button>
      </div>

      <InstallGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        profile={installCtx.profile}
      />
    </>
  );
}
