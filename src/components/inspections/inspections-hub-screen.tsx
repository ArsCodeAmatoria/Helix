"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Link2,
  Plus,
  TowerControl,
} from "lucide-react";
import { useInspectionLog } from "@/components/providers/inspection-log-provider";
import {
  entryGearIds,
  gearResultFor,
  getCraneEquipment,
  getRiggingGear,
  normalizeRiggingEntry,
  riggingGear,
} from "@/lib/inspections";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "crane" | "rigging";

function overallStyle(overall?: string) {
  if (overall === "pass") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  }
  if (overall === "fail") {
    return "bg-rose-500/15 text-rose-700 dark:text-rose-400";
  }
  return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
}

export function InspectionsHubScreen() {
  const log = useInspectionLog();
  const [tab, setTab] = useState<Tab>("crane");
  const cranes = useMemo(() => getCraneEquipment(), []);
  const riggingSessions = log.allRiggingLogs();

  const cranePassToday = cranes.filter((c) => {
    const latest = log.latestCrane(c.id);
    if (!latest) return false;
    const d = new Date(latest.inspectedAt);
    const now = new Date();
    return (
      latest.overall === "pass" && d.toDateString() === now.toDateString()
    );
  }).length;

  const riggingFails = riggingGear.filter((g) => {
    const latest = log.latestRigging(g.id);
    if (!latest) return g.status !== "in-service";
    return (
      g.status !== "in-service" || gearResultFor(latest, g.id) === "fail"
    );
  }).length;

  return (
    <div>
      <PageHeader
        title="Inspection log books"
        subtitle="Crane & full rigger gear checks"
        backHref="/forms"
      />

      <main className="space-y-5 px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="helix-card p-4">
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-700 dark:text-orange-400">
              <TowerControl className="size-5" />
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {cranePassToday}/{cranes.length}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              Cranes passed today
            </p>
          </div>
          <div className="helix-card p-4">
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-400">
              <Link2 className="size-5" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{riggingFails}</p>
            <p className="text-xs font-medium text-muted-foreground">
              Rigging items needing attention
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["crane", "Cranes", TowerControl],
              ["rigging", "Rigging", Link2],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold",
                tab === id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-card text-muted-foreground ring-1 ring-border"
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "crane" && (
          <section className="space-y-2 pb-4">
            <p className="text-sm text-muted-foreground">
              Open a crane log book to review history or start today&apos;s
              inspection. Use the BC Crane binder for erection / climb docs.
            </p>
            <Link
              href="/forms/crane-binder"
              className="helix-card flex items-start gap-3 p-4 active:scale-[0.99]"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-700 dark:text-orange-400">
                <ClipboardCheck className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-snug">
                  BC Crane erection binder
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  FM-TC-01 site binder document checklist
                </p>
              </div>
              <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
            </Link>
            {cranes.map((crane) => {
              const latest = log.latestCrane(crane.id);
              const entries = log.craneLogFor(crane.id);
              return (
                <Link
                  key={crane.id}
                  href={`/forms/inspections/crane/${crane.id}`}
                  className="helix-card flex items-start gap-3 p-4 active:scale-[0.99]"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-700 dark:text-orange-400">
                    <TowerControl className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold leading-snug">{crane.name}</p>
                      <Badge variant="outline" className="capitalize">
                        {crane.status.replace("-", " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {crane.assetTag}
                      {crane.manufacturer ? ` · ${crane.manufacturer}` : ""}
                      {crane.model ? ` ${crane.model}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {latest ? (
                        <Badge
                          className={cn("border-0", overallStyle(latest.overall))}
                        >
                          Last: {latest.overall}
                        </Badge>
                      ) : (
                        <Badge className="border-0 bg-muted text-muted-foreground">
                          No entries
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {entries.length} log
                        {entries.length === 1 ? "" : "s"}
                        {latest
                          ? ` · ${new Date(latest.inspectedAt).toLocaleString()}`
                          : ""}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </section>
        )}

        {tab === "rigging" && (
          <section className="space-y-3 pb-4">
            <p className="text-sm text-muted-foreground">
              One inspection for the whole walkaround — check only the gear
              you&apos;re using.
            </p>

            <Button
              asChild
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-bold"
            >
              <Link href="/forms/inspections/rigging">
                <Plus className="size-5" />
                Open rigging inspection
              </Link>
            </Button>

            <p className="pt-1 text-sm font-bold">Recent sessions</p>
            {riggingSessions.length === 0 && (
              <div className="helix-card p-5 text-center text-sm text-muted-foreground">
                No rigging inspections logged yet.
              </div>
            )}
            {riggingSessions.slice(0, 8).map((raw) => {
              const entry = normalizeRiggingEntry(raw);
              const ids = entryGearIds(entry);
              return (
                <Link
                  key={entry.id}
                  href="/forms/inspections/rigging"
                  className="helix-card flex items-start gap-3 p-4 active:scale-[0.99]"
                >
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                      entry.overall === "fail"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                        : "bg-violet-500/15 text-violet-700 dark:text-violet-400"
                    )}
                  >
                    {entry.overall === "fail" ? (
                      <AlertTriangle className="size-5" />
                    ) : (
                      <Link2 className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className={cn(
                          "border-0 capitalize",
                          overallStyle(entry.overall)
                        )}
                      >
                        {entry.overall}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {entry.inspectionType.replace("-", " ")}
                      </Badge>
                    </div>
                    <p className="mt-2 font-semibold">
                      {new Date(entry.inspectedAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.inspector} · {ids.length} item
                      {ids.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {ids
                        .map((id) => getRiggingGear(id)?.assetTag ?? id)
                        .join(" · ")}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export function OverallIcon({ overall }: { overall: string }) {
  if (overall === "pass") {
    return <CheckCircle2 className="size-4 text-emerald-600" />;
  }
  if (overall === "fail") {
    return <AlertTriangle className="size-4 text-rose-600" />;
  }
  return <ClipboardCheck className="size-4 text-amber-600" />;
}
