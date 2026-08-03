"use client";

import { useState } from "react";
import { Download, Share } from "lucide-react";
import {
  markInstallDismissed,
  useInstallAppOptional,
} from "@/components/pwa/install-app-provider";
import { installStepsForBrowser, type BrowserKind } from "@/lib/browser";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function InstallGuideDialog({
  open,
  onOpenChange,
  mode,
  browserKind = "chrome",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "ios" | "manual";
  browserKind?: BrowserKind;
}) {
  const steps =
    mode === "ios"
      ? installStepsForBrowser("safari")
      : installStepsForBrowser(browserKind);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Download Proven app</DialogTitle>
          <DialogDescription>
            {mode === "ios"
              ? "Add Proven to your Home Screen for full-screen access and offline pages."
              : "Follow these steps in your browser to install the Proven icon."}
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-sm text-foreground">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span>
                {mode === "ios" && i === 0 ? (
                  <>
                    Tap{" "}
                    <Share className="mx-0.5 inline size-4 align-[-2px] text-sky-600" />{" "}
                    <strong>Share</strong> in Safari, then Add to Home Screen.
                  </>
                ) : (
                  step
                )}
              </span>
            </li>
          ))}
        </ol>
        <Button
          className="mt-2 h-12 w-full rounded-2xl text-base font-bold"
          onClick={() => onOpenChange(false)}
        >
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

type InstallAppButtonProps = {
  className?: string;
  variant?: "icon" | "chip";
};

export function InstallAppButton({
  className,
  variant = "icon",
}: InstallAppButtonProps) {
  const installCtx = useInstallAppOptional();
  const [guide, setGuide] = useState<"ios" | "manual" | null>(null);
  const [busy, setBusy] = useState(false);

  if (!installCtx?.showInstallUi) return null;

  async function onClick() {
    if (!installCtx || busy) return;
    setBusy(true);
    try {
      const outcome = await installCtx.install();
      if (outcome === "accepted") markInstallDismissed();
      if (outcome === "ios-guide") setGuide("ios");
      if (outcome === "manual-guide") setGuide("manual");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {variant === "chip" ? (
        <button
          type="button"
          onClick={onClick}
          disabled={busy}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-md ring-2 ring-primary/30",
            className
          )}
        >
          <Download className="size-4" />
          Download app
        </button>
      ) : (
        <Button
          type="button"
          size="icon"
          className={cn(
            "size-11 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90",
            className
          )}
          onClick={onClick}
          disabled={busy}
          aria-label="Download Proven app"
          title="Download app"
        >
          <Download className="size-5" />
        </Button>
      )}

      <InstallGuideDialog
        open={guide != null}
        onOpenChange={(open) => !open && setGuide(null)}
        mode={guide ?? "manual"}
        browserKind={installCtx.browserKind}
      />
    </>
  );
}
