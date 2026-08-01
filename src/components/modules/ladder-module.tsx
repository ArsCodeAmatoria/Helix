"use client";

import { db } from "@/lib/db";
import type { FlhaFormState } from "@/lib/types";
import { ChipSelect } from "@/components/modules/chip-select";
import { YesNo } from "@/components/modules/yes-no";
import { Label } from "@/components/ui/label";

interface LadderModuleProps {
  ladder: FlhaFormState["ladder"];
  onToggleType: (type: string) => void;
  onSetField: (
    field: keyof FlhaFormState["ladder"],
    value: boolean | null
  ) => void;
}

export function LadderModule({
  ladder,
  onToggleType,
  onSetField,
}: LadderModuleProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Ladder Work selected — complete this quick check.
      </p>
      <div>
        <Label className="mb-3 block text-base font-semibold">Ladder type</Label>
        <ChipSelect
          options={db.config.ladderTypes.map((t) => ({ id: t, label: t }))}
          selected={ladder.types}
          onToggle={onToggleType}
        />
      </div>
      {(
        [
          ["correctLadder", "Correct ladder for the job?"],
          ["inspected", "Inspected before use?"],
          ["secured", "Secured / stable?"],
          ["threePointContact", "Three-point contact maintained?"],
        ] as const
      ).map(([field, label]) => (
        <div key={field}>
          <Label className="mb-2 block text-base font-semibold">{label}</Label>
          <YesNo
            value={ladder[field]}
            onChange={(v) => onSetField(field, v)}
          />
        </div>
      ))}
    </div>
  );
}
