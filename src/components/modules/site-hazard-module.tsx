"use client";

import { Plus, Trash2 } from "lucide-react";
import type { AdditionalHazard } from "@/lib/types";
import { YesNo } from "@/components/modules/yes-no";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SiteHazardModuleProps {
  enabled: boolean | null;
  hazards: AdditionalHazard[];
  onEnabledChange: (v: boolean) => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<AdditionalHazard>) => void;
  onRemove: (id: string) => void;
}

export function SiteHazardModule({
  enabled,
  hazards,
  onEnabledChange,
  onAdd,
  onUpdate,
  onRemove,
}: SiteHazardModuleProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-3 text-lg font-semibold leading-snug">
          Any additional hazards today?
        </h3>
        <YesNo value={enabled} onChange={onEnabledChange} />
      </div>

      {enabled && (
        <div className="space-y-4">
          {hazards.map((h, i) => (
            <Card key={h.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <p className="font-semibold">Additional hazard {i + 1}</p>
                {hazards.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 text-destructive"
                    onClick={() => onRemove(h.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Hazard</Label>
                  <Input
                    className="h-12 rounded-xl"
                    value={h.hazard}
                    onChange={(e) => onUpdate(h.id, { hazard: e.target.value })}
                    placeholder="Describe the hazard"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Control</Label>
                  <Textarea
                    className="min-h-20 rounded-xl"
                    value={h.control}
                    onChange={(e) => onUpdate(h.id, { control: e.target.value })}
                    placeholder="How will you control it?"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Responsible person</Label>
                  <Input
                    className="h-12 rounded-xl"
                    value={h.responsiblePerson}
                    onChange={(e) =>
                      onUpdate(h.id, { responsiblePerson: e.target.value })
                    }
                    placeholder="Name"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl"
            onClick={onAdd}
          >
            <Plus className="size-4" />
            Add another hazard
          </Button>
        </div>
      )}

      {enabled === false && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 text-sm text-emerald-800 dark:text-emerald-300">
            No additional site-specific hazards noted for today.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
