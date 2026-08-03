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
const DISMISS_KEY = "proven-install-auto-dismissed";

/**
 * Auto-opens an install sheet on first visit (and when the browser
 * becomes ready to install), showing the Proven home-screen icon.
 */
export function InstallAppAutoPrompt() {
  const installCtx = useInstallAppOptional();
  const [open, setOpen] = useState(false);
  const [guide, setGuide] = useState<"ios" | "manual" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!installCtx?.showInstallUi) return;

    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
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

    // Open as soon as Chrome/Edge can install — icon + prompt ready.
    if (installCtx.canPrompt) {
      openSheet();
      return;
    }

    // First visit: show after a short beat so the icon has time to load.
    let shown = false;
    try {
      shown = sessionStorage.getItem(AUTO_KEY) === "1";
    } catch {
      shown = false;
    }
    if (shown) return;

    const timer = window.setTimeout(openSheet, 900);
    return () => window.clearTimeout(timer);
  }, [installCtx?.showInstallUi, installCtx?.canPrompt]);

  if (!installCtx?.showInstallUi) return null;

  async function onInstall() {
    if (!installCtx || busy) return;
    setBusy(true);
    try {
      const outcome = await installCtx.install();
      if (outcome === "accepted") {
        setOpen(false);
        try {
          localStorage.setItem(DISMISS_KEY, "1");
        } catch {
          /* ignore */
        }
      } else if (outcome === "ios-guide") {
        setOpen(false);
        setGuide("ios");
      } else if (outcome === "manual-guide") {
        setOpen(false);
        setGuide("manual");
      }
    } finally {
      setBusy(false);
    }
  }

  function onDismiss() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
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
        <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-[1.75rem] border-0 p-0 shadow-2xl">
          <div className="relative bg-gradient-to-br from-[#1e3a8a] via-[#2f6bff] to-[#0ea5e9] px-6 pt-6 pb-8 text-white">
            <button
              type="button"
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
              <DialogHeader className="mt-5 space-y-1.5 text-center sm:text-center">
                <DialogTitle className="text-2xl font-bold text-white">
                  Add Proven to your phone
                </DialogTitle>
                <DialogDescription className="text-sm text-sky-50/95">
                  The fingerprint icon installs on your home screen so crews can
                  open forms offline, full-screen.
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
                ? "Loading…"
                : installCtx.canPrompt
                  ? "Install with icon"
                  : "Download app now"}
            </Button>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-2 text-sm font-semibold text-muted-foreground"
            >
              Not now
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <InstallGuideDialog
        open={guide != null}
        onOpenChange={(next) => !next && setGuide(null)}
        mode={guide ?? "manual"}
      />
    </>
  );
}
