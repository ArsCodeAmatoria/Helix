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
  seedInspectionLogs,
  sortEntriesByDateDesc,
} from "@/lib/inspections";

const STORAGE_KEY = "helix-inspections";

interface InspectionLogContextValue {
  craneEntries: CraneInspectionEntry[];
  riggingEntries: RiggingInspectionEntry[];
  craneLogFor: (equipmentId: string) => CraneInspectionEntry[];
  riggingLogFor: (gearId: string) => RiggingInspectionEntry[];
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
    return {
      craneEntries: parsed.craneEntries ?? [],
      riggingEntries: parsed.riggingEntries ?? [],
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

  const riggingLogFor = useCallback(
    (gearId: string) =>
      sortEntriesByDateDesc(
        state.riggingEntries.filter((e) => e.gearId === gearId)
      ),
    [state.riggingEntries]
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
      const next: RiggingInspectionEntry = {
        ...entry,
        id: createEntryId("rig"),
        kind: "rigging",
        inspectedAt: new Date().toISOString(),
        overall: deriveOverall(entry.checks),
      };
      setState((s) => ({
        ...s,
        riggingEntries: [next, ...s.riggingEntries],
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
      craneLogFor,
      riggingLogFor,
      latestCrane,
      latestRigging,
      addCraneEntry,
      addRiggingEntry,
      updateCraneCheck,
      deleteCraneEntry,
      deleteRiggingEntry,
    }),
    [
      state,
      craneLogFor,
      riggingLogFor,
      latestCrane,
      latestRigging,
      addCraneEntry,
      addRiggingEntry,
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
