"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DigitalFormRecord } from "@/lib/types";
import {
  createDigitalFormId,
  seedDigitalForms,
} from "@/lib/digital-forms";

const STORAGE_KEY = "helix-digital-forms";

interface DigitalFormsContextValue {
  records: DigitalFormRecord[];
  forForm: (formId: string) => DigitalFormRecord[];
  addRecord: (
    entry: Omit<DigitalFormRecord, "id" | "createdAt" | "updatedAt"> & {
      createdAt?: string;
      updatedAt?: string;
    }
  ) => DigitalFormRecord;
  updateRecord: (
    id: string,
    patch: Partial<Omit<DigitalFormRecord, "id" | "createdAt">>
  ) => void;
  deleteRecord: (id: string) => void;
}

const DigitalFormsContext = createContext<DigitalFormsContextValue | null>(
  null
);

function loadRecords(): DigitalFormRecord[] {
  if (typeof window === "undefined") return seedDigitalForms();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDigitalForms();
    const parsed = JSON.parse(raw) as DigitalFormRecord[];
    return Array.isArray(parsed) ? parsed : seedDigitalForms();
  } catch {
    return seedDigitalForms();
  }
}

export function DigitalFormsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [records, setRecords] = useState<DigitalFormRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecords(loadRecords());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records, hydrated]);

  const forForm = useCallback(
    (formId: string) =>
      records
        .filter((r) => r.formId === formId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [records]
  );

  const addRecord = useCallback(
    (
      entry: Omit<DigitalFormRecord, "id" | "createdAt" | "updatedAt"> & {
        createdAt?: string;
        updatedAt?: string;
      }
    ) => {
      const now = new Date().toISOString();
      const record: DigitalFormRecord = {
        ...entry,
        id: createDigitalFormId(),
        createdAt: entry.createdAt ?? now,
        updatedAt: entry.updatedAt ?? now,
      };
      setRecords((prev) => [record, ...prev]);
      return record;
    },
    []
  );

  const updateRecord = useCallback(
    (
      id: string,
      patch: Partial<Omit<DigitalFormRecord, "id" | "createdAt">>
    ) => {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...patch,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
    },
    []
  );

  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const value = useMemo(
    () => ({ records, forForm, addRecord, updateRecord, deleteRecord }),
    [records, forForm, addRecord, updateRecord, deleteRecord]
  );

  return (
    <DigitalFormsContext.Provider value={value}>
      {children}
    </DigitalFormsContext.Provider>
  );
}

export function useDigitalForms() {
  const ctx = useContext(DigitalFormsContext);
  if (!ctx) {
    throw new Error("useDigitalForms must be used within DigitalFormsProvider");
  }
  return ctx;
}
