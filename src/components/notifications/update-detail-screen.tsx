"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CloudLightning,
  Info,
  ListChecks,
  MapPin,
} from "lucide-react";
import { getNotification, getProject } from "@/lib/db";
import type { NotificationItem } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const typeIcon: Record<NotificationItem["type"], typeof AlertTriangle> = {
  alert: AlertTriangle,
  weather: CloudLightning,
  action: ListChecks,
  info: Info,
};

const typeColor: Record<NotificationItem["type"], string> = {
  alert: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  weather: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
  action: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  info: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
};

const typeLabel: Record<NotificationItem["type"], string> = {
  alert: "Alert",
  weather: "Weather",
  action: "Action required",
  info: "Company update",
};

export function UpdateDetailScreen({ id }: { id: string }) {
  const item = getNotification(id);
  if (!item) notFound();

  const project = item.projectId ? getProject(item.projectId) : undefined;
  const Icon = typeIcon[item.type];

  return (
    <div>
      <PageHeader
        title="Update"
        subtitle={item.time}
        backHref="/notifications"
      />

      <main className="space-y-5 px-4 py-5">
        <div className="helix-card space-y-4 p-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl",
                typeColor[item.type]
              )}
            >
              <Icon className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <Badge
                className={cn(
                  "mb-2 border-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                  typeColor[item.type]
                )}
              >
                {typeLabel[item.type]}
              </Badge>
              <h1 className="text-xl font-bold leading-snug tracking-tight">
                {item.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.postedBy} · {item.time}
              </p>
            </div>
          </div>

          <p className="text-[15px] leading-relaxed text-foreground">
            {item.detail}
          </p>

          {item.bullets && item.bullets.length > 0 && (
            <div className="space-y-2 rounded-2xl bg-muted/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                What to do
              </p>
              <ul className="space-y-2">
                {item.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex gap-2.5 text-sm leading-snug"
                  >
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
            className="helix-card flex items-start gap-3 p-4 transition-shadow active:scale-[0.99]"
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
            <Link href="/notifications">Back to updates</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
