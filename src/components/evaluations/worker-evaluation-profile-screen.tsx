"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Plus,
} from "lucide-react";
import { useEvaluations } from "@/components/providers/evaluation-provider";
import {
  evaluationDisclaimer,
  getChecklistsForStage,
  getEvaluationChecklist,
  passedChecklistIds,
  stageProgress,
  trackProgress,
  tracksForMember,
} from "@/lib/evaluations";
import { getMember, initials } from "@/lib/team";
import { getProject } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function overallStyle(overall: string) {
  if (overall === "pass") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  }
  if (overall === "fail") {
    return "bg-rose-500/15 text-rose-700 dark:text-rose-400";
  }
  return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
}

export function WorkerEvaluationProfileScreen({
  memberId,
}: {
  memberId: string;
}) {
  const member = getMember(memberId);
  const evals = useEvaluations();
  const records = evals.recordsForMember(memberId);
  const tracks = useMemo(
    () => (member ? tracksForMember(member) : []),
    [member]
  );
  const passed = useMemo(
    () => passedChecklistIds(evals.records, memberId),
    [evals.records, memberId]
  );
  const [openTrack, setOpenTrack] = useState("");

  if (!member) notFound();

  const activeTrack = openTrack || tracks[0]?.id || "";

  return (
    <div>
      <PageHeader
        title={member.name}
        subtitle="Competency profile · continuous evaluation"
        backHref="/evaluations"
      />

      <main className="space-y-4 px-4 py-5">
        <div className="helix-card space-y-3 p-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-14">
              <AvatarFallback className="bg-primary/15 text-lg font-bold text-primary">
                {initials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{member.name}</p>
              <p className="text-sm text-muted-foreground">
                #{member.employeeNumber} · {member.role}
              </p>
              <p className="text-xs text-muted-foreground">{member.trade}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {member.certifications.slice(0, 5).map((c) => (
                  <Badge
                    key={c}
                    className="border-0 bg-emerald-500/15 text-[10px] text-emerald-800 dark:text-emerald-300"
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {evaluationDisclaimer}
          </p>
        </div>

        {tracks.map((track) => {
          const progress = trackProgress(track, passed);
          const open = activeTrack === track.id;
          return (
            <div key={track.id} className="helix-card overflow-hidden">
              <button
                type="button"
                className="flex w-full items-start gap-3 p-4 text-left"
                onClick={() => setOpenTrack(open ? "" : track.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug">{track.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {progress.complete}/{progress.total} evaluations signed
                  </p>
                  <Progress value={progress.percent} className="mt-2 h-2" />
                </div>
                <span className="font-mono text-lg font-bold tabular-nums">
                  {progress.percent}%
                </span>
              </button>

              {open && (
                <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                  {track.stages.map((stage) => {
                    const sp = stageProgress(track, stage, passed);
                    const checklists = getChecklistsForStage(
                      track.id,
                      stage.id
                    );
                    return (
                      <div
                        key={stage.id}
                        className="rounded-2xl border border-border p-3.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Badge variant="secondary" className="mb-1">
                              Stage {stage.order}
                            </Badge>
                            <p className="font-semibold leading-snug">
                              {stage.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {stage.credentialHint}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              "shrink-0 border-0",
                              sp.status === "complete"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : sp.status === "in-progress"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                  : "bg-muted text-muted-foreground"
                            )}
                          >
                            {sp.complete}/{sp.total}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {stage.description}
                        </p>
                        <div className="mt-3 space-y-2">
                          {checklists.map((cl) => {
                            const done = passed.has(cl.id);
                            return (
                              <Link
                                key={cl.id}
                                href={`/evaluations/run?member=${member.id}&checklist=${cl.id}`}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                                  done
                                    ? "bg-emerald-500/10"
                                    : "bg-muted/60 active:scale-[0.99]"
                                )}
                              >
                                {done ? (
                                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                                ) : (
                                  <Plus className="size-5 shrink-0 text-primary" />
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold leading-snug">
                                    {cl.title}
                                  </span>
                                  <span className="block text-[11px] text-muted-foreground">
                                    {done
                                      ? "Signed off — retake to refresh"
                                      : `Run evaluation · ~${cl.estimatedMinutes} min`}
                                  </span>
                                </span>
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <section className="space-y-2 pb-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">Evaluation history</h2>
            <Badge variant="secondary">{records.length}</Badge>
          </div>
          {records.length === 0 && (
            <div className="helix-card p-5 text-center text-sm text-muted-foreground">
              No evaluations yet. Open a pathway checklist to start.
            </div>
          )}
          {records.map((r) => {
            const cl = getEvaluationChecklist(r.checklistId);
            const project = r.projectId ? getProject(r.projectId) : undefined;
            return (
              <div key={r.id} className="helix-card space-y-2 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={cn("border-0 capitalize", overallStyle(r.overall))}
                  >
                    {r.overall}
                  </Badge>
                  {r.supervisorSignature ? (
                    <Badge className="border-0 bg-sky-500/15 text-sky-800 dark:text-sky-300">
                      Supervisor signed
                    </Badge>
                  ) : (
                    <Badge className="border-0 bg-amber-500/15 text-amber-800 dark:text-amber-300">
                      Awaiting sign-off
                    </Badge>
                  )}
                </div>
                <p className="font-semibold leading-snug">
                  {cl?.title ?? r.checklistId}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.evaluatedAt).toLocaleString()} · {r.evaluatorName}{" "}
                  ({r.evaluatorRole})
                  {project ? ` · ${project.projectNumber}` : ""}
                </p>
                {r.notes && (
                  <p className="text-sm text-muted-foreground">{r.notes}</p>
                )}
              </div>
            );
          })}
        </section>

        <Button asChild size="lg" className="h-14 w-full rounded-2xl font-bold">
          <Link href={`/evaluations/run?member=${member.id}`}>
            <ClipboardCheck className="size-5" />
            New evaluation
          </Link>
        </Button>
      </main>
    </div>
  );
}
