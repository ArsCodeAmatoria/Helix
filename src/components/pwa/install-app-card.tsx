"use client";

import { useState } from "react";
import { Download, Smartphone } from "lucide-react";
import {
  InstallGuideDialog,
} from "@/components/pwa/install-app-button";
import { useInstallAppOptional } from "@/components/pwa/install-app-provider";
import { Button } from "@/components/ui/button";

/** Profile / settings card to install the PWA. */
export function InstallAppCard() {
  const installCtx = useInstallAppOptional();
  const [guide, setGuide] = useState<"ios" | "manual" | null>(null);
  const [busy, setBusy] = useState(false);

  if (!installCtx) return null;

  if (installCtx.isInstalled) {
    return (
      <div className="helix-card flex items-center gap-3 border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
          <Smartphone className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Proven app installed</p>
          <p className="text-xs text-muted-foreground">
            You&apos;re running the standalone app.
          </p>
        </div>
      </div>
    );
  }

  async function onInstall() {
    if (!installCtx || busy) return;
    setBusy(true);
    try {
      const outcome = await installCtx.install();
      if (outcome === "ios-guide") setGuide("ios");
      if (outcome === "manual-guide") setGuide("manual");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#2f6bff] to-[#0ea5e9] p-4 text-white shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Download className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold">Download Proven app</p>
            <p className="mt-1 text-sm text-sky-50/95">
              Put Proven on your home screen for faster access on site.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onInstall}
          disabled={busy}
          className="mt-4 h-12 w-full rounded-2xl bg-white font-bold text-[#1e3a8a] hover:bg-sky-50"
        >
          <Download className="size-4" />
          {busy ? "Opening…" : "Download app now"}
        </Button>
      </div>

      <InstallGuideDialog
        open={guide != null}
        onOpenChange={(open) => !open && setGuide(null)}
        mode={guide ?? "manual"}
        browserKind={installCtx.browserKind}
      />
    </>
  );
}
