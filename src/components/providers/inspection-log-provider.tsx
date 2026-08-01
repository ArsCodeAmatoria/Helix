"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  CraneGreasingEntry,
  CraneInspectionEntry,
  CraneInspectionType,
  InspectionCheckResult,
  InspectionLogState,
  RiggingInspectionEntry,
  RiggingInspectionType,
} from "@/lib/types";
import {
  createEntryId,
  deriveOverall,
  deriveRiggingOverall,
  entryGearIds,
  normalizeRiggingEntry,
  seedInspectionLogs,
  sortByGreasedAtDesc,
  sortEntriesByDateDesc,
} from "@/lib/inspections";

const STORAGE_KEY = "helix-inspections-v2";

interface InspectionLogContextValue {
  craneEntries: CraneInspectionEntry[];
  riggingEntries: RiggingInspectionEntry[];
  greasingEntries: CraneGreasingEntry[];
  craneLogFor: (equipmentId: string) => CraneInspectionEntry[];
  /** All rigging sessions, newest first */
  allRiggingLogs: () => RiggingInspectionEntry[];
  /** Sessions that include this gear */
  riggingLogFor: (gearId: string) => RiggingInspectionEntry[];
  greasingLogFor: (equipmentId: string) => CraneGreasingEntry[];
  latestCrane: (equipmentId: string) => CraneInspectionEntry | undefined;
  latestRigging: (gearId: string) => RiggingInspectionEntry | undefined;
  addCraneEntry: (
    entry: Omit<CraneInspectionEntry, "id" | "kind" | "inspectedAt" | "overall"> & {
      inspectionType: CraneInspectionType;
    }
  ) => CraneInspectionEntry;
  addRiggingEntry: (
    entry: Omit<
      RiggingInspectionEntry,
      "id" | "kind" | "inspectedAt" | "overall"
    > & { inspectionType: RiggingInspectionType }
  ) => RiggingInspectionEntry;
  addGreasingEntry: (
    entry: Omit<CraneGreasingEntry, "id" | "greasedAt">
  ) => CraneGreasingEntry;
  updateCraneCheck: (
    entryId: string,
    checkId: string,
    result: InspectionCheckResult
  ) => void;
  deleteCraneEntry: (id: string) => void;
  deleteRiggingEntry: (id: string) => void;
}

const InspectionLogContext = createContext<InspectionLogContextValue | null>(
  null
);

function loadState(): InspectionLogState {
  if (typeof window === "undefined") return seedInspectionLogs();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedInspectionLogs();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<InspectionLogState>;
    const seeded = seedInspectionLogs();
    return {
      craneEntries: parsed.craneEntries ?? [],
      riggingEntries: (parsed.riggingEntries ?? []).map((e) =>
        normalizeRiggingEntry(e as RiggingInspectionEntry)
      ),
      greasingEntries: parsed.greasingEntries ?? seeded.greasingEntries,
    };
  } catch {
    return seedInspectionLogs();
  }
}

