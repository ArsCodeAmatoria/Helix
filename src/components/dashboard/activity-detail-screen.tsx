"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  CloudLightning,
  FileWarning,
  MapPin,
  Wrench,
} from "lucide-react";
import {
  getCorrectiveAction,
  getDeficiency,
  getEquipment,
  getProject,
  getUpcomingInspection,
  getWeatherAlert,
} from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ActivityKind = "deficiency" | "action" | "weather" | "inspection";

const kindMeta: Record<
  ActivityKind,
  { label: string; icon: typeof AlertTriangle; color: string }
> = {
  deficiency: {
    label: "Deficiency",
    icon: AlertTriangle,
    color: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  },
  action: {
    label: "Corrective action",
    icon: FileWarning,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  weather: {
    label: "Weather alert",
    icon: CloudLightning,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400",
  },
  inspection: {
    label: "Inspection",
    icon: ClipboardCheck,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
};

export function ActivityDetailScreen({
  kind,
  id,
}: {
  kind: ActivityKind;
  id: string;
}) {
  const item = resolveItem(kind, id);
  if (!item) notFound();

  const meta = kindMeta[kind];
  const Icon = meta.icon;
  const project = getProject(item.projectId);
  const equipment =
    "equipmentId" in item && item.equipmentId
      ? getEquipment(item.equipmentId)
      : undefined;

  return (
    <div>
      <PageHeader title={meta.label} subtitle={item.metaLine} backHref="/dashboard" />

      <main className="space-y-5 px-4 py-5">
        <div className="helix-card space-y-4 p-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl",
                meta.color
              )}
            >
              <Icon className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge className={cn("border-0 capitalize", meta.color)}>
                  {meta.label}
                </Badge>
                {"severity" in item && item.severity && (
                  <Badge
                    className={cn(
                      "border-0 capitalize",
                      item.severity === "high" &&
                        "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
                      item.severity === "medium" &&
                        "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
                      item.severity === "low" && "bg-slate-100 text-slate-600"
                    )}
                  >
                    {item.severity}
                  </Badge>
                )}
                {"priority" in item && item.priority && (
                  <Badge
                    className={cn(
                      "border-0 capitalize",
                      item.priority === "high" &&
                        "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
                      item.priority === "medium" &&
                        "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
                      item.priority === "low" && "bg-slate-100 text-slate-600"
                    )}
                  >
                    {item.priority}
                  </Badge>
                )}
                {"status" in item && item.status && (
                  <Badge variant="secondary" className="border-0 capitalize">
                    {item.status.replace("-", " ")}
                  </Badge>
                )}
              </div>
              <h1 className="text-xl font-bold leading-snug tracking-tight">
                {item.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{item.metaLine}</p>
            </div>
          </div>

          <p className="text-[15px] leading-relaxed">{item.description}</p>

          {item.bullets.length > 0 && (
            <div className="space-y-2 rounded-2xl bg-muted/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                What to do
              </p>
              <ul className="space-y-2">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2.5 text-sm leading-snug">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {project && (
          <Link
            href={`/projects/${project.id}`}
            className="helix-card flex items-start gap-3 p-4 active:scale-[0.99]"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Related project
              </p>
              <p className="font-semibold leading-snug">{project.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {project.address}, {project.city}
              </p>
            </div>
            <ArrowRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
          </Link>
        )}

        {equipment && (
          <div className="helix-card flex items-start gap-3 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
              <Wrench className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Equipment
              </p>
              <p className="font-semibold leading-snug">{equipment.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {equipment.assetTag} · {equipment.status.replace(/-/g, " ")}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-2 pb-4">
          <Button asChild size="lg" className="h-14 rounded-2xl text-base font-bold">
            <Link href={item.href}>
              {item.cta}
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-2xl font-semibold"
          >
            <Link href="/dashboard">Back to activity</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function resolveItem(kind: ActivityKind, id: string) {
  if (kind === "deficiency") {
    const d = getDeficiency(id);
    if (!d) return null;
    return {
      title: d.title,
      description: d.description,
      projectId: d.projectId,
      href: d.href,
      cta: d.cta,
      bullets: d.bullets,
      severity: d.severity,
      status: d.status,
      metaLine: `${d.location} · Due ${d.dueDate} · ${d.assignee}`,
    };
  }
  if (kind === "action") {
    const a = getCorrectiveAction(id);
    if (!a) return null;
    return {
      title: a.title,
      description: a.description,
      projectId: a.projectId,
      href: a.href,
      cta: a.cta,
      bullets: a.bullets,
      priority: a.priority,
      status: a.status,
      metaLine: `${a.assignee} · Due ${a.dueDate}`,
    };
  }
  if (kind === "weather") {
    const w = getWeatherAlert(id);
    if (!w) return null;
    return {
      title: w.title,
      description: w.description,
      projectId: w.projectId,
      href: w.href,
      cta: w.cta,
      bullets: w.bullets,
      severity: w.severity,
      metaLine: `Issued ${w.issuedAt} · Expires ${w.expiresAt}`,
    };
  }
  const i = getUpcomingInspection(id);
  if (!i) return null;
  return {
    title: i.title,
    description: i.description,
    projectId: i.projectId,
    href: i.href,
    cta: i.cta,
    bullets: i.bullets,
    equipmentId: i.equipmentId,
    metaLine: `${i.type} · ${i.date} · ${i.inspector}`,
  };
}
