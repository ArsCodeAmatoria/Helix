"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  CalendarDays,
  LogIn,
  LogOut,
  MapPin,
  Timer,
} from "lucide-react";
import { useTimeClock } from "@/components/providers/timeclock-provider";
import { DigitalClock, SessionTimer } from "@/components/timeclock/digital-clock";
import { db, getProject } from "@/lib/db";
import {
  formatDateLabel,
  formatDuration,
  formatTime,
  visitDurationMs,
} from "@/lib/timeclock";
import type { SiteVisit } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function LiveVisitDuration({
  visit,
  withMillis = true,
}: {
  visit: SiteVisit;
  withMillis?: boolean;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (visit.clockOut) return;
    const id = setInterval(() => setNow(Date.now()), withMillis ? 50 : 1000);
    return () => clearInterval(id);
  }, [visit.clockOut, withMillis]);

  return (
    <>
      {formatDuration(
        visitDurationMs(visit, now),
        true,
        withMillis && !visit.clockOut
      )}
    </>
  );
}

function TodayTimeline({ visits }: { visits: SiteVisit[] }) {
  const chronological = useMemo(
    () =>
      [...visits].sort(
        (a, b) =>
          new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime()
      ),
    [visits]
  );

  if (chronological.length === 0) return null;

  return (
    <div className="helix-card p-4">
      <p className="mb-3 text-sm font-bold">Today&apos;s timeline</p>
      <div className="space-y-0">
        {chronological.map((visit, i) => {
          const project = getProject(visit.projectId);
          const open = visit.clockOut === null;
          return (
            <div key={visit.id} className="flex gap-3">
              <div className="flex w-10 flex-col items-center">
                <span
                  className={cn(
                    "mt-1 size-3 rounded-full ring-4",
                    open
                      ? "bg-emerald-500 ring-emerald-500/20"
                      : "bg-primary ring-primary/15"
                  )}
                />
                {i < chronological.length - 1 && (
                  <span className="mt-1 w-0.5 flex-1 bg-border" />
                )}
              </div>
              <div className={cn("min-w-0 flex-1 pb-4", i === chronological.length - 1 && "pb-0")}>
                <p className="text-xs font-semibold text-muted-foreground">
                  {formatTime(visit.clockIn)}
                  {visit.clockOut ? ` → ${formatTime(visit.clockOut)}` : " → now"}
                </p>
                <p className="font-semibold leading-snug">
                  {project?.name ?? "Site"}
                </p>
                <p className="text-xs text-muted-foreground">
                  <LiveVisitDuration visit={visit} />
                  {open ? " · active" : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TimeClockScreen() {
  const {
    visits,
    activeVisit,
    todaysVisits,
    todaysTotalMs,
    clockIn,
    clockOut,
    switchSite,
  } = useTimeClock();

  const [now, setNow] = useState(Date.now());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"in" | "switch">("in");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, []);

  const activeProject = activeVisit
    ? getProject(activeVisit.projectId)
    : null;

  const liveTodayTotal = useMemo(() => {
    return todaysVisits.reduce((sum, v) => sum + visitDurationMs(v, now), 0);
  }, [todaysVisits, now]);

  const weekTotalMs = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    return visits
      .filter((v) => new Date(v.clockIn) >= start)
      .reduce((sum, v) => sum + visitDurationMs(v, now), 0);
  }, [visits, now]);

  const historyGroups = useMemo(() => {
    const sorted = [...visits].sort(
      (a, b) =>
        new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()
    );
    const groups: { label: string; items: SiteVisit[] }[] = [];
    for (const visit of sorted) {
      const label = formatDateLabel(visit.clockIn);
      const existing = groups.find((g) => g.label === label);
      if (existing) existing.items.push(visit);
      else groups.push({ label, items: [visit] });
    }
    return groups;
  }, [visits]);

  const openPicker = (mode: "in" | "switch") => {
    setPickerMode(mode);
    setSelectedProjectId(
      mode === "switch"
        ? null
        : db.projects.find((p) => p.assignedToday)?.id ??
            db.projects[0]?.id ??
            null
    );
    setNote("");
    setPickerOpen(true);
  };

  const confirmPicker = async () => {
    if (!selectedProjectId) return;
    setBusy(true);
    try {
      if (pickerMode === "switch") {
        await switchSite(selectedProjectId, note);
      } else {
        await clockIn(selectedProjectId, note);
      }
      setPickerOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleClockOut = async () => {
    setBusy(true);
    try {
      await clockOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Time Clock" subtitle="Live punch · multi-site visits" />

      <main className="space-y-5 px-4 py-5">
        <DigitalClock active={Boolean(activeVisit)} />

        {activeVisit && (
          <SessionTimer startIso={activeVisit.clockIn} />
        )}

        <div
          className={cn(
            "helix-card space-y-4 p-5",
            activeVisit &&
              "ring-2 ring-emerald-500/25 bg-emerald-50/40 dark:bg-emerald-500/5"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Punch status
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {activeVisit ? "Signed in" : "Signed out"}
              </p>
            </div>
            <div
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
                activeVisit
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {activeVisit ? "Live" : "Idle"}
            </div>
          </div>

          {activeVisit && activeProject ? (
            <div className="space-y-2 rounded-2xl bg-card/90 p-3.5 dark:bg-background/40">
              <p className="text-xs font-semibold text-primary">
                {activeProject.projectNumber}
              </p>
              <p className="font-semibold leading-snug">{activeProject.name}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                {activeProject.address}, {activeProject.city}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
                <span>
                  <span className="text-muted-foreground">Signed in </span>
                  <span className="font-semibold">
                    {formatTime(activeVisit.clockIn, true)}
                  </span>
                </span>
                <span>
                  <span className="text-muted-foreground">Elapsed </span>
                  <span className="font-semibold tabular-nums">
                    <LiveVisitDuration visit={activeVisit} />
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sign in when you arrive. Make separate punches for each site visit
              today — morning yard, afternoon tower, evening pour.
            </p>
          )}

          <div className="grid gap-3">
            {activeVisit ? (
              <>
                <Button
                  size="lg"
                  className="h-16 rounded-2xl bg-rose-600 text-base font-bold text-white hover:bg-rose-700"
                  disabled={busy}
                  onClick={handleClockOut}
                >
                  <LogOut className="size-5" />
                  Sign out · {formatDuration(visitDurationMs(activeVisit, now), true, true)}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-2xl text-base font-semibold"
                  disabled={busy}
                  onClick={() => openPicker("switch")}
                >
                  <ArrowRightLeft className="size-5" />
                  Switch site visit
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                className="h-16 rounded-2xl text-base font-bold shadow-md shadow-primary/20"
                disabled={busy}
                onClick={() => openPicker("in")}
              >
                <LogIn className="size-5" />
                Sign in to site
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="helix-card p-3.5">
            <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Timer className="size-4" />
            </div>
            <p className="font-mono text-lg font-bold tabular-nums leading-tight">
              {formatDuration(liveTodayTotal, true, true)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
              Today
            </p>
          </div>
          <div className="helix-card p-3.5">
            <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <MapPin className="size-4" />
            </div>
            <p className="text-lg font-bold leading-tight">
              {todaysVisits.length}
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
              Visits
            </p>
          </div>
          <div className="helix-card p-3.5">
            <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <CalendarDays className="size-4" />
            </div>
            <p className="text-lg font-bold leading-tight">
              {formatDuration(weekTotalMs)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
              This week
            </p>
          </div>
        </div>

        <TodayTimeline visits={todaysVisits} />

        <section className="space-y-4 pb-2">
          <h2 className="text-base font-bold">Visit history</h2>
          {historyGroups.length === 0 && (
            <div className="helix-card p-6 text-center text-sm text-muted-foreground">
              No visits yet. Sign in when you arrive on site.
            </div>
          )}
          {historyGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-muted-foreground">
                  {group.label}
                </p>
                {group.label === "Today" && (
                  <p className="font-mono text-xs font-semibold tabular-nums text-primary">
                    {formatDuration(
                      group.items.reduce(
                        (s, v) => s + visitDurationMs(v, now),
                        0
                      ),
                      true,
                      true
                    )}
                  </p>
                )}
              </div>
              {group.items.map((visit) => {
                const project = getProject(visit.projectId);
                const open = visit.clockOut === null;
                return (
                  <article
                    key={visit.id}
                    className={cn(
                      "helix-card p-4",
                      open && "ring-2 ring-emerald-500/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-primary">
                          {project?.projectNumber ?? "Site"}
                        </p>
                        <p className="font-semibold leading-snug">
                          {project?.name ?? "Unknown site"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {project?.city}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-bold tabular-nums",
                          open
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {open ? (
                          <>
                            LIVE · <LiveVisitDuration visit={visit} />
                          </>
                        ) : (
                          formatDuration(visitDurationMs(visit), true)
                        )}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-muted/60 px-3 py-2">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Sign in
                        </p>
                        <p className="font-semibold">{formatTime(visit.clockIn, true)}</p>
                      </div>
                      <div className="rounded-xl bg-muted/60 px-3 py-2">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Sign out
                        </p>
                        <p className="font-semibold">
                          {visit.clockOut
                            ? formatTime(visit.clockOut, true)
                            : "—"}
                        </p>
                      </div>
                    </div>
                    {visit.note && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {visit.note}
                      </p>
                    )}
                    {(visit.gpsIn || visit.gpsOut) && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        GPS{" "}
                        {visit.gpsIn
                          ? `${visit.gpsIn.lat.toFixed(4)}, ${visit.gpsIn.lng.toFixed(4)}`
                          : "—"}
                        {visit.gpsOut
                          ? ` → ${visit.gpsOut.lat.toFixed(4)}, ${visit.gpsOut.lng.toFixed(4)}`
                          : ""}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ))}
        </section>
      </main>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {pickerMode === "switch" ? "Switch to site" : "Sign in to site"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {pickerMode === "switch"
                ? "Ends the current visit and starts a new site punch."
                : "Choose the project site for this visit."}
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {db.projects.map((p) => {
                const selected = selectedProjectId === p.id;
                const isCurrent = activeVisit?.projectId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isCurrent && pickerMode === "switch"}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={cn(
                      "w-full rounded-2xl border p-3.5 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                        : "border-border bg-card hover:border-primary/30",
                      isCurrent && pickerMode === "switch" && "opacity-40"
                    )}
                  >
                    <p className="text-xs font-semibold text-primary">
                      {p.projectNumber}
                      {p.assignedToday ? " · Assigned today" : ""}
                    </p>
                    <p className="font-semibold leading-snug">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.address}, {p.city}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Textarea
                className="min-h-20 rounded-xl"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Afternoon concrete pour"
              />
            </div>
            <Button
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-bold"
              disabled={!selectedProjectId || busy}
              onClick={confirmPicker}
            >
              {pickerMode === "switch" ? "Switch & sign in" : "Confirm sign in"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