export function InspectionLogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<InspectionLogState>({
    craneEntries: [],
    riggingEntries: [],
    greasingEntries: [],
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const craneLogFor = useCallback(
    (equipmentId: string) =>
      sortEntriesByDateDesc(
        state.craneEntries.filter((e) => e.equipmentId === equipmentId)
      ),
    [state.craneEntries]
  );

  const allRiggingLogs = useCallback(
    () =>
      sortEntriesByDateDesc(
        state.riggingEntries.map((e) => normalizeRiggingEntry(e))
      ),
    [state.riggingEntries]
  );

  const riggingLogFor = useCallback(
    (gearId: string) =>
      sortEntriesByDateDesc(
        state.riggingEntries
          .map((e) => normalizeRiggingEntry(e))
          .filter((e) => entryGearIds(e).includes(gearId))
      ),
    [state.riggingEntries]
  );

  const greasingLogFor = useCallback(
    (equipmentId: string) =>
      sortByGreasedAtDesc(
        state.greasingEntries.filter((e) => e.equipmentId === equipmentId)
      ),
    [state.greasingEntries]
  );

  const latestCrane = useCallback(
    (equipmentId: string) => craneLogFor(equipmentId)[0],
    [craneLogFor]
  );

  const latestRigging = useCallback(
    (gearId: string) => riggingLogFor(gearId)[0],
    [riggingLogFor]
  );

  const addCraneEntry = useCallback(
    (
      entry: Omit<
        CraneInspectionEntry,
        "id" | "kind" | "inspectedAt" | "overall"
      > & { inspectionType: CraneInspectionType }
    ) => {
      const next: CraneInspectionEntry = {
        ...entry,
        id: createEntryId("crane"),
        kind: "crane",
        inspectedAt: new Date().toISOString(),
        overall: deriveOverall(entry.checks),
      };
      setState((s) => ({
        ...s,
        craneEntries: [next, ...s.craneEntries],
      }));
      return next;
    },
    []
  );

  const addRiggingEntry = useCallback(
    (
      entry: Omit<
        RiggingInspectionEntry,
        "id" | "kind" | "inspectedAt" | "overall"
      > & { inspectionType: RiggingInspectionType }
    ) => {
      const gearIds = entry.gearIds?.length
        ? entry.gearIds
        : entryGearIds(entry);
      const gearResults = entry.gearResults ?? [];
      const next: RiggingInspectionEntry = {
        ...entry,
        gearIds,
        gearResults,
        checks: entry.checks ?? [],
        id: createEntryId("rig"),
        kind: "rigging",
        inspectedAt: new Date().toISOString(),
        overall: deriveRiggingOverall(gearResults, entry.checks ?? []),
      };
      setState((s) => ({
        ...s,
        riggingEntries: [next, ...s.riggingEntries],
      }));
      return next;
    },
    []
  );

  const addGreasingEntry = useCallback(
    (entry: Omit<CraneGreasingEntry, "id" | "greasedAt">) => {
      const next: CraneGreasingEntry = {
        ...entry,
        id: createEntryId("grease"),
        greasedAt: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        greasingEntries: [next, ...s.greasingEntries],
      }));
      return next;
    },
    []
  );

  const updateCraneCheck = useCallback(
    (entryId: string, checkId: string, result: InspectionCheckResult) => {
      setState((s) => ({
        ...s,
        craneEntries: s.craneEntries.map((e) => {
          if (e.id !== entryId) return e;
          const checks = e.checks.map((c) =>
            c.id === checkId ? { ...c, result } : c
          );
          return { ...e, checks, overall: deriveOverall(checks) };
        }),
      }));
    },
    []
  );

  const deleteCraneEntry = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      craneEntries: s.craneEntries.filter((e) => e.id !== id),
    }));
  }, []);

  const deleteRiggingEntry = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      riggingEntries: s.riggingEntries.filter((e) => e.id !== id),
    }));
  }, []);

  const value = useMemo(
    () => ({
      craneEntries: state.craneEntries,
      riggingEntries: state.riggingEntries,
      greasingEntries: state.greasingEntries,
      craneLogFor,
      allRiggingLogs,
      riggingLogFor,
      greasingLogFor,
      latestCrane,
      latestRigging,
      addCraneEntry,
      addRiggingEntry,
      addGreasingEntry,
      updateCraneCheck,
      deleteCraneEntry,
      deleteRiggingEntry,
    }),
    [
      state,
      craneLogFor,
      allRiggingLogs,
      riggingLogFor,
      greasingLogFor,
      latestCrane,
      latestRigging,
      addCraneEntry,
      addRiggingEntry,
      addGreasingEntry,
      updateCraneCheck,
      deleteCraneEntry,
      deleteRiggingEntry,
    ]
  );

  return (
    <InspectionLogContext.Provider value={value}>
      {children}
    </InspectionLogContext.Provider>
  );
}

export function useInspectionLog() {
  const ctx = useContext(InspectionLogContext);
  if (!ctx) {
    throw new Error("useInspectionLog must be used within InspectionLogProvider");
  }
  return ctx;
}
