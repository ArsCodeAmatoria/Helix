"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  MapPin,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useSiteInspections } from "@/components/providers/site-inspection-provider";
import { db, getProject } from "@/lib/db";
import {
  blankSiteChecks,
  createFindingId,
  defaultFindingFromCheck,
  deriveSiteOverall,
  findingsBySeverity,
  groupSiteChecksByCategory,
  openFindings,
  siteInspectionDisclaimer,
} from "@/lib/site-inspections";
import type {
  InspectionCheckResult,
  SiteInspectionCheckItem,
  SiteInspectionFinding,
  SiteInspectionSeverity,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Step = "history" | "inspect" | "findings" | "done";

function overallStyle(overall: string) {
  if (overall === "pass") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  }
  if (overall === "fail") {
    return "bg-rose-500/15 text-rose-700 dark:text-rose-400";
  }
  return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
}

function severityStyle(severity: SiteInspectionSeverity) {
  if (severity === "high") {
    return "bg-rose-500/15 text-rose-700 dark:text-rose-400";
  }
  if (severity === "medium") {
    return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  }
  return "bg-sky-500/15 text-sky-700 dark:text-sky-400";
}

function CheckRow({
  item,
  onChange,
  onNote,
}: {
  item: SiteInspectionCheckItem;
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
      {item.guidance && (
        <p className="mt-1 text-[11px] text-muted-foreground">{item.guidance}</p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(
          [
            ["pass", "Pass", Check, "bg-emerald-600 text-white"],
            ["fail", "Fail", X, "bg-rose-600 text-white"],
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
      {(item.result === "fail" || item.note) && (
        <Input
          className="mt-2 h-10 rounded-xl text-sm"
          placeholder="Finding note…"
          value={item.note}
          onChange={(e) => onNote(e.target.value)}
        />
      )}
    </div>
  );
}

export function SiteInspectionsHubScreen() {
  const { inspections, addInspection, updateFindingStatus } =
    useSiteInspections();
  const [step, setStep] = useState<Step>("history");
  const [projectFilter, setProjectFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(
    inspections[0]?.id ?? null
  );
  const [savedId, setSavedId] = useState<string | null>(null);

  const [projectId, setProjectId] = useState(
    db.projects.find((p) => p.assignedToday)?.id ?? db.projects[0]?.id ?? ""
  );
  const [inspector, setInspector] = useState(
    db.worker.name === "Marcus Chen" ? "Priya Nair" : db.worker.name
  );
  const [weatherNotes, setWeatherNotes] = useState("");
  const [comments, setComments] = useState("");
  const [checks, setChecks] = useState<SiteInspectionCheckItem[]>(() =>
    blankSiteChecks()
  );
  const [findings, setFindings] = useState<SiteInspectionFinding[]>([]);
  const [openCategory, setOpenCategory] = useState(
    groupSiteChecksByCategory(blankSiteChecks())[0]?.category.id ?? ""
  );

  const project = getProject(projectId);
  const grouped = useMemo(() => groupSiteChecksByCategory(checks), [checks]);

  const answered = checks.filter((c) => c.result != null).length;
  const failedChecks = checks.filter((c) => c.result === "fail");
  const overall = deriveSiteOverall(checks);
  const progressPct =
    checks.length === 0 ? 0 : Math.round((answered / checks.length) * 100);

  const allOpen = useMemo(() => openFindings(inspections), [inspections]);
  const severityCounts = findingsBySeverity(allOpen);

  const filteredHistory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inspections.filter((insp) => {
      if (projectFilter !== "all" && insp.projectId !== projectFilter) {
        return false;
      }
      if (!q) return true;
      const p = getProject(insp.projectId);
      return (
        insp.inspector.toLowerCase().includes(q) ||
        insp.comments.toLowerCase().includes(q) ||
        (p?.name.toLowerCase().includes(q) ?? false) ||
        insp.findings.some((f) => f.title.toLowerCase().includes(q))
      );
    });
  }, [inspections, projectFilter, query]);

  const setCheckResult = (id: string, result: InspectionCheckResult) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, result } : c))
    );
  };

  const setCheckNote = (id: string, note: string) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, note } : c))
    );
  };

  const startNew = () => {
    setChecks(blankSiteChecks());
    setFindings([]);
    setComments("");
    setWeatherNotes(
      project
        ? `${project.weather} · ${project.temperature}°C`
        : ""
    );
    setInspector(
      db.worker.name === "Marcus Chen" ? "Priya Nair" : db.worker.name
    );
    setSavedId(null);
    setOpenCategory(groupSiteChecksByCategory(blankSiteChecks())[0]?.category.id ?? "");
    setStep("inspect");
  };

  const goToFindings = () => {
    const location = project
      ? `${project.name.split("—")[0].trim()} · ${project.address}`
      : "";
    const next = failedChecks.map((check) => {
      const existing = findings.find((f) => f.checkId === check.id);
      if (existing) {
        return {
          ...existing,
          title: check.label,
          description:
            check.note || existing.description || check.guidance || existing.description,
        };
      }
      return {
        id: createFindingId(),
        ...defaultFindingFromCheck(check, location),
        description:
          check.note || check.guidance || "Site condition requires correction.",
      };
    });
    setFindings(next);
    setStep("findings");
  };

  const updateFinding = (
    id: string,
    patch: Partial<Omit<SiteInspectionFinding, "correctiveAction">> & {
      correctiveAction?: Partial<SiteInspectionFinding["correctiveAction"]>;
    }
  ) => {
    setFindings((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        return {
          ...f,
          ...patch,
          correctiveAction: {
            ...f.correctiveAction,
            ...patch.correctiveAction,
            priority:
              patch.correctiveAction?.priority ??
              patch.severity ??
              f.correctiveAction.priority,
          },
        };
      })
    );
  };

  const saveInspection = () => {
    if (!projectId || answered < checks.length) return;
    const record = addInspection({
      projectId,
      inspector: inspector.trim() || db.worker.name,
      weatherNotes: weatherNotes.trim(),
      comments: comments.trim(),
      checks,
      findings,
      overall,
    });
    setSavedId(record.id);
    setExpandedId(record.id);
    setStep("done");
  };

  return (
    <div>
      <PageHeader
        title="Site inspections"
        subtitle="Walkthrough checklist · findings · corrective actions"
        backHref="/forms"
      />

      <main className="space-y-4 px-4 py-5">
        <div className="helix-card space-y-3 border border-sky-200 bg-sky-50/80 p-4 dark:border-sky-500/30 dark:bg-sky-500/10">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-800 dark:text-sky-200">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="font-bold text-sky-950 dark:text-sky-100">
                Project site walkthrough
              </p>
              <p className="mt-1 text-sm text-sky-900/80 dark:text-sky-200/80">
                {siteInspectionDisclaimer}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/forms/inspections"
              className="rounded-xl bg-white/70 px-3 py-2.5 text-center text-sm font-semibold text-sky-950 dark:bg-black/20 dark:text-sky-100"
            >
              Crane &amp; rigging logs
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-white/70 px-3 py-2.5 text-center text-sm font-semibold text-sky-950 dark:bg-black/20 dark:text-sky-100"
            >
              Safety Hub
            </Link>
          </div>
          <a
            href="/cor-pdfs/internal-cor-site-inspection-checklist.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-3 dark:bg-black/20"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-900 dark:text-sky-100">
              <FileText className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">
                Internal COR Site Inspection Checklist
              </p>
              <p className="text-[11px] text-sky-900/70 dark:text-sky-200/70">
                Auditor field checklist · 12 pages
              </p>
            </div>
            <ExternalLink className="size-3.5 shrink-0 text-sky-800/60 dark:text-sky-200/60" />
          </a>
          <a
            href="/cor-pdfs/daily-site-safety-checklist.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-3 dark:bg-black/20"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-900 dark:text-sky-100">
              <FileText className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">
                Daily Site Safety Checklist
              </p>
              <p className="text-[11px] text-sky-900/70 dark:text-sky-200/70">
                Crane &amp; formwork · 6 pages
              </p>
            </div>
            <ExternalLink className="size-3.5 shrink-0 text-sky-800/60 dark:text-sky-200/60" />
          </a>
          <a
            href="/cor-pdfs/daily-site-inspection.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-3 dark:bg-black/20"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-900 dark:text-sky-100">
              <FileText className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">
                Daily Site Inspection
              </p>
              <p className="text-[11px] text-sky-900/70 dark:text-sky-200/70">
                Reference PDF · 23 pages
              </p>
            </div>
            <ExternalLink className="size-3.5 shrink-0 text-sky-800/60 dark:text-sky-200/60" />
          </a>
          <a
            href="/cor-pdfs/comprehensive-construction-site-inspection.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-3 dark:bg-black/20"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-900 dark:text-sky-100">
              <FileText className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">
                Comprehensive Construction Site Inspection
              </p>
              <p className="text-[11px] text-sky-900/70 dark:text-sky-200/70">
                Reference PDF · 101 pages
              </p>
            </div>
            <ExternalLink className="size-3.5 shrink-0 text-sky-800/60 dark:text-sky-200/60" />
          </a>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="helix-card p-3.5">
            <p className="font-mono text-2xl font-bold tabular-nums">
              {inspections.length}
            </p>
            <p className="text-[11px] text-muted-foreground">Inspections</p>
          </div>
          <div className="helix-card p-3.5">
            <p className="font-mono text-2xl font-bold tabular-nums text-rose-600">
              {allOpen.length}
            </p>
            <p className="text-[11px] text-muted-foreground">Open findings</p>
          </div>
          <div className="helix-card p-3.5">
            <p className="font-mono text-2xl font-bold tabular-nums text-amber-600">
              {severityCounts.high}
            </p>
            <p className="text-[11px] text-muted-foreground">High severity</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setStep("history")}
            className={cn(
              "min-h-12 rounded-2xl text-sm font-semibold",
              step === "history" || step === "done"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground ring-1 ring-border"
            )}
          >
            History
          </button>
          <Button
            className="h-12 rounded-2xl"
            onClick={startNew}
          >
            <Plus className="size-4" />
            New inspection
          </Button>
        </div>

        {(step === "history" || step === "done") && (
          <section className="space-y-3 pb-8">
            {step === "done" && savedId && (
              <div className="helix-card flex gap-3 border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Site inspection saved
                  </p>
                  <p className="mt-1 text-emerald-800/90 dark:text-emerald-200/80">
                    {findings.length} finding{findings.length === 1 ? "" : "s"} ·{" "}
                    overall {overall}
                  </p>
                </div>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search inspections or findings…"
                className="h-14 rounded-2xl pl-11 text-base"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setProjectFilter("all")}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-semibold",
                  projectFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                All sites
              </button>
              {db.projects
                .filter((p) => p.status === "active")
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProjectFilter(p.id)}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-semibold",
                      projectFilter === p.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {p.name.split("—")[0].trim()}
                  </button>
                ))}
            </div>

            {filteredHistory.length === 0 && (
              <div className="helix-card p-6 text-center text-sm text-muted-foreground">
                No site inspections yet. Start a walkthrough.
              </div>
            )}

            {filteredHistory.map((insp) => {
              const p = getProject(insp.projectId);
              const open = expandedId === insp.id;
              const openCount = insp.findings.filter(
                (f) => f.correctiveAction.status !== "closed"
              ).length;
              return (
                <div key={insp.id} className="helix-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : insp.id)}
                    className="flex w-full items-start gap-3 p-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold leading-snug">
                            {p?.name ?? "Unknown project"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(insp.inspectedAt).toLocaleString()} ·{" "}
                            {insp.inspector}
                          </p>
                        </div>
                        <Badge className={cn("shrink-0 border-0", overallStyle(insp.overall))}>
                          {insp.overall}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>
                          {insp.checks.filter((c) => c.result === "fail").length}{" "}
                          fails
                        </span>
                        <span>·</span>
                        <span>
                          {openCount} open finding{openCount === 1 ? "" : "s"}
                        </span>
                        {insp.weatherNotes && (
                          <>
                            <span>·</span>
                            <span>{insp.weatherNotes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>

                  {open && (
                    <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                      {insp.comments && (
                        <p className="text-sm text-muted-foreground">
                          {insp.comments}
                        </p>
                      )}
                      {insp.findings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No findings recorded.
                        </p>
                      ) : (
                        insp.findings.map((f) => (
                          <div
                            key={f.id}
                            className="space-y-2 rounded-2xl bg-muted/50 p-3.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-bold leading-snug">
                                  {f.title}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <MapPin className="size-3" />
                                  {f.location || "Site"}
                                </p>
                              </div>
                              <Badge
                                className={cn(
                                  "shrink-0 border-0 capitalize",
                                  severityStyle(f.severity)
                                )}
                              >
                                {f.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {f.description}
                            </p>
                            <div className="rounded-xl bg-background/80 px-3 py-2 text-sm">
                              <p className="font-semibold">
                                CA · {f.correctiveAction.assignee || "Unassigned"}
                              </p>
                              <p className="mt-0.5 text-muted-foreground">
                                {f.correctiveAction.description || "—"}
                              </p>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                Due {f.correctiveAction.dueDate} ·{" "}
                                {f.correctiveAction.status}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {(
                                ["open", "in-progress", "closed"] as const
                              ).map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() =>
                                    updateFindingStatus(insp.id, f.id, status)
                                  }
                                  className={cn(
                                    "rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize",
                                    f.correctiveAction.status === status
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {step === "inspect" && (
          <section className="space-y-4 pb-8">
            <div className="helix-card space-y-3 p-4">
              <p className="text-sm font-bold">Inspection header</p>
              <div className="space-y-1.5">
                <Label>Project</Label>
                <select
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    const p = getProject(e.target.value);
                    if (p) {
                      setWeatherNotes(`${p.weather} · ${p.temperature}°C`);
                    }
                  }}
                >
                  {db.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Inspector</Label>
                <Input
                  className="h-12 rounded-xl"
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Weather / conditions</Label>
                <Input
                  className="h-12 rounded-xl"
                  value={weatherNotes}
                  onChange={(e) => setWeatherNotes(e.target.value)}
                  placeholder="Wind, rain, visibility…"
                />
              </div>
            </div>

            <div className="helix-card space-y-2 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">
                  Checklist {answered}/{checks.length}
                </span>
                <Badge className={cn("border-0", overallStyle(overall))}>
                  {answered === 0 ? "Not started" : overall}
                </Badge>
              </div>
              <Progress value={progressPct} className="h-2.5" />
              {failedChecks.length > 0 && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                  <AlertTriangle className="size-3.5" />
                  {failedChecks.length} fail
                  {failedChecks.length === 1 ? "" : "s"} will become findings
                </p>
              )}
            </div>

            {grouped.map(({ category, checks: sectionChecks }) => {
              const open = openCategory === category.id;
              const done = sectionChecks.filter((c) => c.result != null).length;
              const fails = sectionChecks.filter((c) => c.result === "fail").length;
              return (
                <div key={category.id} className="helix-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenCategory(open ? "" : category.id)
                    }
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  >
                    <div>
                      <p className="font-bold">{category.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {done}/{sectionChecks.length} checked
                        {fails > 0 ? ` · ${fails} fail` : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">{open ? "Hide" : "Open"}</Badge>
                  </button>
                  {open && (
                    <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
                      {sectionChecks.map((item) => (
                        <CheckRow
                          key={item.id}
                          item={item}
                          onChange={(result) => setCheckResult(item.id, result)}
                          onNote={(note) => setCheckNote(item.id, note)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="helix-card space-y-1.5 p-4">
              <Label>Inspection comments</Label>
              <Textarea
                className="min-h-24 rounded-xl"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Summary of site conditions, trades present, follow-ups…"
              />
            </div>

            <Button
              className="h-12 w-full rounded-2xl"
              disabled={answered < checks.length}
              onClick={goToFindings}
            >
              {failedChecks.length > 0
                ? `Review ${failedChecks.length} finding${failedChecks.length === 1 ? "" : "s"}`
                : "Continue — no findings"}
            </Button>
            {answered < checks.length && (
              <p className="text-center text-xs text-muted-foreground">
                Complete all checklist items to continue ({checks.length - answered}{" "}
                remaining)
              </p>
            )}
          </section>
        )}

        {step === "findings" && (
          <section className="space-y-4 pb-8">
            <div className="helix-card space-y-2 p-4">
              <p className="font-bold">Findings & corrective actions</p>
              <p className="text-sm text-muted-foreground">
                Failed checklist items become findings. Assign severity, owner,
                and due date before saving.
              </p>
              <Badge className={cn("border-0", overallStyle(overall))}>
                Overall {overall}
              </Badge>
            </div>

            {findings.length === 0 ? (
              <div className="helix-card space-y-3 p-4 text-center">
                <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
                <p className="font-semibold">No findings</p>
                <p className="text-sm text-muted-foreground">
                  All applicable items passed or N/A. Save to complete the
                  inspection.
                </p>
              </div>
            ) : (
              findings.map((f, index) => (
                <div key={f.id} className="helix-card space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Finding {index + 1}
                    </p>
                    <div className="flex gap-1">
                      {(["low", "medium", "high"] as const).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() =>
                            updateFinding(f.id, {
                              severity: sev,
                              correctiveAction: { priority: sev },
                            })
                          }
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                            f.severity === sev
                              ? severityStyle(sev)
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input
                      className="h-11 rounded-xl"
                      value={f.title}
                      onChange={(e) =>
                        updateFinding(f.id, { title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      className="min-h-20 rounded-xl"
                      value={f.description}
                      onChange={(e) =>
                        updateFinding(f.id, { description: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Input
                      className="h-11 rounded-xl"
                      value={f.location}
                      onChange={(e) =>
                        updateFinding(f.id, { location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Corrective action</Label>
                    <Textarea
                      className="min-h-16 rounded-xl"
                      placeholder="What must be done to close this finding?"
                      value={f.correctiveAction.description}
                      onChange={(e) =>
                        updateFinding(f.id, {
                          correctiveAction: { description: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label>Assignee</Label>
                      <Input
                        className="h-11 rounded-xl"
                        value={f.correctiveAction.assignee}
                        onChange={(e) =>
                          updateFinding(f.id, {
                            correctiveAction: { assignee: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Due</Label>
                      <Input
                        type="date"
                        className="h-11 rounded-xl"
                        value={f.correctiveAction.dueDate}
                        onChange={(e) =>
                          updateFinding(f.id, {
                            correctiveAction: { dueDate: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-12 rounded-2xl"
                onClick={() => setStep("inspect")}
              >
                Back
              </Button>
              <Button className="h-12 rounded-2xl" onClick={saveInspection}>
                Save inspection
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
