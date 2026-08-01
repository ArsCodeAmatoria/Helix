"use client";

import { Check, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import type { Hazard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const severityStyle: Record<Hazard["severity"], string> = {
  critical: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  low: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
};

interface HazardModuleProps {
  hazards: Hazard[];
  confirmedIds: string[];
  onToggle: (id: string) => void;
  onConfirmAll: () => void;
}

export function HazardModule({
  hazards,
  confirmedIds,
  onToggle,
  onConfirmAll,
}: HazardModuleProps) {
  const allDone =
    hazards.length > 0 && hazards.every((h) => confirmedIds.includes(h.id));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Loaded from your tasks. Review each control, then confirm.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10 shrink-0 rounded-xl"
          onClick={onConfirmAll}
          disabled={allDone || hazards.length === 0}
        >
          Confirm all
        </Button>
      </div>

      {hazards.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
            <ShieldAlert className="size-8 opacity-50" />
            <p>Select tasks first to load hazards.</p>
          </CardContent>
        </Card>
      )}

      {hazards.map((hazard, i) => {
        const confirmed = confirmedIds.includes(hazard.id);
        return (
          <motion.div
            key={hazard.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card
              className={cn(
                "overflow-hidden transition-colors",
                confirmed && "border-emerald-500/40 bg-emerald-500/5"
              )}
            >
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{hazard.title}</h3>
                    <Badge
                      variant="outline"
                      className={cn("capitalize", severityStyle[hazard.severity])}
                    >
                      {hazard.severity}
                    </Badge>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggle(hazard.id)}
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 transition-colors",
                    confirmed
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                  aria-label={confirmed ? "Unconfirm" : "Confirm reviewed"}
                >
                  <Check className="size-6" strokeWidth={3} />
                </button>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Controls
                </p>
                <ul className="space-y-2">
                  {hazard.controls.map((c) => (
                    <li
                      key={c}
                      className="flex gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-sm leading-snug"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      {c}
                    </li>
                  ))}
                </ul>
                <p
                  className={cn(
                    "pt-1 text-sm font-medium",
                    confirmed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {confirmed ? "Reviewed ✓" : "Tap checkbox to confirm"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
