"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Droplets,
  ExternalLink,
  FileText,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { useInspectionLog } from "@/components/providers/inspection-log-provider";
import { getEquipment, getProject } from "@/lib/db";
import { getChartsForEquipment } from "@/lib/crane-charts";
import {
  blankChecks,
  craneChecklist,
  deriveOverall,
  getCraneMaintenance,
  greasePointStatus,
  groupChecksBySection,
  lastGreasedForPoint,
} from "@/lib/inspections";
import { db } from "@/lib/db";
import type {
  CraneInspectionType,
  InspectionCheckItem,
  InspectionCheckResult,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TYPES: CraneInspectionType[] = ["daily", "shift", "weekly", "monthly"];

function overallStyle(overall: string) {
  if (overall === "pass") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  }
  if (overall === "fail") {
    return "bg-rose-500/15 text-rose-700 dark:text-rose-400";
  }
  return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
}

function CheckRow({
  item,
  onChange,
}: {
  item: InspectionCheckItem;
  onChange: (result: InspectionCheckResult) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <p className="text-sm font-semibold leading-snug">{item.label}</p>
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
    </div>
  );
}

export function CraneLogbookScreen({ equipmentId }: { equipmentId: string }) {
  const equipment = getEquipment(equipmentId);
  if (!equipment) notFound();

  const log = useInspectionLog();
  const entries = log.craneLogFor(equipmentId);
  const greaseLog = log.greasingLogFor(equipmentId);
  const schedule = getCraneMaintenance(equipmentId);
  const charts = getChartsForEquipment(equipmentId);
  const [mode, setMode] = useState<"log" | "new" | "grease">("log");
  const [expandedId, setExpandedId] = useState<string | null>(
    entries[0]?.id ?? null
  );

  const [inspectionType, setInspectionType] =
    useState<CraneInspectionType>("daily");
  const [inspector, setInspector] = useState(db.worker.name);
  const [projectId, setProjectId] = useState(
    db.projects.find((p) => p.assignedToday)?.id ?? ""
  );
  const [windKmh, setWindKmh] = useState("");
  const [hours, setHours] = useState("");
  const [comments, setComments] = useState("");
  const [checks, setChecks] = useState<InspectionCheckItem[]>(() =>
    blankChecks(craneChecklist)
  );

  const [greaseTech, setGreaseTech] = useState(db.worker.name);
  const [greaseNotes, setGreaseNotes] = useState("");
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);

  const overall = useMemo(() => deriveOverall(checks), [checks]);
  const incomplete = checks.some((c) => c.result === null);
  const grouped = useMemo(() => groupChecksBySection(checks), [checks]);

  const overdueCount =
    schedule?.greasePoints.filter((point) => {
      const last = lastGreasedForPoint(
        log.greasingEntries,
        equipmentId,
        point.id
      );
      return greasePointStatus(point, last).overdue;
    }).length ?? 0;

  const markAllPass = () => {
    setChecks((prev) => prev.map((c) => ({ ...c, result: "pass" })));
  };

  const markSectionPass = (section: string) => {
    setChecks((prev) =>
      prev.map((c) =>
        (c.section ?? "General") === section ? { ...c, result: "pass" } : c
      )
    );
  };

  const submit = () => {
    if (incomplete) return;
    const entry = log.addCraneEntry({
      equipmentId,
      inspectionType,
      inspector: inspector.trim() || db.worker.name,
      projectId: projectId || null,
      windKmh: windKmh ? Number(windKmh) : null,
      hours: hours ? Number(hours) : null,
      checks,
      comments: comments.trim(),
    });
    setMode("log");
    setExpandedId(entry.id);
    setChecks(blankChecks(craneChecklist));
    setComments("");
    setWindKmh("");
    setHours("");
  };

  const submitGreasing = () => {
    if (selectedPoints.length === 0) return;
    log.addGreasingEntry({
      equipmentId,
      technician: greaseTech.trim() || db.worker.name,
      pointIds: selectedPoints,
      notes: greaseNotes.trim(),
    });
    setSelectedPoints([]);
    setGreaseNotes("");
    setMode("grease");
  };

  return (
    <div>
      <PageHeader
        title={equipment.assetTag}
        subtitle={`${equipment.name} · log book`}
        backHref="/forms/inspections"
      />

      <main className="space-y-4 px-4 py-5">
        <div className="helix-card space-y-2 p-4">
          <p className="font-bold">{equipment.name}</p>
          <p className="text-sm text-muted-foreground">
            {equipment.manufacturer} {equipment.model} ·{" "}
            <span className="capitalize">
              {equipment.status.replace("-", " ")}
            </span>
          </p>
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
              <AlertTriangle className="size-4 shrink-0" />
              {overdueCount} greasing point
              {overdueCount === 1 ? "" : "s"} overdue
            </div>
          )}
          {charts.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              {charts.map((chart) => (
                <Button
                  key={chart.id}
                  asChild
                  variant="outline"
                  className="h-11 justify-start rounded-xl"
                >
                  <a href={chart.file} target="_blank" rel="noopener noreferrer">
                    <FileText className="size-4" />
                    Load chart · {chart.model}
                    <ExternalLink className="ml-auto size-4" />
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["log", `Log (${entries.length})`],
              ["new", "Inspect"],
              ["grease", "Greasing"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                "min-h-12 rounded-2xl text-sm font-semibold",
                mode === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-border"
              )}
            >
              {id === "new" && <Plus className="mr-1 inline size-4" />}
              {id === "grease" && <Droplets className="mr-1 inline size-4" />}
              {label}
            </button>
          ))}
        </div>

        {mode === "new" && (
          <section className="space-y-4 pb-4">
            <div>
              <Label className="mb-2 block">Inspection type</Label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInspectionType(t)}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-semibold capitalize",
                      inspectionType === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
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
              <Label>Project</Label>
              <select
                className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Select project</option>
                {db.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Wind (km/h)</Label>
                <Input
                  className="h-12 rounded-xl"
                  inputMode="decimal"
                  value={windKmh}
                  onChange={(e) => setWindKmh(e.target.value)}
                  placeholder="—"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hours</Label>
                <Input
                  className="h-12 rounded-xl"
                  inputMode="decimal"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="—"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">Checklist</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-xl"
                onClick={markAllPass}
              >
                Mark all pass
              </Button>
            </div>

            <div className="space-y-4">
              {grouped.map(({ section, items }) => (
                <div key={section} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {section}
                    </p>
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary"
                      onClick={() => markSectionPass(section)}
                    >
                      Pass section
                    </button>
                  </div>
                  {items.map((item) => (
                    <CheckRow
                      key={item.id}
                      item={item}
                      onChange={(result) =>
                        setChecks((prev) =>
                          prev.map((c) =>
                            c.id === item.id ? { ...c, result } : c
                          )
                        )
                      }
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Comments</Label>
              <Textarea
                className="min-h-24 rounded-xl"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Limits, E-stop tests, greasing notes, deficiencies…"
              />
            </div>

            <div className="helix-card flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Result
                </p>
                <Badge
                  className={cn("mt-1 border-0 capitalize", overallStyle(overall))}
                >
                  {overall}
                </Badge>
              </div>
              <Button
                size="lg"
                className="h-12 rounded-2xl px-6 font-bold"
                disabled={incomplete}
                onClick={submit}
              >
                Save to log book
              </Button>
            </div>
            {incomplete && (
              <p className="text-center text-sm text-muted-foreground">
                Complete every checklist item to save.
              </p>
            )}
          </section>
        )}

        {mode === "grease" && (
          <section className="space-y-4 pb-4">
            {!schedule && (
              <div className="helix-card p-6 text-center text-sm text-muted-foreground">
                No greasing schedule configured for this crane.
              </div>
            )}

            {schedule && (
              <>
                <div className="helix-card space-y-2 p-4">
                  <p className="font-bold">Greasing / maintenance schedule</p>
                  <p className="text-sm text-muted-foreground">{schedule.notes}</p>
                </div>

                <div className="space-y-2">
                  {schedule.greasePoints.map((point) => {
                    const last = lastGreasedForPoint(
                      log.greasingEntries,
                      equipmentId,
                      point.id
                    );
                    const status = greasePointStatus(point, last);
                    const selected = selectedPoints.includes(point.id);
                    return (
                      <button
                        key={point.id}
                        type="button"
                        onClick={() =>
                          setSelectedPoints((prev) =>
                            selected
                              ? prev.filter((id) => id !== point.id)
                              : [...prev, point.id]
                          )
                        }
                        className={cn(
                          "w-full rounded-2xl border p-4 text-left",
                          selected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border bg-card",
                          status.overdue && !selected && "ring-1 ring-amber-500/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold leading-snug">
                              {point.label}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Every {point.intervalDays} day
                              {point.intervalDays === 1 ? "" : "s"}
                              {last
                                ? ` · Last ${new Date(last.greasedAt).toLocaleDateString()}`
                                : " · Never logged"}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              "shrink-0 border-0",
                              status.overdue
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            )}
                          >
                            {status.overdue
                              ? "Due now"
                              : `Due in ${status.daysLeft}d`}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1.5">
                  <Label>Technician</Label>
                  <Input
                    className="h-12 rounded-xl"
                    value={greaseTech}
                    onChange={(e) => setGreaseTech(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    className="min-h-20 rounded-xl"
                    value={greaseNotes}
                    onChange={(e) => setGreaseNotes(e.target.value)}
                    placeholder="Grease type, quantity, issues found…"
                  />
                </div>
                <Button
                  size="lg"
                  className="h-14 w-full rounded-2xl text-base font-bold"
                  disabled={selectedPoints.length === 0}
                  onClick={submitGreasing}
                >
                  <Droplets className="size-5" />
                  Log greasing ({selectedPoints.length})
                </Button>

                <div className="space-y-2 pt-2">
                  <p className="text-sm font-bold">Greasing history</p>
                  {greaseLog.length === 0 && (
                    <p className="text-sm text-muted-foreground">No greasing logs yet.</p>
                  )}
                  {greaseLog.map((entry) => (
                    <div key={entry.id} className="helix-card space-y-1 p-4">
                      <p className="font-semibold">
                        {new Date(entry.greasedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.technician} · {entry.pointIds.length} point
                        {entry.pointIds.length === 1 ? "" : "s"}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {mode === "log" && (
          <section className="space-y-2 pb-4">
            {entries.length === 0 && (
              <div className="helix-card p-6 text-center text-sm text-muted-foreground">
                No inspections yet. Start the first log entry.
                <Button
                  className="mt-4 h-12 w-full rounded-2xl"
                  onClick={() => setMode("new")}
                >
                  New inspection
                </Button>
              </div>
            )}
            {entries.map((entry) => {
              const open = expandedId === entry.id;
              const project = entry.projectId
                ? getProject(entry.projectId)
                : undefined;
              const sections = groupChecksBySection(entry.checks);
              return (
                <div key={entry.id} className="helix-card overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 p-4 text-left"
                    onClick={() => setExpandedId(open ? null : entry.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={cn(
                            "border-0 capitalize",
                            overallStyle(entry.overall)
                          )}
                        >
                          {entry.overall}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {entry.inspectionType}
                        </Badge>
                      </div>
                      <p className="mt-2 font-semibold">
                        {new Date(entry.inspectedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.inspector}
                        {project ? ` · ${project.projectNumber}` : ""}
                        {entry.windKmh != null
                          ? ` · Wind ${entry.windKmh} km/h`
                          : ""}
                      </p>
                    </div>
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                      {sections.map(({ section, items }) => (
                        <div key={section} className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {section}
                          </p>
                          {items.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-start justify-between gap-3 text-sm"
                            >
                              <span className="leading-snug text-muted-foreground">
                                {c.label}
                              </span>
                              <Badge
                                className={cn(
                                  "shrink-0 border-0 capitalize",
                                  overallStyle(
                                    c.result === "fail"
                                      ? "fail"
                                      : c.result === "pass"
                                        ? "pass"
                                        : "conditional"
                                  )
                                )}
                              >
                                {c.result ?? "—"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ))}
                      {entry.comments && (
                        <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm">
                          {entry.comments}
                        </p>
                      )}
                      <Link
                        href="/forms/cranes"
                        className="inline-flex text-sm font-semibold text-primary"
                      >
                        Review load charts
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
