"use client";

import { db } from "@/lib/db";
import type { Role } from "@/lib/types";
import { ChipSelect } from "@/components/modules/chip-select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WorkerModuleProps {
  role: Role | null;
  onRoleChange: (role: Role) => void;
}

export function WorkerModule({ role, onRoleChange }: WorkerModuleProps) {
  const worker = db.worker;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Worker profile
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {worker.name}
              </h2>
            </div>
            <Badge variant="secondary" className="text-sm">
              #{worker.employeeNumber}
            </Badge>
          </div>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Trade</dt>
              <dd className="font-medium text-right">{worker.trade}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Supervisor</dt>
              <dd className="font-medium text-right">{worker.supervisor}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-muted-foreground">Crew</dt>
              <dd className="font-medium text-right">{worker.crew}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-base font-semibold">Select today&apos;s role</h3>
        <ChipSelect
          options={worker.roles.map((r) => ({ id: r, label: r }))}
          selected={role ? [role] : []}
          onToggle={(id) => onRoleChange(id as Role)}
        />
      </div>
    </div>
  );
}
