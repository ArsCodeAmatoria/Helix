"use client";

import { useState } from "react";
import { ExternalLink, FileText, Wrench, AlertTriangle } from "lucide-react";
import type { EquipmentInspection, EquipmentItem } from "@/lib/types";
import { getChartsForEquipment } from "@/lib/crane-charts";
import { YesNo } from "@/components/modules/yes-no";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface EquipmentModuleProps {
  equipment: EquipmentItem[];
  inspections: EquipmentInspection[];
  onUpdate: (equipmentId: string, patch: Partial<EquipmentInspection>) => void;
}

export function EquipmentModule({
  equipment,
  inspections,
  onUpdate,
}: EquipmentModuleProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = equipment.find((e) => e.id === activeId);
  const inspection = inspections.find((i) => i.equipmentId === activeId);
  const charts = activeId ? getChartsForEquipment(activeId) : [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Project equipment loaded. Tap an item to complete inspection.
      </p>
      {equipment.map((eq) => {
        const insp = inspections.find((i) => i.equipmentId === eq.id);
        const done = insp?.inspected !== null && insp?.inspected !== undefined;
        return (
          <button
            key={eq.id}
            type="button"
            onClick={() => setActiveId(eq.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
              done
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-border bg-card hover:border-primary/30",
              eq.status === "out-of-service" && "border-rose-500/40"
            )}
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Wrench className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{eq.name}</p>
              <p className="text-xs text-muted-foreground">
                {eq.assetTag}
                {eq.manufacturer ? ` · ${eq.manufacturer}` : ""}
                {eq.model ? ` ${eq.model}` : ""} · Last insp. {eq.lastInspection}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                eq.status === "out-of-service" &&
                  "border-rose-500/40 text-rose-600",
                eq.status === "maintenance" &&
                  "border-amber-500/40 text-amber-600"
              )}
            >
              {eq.status.replace("-", " ")}
            </Badge>
          </button>
        );
      })}

      <Dialog open={!!activeId} onOpenChange={(o) => !o && setActiveId(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{active?.name}</DialogTitle>
          </DialogHeader>
          {active && inspection && (
            <div className="space-y-5">
              {active.status === "out-of-service" && (
                <Card className="border-rose-500/40 bg-rose-500/5">
                  <CardContent className="flex items-center gap-2 p-3 text-sm text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="size-4 shrink-0" />
                    Tagged out of service — do not use.
                  </CardContent>
                </Card>
              )}

              {charts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-base">Load charts</Label>
                  {charts.map((chart) => (
                    <Button
                      key={chart.id}
                      asChild
                      variant="outline"
                      className="h-12 w-full justify-start rounded-xl font-semibold"
                    >
                      <a
                        href={chart.file}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="size-4" />
                        {chart.manufacturer} {chart.model}
                        <ExternalLink className="ml-auto size-4" />
                      </a>
                    </Button>
                  ))}
                </div>
              )}

              <div>
                <Label className="mb-2 block text-base">
                  Inspection completed?
                </Label>
                <YesNo
                  value={inspection.inspected}
                  onChange={(v) => onUpdate(active.id, { inspected: v })}
                />
              </div>
              <div>
                <Label className="mb-2 block text-base">Deficiencies?</Label>
                <YesNo
                  value={inspection.deficiencies}
                  onChange={(v) => onUpdate(active.id, { deficiencies: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Comments</Label>
                <Textarea
                  className="min-h-24 rounded-xl"
                  value={inspection.comments}
                  onChange={(e) =>
                    onUpdate(active.id, { comments: e.target.value })
                  }
                  placeholder="Optional notes"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
