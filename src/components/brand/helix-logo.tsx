"use client";

import { Dna } from "lucide-react";
import { cn } from "@/lib/utils";

type HelixLogoProps = {
  className?: string;
  iconClassName?: string;
  /** Show wordmark next to the mark */
  withWordmark?: boolean;
  wordmarkClassName?: string;
};

/** Helix brand mark — Lucide DNA (https://lucide.dev/icons/dna) */
export function HelixLogo({
  className,
  iconClassName,
  withWordmark = false,
  wordmarkClassName,
}: HelixLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground",
          iconClassName
        )}
        aria-hidden={!withWordmark}
      >
        <Dna className="size-[55%] stroke-[2.25]" />
      </span>
      {withWordmark && (
        <span
          className={cn(
            "text-lg font-bold tracking-tight text-foreground",
            wordmarkClassName
          )}
        >
          Helix
        </span>
      )}
      <span className="sr-only">Helix</span>
    </span>
  );
}
