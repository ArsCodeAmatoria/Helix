"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FolderKanban,
  HardHat,
  Plus,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleTile } from "@/components/modules/module-tile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const assetModules = [
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
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
    color: "bg-[#f79009]",
  },
  {
    href: "/dashboard",
    label: "Safety Hub",
    icon: ShieldAlert,
    color: "bg-[#ee46bc]",
    badge: 4,
  },
  {
    href: "/dashboard",
    label: "Equipment",
    icon: Wrench,
    color: "bg-[#7a5af8]",
  },
  {
    href: "/profile",
    label: "My Crew",
    icon: HardHat,
    color: "bg-[#06aed4]",
  },
];

const recentForms = [
  {
    id: "f1",
    title: "FLHA — Oceanview Tower L28",
    status: "Submitted",
    time: "Today 06:42",
    statusColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  {
    id: "f2",
    title: "FLHA — Fraser Crossing Columns",
    status: "Draft",
    time: "Today 05:58",
    statusColor: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  {
    id: "f3",
    title: "Equipment inspection — TC-1",
    status: "Reviewed",
    time: "Yesterday",
    statusColor: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  },
];

export function FormsScreen() {
  const params = useSearchParams();
  const submitted = params.get("submitted") === "1";

  return (
    <div>
      <PageHeader title="Assets" subtitle="Forms, jobs & resources" />
      <main className="space-y-6 px-4 py-5">
        {submitted && (
          <div className="helix-card flex items-center gap-3 border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <CheckCircle2 className="size-6 text-emerald-600" />
            <div>
              <p className="font-semibold">FLHA submitted</p>
              <p className="text-sm text-muted-foreground">
                Saved · ready for supervisor review
              </p>
            </div>
          </div>
        )}

        <Button
          asChild
          size="lg"
          className="h-14 w-full rounded-2xl text-base font-bold shadow-md shadow-primary/20"
        >
          <Link href="/forms/flha">
            <Plus className="size-5" />
            Start new FLHA
          </Link>
        </Button>

        <section>
          <h2 className="mb-3 text-base font-bold">All assets</h2>
          <div className="grid grid-cols-3 gap-3">
            {assetModules.map((m, i) => (
              <ModuleTile key={m.label} {...m} delay={i * 0.04} />
            ))}
          </div>
        </section>

        <section className="space-y-3 pb-2">
          <h2 className="text-base font-bold">Recent activity</h2>
          {recentForms.map((f) => (
            <div key={f.id} className="helix-card flex items-center gap-3 p-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ClipboardList className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.time}</p>
              </div>
              <Badge className={`border-0 ${f.statusColor}`}>{f.status}</Badge>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
