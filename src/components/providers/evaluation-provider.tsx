"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { EvaluationRecord } from "@/lib/types";
import {
  createEvaluationId,
  deriveEvaluationOverall,
  seedEvaluationRecords,
} from "@/lib/evaluations";

const STORAGE_KEY = "helix-evaluations";

interface EvaluationContextValue {
  records: EvaluationRecord[];
  recordsForMember: (memberId: string) => EvaluationRecord[];
  addRecord: (
    entry: Omit<EvaluationRecord, "id" | "overall" | "evaluatedAt"> & {
      evaluatedAt?: string;
    }
  ) => EvaluationRecord;
  deleteRecord: (id: string) => void;
}

const EvaluationContext = createContext<EvaluationContextValue | null>(null);

function loadRecords(): EvaluationRecord[] {
  if (typeof window === "undefined") return seedEvaluationRecords();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedEvaluationRecords();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as EvaluationRecord[];
    return Array.isArray(parsed) ? parsed : seedEvaluationRecords();
  } catch {
    return seedEvaluationRecords();
  }
}

export function EvaluationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [records, setRecords] = useState<EvaluationRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecords(loadRecords());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records, hydrated]);

  const recordsForMember = useCallback(
    (memberId: string) =>
      records
        .filter((r) => r.memberId === memberId)
        .sort(
          (a, b) =>
            new Date(b.evaluatedAt).getTime() -
            new Date(a.evaluatedAt).getTime()
        ),
    [records]
  );

  const addRecord = useCallback(
    (
      entry: Omit<EvaluationRecord, "id" | "overall" | "evaluatedAt"> & {
        evaluatedAt?: string;
      }
    ) => {
      const next: EvaluationRecord = {
        ...entry,
        id: createEvaluationId(),
        evaluatedAt: entry.evaluatedAt ?? new Date().toISOString(),
        overall: deriveEvaluationOverall(entry.items),
      };
      setRecords((prev) => [next, ...prev]);
      return next;
    },
    []
  );

  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const value = useMemo(
    () => ({ records, recordsForMember, addRecord, deleteRecord }),
    [records, recordsForMember, addRecord, deleteRecord]
  );

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
}

export function useEvaluations() {
  const ctx = useContext(EvaluationContext);
  if (!ctx) {
    throw new Error("useEvaluations must be used within EvaluationProvider");
  }
  return ctx;
}

export function useEvaluationsOptional() {
  return useContext(EvaluationContext);
}
