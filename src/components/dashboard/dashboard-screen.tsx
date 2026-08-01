"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ClipboardCheck,
  CloudLightning,
  FileWarning,
  HardHat,
  Wrench,
} from "lucide-react";
import { db, getProject } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statCards = [
  {
    key: "outstandingDeficiencies",
    label: "Outstanding deficiencies",
    icon: AlertTriangle,
    color: "text-rose-600 bg-rose-500/10",
  },
  {
    key: "openCorrectiveActions",
    label: "Open corrective actions",
    icon: FileWarning,
    color: "text-amber-600 bg-amber-500/10",
  },
  {
    key: "todaysFlhas",
    label: "Today's FLHAs",
    icon: ClipboardCheck,
    color: "text-sky-600 bg-sky-500/10",
  },
  {
    key: "pendingReviews",
    label: "Pending reviews",
    icon: HardHat,
    color: "text-indigo-600 bg-indigo-500/10",
  },
  {
    key: "equipmentOutOfService",
    label: "Equipment out of service",
    icon: Wrench,
    color: "text-orange-600 bg-orange-500/10",
  },
  {
    key: "weatherAlerts",
    label: "Weather alerts",
    icon: CloudLightning,
    color: "text-cyan-600 bg-cyan-500/10",
  },
  {
    key: "upcomingInspections",
    label: "Upcoming inspections",
    icon: ClipboardCheck,
    color: "text-emerald-600 bg-emerald-500/10",
  },
] as const;

export function DashboardScreen() {
  const { stats, deficiencies, correctiveActions, weatherAlerts, upcomingInspections } =
    db.dashboard;

  return (
    <div>
      <PageHeader title="Activity" subtitle="Safety overview" />
      <main className="space-y-6 px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            const value = stats[card.key];
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="helix-card h-full p-4">
                  <div
                    className={cn(
                      "mb-3 flex size-11 items-center justify-center rounded-2xl",
                      card.color
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <p className="text-3xl font-bold tracking-tight">{value}</p>
                  <p className="mt-1 text-xs font-medium leading-snug text-muted-foreground">
                    {card.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {weatherAlerts.map((alert) => (
          <div
            key={alert.id}
            className="helix-card flex gap-3 border border-cyan-100 bg-cyan-50/80 p-4 dark:border-cyan-500/30 dark:bg-cyan-500/10"
          >
            <CloudLightning className="mt-0.5 size-5 shrink-0 text-cyan-600" />
            <div>
              <p className="font-semibold">{alert.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{alert.body}</p>
            </div>
          </div>
        ))}

        <section className="space-y-3">
          <h2 className="text-base font-bold">Outstanding deficiencies</h2>
          {deficiencies.map((d) => {
            const project = getProject(d.projectId);
            return (
              <div key={d.id} className="helix-card flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold leading-snug">{d.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {project?.projectNumber} · Due {d.dueDate}
                  </p>
                </div>
                <Badge
                  className={cn(
                    "border-0 capitalize",
                    d.severity === "high" && "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
                    d.severity === "medium" && "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
                    d.severity === "low" && "bg-slate-100 text-slate-600"
                  )}
                >
                  {d.severity}
                </Badge>
              </div>
            );
          })}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold">Open corrective actions</h2>
          {correctiveActions.map((ca) => (
            <div key={ca.id} className="helix-card p-4">
              <p className="font-semibold leading-snug">{ca.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {ca.assignee} · Due {ca.dueDate}
              </p>
            </div>
          ))}
        </section>

        <section className="space-y-3 pb-4">
          <h2 className="text-base font-bold">Upcoming inspections</h2>
          {upcomingInspections.map((insp) => {
            const project = getProject(insp.projectId);
            return (
              <div key={insp.id} className="helix-card p-4">
                <p className="font-semibold">{insp.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {project?.name} · {insp.date}
                </p>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
