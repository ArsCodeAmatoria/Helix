"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FolderKanban,
  HardHat,
  Link2,
  Plus,
  ShieldAlert,
  TowerControl,
  Wrench,
} from "lucide-react";
import { getSjpDocuments, getSwpDocuments } from "@/lib/db";
import { craneCharts } from "@/lib/crane-charts";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleTile } from "@/components/modules/module-tile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    href: "/forms/inspections",
    label: "Inspections",
    icon: Wrench,
    color: "bg-[#f79009]",
  },
  {
    href: "/forms/swp",
    label: "SWPs",
    icon: BookOpen,
    color: "bg-[#0ba5ec]",
  },
  {
    href: "/forms/sjp",
    label: "SJPs",
    icon: ClipboardList,
    color: "bg-[#7a5af8]",
  },
  {
    href: "/forms/cranes",
    label: "Load charts",
    icon: TowerControl,
    color: "bg-[#ee46bc]",
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
    color: "bg-[#6172f3]",
  },
  {
    href: "/dashboard",
    label: "Safety Hub",
    icon: ShieldAlert,
    color: "bg-[#12b76a]",
    badge: 4,
  },
  {
    href: "/team",
    label: "My Crew",
    icon: HardHat,
    color: "bg-[#06aed4]",
  },
];

const recentForms = [
  {
    id: "f1",
    title: "FLHA — Oceanview Tower L28",
    href: "/forms/flha?project=proj-oceanview",
    status: "Submitted",
    time: "Today 06:42",
    statusColor:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  {
    id: "f2",
    title: "Crane daily — TC-1 Oceanview",
    href: "/forms/inspections/crane/eq-tc1",
    status: "Passed",
    time: "Today 06:15",
    statusColor:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  {
    id: "f3",
    title: "Rigging pre-use walkaround",
    href: "/forms/inspections/rigging",
    status: "Passed",
    time: "Today 06:25",
    statusColor:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  {
    id: "f4",
    title: "SJP — Blind Lift Radio Protocol",
    href: "/forms/documents/doc-sjp-blind",
    status: "Reviewed",
    time: "Today 06:10",
    statusColor:
      "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  },
  {
    id: "f5",
    title: "FLHA — Fraser Crossing Columns",
    href: "/forms/flha?project=proj-fraser",
    status: "Draft",
    time: "Yesterday",
    statusColor:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
];

export function FormsScreen() {
  const params = useSearchParams();
  const submitted = params.get("submitted") === "1";
  const swps = getSwpDocuments();
  const sjps = getSjpDocuments();

  return (
    <div>
      <PageHeader title="Forms & procedures" subtitle="FLHA, SWPs & SJPs" />
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

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/forms/inspections"
            className="helix-card flex flex-col gap-2 p-4 active:scale-[0.99]"
          >
            <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-700 dark:text-orange-400">
              <TowerControl className="size-5" />
            </div>
            <p className="font-bold leading-snug">Crane inspections</p>
            <p className="text-xs text-muted-foreground">
              Daily / shift log books per crane
            </p>
          </Link>
          <Link
            href="/forms/inspections"
            className="helix-card flex flex-col gap-2 p-4 active:scale-[0.99]"
          >
            <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-700 dark:text-violet-400">
              <Link2 className="size-5" />
            </div>
            <p className="font-bold leading-snug">Rigging inspections</p>
            <p className="text-xs text-muted-foreground">
              Bins, slings, bridles, hook &amp; block + more
            </p>
          </Link>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">Safe Work Procedures</h2>
            <Link
              href="/forms/swp"
              className="text-sm font-semibold text-primary"
            >
              See all ({swps.length})
            </Link>
          </div>
          <div className="space-y-2">
            {swps.slice(0, 3).map((doc) => (
              <Link
                key={doc.id}
                href={`/forms/documents/${doc.id}`}
                className="helix-card flex items-start gap-3 p-4 active:scale-[0.99]"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-700 dark:text-sky-400">
                  <BookOpen className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{doc.shortTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {doc.summary}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    SWP · v{doc.version}
                  </p>
                </div>
                <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">Safe Job Procedures</h2>
            <Link
              href="/forms/sjp"
              className="text-sm font-semibold text-primary"
            >
              See all ({sjps.length})
            </Link>
          </div>
          <div className="space-y-2">
            {sjps.slice(0, 3).map((doc) => (
              <Link
                key={doc.id}
                href={`/forms/documents/${doc.id}`}
                className="helix-card flex items-start gap-3 p-4 active:scale-[0.99]"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-700 dark:text-violet-400">
                  <ClipboardList className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{doc.shortTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {doc.summary}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    SJP · v{doc.version}
                  </p>
                </div>
                <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">Crane load charts</h2>
            <Link
              href="/forms/cranes"
              className="text-sm font-semibold text-primary"
            >
              See all ({craneCharts.length})
            </Link>
          </div>
          <div className="space-y-2">
            {craneCharts.slice(0, 3).map((chart) => (
              <a
                key={chart.id}
                href={chart.file}
                target="_blank"
                rel="noopener noreferrer"
                className="helix-card flex items-start gap-3 p-4 active:scale-[0.99]"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-700 dark:text-orange-400">
                  <TowerControl className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">
                    {chart.manufacturer} · {chart.model}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {chart.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF · {chart.type}
                  </p>
                </div>
                <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
              </a>
            ))}
            <Link
              href="/forms/cranes"
              className="helix-card flex items-center justify-center gap-2 p-4 text-sm font-semibold text-primary"
            >
              Browse Liebherr, Potain & Terex charts
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">All assets</h2>
            <Link
              href="/forms/documents"
              className="text-sm font-semibold text-primary"
            >
              All docs
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {assetModules.map((m, i) => (
              <ModuleTile key={m.label} {...m} delay={i * 0.04} />
            ))}
          </div>
        </section>

        <section className="space-y-3 pb-2">
          <h2 className="text-base font-bold">Recent activity</h2>
          {recentForms.map((f) => (
            <Link
              key={f.id}
              href={f.href}
              className="helix-card flex items-center gap-3 p-4 active:scale-[0.99]"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ClipboardList className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.time}</p>
              </div>
              <Badge className={cn("border-0", f.statusColor)}>{f.status}</Badge>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
