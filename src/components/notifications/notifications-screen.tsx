"use client";

import Link from "next/link";
import { ChevronRight, Bell, CloudLightning, Info, AlertTriangle, ListChecks } from "lucide-react";
import { db } from "@/lib/db";
import type { NotificationItem } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
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
  action: "Action",
  info: "Update",
};

export function NotificationsScreen() {
  const items = db.notifications;
  const unread = items.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Updates"
        subtitle={`${unread} unread · ${items.length} total`}
        action={
          <div className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Bell className="size-5 text-muted-foreground" />
          </div>
        }
      />
      <main className="space-y-3 px-4 py-5">
        {items.map((n) => {
          const Icon = typeIcon[n.type];
          return (
            <Link
              key={n.id}
              href={`/notifications/${n.id}`}
              className={cn(
                "helix-card flex gap-3 p-4 transition-shadow active:scale-[0.99]",
                !n.read && "ring-2 ring-primary/15"
              )}
            >
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                  typeColor[n.type]
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge
                        className={cn(
                          "border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          typeColor[n.type]
                        )}
                      >
                        {typeLabel[n.type]}
                      </Badge>
                      {!n.read && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                          New
                        </span>
                      )}
                    </div>
                    <p className="font-semibold leading-snug">{n.title}</p>
                  </div>
                  <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {n.body}
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {n.time} · {n.cta}
                </p>
              </div>
            </Link>
          );
        })}
      </main>
    </div>
  );
}
