"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useDigitalForms } from "@/components/providers/digital-forms-provider";
import {
  blankDigitalAnswers,
  blankDigitalChecks,
  blankDigitalMeta,
  checklistProgress,
  deriveDigitalOverall,
  formKindLabel,
  getDigitalFormTemplate,
  getDigitalFormTemplates,
  groupDigitalChecks,
  interviewProgress,
} from "@/lib/digital-forms";
import type {
  DigitalFormCheckItem,
  DigitalFormInterviewAnswer,
  DigitalFormMetaField,
  DigitalFormRecord,
  DigitalFormTemplate,
  InspectionCheckResult,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Step = "catalog" | "history" | "meta" | "work" | "done";

function CheckRow({
  item,
  onChange,
  onNote,
}: {
  item: DigitalFormCheckItem;
  onChange: (result: InspectionCheckResult) => void;
  onNote: (note: string) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3.5",
        item.result === "fail"
          ? "border-rose-500/30 bg-rose-500/5"
          : item.result === "pass"
            ? "border-emerald-500/20 bg-card"
            : "border-border bg-card"
      )}
    >
      <p className="text-sm font-semibold leading-snug">{item.label}</p>
      {item.guidance ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{item.guidance}</p>
      ) : null}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(
          [
            ["pass", "Yes", Check, "bg-emerald-600 text-white"],
            ["fail", "No", X, "bg-rose-600 text-white"],
            ["na", "N/A", Minus, "bg-slate-500 text-white"],
          ] as const
        ).map(([value, label, Icon, active]) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(item.result === value ? null : value)}
            className={cn(
              "flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold ring-1 ring-border",
              item.result === value
                ? active
                : "bg-muted/50 text-muted-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
      <Input
        className="mt-2 h-10 rounded-xl"
        placeholder="Comments"
        value={item.note}
        onChange={(e) => onNote(e.target.value)}
      />
    </div>
  );
}

