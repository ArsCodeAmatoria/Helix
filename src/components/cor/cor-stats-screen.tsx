"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  FileWarning,
  Hammer,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  computeCorReadiness,
  type CoverageLevel,
} from "@/lib/cor-stats";
import { pdfToDigitalFormId } from "@/lib/digital-forms";
import { computeWorkerCompliance } from "@/lib/cor-worker";
import {
  computeWorkerActivity,
  getMemberActivity,
  type ActivityBarItem,
  type MemberActivitySummary,
} from "@/lib/worker-activity";
import { useTeamOptional } from "@/components/providers/team-provider";
import { members as allMembers, initials } from "@/lib/team";
import { PageHeader } from "@/components/layout/page-header";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const levelStyle: Record<CoverageLevel, string> = {
  strong: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  partial: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  interview: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  gap: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

const levelLabel: Record<CoverageLevel, string> = {
  strong: "Documented",
  partial: "Partial",
  interview: "Interview",
  gap: "Gap",
};

type View = "workers" | "activity" | "company";
type WorkerFilter = "all" | "missing" | "compliant" | "crew";

function ActivityBars({
  items,
  valueLabel = "selections",
}: {
  items: ActivityBarItem[];
  valueLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.id} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.label}</p>
              {item.secondary && (
                <p className="text-[11px] text-muted-foreground">
                  {item.secondary}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-sm font-bold tabular-nums">
                {item.count}
                {item.hours != null ? (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {" "}
                    · {item.hours}h
                  </span>
                ) : null}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {item.percent}% of {valueLabel}
              </p>
            </div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / max) * 100}%` }}
              transition={{ delay: i * 0.03, duration: 0.35 }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CorStatsScreen() {
  const team = useTeamOptional();
  const readiness = useMemo(() => computeCorReadiness(), []);
  const activity = useMemo(() => computeWorkerActivity(), []);
  const [view, setView] = useState<View>("workers");
  const [selectedId, setSelectedId] = useState<number | null>(
    readiness.elements[0]?.element.id ?? null
  );
  const [workerFilter, setWorkerFilter] = useState<WorkerFilter>("all");
  const [workerQuery, setWorkerQuery] = useState("");
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(
    null
  );
  const [activityWorkerQuery, setActivityWorkerQuery] = useState("");
  const [activityWorkerFilter, setActivityWorkerFilter] = useState<
    "all" | "crew"
  >("all");

  const selected =
    readiness.elements.find((e) => e.element.id === selectedId) ??
    readiness.elements[0];

  const compliance = useMemo(() => {
    const pool =
      workerFilter === "crew" && team?.todaysMembers.length
        ? team.todaysMembers
        : allMembers;
    return computeWorkerCompliance(pool);
  }, [workerFilter, team?.todaysMembers]);

  const filteredWorkers = useMemo(() => {
    const q = workerQuery.trim().toLowerCase();
    return compliance.workers.filter((w) => {
      if (workerFilter === "missing" && w.compliant) return false;
      if (workerFilter === "compliant" && !w.compliant) return false;
      if (!q) return true;
      return (
        w.member.name.toLowerCase().includes(q) ||
        w.member.employeeNumber.includes(q) ||
        w.member.role.toLowerCase().includes(q) ||
        w.member.trade.toLowerCase().includes(q) ||
        w.missing.some((m) =>
          m.requirement.name.toLowerCase().includes(q)
        )
      );
    });
  }, [compliance.workers, workerFilter, workerQuery]);

  const filteredActivityWorkers = useMemo(() => {
    const pool =
      activityWorkerFilter === "crew" && team?.todaysMembers.length
        ? new Set(team.todaysMembers.map((m) => m.id))
        : null;
    const q = activityWorkerQuery.trim().toLowerCase();
    return activity.byWorker.filter((w) => {
      if (pool && !pool.has(w.member.id)) return false;
      if (!q) return true;
      return (
        w.member.name.toLowerCase().includes(q) ||
        w.member.employeeNumber.includes(q) ||
        w.member.role.toLowerCase().includes(q) ||
        w.member.trade.toLowerCase().includes(q) ||
        w.topTasks.some((t) => t.label.toLowerCase().includes(q))
      );
    });
  }, [
    activity.byWorker,
    activityWorkerFilter,
    activityWorkerQuery,
    team?.todaysMembers,
  ]);

  return (
    <div>
      <PageHeader
        title="COR Statistics"
        subtitle="Worker compliance, work activity & audit readiness"
      />

      <main className="space-y-5 px-4 py-5">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["workers", "Workers", Users],
              ["activity", "Work", BarChart3],
              ["company", "Audit", Shield],
            ] as const
          ).map(([id, label, Icon]) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-card text-muted-foreground ring-1 ring-border"
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>

        {view === "activity" && (
          <>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-5 text-white shadow-lg">
              <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-orange-500/20 blur-3xl" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-300">
                  What workers do most · {activity.periodLabel}
                </p>
                <p className="mt-2 text-lg font-bold leading-snug">
                  {activity.topTasks[0]?.label ?? "—"} leads FLHA tasks
                </p>
                <p className="mt-2 text-sm text-slate-300">{activity.insight}</p>
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 px-3 py-2.5">
                  <p className="font-mono text-2xl font-bold tabular-nums">
                    {activity.totalFlhas}
                  </p>
                  <p className="text-[11px] text-slate-300">FLHAs logged</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-2.5">
                  <p className="font-mono text-2xl font-bold tabular-nums">
                    {activity.totalHours}
                    <span className="text-base text-orange-300">h</span>
                  </p>
                  <p className="text-[11px] text-slate-300">Crew hours</p>
                </div>
              </div>
              <p className="relative mt-3 text-[11px] text-slate-400">
                {activity.siteNote}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Kpi
                icon={<Hammer className="size-4" />}
                color="bg-orange-500/10 text-orange-600"
                value={activity.topTasks[0]?.label ?? "—"}
                label="Top task"
              />
              <Kpi
                icon={<BarChart3 className="size-4" />}
                color="bg-sky-500/10 text-sky-600"
                value={activity.byCategory[0]?.label ?? "—"}
                label="Top category"
              />
              <Kpi
                icon={<Users className="size-4" />}
                color="bg-violet-500/10 text-violet-600"
                value={activity.byWorker[0]?.member.name.split(" ")[0] ?? "—"}
                label="Top hours"
              />
              <Kpi
                icon={<ClipboardList className="size-4" />}
                color="bg-emerald-500/10 text-emerald-600"
                value={`${activity.topTasks[0]?.percent ?? 0}%`}
                label="Share of selections"
              />
            </div>

            <section className="helix-card space-y-4 p-4">
              <div>
                <h2 className="text-base font-bold">Top tasks</h2>
                <p className="text-sm text-muted-foreground">
                  Most common FLHA task selections — what crews actually do.
                </p>
              </div>
              <ActivityBars items={activity.topTasks} />
            </section>

            <section className="helix-card space-y-4 p-4">
              <div>
                <h2 className="text-base font-bold">By work category</h2>
                <p className="text-sm text-muted-foreground">
                  Formwork vs rigging vs tower crane mix.
                </p>
              </div>
              <ActivityBars items={activity.byCategory} />
            </section>

            <section className="helix-card space-y-4 p-4">
              <div>
                <h2 className="text-base font-bold">Roster by role</h2>
                <p className="text-sm text-muted-foreground">
                  How the workforce is composed today.
                </p>
              </div>
              <ActivityBars items={activity.byRole} valueLabel="workers" />
            </section>

            <section className="helix-card space-y-4 p-4">
              <div>
                <h2 className="text-base font-bold">Roster by trade</h2>
                <p className="text-sm text-muted-foreground">
                  Trade groups across the company directory.
                </p>
              </div>
              <ActivityBars items={activity.byTrade} valueLabel="workers" />
            </section>

            <section className="space-y-3 pb-6">
              <div>
                <h2 className="text-base font-bold">
                  Individual workers ({filteredActivityWorkers.length})
                </h2>
                <p className="text-sm text-muted-foreground">
                  FLHAs, hours, and top tasks per person ·{" "}
                  {activity.periodLabel.toLowerCase()}.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={activityWorkerQuery}
                  onChange={(e) => setActivityWorkerQuery(e.target.value)}
                  placeholder="Search worker or task…"
                  className="h-14 rounded-2xl pl-11 text-base"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All"],
                    ["crew", "Today's crew"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActivityWorkerFilter(id)}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-semibold",
                      activityWorkerFilter === id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activityWorkerFilter === "crew" &&
                !team?.todaysMembers.length && (
                  <div className="helix-card p-4 text-sm text-muted-foreground">
                    No crew selected for today. Fill My Team first, or view All
                    workers.
                  </div>
                )}

              {filteredActivityWorkers.length === 0 && (
                <div className="helix-card p-6 text-center text-sm text-muted-foreground">
                  No workers match this filter.
                </div>
              )}

              <div className="space-y-2">
                {filteredActivityWorkers.map((w, i) => (
                  <WorkerActivityCard
                    key={w.member.id}
                    summary={w}
                    index={i}
                    open={expandedActivityId === w.member.id}
                    onToggle={() =>
                      setExpandedActivityId(
                        expandedActivityId === w.member.id
                          ? null
                          : w.member.id
                      )
                    }
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {view === "workers" && (
          <>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-lg">
              <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
                    Worker compliance
                  </p>
                  <p className="mt-2 font-mono text-5xl font-bold tabular-nums tracking-tight">
                    {compliance.percentCompliant}
                    <span className="text-2xl text-sky-300">%</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {compliance.compliantCount} of {compliance.workers.length}{" "}
                    workers meet role requirements
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-center text-xs font-bold uppercase tracking-wide",
                    compliance.nonCompliantCount === 0
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-200"
                  )}
                >
                  {compliance.nonCompliantCount === 0 ? (
                    <UserCheck className="mx-auto mb-1 size-5" />
                  ) : (
                    <UserX className="mx-auto mb-1 size-5" />
                  )}
                  {compliance.nonCompliantCount === 0
                    ? "All compliant"
                    : `${compliance.nonCompliantCount} gaps`}
                </div>
              </div>
              <Progress
                value={compliance.percentCompliant}
                className="relative mt-4 h-3 bg-white/10 [&_[data-slot=progress-indicator]]:bg-emerald-400"
              />
              <p className="relative mt-3 text-[11px] text-slate-400">
                {compliance.source}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Kpi
                icon={<CheckCircle2 className="size-4" />}
                color="bg-emerald-500/10 text-emerald-600"
                value={String(compliance.compliantCount)}
                label="Compliant workers"
              />
              <Kpi
                icon={<AlertTriangle className="size-4" />}
                color="bg-rose-500/10 text-rose-600"
                value={String(compliance.nonCompliantCount)}
                label="Need training"
              />
              <Kpi
                icon={<ClipboardList className="size-4" />}
                color="bg-amber-500/10 text-amber-600"
                value={String(compliance.totalMissing)}
                label="Missing requirements"
              />
              <Kpi
                icon={<Users className="size-4" />}
                color="bg-sky-500/10 text-sky-600"
                value={String(compliance.workers.length)}
                label="Workers in view"
              />
            </div>

            <button
              type="button"
              onClick={() => setView("activity")}
              className="helix-card flex w-full items-center gap-3 p-4 text-left active:scale-[0.99]"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-700 dark:text-orange-400">
                <BarChart3 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">What workers do most</p>
                <p className="text-sm text-muted-foreground">
                  {activity.topTasks[0]?.label} ·{" "}
                  {activity.topTasks[0]?.percent}% of FLHA tasks
                </p>
              </div>
              <Badge variant="secondary">Open</Badge>
            </button>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={workerQuery}
                onChange={(e) => setWorkerQuery(e.target.value)}
                placeholder="Search worker or missing requirement…"
                className="h-14 rounded-2xl pl-11 text-base"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["missing", "Missing"],
                  ["compliant", "Compliant"],
                  ["crew", "Today's crew"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setWorkerFilter(id)}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-semibold",
                    workerFilter === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {workerFilter === "crew" && !team?.todaysMembers.length && (
              <div className="helix-card p-4 text-sm text-muted-foreground">
                No crew selected for today. Fill My Team first, or view All
                workers.
              </div>
            )}

            <section className="space-y-2 pb-4">
              <h2 className="text-base font-bold">
                Individual requirements ({filteredWorkers.length})
              </h2>
              {filteredWorkers.length === 0 && (
                <div className="helix-card p-6 text-center text-sm text-muted-foreground">
                  No workers match this filter.
                </div>
              )}
              {filteredWorkers.map((w, i) => {
                const open = expandedWorkerId === w.member.id;
                return (
                  <motion.div
                    key={w.member.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2) }}
                    className={cn(
                      "helix-card overflow-hidden",
                      w.compliant
                        ? "ring-1 ring-emerald-500/20"
                        : "ring-1 ring-rose-500/15"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedWorkerId(open ? null : w.member.id)
                      }
                      className="flex w-full items-start gap-3 p-3.5 text-left"
                    >
                      <Avatar className="size-11">
                        <AvatarFallback className="bg-primary/15 font-bold text-primary">
                          {initials(w.member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold leading-snug">
                              {w.member.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              #{w.member.employeeNumber} · {w.member.role}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              "shrink-0 border-0",
                              w.compliant
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                            )}
                          >
                            {w.compliant ? "Compliant" : "Missing"}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground">
                            {w.metCount}/{w.requiredCount} requirements
                            {!w.compliant &&
                              ` · ${w.missing.length} missing`}
                          </p>
                          <span
                            className={cn(
                              "font-mono text-sm font-bold tabular-nums",
                              w.compliant
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            )}
                          >
                            {w.percent}%
                          </span>
                        </div>
                        <Progress value={w.percent} className="mt-2 h-2" />
                        {!w.compliant && !open && (
                          <p className="mt-2 line-clamp-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                            Missing:{" "}
                            {w.missing
                              .map((m) => m.requirement.name)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </button>

                    {open && (
                      <div className="space-y-3 border-t border-border px-3.5 pb-3.5 pt-3">
                        <MemberWorkStats memberId={w.member.id} />
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Role requirements · {w.member.trade}
                        </p>
                        {w.required.map((item) => (
                          <div
                            key={item.requirement.id}
                            className={cn(
                              "flex items-start gap-3 rounded-xl px-3 py-2.5",
                              item.met
                                ? "bg-emerald-500/10"
                                : "bg-rose-500/10"
                            )}
                          >
                            {item.met ? (
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold leading-snug">
                                {item.requirement.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {item.requirement.category} ·{" "}
                                {item.requirement.description}
                              </p>
                              {item.met && item.matchedCertification && (
                                <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                  On file: {item.matchedCertification}
                                </p>
                              )}
                              {!item.met && (
                                <p className="mt-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                                  Not on file — schedule training
                                </p>
                              )}
                            </div>
                            <Badge
                              className={cn(
                                "shrink-0 border-0 text-[10px]",
                                item.met
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                              )}
                            >
                              {item.met ? "Met" : "Missing"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </section>
          </>
        )}

        {view === "company" && (
          <>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-lg">
              <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-sky-500/20 blur-3xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
                    Estimated audit score
                  </p>
                  <p className="mt-2 font-mono text-5xl font-bold tabular-nums tracking-tight">
                    {readiness.percent}
                    <span className="text-2xl text-sky-300">%</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {readiness.awarded} / {readiness.maxPoints} pts · Pass ≥{" "}
                    {readiness.config.passOverallPercent}% overall &{" "}
                    {readiness.config.passElementPercent}% per element
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-center text-xs font-bold uppercase tracking-wide",
                    readiness.auditReady
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-200"
                  )}
                >
                  <Award className="mx-auto mb-1 size-5" />
                  {readiness.auditReady ? "Audit ready" : "Improve gaps"}
                </div>
              </div>
              <Progress
                value={readiness.percent}
                className="relative mt-4 h-3 bg-white/10 [&_[data-slot=progress-indicator]]:bg-sky-400"
              />
              <p className="relative mt-3 text-[11px] text-slate-400">
                Source: {readiness.config.source}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Kpi
                icon={<CheckCircle2 className="size-4" />}
                color="bg-emerald-500/10 text-emerald-600"
                value={`${readiness.elements.filter((e) => e.meetsElementMin).length}/${readiness.elements.length}`}
                label="Elements ≥ 50%"
              />
              <Kpi
                icon={<FileWarning className="size-4" />}
                color="bg-rose-500/10 text-rose-600"
                value={String(readiness.gapQuestions.length)}
                label="Documentation gaps"
              />
              <Kpi
                icon={<ClipboardList className="size-4" />}
                color="bg-sky-500/10 text-sky-600"
                value={`${readiness.currentDocs}/${readiness.docs.length}`}
                label="Docs current"
              />
              <Kpi
                icon={<AlertTriangle className="size-4" />}
                color="bg-amber-500/10 text-amber-600"
                value={String(readiness.needsReview)}
                label="Need review"
              />
            </div>

            {(() => {
              const auditPdfs = readiness.docs.filter((d) => d.file);
              if (auditPdfs.length === 0) return null;
              const accent = (id: string) =>
                id === "doc-bccsa-workbook"
                  ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400"
                  : "bg-sky-500/15 text-sky-700 dark:text-sky-400";
              const openAccent = (id: string) =>
                id === "doc-bccsa-workbook"
                  ? "text-indigo-700 dark:text-indigo-400"
                  : "text-sky-700 dark:text-sky-400";
              return (
                <div className="space-y-2">
                  <p className="text-sm font-bold">Audit digital forms</p>
                  {auditPdfs.map((doc) => {
                    const digitalId =
                      (doc.id && pdfToDigitalFormId[doc.id]) ||
                      (doc.file ? pdfToDigitalFormId[doc.file] : undefined);
                    const href = digitalId
                      ? `/forms/cor/${digitalId}`
                      : doc.file!;
                    return (
                      <a
                        key={doc.id}
                        href={href}
                        {...(digitalId
                          ? {}
                          : { target: "_blank", rel: "noopener noreferrer" })}
                        className="helix-card flex items-start gap-3 p-4 transition-shadow hover:shadow-md"
                      >
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-xl",
                            accent(doc.id)
                          )}
                        >
                          <FileText className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold leading-snug">
                              {doc.title}
                            </p>
                            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                          </div>
                          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                            {doc.description ?? doc.category}
                          </p>
                          <p
                            className={cn(
                              "mt-2 text-[11px] font-medium",
                              openAccent(doc.id)
                            )}
                          >
                            {digitalId ? "Open digital form" : "Open PDF"}
                            {doc.pages ? ` · ${doc.pages} pages` : ""}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              );
            })()}

            {!readiness.passesOverall && (
              <div className="helix-card flex gap-3 border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div className="text-sm">
                  <p className="font-semibold">Below 80% pass threshold</p>
                  <p className="mt-1 text-muted-foreground">
                    Close documentation gaps and refresh stale procedures before
                    the next COR audit.
                  </p>
                </div>
              </div>
            )}

            {readiness.failingElements.length > 0 && (
              <div className="helix-card space-y-2 p-4">
                <p className="text-sm font-bold">Elements under 50%</p>
                {readiness.failingElements.map((e) => (
                  <button
                    key={e.element.id}
                    type="button"
                    onClick={() => setSelectedId(e.element.id)}
                    className="flex w-full items-center justify-between rounded-xl bg-rose-500/10 px-3 py-2.5 text-left"
                  >
                    <span className="text-sm font-medium">
                      E{e.element.id} · {e.element.title}
                    </span>
                    <span className="font-mono text-sm font-bold text-rose-600">
                      {e.percent}%
                    </span>
                  </button>
                ))}
              </div>
            )}

            <section>
              <h2 className="mb-3 text-base font-bold">14 COR elements</h2>
              <div className="grid grid-cols-1 gap-2">
                {readiness.elements.map((e, i) => (
                  <motion.button
                    key={e.element.id}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedId(e.element.id)}
                    className={cn(
                      "helix-card w-full p-3.5 text-left transition-shadow",
                      selectedId === e.element.id &&
                        "ring-2 ring-primary/30 shadow-md"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary">
                          Element {e.element.id}
                        </p>
                        <p className="font-semibold leading-snug">
                          {e.element.title}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {e.strong} documented · {e.partial} partial · {e.gaps}{" "}
                          gaps · {e.docs.length} linked docs
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "font-mono text-xl font-bold tabular-nums",
                            e.meetsElementMin
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {e.percent}%
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {e.awarded}/{e.maxPoints}
                        </p>
                      </div>
                    </div>
                    <Progress value={e.percent} className="mt-3 h-2" />
                  </motion.button>
                ))}
              </div>
            </section>

            {selected && (
              <section className="space-y-3 pb-4">
                <div className="flex items-center gap-2">
                  <Shield className="size-5 text-primary" />
                  <h2 className="text-base font-bold">
                    E{selected.element.id} detail
                  </h2>
                </div>

                {selected.docs.length > 0 && (
                  <div className="helix-card space-y-2 p-4">
                    <p className="text-sm font-bold">Linked documentation</p>
                    {selected.docs.map((d) => {
                      const digitalId =
                        pdfToDigitalFormId[d.id] ||
                        (d.file ? pdfToDigitalFormId[d.file] : undefined);
                      const href = digitalId
                        ? `/forms/cor/${digitalId}`
                        : d.file;
                      const inner = (
                        <>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-snug">
                              {d.title}
                              {href ? (
                                <ExternalLink className="ml-1.5 inline size-3 align-[-1px] text-muted-foreground" />
                              ) : null}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {d.category} · {d.owner} · Reviewed{" "}
                              {d.lastReviewed}
                              {digitalId ? " · Digital form" : ""}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              "shrink-0 border-0 capitalize",
                              d.status === "current"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            )}
                          >
                            {d.status.replace("-", " ")}
                          </Badge>
                        </>
                      );
                      if (href) {
                        return (
                          <a
                            key={d.id}
                            href={href}
                            {...(digitalId
                              ? {}
                              : {
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                                })}
                            className="flex items-start justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5 transition-colors hover:bg-muted"
                          >
                            {inner}
                          </a>
                        );
                      }
                      return (
                        <div
                          key={d.id}
                          className="flex items-start justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5"
                        >
                          {inner}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-bold">Audit questions vs evidence</p>
                  {selected.questions.map((q) => (
                    <div key={q.id} className="helix-card space-y-2 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-primary">
                            {q.id}
                          </p>
                          <p className="text-sm font-medium leading-snug">
                            {q.text}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "shrink-0 border-0",
                            levelStyle[q.score.level]
                          )}
                        >
                          {levelLabel[q.score.level]}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Est. {q.score.awarded}/{q.maxPoints} pts
                        </span>
                        {q.score.evidenceIds.length > 0 && (
                          <span>
                            {q.score.evidenceIds.length} evidence item
                            {q.score.evidenceIds.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      {q.score.note && (
                        <p className="rounded-lg bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">
                          {q.score.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function MemberWorkStats({ memberId }: { memberId: string }) {
  const summary = getMemberActivity(memberId);
  if (!summary) return null;

  return (
    <div className="space-y-2 rounded-2xl bg-orange-500/10 p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
        Work activity · {summary.periodLabel.toLowerCase()}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-background/70 px-3 py-2">
          <p className="font-mono text-lg font-bold tabular-nums">
            {summary.flhas}
          </p>
          <p className="text-[11px] text-muted-foreground">
            FLHAs · {summary.percentOfFlhas}% of company
          </p>
        </div>
        <div className="rounded-xl bg-background/70 px-3 py-2">
          <p className="font-mono text-lg font-bold tabular-nums">
            {summary.hours}
            <span className="text-sm text-muted-foreground">h</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Hours · {summary.percentOfHours}% of company
          </p>
        </div>
      </div>
      {summary.topTasks.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Top tasks
          </p>
          {summary.topTasks.slice(0, 3).map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate font-medium">{t.label}</span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {t.count}× · {t.hours}h
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkerActivityCard({
  summary,
  index,
  open,
  onToggle,
}: {
  summary: MemberActivitySummary;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const { member } = summary;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      className="helix-card overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-3.5 text-left"
      >
        <Avatar className="size-11">
          <AvatarFallback className="bg-orange-500/15 font-bold text-orange-700 dark:text-orange-400">
            {initials(member.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold leading-snug">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                #{member.employeeNumber} · {member.role}
              </p>
            </div>
            <Badge className="shrink-0 border-0 bg-orange-500/15 text-orange-700 dark:text-orange-400">
              {summary.hours}h
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {summary.flhas} FLHAs · {summary.percentOfHours}% of hours
            </span>
            <span className="truncate font-medium text-foreground">
              {summary.topTasks[0]?.label ?? "—"}
            </span>
          </div>
          <Progress
            value={summary.percentOfHours}
            className="mt-2 h-2 [&_[data-slot=progress-indicator]]:bg-orange-500"
          />
          {!open && summary.topTasks.length > 0 && (
            <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
              Top:{" "}
              {summary.topTasks
                .slice(0, 3)
                .map((t) => t.label)
                .join(", ")}
            </p>
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-3.5 pb-3.5 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/60 px-3 py-2.5">
              <p className="font-mono text-xl font-bold tabular-nums">
                {summary.flhas}
              </p>
              <p className="text-[11px] text-muted-foreground">
                FLHAs ({summary.percentOfFlhas}%)
              </p>
            </div>
            <div className="rounded-xl bg-muted/60 px-3 py-2.5">
              <p className="font-mono text-xl font-bold tabular-nums">
                {summary.hours}
                <span className="text-sm text-muted-foreground">h</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Hours ({summary.percentOfHours}%)
              </p>
            </div>
          </div>

          {summary.byCategory.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              <ActivityBars items={summary.byCategory} />
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Top tasks · {member.trade}
            </p>
            <ActivityBars items={summary.topTasks} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function Kpi({
  icon,
  color,
  value,
  label,
}: {
  icon: React.ReactNode;
  color: string;
  value: string;
  label: string;
}) {
  return (
    <div className="helix-card p-3.5">
      <div
        className={cn(
          "mb-2 flex size-9 items-center justify-center rounded-xl",
          color
        )}
      >
        {icon}
      </div>
      <p className="truncate text-xl font-bold tabular-nums leading-tight">
        {value}
      </p>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
