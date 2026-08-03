"use client";

import { useState } from "react";
import { Download, MoreVertical, Share } from "lucide-react";
import { useInstallAppOptional } from "@/components/pwa/install-app-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function InstallGuideDialog({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "ios" | "manual";
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Download Proven app</DialogTitle>
          <DialogDescription>
            {mode === "ios"
              ? "Add Proven to your Home Screen for full-screen access and offline pages."
              : "Install Proven from your browser menu — it only takes a second."}
          </DialogDescription>
        </DialogHeader>
        {mode === "ios" ? (
          <ol className="space-y-3 text-sm text-foreground">
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                1
              </span>
              <span>
                Tap{" "}
                <Share className="mx-0.5 inline size-4 align-[-2px] text-sky-600" />{" "}
                <strong>Share</strong> in Safari.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                2
              </span>
              <span>
                Scroll and choose <strong>Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                3
              </span>
              <span>
                Tap <strong>Add</strong> — Proven opens like a native app.
              </span>
            </li>
          </ol>
        ) : (
          <ol className="space-y-3 text-sm text-foreground">
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                1
              </span>
              <span>
                Tap the browser menu{" "}
                <MoreVertical className="mx-0.5 inline size-4 align-[-2px]" />{" "}
                (Chrome / Edge).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                2
              </span>
              <span>
                Choose <strong>Install app</strong> or{" "}
                <strong>Add to Home screen</strong>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                3
              </span>
              <span>
                Confirm — Proven installs with the fingerprint icon.
              </span>
            </li>
          </ol>
        )}
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
      />
    </>
  );
}

export { InstallGuideDialog };
