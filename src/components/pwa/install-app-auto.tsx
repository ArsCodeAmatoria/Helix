"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { InstallGuideDialog } from "@/components/pwa/install-app-button";
import { useInstallAppOptional } from "@/components/pwa/install-app-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AUTO_KEY = "proven-install-auto-shown";

/**
 * Auto-opens install for the detected browser.
 * Android Chrome/Edge: native prompt on tap.
 * iPhone Chrome/Safari/etc.: browser-specific Add to Home Screen steps.
 */
export function InstallAppAutoPrompt() {
  const installCtx = useInstallAppOptional();
  const [open, setOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!installCtx?.showInstallUi || dismissed) return;
    try {
      if (localStorage.getItem("proven-install-auto-dismissed") === "1") {
        setDismissed(true);
        return;
      }
    } catch {
      /* ignore */
    }

    const openSheet = () => {
      setOpen(true);
      try {
        sessionStorage.setItem(AUTO_KEY, "1");
      } catch {
        /* ignore */
      }
    };

    if (installCtx.canPrompt) {
      openSheet();
      return;
    }

    if (!installCtx.swReady) return;

    let shown = false;
    try {
      shown = sessionStorage.getItem(AUTO_KEY) === "1";
    } catch {
      shown = false;
    }
    if (shown) return;

    const timer = window.setTimeout(openSheet, 500);
    return () => window.clearTimeout(timer);
  }, [
    installCtx?.showInstallUi,
    installCtx?.canPrompt,
    installCtx?.swReady,
    dismissed,
  ]);

  if (!installCtx?.showInstallUi || dismissed) return null;

  const { profile, canPrompt } = installCtx;

  async function onInstall() {
    if (!installCtx || busy) return;
    setBusy(true);
    try {
      const outcome = await installCtx.install();
      if (outcome === "accepted") {
        setOpen(false);
        setDismissed(true);
      } else {
        // Always show steps for THIS browser — never Safari unless it is Safari.
        setOpen(false);
        setGuideOpen(true);
      }
    } finally {
      setBusy(false);
    }
  }

  function onDismiss(event?: React.SyntheticEvent) {
    event?.stopPropagation();
    event?.nativeEvent?.stopImmediatePropagation?.();
    installCtx?.dismissInstall();
    setDismissed(true);
    setOpen(false);
    try {
      sessionStorage.setItem(AUTO_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) onDismiss();
          else setOpen(true);
        }}
      >
        <DialogContent
          className="max-w-sm gap-0 overflow-hidden rounded-[1.75rem] border-0 p-0 shadow-2xl"
          onPointerDownCapture={(e) => {
            const el = e.target as HTMLElement | null;
            if (el?.closest("[data-install-skip]")) e.stopPropagation();
          }}
        >
          <div className="relative bg-gradient-to-br from-[#1e3a8a] via-[#2f6bff] to-[#0ea5e9] px-6 pt-6 pb-8 text-white">
            <button
              type="button"
              data-install-skip
              onClick={onDismiss}
              className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/20"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-[1.35rem] bg-white p-2.5 shadow-lg ring-4 ring-white/25">
                <Image
                  src="/icons/icon-192.png"
                  alt="Proven app icon"
                  width={96}
                  height={96}
                  priority
                  className="size-24 rounded-[1.1rem]"
                />
              </div>
              <p className="mt-4 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold tracking-wide text-sky-50 uppercase">
                {profile.shortLabel}
                {canPrompt
                  ? " · ready to install"
                  : installCtx.swReady
                    ? " · tap to continue"
                    : " · loading"}
              </p>
              <DialogHeader className="mt-3 space-y-1.5 text-center sm:text-center">
                <DialogTitle className="text-2xl font-bold text-white">
                  Install with {profile.shortLabel}
                </DialogTitle>
                <DialogDescription className="text-sm text-sky-50/95">
                  {canPrompt
                    ? `${profile.label} is ready. Tap below to install the Proven icon.`
                    : profile.summary}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="space-y-3 bg-card px-5 py-5">
            <Button
              type="button"
              onClick={onInstall}
              disabled={busy}
              className="h-14 w-full rounded-2xl text-base font-bold shadow-md"
            >
              <Download className="size-5" />
              {busy
                ? "Working…"
                : canPrompt
                  ? `Install with ${profile.shortLabel}`
                  : `Continue in ${profile.shortLabel}`}
            </Button>
            <button
              type="button"
              data-install-skip
              onClick={onDismiss}
              className="w-full py-2 text-sm font-semibold text-muted-foreground"
            >
              Not now
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <InstallGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        profile={profile}
      />
    </>
  );
}
