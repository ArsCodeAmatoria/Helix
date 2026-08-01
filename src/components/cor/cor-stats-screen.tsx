"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  Shield,
} from "lucide-react";
import {
  computeCorReadiness,
  type CoverageLevel,
} from "@/lib/cor-stats";
import { PageHeader } from "@/components/layout/page-header";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

export function CorStatsScreen() {
  const readiness = useMemo(() => computeCorReadiness(), []);
  const [selectedId, setSelectedId] = useState<number | null>(
    readiness.elements[0]?.element.id ?? null
  );
  const selected =
    readiness.elements.find((e) => e.element.id === selectedId) ??
    readiness.elements[0];

  return (
    <div>
      <PageHeader
        title="COR Statistics"
        subtitle="BCCSA audit readiness vs Helix docs"
      />

      <main className="space-y-5 px-4 py-5">
        {/* Overall score */}
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

        {/* KPI row */}
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
                Close documentation gaps and refresh stale procedures before the
                next COR audit.
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

        {/* Element grid */}
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
                      {e.strong} documented · {e.partial} partial · {e.gaps} gaps
                      · {e.docs.length} linked docs
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

        {/* Selected element detail */}
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
                      <p className="text-xs font-bold text-primary">{q.id}</p>
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
