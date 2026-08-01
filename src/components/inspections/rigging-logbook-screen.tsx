"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { useInspectionLog } from "@/components/providers/inspection-log-provider";
import { db, getProject } from "@/lib/db";
import {
  blankChecks,
  checklistForSelectedGear,
  deriveRiggingOverall,
  entryGearIds,
  getRiggingGear,
  groupChecksBySection,
  normalizeRiggingEntry,
  riggingCategories,
  riggingGear,
} from "@/lib/inspections";
import type {
  InspectionCheckItem,
  InspectionCheckResult,
  RiggingGearResult,
  RiggingInspectionType,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TYPES: RiggingInspectionType[] = [
  "pre-use",
  "periodic",
  "after-incident",
];

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

export function RiggingLogbookScreen() {
  const log = useInspectionLog();
  const entries = log.allRiggingLogs();
  const [mode, setMode] = useState<"log" | "new">("log");
  const [expandedId, setExpandedId] = useState<string | null>(
    entries[0]?.id ?? null
  );
  const [filterCat, setFilterCat] = useState<string>("all");

  const [inspectionType, setInspectionType] =
    useState<RiggingInspectionType>("pre-use");
  const [inspector, setInspector] = useState(db.worker.name);
  const [projectId, setProjectId] = useState(
    db.projects.find((p) => p.assignedToday)?.id ?? ""
  );
  const [comments, setComments] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [gearResults, setGearResults] = useState<RiggingGearResult[]>([]);
  const [checks, setChecks] = useState<InspectionCheckItem[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const overall = useMemo(
    () => deriveRiggingOverall(gearResults, checks),
    [gearResults, checks]
  );

  const ratedSelected = gearResults.filter(
    (g) => g.result === "pass" || g.result === "fail"
  );
  const unratedSelected = selectedIds.filter(
    (id) =>
      !gearResults.some(
        (g) => g.gearId === id && (g.result === "pass" || g.result === "fail")
      )
  );
  const canSave = selectedIds.length > 0 && unratedSelected.length === 0;

  const filteredGear = useMemo(() => {
    if (filterCat === "all") return riggingGear;
    return riggingGear.filter((g) => g.category === filterCat);
  }, [filterCat]);

  const toggleGear = (gearId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(gearId)) {
        setGearResults((results) => results.filter((g) => g.gearId !== gearId));
        const next = prev.filter((id) => id !== gearId);
        setChecks(blankChecks(checklistForSelectedGear(next)));
        return next;
      }
      const next = [...prev, gearId];
      setGearResults((results) => [...results, { gearId, result: null }]);
      setChecks(blankChecks(checklistForSelectedGear(next)));
      return next;
    });
  };

  const setGearResult = (gearId: string, result: InspectionCheckResult) => {
    setGearResults((prev) =>
      prev.map((g) =>
        g.gearId === gearId
          ? { ...g, result: g.result === result ? null : result }
          : g
      )
    );
  };

  const markSelectedPass = () => {
    setGearResults((prev) =>
      prev.map((g) =>
        selectedIds.includes(g.gearId) ? { ...g, result: "pass" } : g
      )
    );
  };

  const submit = () => {
    if (!canSave) return;
    const entry = log.addRiggingEntry({
      gearIds: selectedIds,
      gearResults: gearResults.filter((g) => selectedIds.includes(g.gearId)),
      inspectionType,
      inspector: inspector.trim() || db.worker.name,
      projectId: projectId || null,
      checks: checks.filter((c) => c.result !== null),
      comments: comments.trim(),
    });
    setMode("log");
    setExpandedId(entry.id);
    setSelectedIds([]);
    setGearResults([]);
    setChecks([]);
    setComments("");
    setShowDetails(false);
  };

  return (
    <div>
      <PageHeader
        title="Rigging inspection"
        subtitle="One walkaround — only gear in use"
        backHref="/forms/inspections"
      />

      <main className="space-y-4 px-4 py-5">
        <div className="helix-card space-y-2 p-4">
          <p className="font-bold">Pre-use / periodic check</p>
          <p className="text-sm text-muted-foreground">
            Select what you&apos;re using this lift. Skip the rest — unused gear
            does not need to be checked to pass.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("log")}
            className={cn(
              "min-h-12 rounded-2xl text-sm font-semibold",
              mode === "log"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground ring-1 ring-border"
            )}
          >
            Log ({entries.length})
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={cn(
              "inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold",
              mode === "new"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground ring-1 ring-border"
            )}
          >
            <Plus className="size-4" />
            New inspection
          </button>
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
                    {t.replace("-", " ")}
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

            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold">Gear in use</p>
                <p className="text-xs text-muted-foreground">
                  {selectedIds.length} selected
                  {unratedSelected.length > 0
                    ? ` · ${unratedSelected.length} need Pass/Fail`
                    : ""}
                </p>
              </div>
              {selectedIds.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-xl"
                  onClick={markSelectedPass}
                >
                  Pass selected
                </Button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setFilterCat("all")}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold",
                  filterCat === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                All
              </button>
              {riggingCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold",
                    filterCat === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredGear.map((gear) => {
                const selected = selectedIds.includes(gear.id);
                const result =
                  gearResults.find((g) => g.gearId === gear.id)?.result ?? null;
                return (
                  <div
                    key={gear.id}
                    className={cn(
                      "rounded-2xl border p-3.5",
                      selected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                        : "border-border bg-card"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleGear(gear.id)}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted text-muted-foreground"
                        )}
                      >
                        {selected ? <Check className="size-3.5" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <Badge className="border-0 bg-violet-500/15 text-violet-700 dark:text-violet-400">
                            {gear.category}
                          </Badge>
                          {gear.status !== "in-service" && (
                            <Badge variant="outline" className="capitalize">
                              {gear.status.replace("-", " ")}
                            </Badge>
                          )}
                        </span>
                        <span className="mt-1 block font-semibold leading-snug">
                          {gear.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {gear.assetTag} · {gear.capacity}
                        </span>
                      </span>
                    </button>
                    {selected && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {(
                          [
                            ["pass", "Pass", Check, "bg-emerald-600 text-white"],
                            ["fail", "Fail / tag out", X, "bg-rose-600 text-white"],
                          ] as const
                        ).map(([value, label, Icon, active]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setGearResult(gear.id, value)}
                            className={cn(
                              "flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold ring-1 ring-border",
                              result === value
                                ? active
                                : "bg-muted/50 text-muted-foreground"
                            )}
                          >
                            <Icon className="size-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedIds.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowDetails((v) => !v)}
                  className="text-sm font-semibold text-primary"
                >
                  {showDetails
                    ? "Hide optional detail checks"
                    : "Optional detail checks (skip anything N/A)"}
                </button>
                {showDetails && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Only for the gear you selected. Leave blank or mark N/A —
                      does not block saving.
                    </p>
                    {checks.map((item) => (
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
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Comments</Label>
              <Textarea
                className="min-h-24 rounded-xl"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Lift notes, tag-outs, NDT…"
              />
            </div>

            <div className="helix-card flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Result
                </p>
                <Badge
                  className={cn("mt-1 border-0 capitalize", overallStyle(overall))}
                >
                  {overall}
                </Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ratedSelected.length} of {riggingGear.length} gear checked
                </p>
              </div>
              <Button
                size="lg"
                className="h-12 rounded-2xl px-6 font-bold"
                disabled={!canSave}
                onClick={submit}
              >
                Save inspection
              </Button>
            </div>
            {!canSave && (
              <p className="text-center text-sm text-muted-foreground">
                {selectedIds.length === 0
                  ? "Select the gear you're using, then Pass or Fail each."
                  : "Pass or Fail each selected item (unused gear stays unchecked)."}
              </p>
            )}
          </section>
        )}

        {mode === "log" && (
          <section className="space-y-2 pb-4">
            {entries.length === 0 && (
              <div className="helix-card p-6 text-center text-sm text-muted-foreground">
                No inspections yet.
                <Button
                  className="mt-4 h-12 w-full rounded-2xl"
                  onClick={() => setMode("new")}
                >
                  New inspection
                </Button>
              </div>
            )}
            {entries.map((raw) => {
              const entry = normalizeRiggingEntry(raw);
              const open = expandedId === entry.id;
              const project = entry.projectId
                ? getProject(entry.projectId)
                : undefined;
              const ids = entryGearIds(entry);
              const detailChecks = entry.checks.filter((c) => c.result !== null);
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
                          {entry.inspectionType.replace("-", " ")}
                        </Badge>
                        <Badge variant="outline">
                          {ids.length} item{ids.length === 1 ? "" : "s"}
                        </Badge>
                      </div>
                      <p className="mt-2 font-semibold">
                        {new Date(entry.inspectedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.inspector}
                        {project ? ` · ${project.projectNumber}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ids
                          .map((id) => getRiggingGear(id)?.assetTag ?? id)
                          .join(" · ")}
                      </p>
                    </div>
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Gear checked
                      </p>
                      {entry.gearResults.map((gr) => {
                        const gear = getRiggingGear(gr.gearId);
                        return (
                          <div
                            key={gr.gearId}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <span className="leading-snug text-muted-foreground">
                              {gear
                                ? `${gear.assetTag} · ${gear.name}`
                                : gr.gearId}
                            </span>
                            <Badge
                              className={cn(
                                "shrink-0 border-0 capitalize",
                                overallStyle(
                                  gr.result === "fail"
                                    ? "fail"
                                    : gr.result === "pass"
                                      ? "pass"
                                      : "conditional"
                                )
                              )}
                            >
                              {gr.result ?? "—"}
                            </Badge>
                          </div>
                        );
                      })}
                      {detailChecks.length > 0 && (
                        <>
                          <p className="pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Detail checks
                          </p>
                          {groupChecksBySection(detailChecks).map(
                            ({ section, items }) => (
                              <div key={section} className="space-y-2">
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
                            )
                          )}
                        </>
                      )}
                      {entry.comments && (
                        <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm">
                          {entry.comments}
                        </p>
                      )}
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
