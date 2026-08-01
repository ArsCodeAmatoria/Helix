"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ClipboardList,
  FileWarning,
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
import { computeWorkerCompliance } from "@/lib/cor-worker";
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

type View = "workers" | "company";
type WorkerFilter = "all" | "missing" | "compliant" | "crew";

export function CorStatsScreen() {
  const team = useTeamOptional();
  const readiness = useMemo(() => computeCorReadiness(), []);
  const [view, setView] = useState<View>("workers");
  const [selectedId, setSelectedId] = useState<number | null>(
    readiness.elements[0]?.element.id ?? null
  );
  const [workerFilter, setWorkerFilter] = useState<WorkerFilter>("all");
  const [workerQuery, setWorkerQuery] = useState("");
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);

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

  return (
    <div>
      <PageHeader
        title="COR Statistics"
        subtitle="Worker compliance & BCCSA audit readiness"
      />

      <main className="space-y-5 px-4 py-5">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["workers", "Workers", Users],
              ["company", "Company audit", Shield],
            ] as const
          ).map(([id, label, Icon]) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-colors",
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
                      <div className="space-y-2 border-t border-border px-3.5 pb-3.5 pt-3">
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
                    {selected.docs.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-start justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-semibold leading-snug">
                            {d.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {d.category} · {d.owner} · Reviewed {d.lastReviewed}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "border-0 capitalize",
                            d.status === "current"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          )}
                        >
                          {d.status.replace("-", " ")}
                        </Badge>
                      </div>
                    ))}
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
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
