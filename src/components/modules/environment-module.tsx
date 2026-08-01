"use client";

import { db } from "@/lib/db";
import { ChipSelect } from "@/components/modules/chip-select";

interface EnvironmentModuleProps {
  selected: string[];
  onToggle: (item: string) => void;
}

export function EnvironmentModule({
  selected,
  onToggle,
}: EnvironmentModuleProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Conditions suggested from today&apos;s weather and site hazards. Tap to
        adjust — leave blank if none apply.
      </p>
      <ChipSelect
        options={db.config.environmentOptions.map((e) => ({
          id: e,
          label: e,
        }))}
        selected={selected}
        onToggle={onToggle}
      />
    </div>
  );
}
