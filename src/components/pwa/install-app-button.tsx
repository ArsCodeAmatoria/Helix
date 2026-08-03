"use client";

import { useState } from "react";
import {
  markInstallDismissed,
  useInstallAppOptional,
} from "@/components/pwa/install-app-provider";
import type { InstallProfile } from "@/lib/browser";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

export function InstallGuideDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: InstallProfile;
}) {
  const steps = profile.steps.length
    ? profile.steps
    : [
        "Open your browser menu",
        "Choose Install app or Add to Home Screen",
        "Confirm to add the Proven icon",
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Install with {profile.shortLabel}</DialogTitle>
          <DialogDescription>{profile.summary}</DialogDescription>
        </DialogHeader>
        <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
          Detected: {profile.label}
        </p>
        <ol className="space-y-3 text-sm text-foreground">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span>{step}</span>
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
  const [guideOpen, setGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!installCtx?.showInstallUi) return null;

  async function onClick() {
    if (!installCtx || busy) return;
    setBusy(true);
    try {
      const outcome = await installCtx.install();
      if (outcome === "accepted") markInstallDismissed();
      if (outcome === "guide" || outcome === "dismissed") setGuideOpen(true);
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
        open={guideOpen}
        onOpenChange={setGuideOpen}
        profile={installCtx.profile}
      />
    </>
  );
}
