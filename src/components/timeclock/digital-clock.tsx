"use client";

import { useEffect, useState } from "react";
import { formatClockParts, formatDuration } from "@/lib/timeclock";
import { cn } from "@/lib/utils";

interface DigitalClockProps {
  active?: boolean;
  className?: string;
}

export function DigitalClock({ active = false, className }: DigitalClockProps) {
  const [now, setNow] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 50);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "helix-card min-h-[200px] animate-pulse bg-slate-900 p-5",
          className
        )}
      />
    );
  }

  const parts = formatClockParts(now);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.35)]",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-6 size-36 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/90">
            Proven Time Clock
          </p>
          <p className="mt-1 text-sm font-medium text-slate-300">
            {parts.dateLine}
          </p>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
            active
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-white/10 text-slate-300"
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              active ? "animate-pulse bg-emerald-400" : "bg-slate-400"
            )}
          />
          {active ? "On site" : "Off duty"}
        </div>
      </div>

      {/* HH : MM : SS . CS */}
      <div className="relative mt-5 flex items-end justify-center gap-0.5 font-mono tracking-tight sm:gap-1">
        <TimeBlock value={parts.hours} label="HRS" />
        <Colon />
        <TimeBlock value={parts.minutes} label="MIN" />
        <Colon />
        <TimeBlock value={parts.seconds} label="SEC" />
        <span className="mb-7 px-0.5 text-2xl font-bold text-sky-400/70 sm:mb-8 sm:text-3xl">
          .
        </span>
        <TimeBlock value={parts.centis} label="MS" accent small />
        <span className="mb-6 ml-2 text-base font-bold text-sky-300 sm:mb-7 sm:text-lg">
          {parts.ampm}
        </span>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
        <MetaChip label="24h" value={parts.hours24 + ":" + parts.minutes} />
        <MetaChip label="Day" value={String(parts.day).padStart(2, "0")} />
        <MetaChip label="Year" value={String(parts.year)} />
      </div>

      <p className="relative mt-3 text-center text-xs font-medium text-slate-400">
        {parts.weekday} · {parts.timeZone} · {parts.millis} ms
      </p>
    </div>
  );
}

function TimeBlock({
  value,
  label,
  accent = false,
  small = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={cn(
          "inline-flex justify-center font-bold leading-none tabular-nums",
          small
            ? "min-w-[1.6ch] text-[1.85rem] sm:text-4xl"
            : "min-w-[1.55ch] text-[2.75rem] sm:text-5xl",
          accent ? "text-sky-300" : "text-white"
        )}
      >
        {value}
      </span>
      <span className="mt-1.5 text-[9px] font-bold tracking-[0.14em] text-slate-400">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span className="mb-6 animate-pulse px-0.5 text-[2rem] font-bold leading-none text-sky-400/80 sm:mb-7 sm:text-4xl">
      :
    </span>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-2 py-1.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="font-mono text-sm font-semibold tabular-nums text-slate-200">
        {value}
      </p>
    </div>
  );
}

interface SessionTimerProps {
  startIso: string;
  label?: string;
}

export function SessionTimer({
  startIso,
  label = "Session elapsed",
}: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () =>
      setElapsed(Math.max(0, Date.now() - new Date(startIso).getTime()));
    tick();
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [startIso]);

  const parts = formatDuration(elapsed, true, true).split(".");
  const main = parts[0] ?? "00:00:00";
  const cs = parts[1] ?? "00";

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          {label}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70 dark:text-emerald-300/70">
          HRS · MIN · SEC · MS
        </p>
      </div>
      <p className="mt-1 font-mono text-3xl font-bold tabular-nums tracking-tight text-emerald-700 dark:text-emerald-300">
        {main}
        <span className="text-emerald-500/80">.{cs}</span>
      </p>
    </div>
  );
}
