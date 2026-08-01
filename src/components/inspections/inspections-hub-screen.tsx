"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Link2,
  TowerControl,
} from "lucide-react";
import { useInspectionLog } from "@/components/providers/inspection-log-provider";
import { getCraneEquipment, riggingGear } from "@/lib/inspections";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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

  const cranePassToday = cranes.filter((c) => {
    const latest = log.latestCrane(c.id);
    if (!latest) return false;
    const d = new Date(latest.inspectedAt);
    const now = new Date();
    return (
      latest.overall === "pass" &&
      d.toDateString() === now.toDateString()
    );
  }).length;

  const riggingIssues = riggingGear.filter((g) => {
    const latest = log.latestRigging(g.id);
    return (
      g.status !== "in-service" ||
      latest?.overall === "fail"
    );
  }).length;

  return (
    <div>
      <PageHeader
        title="Inspection log books"
        subtitle="Crane & rigging daily / pre-use logs"
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
            <p className="text-2xl font-bold tabular-nums">{riggingIssues}</p>
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
              inspection.
            </p>
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
                      <Badge
                        variant="outline"
                        className="capitalize"
                      >
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
                        <Badge className={cn("border-0", overallStyle(latest.overall))}>
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
          <section className="space-y-2 pb-4">
            <p className="text-sm text-muted-foreground">
              Pre-use and periodic inspections for each piece of gear.
            </p>
            {riggingGear.map((gear) => {
              const latest = log.latestRigging(gear.id);
              const entries = log.riggingLogFor(gear.id);
              const attention =
                gear.status !== "in-service" || latest?.overall === "fail";
              return (
                <Link
                  key={gear.id}
                  href={`/forms/inspections/rigging/${gear.id}`}
                  className={cn(
                    "helix-card flex items-start gap-3 p-4 active:scale-[0.99]",
                    attention && "ring-1 ring-rose-500/20"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                      attention
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                        : "bg-violet-500/15 text-violet-700 dark:text-violet-400"
                    )}
                  >
                    {attention ? (
                      <AlertTriangle className="size-5" />
                    ) : (
                      <Link2 className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold leading-snug">{gear.name}</p>
                      <Badge variant="outline" className="capitalize">
                        {gear.status.replace("-", " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {gear.assetTag} · {gear.capacity} · {gear.type}
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
                      </span>
                    </div>
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
