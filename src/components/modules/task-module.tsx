"use client";

import { db } from "@/lib/db";
import type { TaskCategory } from "@/lib/types";
import { ChipSelect } from "@/components/modules/chip-select";

const CATEGORIES: TaskCategory[] = ["FORMWORK", "RIGGER", "TOWER CRANE"];

interface TaskModuleProps {
  selected: string[];
  onToggle: (taskId: string) => void;
}

export function TaskModule({ selected, onToggle }: TaskModuleProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Tap everything you&apos;ll do today. Hazards load automatically — no typing.
      </p>
      {CATEGORIES.map((cat) => {
        const tasks = db.tasks.filter((t) => t.category === cat);
        return (
          <section key={cat}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              {cat}
            </h3>
            <ChipSelect
              options={tasks.map((t) => ({ id: t.id, label: t.label }))}
              selected={selected}
              onToggle={onToggle}
            />
          </section>
        );
      })}
    </div>
  );
}
