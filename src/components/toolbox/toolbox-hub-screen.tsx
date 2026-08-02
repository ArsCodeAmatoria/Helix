"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Megaphone,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useToolbox } from "@/components/providers/toolbox-provider";
import { useTeamOptional } from "@/components/providers/team-provider";
import { db, getProject } from "@/lib/db";
import { initials, members as allMembers } from "@/lib/team";
import {
  generateToolboxTalk,
  getToolboxTopic,
  searchToolboxTopics,
  toolboxAuthorities,
  toolboxCategories,
  toolboxDisclaimer,
  toolboxTopics,
} from "@/lib/toolbox-talks";
import { PageHeader } from "@/components/layout/page-header";
import { ChipSelect } from "@/components/modules/chip-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ToolboxAuthority } from "@/lib/types";

type Step = "topics" | "preview" | "deliver";

const authorityStyle: Record<ToolboxAuthority, string> = {
  WorkSafeBC: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  "BC Crane Safety": "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  "Technical Safety BC":
    "bg-violet-500/15 text-violet-800 dark:text-violet-300",
};

export function ToolboxHubScreen() {
  const { talks, addTalk } = useToolbox();
  const team = useTeamOptional();
  const [step, setStep] = useState<Step>("topics");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([
    "tbt-blind-lift",
    "tbt-swing-radius",
  ]);
  const [projectId, setProjectId] = useState(
    db.projects.find((p) => p.assignedToday)?.id ?? db.projects[0]?.id ?? ""
  );
  const [facilitatorName, setFacilitatorName] = useState(
    db.worker.supervisor || db.worker.name
  );
  const [attendees, setAttendees] = useState<string[]>(() =>
    team?.todaysMembers.length
      ? team.todaysMembers.map((m) => m.id)
      : ["m-chen", "m-lee", "m-nguyen", "m-kim"]
  );
  const [notes, setNotes] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);

  const filteredTopics = useMemo(() => {
    let pool = searchToolboxTopics(query);
    if (category !== "all") {
      pool = pool.filter((t) => t.category === category);
    }
    return pool;
  }, [query, category]);

  const generated = useMemo(
    () => generateToolboxTalk(selected),
    [selected]
  );

  const crewPool = team?.todaysMembers.length
    ? team.todaysMembers
    : allMembers.slice(0, 12);

  const toggleTopic = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSavedId(null);
  };

  const toggleAttendee = (id: string) => {
    setAttendees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const saveTalk = () => {
    if (selected.length === 0) return;
    const record = addTalk({
      topicIds: selected,
      title: generated.title,
      projectId: projectId || null,
      facilitatorName: facilitatorName.trim() || db.worker.name,
      attendeeMemberIds: attendees,
      notes: notes.trim(),
      generatedSummary: generated.summary,
    });
    setSavedId(record.id);
    setStep("deliver");
  };

  return (
    <div>
      <PageHeader
        title="Toolbox talks"
        subtitle="Build a crew brief with regulatory citations"
        backHref="/forms"
      />

      <main className="space-y-4 px-4 py-5">
        <div className="helix-card space-y-3 border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-800 dark:text-amber-200">
              <Megaphone className="size-5" />
            </div>
            <div>
              <p className="font-bold text-amber-950 dark:text-amber-100">
                Select topics → generate talk
              </p>
              <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">
                {toolboxDisclaimer}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {toolboxAuthorities.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-amber-950 dark:bg-black/20 dark:text-amber-100"
              >
                {a.shortName}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["topics", "Topics"],
              ["preview", "Talk"],
              ["deliver", "Deliver"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStep(id)}
              className={cn(
                "min-h-12 rounded-2xl text-sm font-semibold",
                step === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-border"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="helix-card p-3.5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {selected.length} topic{selected.length === 1 ? "" : "s"} selected
            </span>
            <span>
              {generated.citations.length} citation
              {generated.citations.length === 1 ? "" : "s"}
            </span>
          </div>
          <Progress
            value={
              toolboxTopics.length === 0
                ? 0
                : Math.min(100, (selected.length / 4) * 100)
            }
            className="h-2"
          />
        </div>

        {step === "topics" && (
          <section className="space-y-3 pb-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics or regulations…"
                className="h-14 rounded-2xl pl-11 text-base"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-semibold",
                  category === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                All
              </button>
              {toolboxCategories().map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-semibold",
                    category === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <ChipSelect
              options={filteredTopics.map((t) => ({
                id: t.id,
                label: t.title,
              }))}
              selected={selected}
              onToggle={toggleTopic}
            />

            <div className="space-y-2">
              {filteredTopics.map((topic) => {
                const active = selected.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className={cn(
                      "helix-card w-full p-4 text-left transition-shadow active:scale-[0.99]",
                      active && "ring-2 ring-primary/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Badge variant="secondary" className="mb-2">
                          {topic.category}
                        </Badge>
                        <p className="font-bold leading-snug">{topic.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {topic.summary}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {active ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <BookOpen className="size-5" />
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Array.from(
                        new Set(topic.citations.map((c) => c.authority))
                      ).map((auth) => (
                        <span
                          key={auth}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            authorityStyle[auth]
                          )}
                        >
                          {auth}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              className="h-12 w-full rounded-2xl"
              disabled={selected.length === 0}
              onClick={() => setStep("preview")}
            >
              Build talk ({selected.length})
            </Button>
          </section>
        )}

        {step === "preview" && (
          <section className="space-y-4 pb-6">
            {selected.length === 0 ? (
              <div className="helix-card p-6 text-center text-sm text-muted-foreground">
                Select at least one topic first.
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-5 text-white shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                    Generated toolbox talk
                  </p>
                  <h2 className="mt-2 text-xl font-bold leading-snug">
                    {generated.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {generated.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {generated.topics.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"
                      >
                        {t.title}
                      </span>
                    ))}
                  </div>
                </div>

                {generated.talkingPoints.map((block) => (
                  <div key={block.topicId} className="helix-card space-y-3 p-4">
                    <h3 className="font-bold">{block.topicTitle}</h3>
                    <ul className="space-y-2">
                      {block.points.map((point, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm leading-snug text-foreground"
                        >
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    {generated.discussionPrompts
                      .find((d) => d.topicId === block.topicId)
                      ?.prompts.map((prompt, i) => (
                        <p
                          key={i}
                          className="rounded-xl bg-muted/60 px-3 py-2 text-sm italic text-muted-foreground"
                        >
                          Discuss: {prompt}
                        </p>
                      ))}
                  </div>
                ))}

                <div className="helix-card space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="size-5 text-primary" />
                    <h3 className="font-bold">Regulatory citations</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cited from WorkSafeBC, BC Crane Safety, and Technical Safety
                    BC for the selected topics.
                  </p>
                  <div className="space-y-2">
                    {generated.citations.map((c, i) => (
                      <div
                        key={`${c.authority}-${c.label}-${i}`}
                        className="rounded-2xl bg-muted/50 px-3 py-3"
                      >
                        <Badge
                          className={cn(
                            "mb-2 border-0",
                            authorityStyle[c.authority]
                          )}
                        >
                          {c.authority}
                        </Badge>
                        {c.url ? (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 text-sm font-semibold text-primary"
                          >
                            <span className="min-w-0 flex-1 leading-snug">
                              {c.label}
                            </span>
                            <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                          </a>
                        ) : (
                          <p className="text-sm font-semibold leading-snug">
                            {c.label}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {generated.relatedDocuments.length > 0 && (
                  <div className="helix-card space-y-2 p-4">
                    <h3 className="font-bold">Related Helix documents</h3>
                    {generated.relatedDocuments.map((doc) => (
                      <Link
                        key={doc.id}
                        href={`/forms/documents/${doc.id}`}
                        className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5 text-sm font-semibold"
                      >
                        {doc.shortTitle || doc.title}
                        <ExternalLink className="size-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}

                <Button
                  className="h-12 w-full rounded-2xl"
                  onClick={() => setStep("deliver")}
                >
                  Continue to deliver
                </Button>
              </>
            )}
          </section>
        )}

        {step === "deliver" && (
          <section className="space-y-4 pb-6">
            <div className="helix-card space-y-3 p-4">
              <p className="text-sm font-bold">Delivery details</p>
              <div className="space-y-1.5">
                <Label>Project</Label>
                <select
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  {db.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Facilitator</Label>
                <Input
                  className="h-12 rounded-xl"
                  value={facilitatorName}
                  onChange={(e) => setFacilitatorName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  className="min-h-24 rounded-xl"
                  placeholder="Site conditions, questions raised, actions…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="helix-card space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <p className="font-bold">
                  Attendees ({attendees.length})
                </p>
              </div>
              <div className="space-y-2">
                {crewPool.map((m) => {
                  const on = attendees.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAttendee(m.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left",
                        on ? "bg-primary/10 ring-1 ring-primary/25" : "bg-muted/50"
                      )}
                    >
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-primary/15 text-sm font-bold text-primary">
                          {initials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role}</p>
                      </div>
                      {on && <CheckCircle2 className="size-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {savedId ? (
              <div className="helix-card space-y-3 border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-900 dark:text-emerald-200">
                      Toolbox talk saved
                    </p>
                    <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-200/80">
                      {generated.title} · {attendees.length} attendees
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl"
                  onClick={() => {
                    setSelected([]);
                    setNotes("");
                    setSavedId(null);
                    setStep("topics");
                  }}
                >
                  Start another talk
                </Button>
              </div>
            ) : (
              <Button
                className="h-12 w-full rounded-2xl"
                disabled={selected.length === 0 || attendees.length === 0}
                onClick={saveTalk}
              >
                Mark delivered & save
              </Button>
            )}
          </section>
        )}

        {talks.length > 0 && step === "topics" && (
          <section className="space-y-3 pb-8">
            <h2 className="text-base font-bold">Recent toolbox talks</h2>
            {talks.slice(0, 6).map((talk) => {
              const project = talk.projectId
                ? getProject(talk.projectId)
                : null;
              const topicTitles = talk.topicIds
                .map((id) => getToolboxTopic(id)?.title)
                .filter(Boolean);
              return (
                <div key={talk.id} className="helix-card space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold leading-snug">{talk.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(talk.deliveredAt).toLocaleString()} ·{" "}
                        {talk.facilitatorName}
                        {project ? ` · ${project.name}` : ""}
                      </p>
                    </div>
                    <Badge className="shrink-0 border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      Delivered
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {topicTitles.join(" · ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {talk.attendeeMemberIds.length} attendees
                    {talk.notes ? ` · ${talk.notes}` : ""}
                  </p>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
