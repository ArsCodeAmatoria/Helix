"use client";

import { FingerprintPattern } from "lucide-react";
import { cn } from "@/lib/utils";

type ProvenLogoProps = {
  className?: string;
  iconClassName?: string;
  /** Show wordmark next to the mark */
  withWordmark?: boolean;
  wordmarkClassName?: string;
};

/** Proven brand mark — Lucide fingerprint-pattern (https://lucide.dev/icons/fingerprint-pattern) */
export function ProvenLogo({
  className,
  iconClassName,
  withWordmark = false,
  wordmarkClassName,
}: ProvenLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground",
          iconClassName
        )}
        aria-hidden={!withWordmark}
      >
        <FingerprintPattern className="size-[55%] stroke-[2.25]" />
      </span>
      {withWordmark && (
        <span
          className={cn(
            "text-lg font-bold tracking-tight text-foreground",
            wordmarkClassName
          )}
        >
          Proven
        </span>
      )}
      <span className="sr-only">Proven</span>
    </span>
  );
}

/** @deprecated Use ProvenLogo */
export const HelixLogo = ProvenLogo;
