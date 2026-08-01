import type { SiteVisit } from "@/lib/types";

export function formatTime(iso: string, withSeconds = false): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" as const } : {}),
  });
}

export function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function visitDurationMs(visit: SiteVisit, now = Date.now()): number {
  const start = new Date(visit.clockIn).getTime();
  const end = visit.clockOut ? new Date(visit.clockOut).getTime() : now;
  return Math.max(0, end - start);
}

export function formatDuration(
  ms: number,
  withSeconds = false,
  withMillis = false
): string {
  const totalMs = Math.max(0, Math.floor(ms));
  const totalSec = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const cs = Math.floor((totalMs % 1000) / 10);
  if (withMillis) {
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs
      .toString()
      .padStart(2, "0")}`;
  }
  if (withSeconds) {
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  if (h <= 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function formatClockParts(date: Date) {
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const millis = date.getMilliseconds().toString().padStart(3, "0");
  const centis = Math.floor(date.getMilliseconds() / 10)
    .toString()
    .padStart(2, "0");
  const ampm = hours24 >= 12 ? "PM" : "AM";
  const weekday = date.toLocaleDateString("en-CA", { weekday: "long" });
  const month = date.toLocaleDateString("en-CA", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone?.replace(/_/g, " ") ??
    "Local";
  return {
    hours: hours12.toString().padStart(2, "0"),
    hours24: hours24.toString().padStart(2, "0"),
    minutes,
    seconds,
    millis,
    centis,
    ampm,
    weekday,
    month,
    day,
    year,
    timeZone,
    dateLine: `${weekday}, ${month} ${day}, ${year}`,
  };
}

export function isSameDay(iso: string, date = new Date()): boolean {
  return new Date(iso).toDateString() === date.toDateString();
}

export function createVisitId(): string {
  return `visit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Sample prior visits so the UI isn't empty on first load */
export function seedVisits(): SiteVisit[] {
  const today = new Date();
  const morningIn = new Date(today);
  morningIn.setHours(6, 42, 0, 0);
  const morningOut = new Date(today);
  morningOut.setHours(10, 15, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yIn = new Date(yesterday);
  yIn.setHours(6, 55, 0, 0);
  const yOut = new Date(yesterday);
  yOut.setHours(15, 30, 0, 0);

  return [
    {
      id: "visit-seed-1",
      projectId: "proj-oceanview",
      clockIn: morningIn.toISOString(),
      clockOut: morningOut.toISOString(),
      note: "Morning deck pour support",
      gpsIn: { lat: 49.2827, lng: -123.1207 },
      gpsOut: { lat: 49.2827, lng: -123.1207 },
    },
    {
      id: "visit-seed-2",
      projectId: "proj-fraser",
      clockIn: yIn.toISOString(),
      clockOut: yOut.toISOString(),
      note: "",
      gpsIn: null,
      gpsOut: null,
    },
  ];
}
