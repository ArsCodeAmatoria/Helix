"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  HardHat,
  TowerControl,
} from "lucide-react";
import { useEvaluations } from "@/components/providers/evaluation-provider";
import {
  evaluationDisclaimer,
  evaluationSource,
  evaluationTracks,
  getEvaluationChecklist,
  passedChecklistIds,
  trackProgress,
  tracksForMember,
} from "@/lib/evaluations";
import { members, initials } from "@/lib/team";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Tab = "pathways" | "workers" | "lifts";

const SITE_LIFTS = [
  "eval-concrete-day",
  "eval-tables",
  "eval-doka-cart",
  "eval-gang-forms",
  "eval-elevator-core",
  "eval-blind-lift",
  "eval-panel-fly",
];

export function EvaluationsHubScreen() {
  const evals = useEvaluations();
  const [tab, setTab] = useState<Tab>("pathways");

  const siteLifts = useMemo(
    () =>
      SITE_LIFTS.map((id) => getEvaluationChecklist(id)).filter(
        (c): c is NonNullable<typeof c> => Boolean(c)
      ),
    []
  );

  return (
    <div>
      <PageHeader
        title="Competency evaluations"
        subtitle="Riggers · crane operators · continuous sign-off"
        backHref="/forms"
      />

      <main className="space-y-4 px-4 py-5">
        <div className="helix-card space-y-2 p-4">
          <p className="text-sm font-semibold leading-snug">
            Build qualifications over time
          </p>
          <p className="text-sm text-muted-foreground">
            Supervisors and foremen evaluate workers on learning checks and
            site lifts (concrete day, tables, Doka cart, gang forms, core
            lifts…). Passed evals with sign-off count toward Basics →
            Intermediate → Advanced (riggers) and BC Crane Safety → Levels →
            Red Seal (operators).
          </p>
          <p className="text-[11px] text-muted-foreground">
            {evaluationDisclaimer}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["pathways", "Pathways", GraduationCap],
              ["lifts", "Site lifts", ClipboardCheck],
              ["workers", "Workers", HardHat],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex min-h-12 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold",
                tab === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-border"
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "pathways" && (
          <section className="space-y-3 pb-4">
            <p className="text-xs text-muted-foreground">{evaluationSource}</p>
            {evaluationTracks.map((track) => (
              <div key={track.id} className="helix-card space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                      track.id === "rigger"
                        ? "bg-violet-500/15 text-violet-700 dark:text-violet-400"
                        : "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                    )}
                  >
                    {track.id === "rigger" ? (
                      <HardHat className="size-5" />
                    ) : (
                      <TowerControl className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-snug">{track.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {track.authority}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {track.summary}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {track.stages.map((stage) => (
                    <div
                      key={stage.id}
                      className="rounded-xl bg-muted/50 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="shrink-0">
                          {stage.order}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug">
                            {stage.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {stage.subtitle} · {stage.credentialHint}
                          </p>
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {stage.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === "lifts" && (
          <section className="space-y-2 pb-4">
            <p className="text-sm text-muted-foreground">
              Site-specific lift evaluations — pick a worker on their profile
              to run and sign off.
            </p>
            {siteLifts.map((cl) => (
              <div key={cl.id} className="helix-card space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge className="mb-1 border-0 bg-sky-500/15 text-sky-800 dark:text-sky-300">
                      {cl.category}
                    </Badge>
                    <p className="font-bold leading-snug">{cl.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {cl.items.length} checks · ~{cl.estimatedMinutes} min ·{" "}
                      {cl.audience}
                    </p>
                  </div>
                </div>
                <Link
                  href="/evaluations?tab=workers"
                  className="inline-flex text-sm font-semibold text-primary"
                  onClick={() => setTab("workers")}
                >
                  Choose worker to evaluate
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            ))}
          </section>
        )}

        {tab === "workers" && (
          <section className="space-y-2 pb-4">
            <p className="text-sm text-muted-foreground">
              Open a worker to see pathway progress and run new evaluations.
            </p>
            {members.map((member) => {
              const passed = passedChecklistIds(evals.records, member.id);
              const tracks = tracksForMember(member);
              const overall = tracks.reduce(
                (acc, t) => {
                  const p = trackProgress(t, passed);
                  return {
                    complete: acc.complete + p.complete,
                    total: acc.total + p.total,
                  };
                },
                { complete: 0, total: 0 }
              );
              const percent =
                overall.total === 0
                  ? 0
                  : Math.round((overall.complete / overall.total) * 100);
              return (
                <Link
                  key={member.id}
                  href={`/evaluations/member/${member.id}`}
                  className="helix-card flex items-start gap-3 p-4 active:scale-[0.99]"
                >
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-primary/15 font-bold text-primary">
                      {initials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-snug">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role} · {member.trade}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tracks.map((t) => (
                        <Badge
                          key={t.id}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {t.title}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {overall.complete}/{overall.total} signed evals
                      </span>
                      <span className="font-mono text-sm font-bold">
                        {percent}%
                      </span>
                    </div>
                    <Progress value={percent} className="mt-1.5 h-2" />
                  </div>
                  <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </section>
        )}

        <div className="helix-card flex gap-3 p-4 text-sm text-muted-foreground">
          <Award className="size-5 shrink-0 text-primary" />
          <p>
            References:{" "}
            <a
              className="font-semibold text-primary underline"
              href="https://bccranesafety.ca"
              target="_blank"
              rel="noreferrer"
            >
              BC Crane Safety
            </a>
            ,{" "}
            <a
              className="font-semibold text-primary underline"
              href="https://skilledtradesbc.ca/tower-crane-operator"
              target="_blank"
              rel="noreferrer"
            >
              SkilledTradesBC Tower Crane
            </a>
            ,{" "}
            <a
              className="font-semibold text-primary underline"
              href="https://skilledtradesbc.ca/mobile-crane-operator"
              target="_blank"
              rel="noreferrer"
            >
              Mobile Crane
            </a>
            , Fulford/Cranesafe rigger Level 1–2.
          </p>
        </div>
      </main>
    </div>
  );
}