function MetaFields({
  fields,
  meta,
  onChange,
}: {
  fields: DigitalFormMetaField[];
  meta: Record<string, string | string[]>;
  onChange: (id: string, value: string | string[]) => void;
}) {
  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const value = meta[field.id];
        if (field.type === "textarea") {
          return (
            <div key={field.id} className="space-y-1.5">
              <Label>{field.label}</Label>
              <Textarea
                className="min-h-24 rounded-xl"
                value={typeof value === "string" ? value : ""}
                onChange={(e) => onChange(field.id, e.target.value)}
              />
            </div>
          );
        }
        if (field.type === "select") {
          return (
            <div key={field.id} className="space-y-1.5">
              <Label>{field.label}</Label>
              <select
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={typeof value === "string" ? value : ""}
                onChange={(e) => onChange(field.id, e.target.value)}
              >
                <option value="">Select…</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (field.type === "multiselect") {
          const selected = Array.isArray(value) ? value : [];
          return (
            <div key={field.id} className="space-y-2">
              <Label>{field.label}</Label>
              <div className="flex flex-wrap gap-2">
                {(field.options ?? []).map((opt) => {
                  const on = selected.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onChange(
                          field.id,
                          on
                            ? selected.filter((x) => x !== opt)
                            : [...selected, opt]
                        );
                      }}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
                        on
                          ? "bg-primary text-primary-foreground ring-primary"
                          : "bg-muted/50 text-muted-foreground ring-border"
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
        return (
          <div key={field.id} className="space-y-1.5">
            <Label>{field.label}</Label>
            <Input
              className="h-11 rounded-xl"
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(field.id, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}

export function DigitalFormsHubScreen({
  initialFormId,
}: {
  initialFormId?: string;
}) {
  const { records, forForm, addRecord, deleteRecord } = useDigitalForms();
  const templates = useMemo(() => getDigitalFormTemplates(), []);
  const router = useRouter();

  const [step, setStep] = useState<Step>(
    initialFormId ? "history" : "catalog"
  );
  const [formId, setFormId] = useState<string | null>(initialFormId ?? null);
  const [query, setQuery] = useState("");
  const [meta, setMeta] = useState<Record<string, string | string[]>>({});
  const [checks, setChecks] = useState<DigitalFormCheckItem[]>([]);
  const [answers, setAnswers] = useState<DigitalFormInterviewAnswer[]>([]);
  const [notes, setNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [saved, setSaved] = useState<DigitalFormRecord | null>(null);

  const template = formId ? getDigitalFormTemplate(formId) : undefined;
  const history = formId ? forForm(formId) : [];

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.kind.includes(q)
    );
  }, [templates, query]);

  const grouped = useMemo(() => {
    if (!template?.categories) return [];
    const map = groupDigitalChecks(checks);
    return template.categories
      .filter((c) => map.has(c.id))
      .map((c) => ({ category: c, items: map.get(c.id)! }));
  }, [template, checks]);

  const checkProg = checklistProgress(checks);
  const interviewProg = interviewProgress(answers);

  function openForm(id: string) {
    setFormId(id);
    setSaved(null);
    setStep("history");
  }

  function startNew(t: DigitalFormTemplate) {
    setFormId(t.id);
    setMeta(blankDigitalMeta(t));
    setChecks(blankDigitalChecks(t));
    setAnswers(blankDigitalAnswers(t));
    setNotes("");
    setActiveCategory(t.categories?.[0]?.id ?? null);
    setSaved(null);
    setStep("meta");
  }

  function setMetaValue(id: string, value: string | string[]) {
    setMeta((prev) => ({ ...prev, [id]: value }));
  }

  function patchCheck(
    id: string,
    patch: Partial<DigitalFormCheckItem>
  ) {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  function patchAnswer(
    questionId: string,
    patch: Partial<DigitalFormInterviewAnswer>
  ) {
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionId === questionId ? { ...a, ...patch } : a
      )
    );
  }

  function complete() {
    if (!template) return;
    const overall =
      template.kind === "checklist"
        ? deriveDigitalOverall(checks)
        : null;
    const record = addRecord({
      formId: template.id,
      status: "completed",
      meta,
      checks: template.kind === "checklist" ? checks : [],
      answers: template.kind === "interview" ? answers : [],
      notes,
      overall,
    });
    setSaved(record);
    setStep("done");
  }

  return (
    <div className="min-h-full pb-8">
      <PageHeader
        title="COR digital forms"
        subtitle="Interactive versions of the audit & inspection PDFs"
        backHref={step === "catalog" ? "/forms" : undefined}
        onBack={
          step !== "catalog"
            ? () => {
                if (step === "work" || step === "meta") {
                  setStep("history");
                  return;
                }
                if (initialFormId) {
                  router.push("/forms/cor");
                  return;
                }
                setFormId(null);
                setStep("catalog");
              }
            : undefined
        }
      />

      <main className="space-y-4 px-4 py-5">
        {step === "catalog" && (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-12 rounded-2xl pl-10"
                placeholder="Search forms…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              {records.length} saved submission
              {records.length === 1 ? "" : "s"} · {templates.length} digital
              forms
            </p>

            <div className="space-y-2">
              {filteredTemplates.map((t) => {
                const count = forForm(t.id).length;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openForm(t.id)}
                    className="helix-card flex w-full items-start gap-3 p-4 text-left transition-shadow hover:shadow-md"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-700 dark:text-sky-400">
                      <ClipboardList className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold leading-snug">{t.title}</p>
                        <Badge className="border-0 bg-muted text-muted-foreground">
                          {formKindLabel(t.kind)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {t.subtitle}
                      </p>
                      <p className="mt-2 text-[11px] font-medium text-sky-700 dark:text-sky-400">
                        {t.pages} pg source · {count} saved
                      </p>
                    </div>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {(step === "history" || step === "done") && template && (
          <>
            <div className="helix-card space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-700 dark:text-sky-400">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{template.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {template.disclaimer}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={template.sourcePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-muted/60 px-3 py-2 text-xs font-semibold"
                >
                  Source PDF
                  <ExternalLink className="size-3.5" />
                </a>
                {template.linkedForms?.map((id) => {
                  const linked = getDigitalFormTemplate(id);
                  if (!linked) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => openForm(id)}
                      className="rounded-xl bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-800 dark:text-sky-300"
                    >
                      Open {linked.title}
                    </button>
                  );
                })}
              </div>
              <Button className="h-12 w-full rounded-2xl" onClick={() => startNew(template)}>
                <Plus className="size-4" />
                New digital form
              </Button>
            </div>

            {step === "done" && saved && (
              <div className="helix-card border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Saved · {saved.overall ? `Overall ${saved.overall}` : "Completed"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(saved.createdAt).toLocaleString()}
                </p>
              </div>
            )}

            <section className="space-y-2 pb-4">
              <h2 className="text-base font-bold">History</h2>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No submissions yet for this form.
                </p>
              ) : (
                history.map((r) => (
                  <div
                    key={r.id}
                    className="helix-card flex items-center justify-between gap-3 p-3.5"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {typeof r.meta.project === "string" && r.meta.project
                          ? r.meta.project
                          : typeof r.meta.interviewee === "string" &&
                              r.meta.interviewee
                            ? String(r.meta.interviewee)
                            : "Submission"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(r.updatedAt).toLocaleString()} · {r.status}
                        {r.overall ? ` · ${r.overall}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecord(r.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {step === "meta" && template && (
          <section className="space-y-4 pb-8">
            <div>
              <h2 className="text-base font-bold">Details</h2>
              <p className="text-sm text-muted-foreground">{template.title}</p>
            </div>
            <MetaFields
              fields={template.metaFields}
              meta={meta}
              onChange={setMetaValue}
            />
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                className="min-h-24 rounded-xl"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              className="h-12 w-full rounded-2xl"
              onClick={() => {
                if (template.kind === "audit-plan") {
                  complete();
                } else {
                  setStep("work");
                }
              }}
            >
              {template.kind === "audit-plan"
                ? "Save audit plan"
                : "Continue to form"}
            </Button>
          </section>
        )}

        {step === "work" && template?.kind === "checklist" && (
          <section className="space-y-4 pb-8">
            <div className="helix-card space-y-2 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold">Progress</p>
                <p className="font-mono text-sm font-bold tabular-nums">
                  {checkProg.scored}/{checkProg.total}
                </p>
              </div>
              <Progress value={checkProg.percent} className="h-2" />
              {checkProg.fails > 0 ? (
                <p className="text-[11px] font-medium text-rose-600">
                  {checkProg.fails} No / fail item
                  {checkProg.fails === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {grouped.map(({ category, items }) => {
                const done = items.filter((i) => i.result != null).length;
                const active = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "shrink-0 rounded-2xl px-3 py-2 text-left text-xs font-semibold ring-1",
                      active
                        ? "bg-primary text-primary-foreground ring-primary"
                        : "bg-card text-muted-foreground ring-border"
                    )}
                  >
                    <span className="block max-w-[9rem] truncate">
                      {category.label.replace(/^Section \d+ — |^Part \d+ — /, "")}
                    </span>
                    <span className="opacity-80">
                      {done}/{items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {grouped
              .filter((g) => g.category.id === activeCategory)
              .map(({ category, items }) => (
                <div key={category.id} className="space-y-2">
                  <h2 className="text-base font-bold">{category.label}</h2>
                  {items.map((item) => (
                    <CheckRow
                      key={item.id}
                      item={item}
                      onChange={(result) => patchCheck(item.id, { result })}
                      onNote={(note) => patchCheck(item.id, { note })}
                    />
                  ))}
                </div>
              ))}

            {template.workerPrompts && template.workerPrompts.length > 0 ? (
              <div className="helix-card space-y-2 p-4">
                <p className="text-sm font-bold">Ask workers</p>
                {template.workerPrompts.map((p) => (
                  <p
                    key={p.id}
                    className="text-sm text-muted-foreground before:mr-2 before:content-['•']"
                  >
                    {p.prompt}
                  </p>
                ))}
              </div>
            ) : null}

            <Button className="h-12 w-full rounded-2xl" onClick={complete}>
              Save inspection
            </Button>
          </section>
        )}

        {step === "work" && template?.kind === "interview" && (
          <section className="space-y-4 pb-8">
            <div className="helix-card space-y-2 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold">Questions answered</p>
                <p className="font-mono text-sm font-bold tabular-nums">
                  {interviewProg.answered}/{interviewProg.total}
                </p>
              </div>
              <Progress value={interviewProg.percent} className="h-2" />
            </div>

            {(template.questions ?? []).map((q) => {
              const answer = answers.find((a) => a.questionId === q.id);
              if (!answer) return null;
              return (
                <div key={q.id} className="helix-card space-y-3 p-4">
                  <div>
                    <p className="text-xs font-bold text-primary">
                      Question {q.number}
                    </p>
                    <p className="font-semibold leading-snug">{q.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {q.prompt}
                    </p>
                  </div>
                  <Textarea
                    className="min-h-24 rounded-xl"
                    placeholder="Interview response…"
                    value={answer.response}
                    onChange={(e) =>
                      patchAnswer(q.id, { response: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        ["strong", "Strong"],
                        ["adequate", "OK"],
                        ["gap", "Gap"],
                        ["na", "N/A"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          patchAnswer(q.id, {
                            assessment:
                              answer.assessment === value ? null : value,
                          })
                        }
                        className={cn(
                          "h-10 rounded-xl text-xs font-semibold ring-1 ring-border",
                          answer.assessment === value
                            ? value === "gap"
                              ? "bg-rose-600 text-white"
                              : value === "strong"
                                ? "bg-emerald-600 text-white"
                                : "bg-sky-600 text-white"
                            : "bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <Input
                    className="h-10 rounded-xl"
                    placeholder="Evidence / observations"
                    value={answer.evidenceNotes}
                    onChange={(e) =>
                      patchAnswer(q.id, { evidenceNotes: e.target.value })
                    }
                  />
                </div>
              );
            })}

            <Button className="h-12 w-full rounded-2xl" onClick={complete}>
              Save interview
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}

export function DigitalFormDeepLink({ formId }: { formId: string }) {
  const template = getDigitalFormTemplate(formId);
  if (!template) {
    return (
      <div className="p-6">
        <p className="font-semibold">Form not found</p>
        <Link href="/forms/cor" className="text-sm text-primary underline">
          Back to COR digital forms
        </Link>
      </div>
    );
  }
  return <DigitalFormsHubScreen initialFormId={formId} />;
}
