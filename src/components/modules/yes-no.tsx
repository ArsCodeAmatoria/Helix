"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface YesNoProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  className?: string;
}

export function YesNo({
  value,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
  className,
}: YesNoProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {[
        { v: true, label: yesLabel },
        { v: false, label: noLabel },
      ].map((opt) => {
        const active = value === opt.v;
        return (
          <motion.button
            key={String(opt.v)}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(opt.v)}
            className={cn(
              "min-h-14 rounded-2xl border-2 text-base font-semibold transition-colors",
              active
                ? opt.v
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-500 bg-slate-600 text-white"
                : "border-border bg-card text-foreground hover:bg-muted/50"
            )}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}
