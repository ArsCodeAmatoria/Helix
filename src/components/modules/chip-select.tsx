"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChipSelectProps {
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  multi?: boolean;
  className?: string;
}

export function ChipSelect({
  options,
  selected,
  onToggle,
  className,
}: ChipSelectProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const active = selected.includes(opt.id);
        return (
          <motion.button
            key={opt.id}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onToggle(opt.id)}
            className={cn(
              "min-h-12 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/60"
            )}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}
