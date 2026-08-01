"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  ClipboardCheck,
  Clock,
  CloudSun,
  FileText,
  FolderKanban,
  HardHat,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { getTodaysProjects, db } from "@/lib/db";
import { ProjectCard } from "@/components/modules/project-card";
import { ModuleTile } from "@/components/modules/module-tile";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTimeClock } from "@/components/providers/timeclock-provider";

const quickActions = [
  {
    href: "/timeclock",
    label: "Time Clock",
    icon: Clock,
    color: "bg-primary text-primary-foreground",
  },
  {
    href: "/forms/flha",
    label: "Start FLHA",
    icon: ClipboardCheck,
    color: "bg-muted text-foreground border border-border",
  },
  {
    href: "/projects",
    label: "My jobs",
    icon: FolderKanban,
    color: "bg-muted text-foreground border border-border",
  },
  {
    href: "/dashboard",
    label: "Safety",
    icon: ShieldAlert,
    color: "bg-muted text-foreground border border-border",
  },
];

const modules = [
  {
    href: "/timeclock",
    label: "Time Clock",
    icon: Clock,
    color: "bg-[#12b76a]",
  },
  {
    href: "/forms/flha",
    label: "FLHA",
    icon: ClipboardCheck,
    color: "bg-[#2f6bff]",
  },
  {
    href: "/statistics",
    label: "COR Stats",
    icon: ShieldAlert,
    color: "bg-[#f79009]",
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
    color: "bg-[#7a5af8]",
  },
  {
    href: "/forms",
    label: "Forms",
    icon: FileText,
    color: "bg-[#ee46bc]",
  },
  {
    href: "/team",
    label: "My Crew",
    icon: HardHat,
    color: "bg-[#06aed4]",
  },
];

export function HomeScreen() {
  const projects = getTodaysProjects();
  const company = db.company;
  const worker = db.worker;
  const unread = db.notifications.filter((n) => !n.read).length;
  const { activeVisit } = useTimeClock();
  const firstName = worker.name.split(" ")[0];
  const initials = worker.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  const moduleTiles = modules.map((m) =>
    m.href === "/timeclock" && activeVisit
      ? { ...m, badge: "IN" as string | number }
      : m
  );

  return (
    <div className="min-h-dvh bg-background">
      {/* Feed header — Connecteam-style greeting */}
      <header className="bg-card px-4 pb-4 pt-[max(0.85rem,env(safe-area-inset-top))] shadow-[0_1px_0_rgba(16,24,40,0.04)]">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 border-2 border-primary/15">
            <AvatarFallback className="bg-primary text-base font-bold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {company.shortName}
            </p>
            <h1 className="truncate text-[22px] font-bold leading-tight tracking-tight">
              Hi, {firstName} 👋
            </h1>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="relative size-11 rounded-full bg-muted"
            asChild
          >
            <Link href="/notifications" aria-label="Notifications">
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 size-2.5 rounded-full bg-rose-500 ring-2 ring-card" />
              )}
            </Link>
          </Button>
        </div>

        {/* Quick actions */}
        <div className="-mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm ${action.color}`}
              >
                <Icon className="size-4" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="space-y-6 px-4 py-5">
        {/* Weather strip */}
        {projects[0] && (
          <div className="helix-card flex items-center gap-3 px-4 py-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
              <CloudSun className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {projects[0].weather} · {projects[0].temperature}°C
              </p>
              <p className="truncate text-xs text-muted-foreground">
                On site · {projects[0].city}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-primary"
            >
              Alerts
            </Link>
          </div>
        )}

        {/* App module grid */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">Shortcuts</h2>
            <Link href="/forms" className="text-sm font-semibold text-primary">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {moduleTiles.map((m, i) => (
              <ModuleTile key={m.label} {...m} delay={i * 0.04} />
            ))}
          </div>
        </section>

        {/* Today's assigned work feed */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">For you today</h2>
            <Link href="/projects" className="text-sm font-semibold text-primary">
              All jobs
            </Link>
          </div>
          <div className="space-y-3">
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
              >
                <ProjectCard project={p} showStart />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Company updates */}
        <section className="pb-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">Company updates</h2>
            <Link
              href="/notifications"
              className="text-sm font-semibold text-primary"
            >
              See all
            </Link>
          </div>
          <div className="space-y-3">
            {db.notifications.slice(0, 3).map((n) => (
              <Link
                key={n.id}
                href={`/notifications/${n.id}`}
                className="helix-card block space-y-3 p-4 transition-shadow active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                    {company.logoText}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug">{n.title}</p>
                      {!n.read && (
                        <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {n.body}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {n.time} · {n.postedBy}
                    </p>
                  </div>
                </div>
                <span className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                  {n.cta}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
