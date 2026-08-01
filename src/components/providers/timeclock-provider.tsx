"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { SiteVisit } from "@/lib/types";
import {
  createVisitId,
  isSameDay,
  seedVisits,
  visitDurationMs,
} from "@/lib/timeclock";

const STORAGE_KEY = "helix-timeclock";

interface TimeClockContextValue {
  visits: SiteVisit[];
  activeVisit: SiteVisit | null;
  todaysVisits: SiteVisit[];
  todaysTotalMs: number;
  clockIn: (projectId: string, note?: string) => Promise<void>;
  clockOut: (note?: string) => Promise<void>;
  switchSite: (projectId: string, note?: string) => Promise<void>;
  updateVisitNote: (id: string, note: string) => void;
  deleteVisit: (id: string) => void;
}

const TimeClockContext = createContext<TimeClockContextValue | null>(null);

function loadVisits(): SiteVisit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedVisits();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as SiteVisit[];
  } catch {
    return seedVisits();
  }
}

function captureGps(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 49.2827, lng: -123.1207 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: 49.2827, lng: -123.1207 }),
      { timeout: 4000 }
    );
  });
}

export function TimeClockProvider({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setVisits(loadVisits());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
  }, [visits, hydrated]);

  const activeVisit = useMemo(
    () => visits.find((v) => v.clockOut === null) ?? null,
    [visits]
  );

  const todaysVisits = useMemo(
    () =>
      visits
        .filter((v) => isSameDay(v.clockIn))
        .sort(
          (a, b) =>
            new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()
        ),
    [visits]
  );

  const todaysTotalMs = useMemo(
    () => todaysVisits.reduce((sum, v) => sum + visitDurationMs(v), 0),
    [todaysVisits]
  );

  const clockIn = useCallback(async (projectId: string, note = "") => {
    const gps = await captureGps();
    setVisits((prev) => {
      // Close any open visit before starting a new site visit
      const closed = prev.map((v) =>
        v.clockOut === null
          ? { ...v, clockOut: new Date().toISOString(), gpsOut: gps }
          : v
      );
      const visit: SiteVisit = {
        id: createVisitId(),
        projectId,
        clockIn: new Date().toISOString(),
        clockOut: null,
        note,
        gpsIn: gps,
        gpsOut: null,
      };
      return [visit, ...closed];
    });
  }, []);

  const clockOut = useCallback(async (note?: string) => {
    const gps = await captureGps();
    setVisits((prev) =>
      prev.map((v) =>
        v.clockOut === null
          ? {
              ...v,
              clockOut: new Date().toISOString(),
              gpsOut: gps,
              note: note?.trim() ? note : v.note,
            }
          : v
      )
    );
  }, []);

  const switchSite = useCallback(
    async (projectId: string, note = "") => {
      await clockIn(projectId, note);
    },
    [clockIn]
  );

  const updateVisitNote = useCallback((id: string, note: string) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, note } : v))
    );
  }, []);

  const deleteVisit = useCallback((id: string) => {
    setVisits((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const value: TimeClockContextValue = {
    visits,
    activeVisit,
    todaysVisits,
    todaysTotalMs,
    clockIn,
    clockOut,
    switchSite,
    updateVisitNote,
    deleteVisit,
  };

  return (
    <TimeClockContext.Provider value={value}>
      {children}
    </TimeClockContext.Provider>
  );
}

export function useTimeClock() {
  const ctx = useContext(TimeClockContext);
  if (!ctx) throw new Error("useTimeClock must be used within TimeClockProvider");
  return ctx;
}
