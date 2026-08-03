"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { SiteInspectionRecord } from "@/lib/types";
import {
  createSiteInspectionId,
  seedSiteInspections,
} from "@/lib/site-inspections";

const STORAGE_KEY = "helix-site-inspections";

interface SiteInspectionContextValue {
  inspections: SiteInspectionRecord[];
  forProject: (projectId: string) => SiteInspectionRecord[];
  addInspection: (
    entry: Omit<SiteInspectionRecord, "id" | "inspectedAt"> & {
      inspectedAt?: string;
    }
  ) => SiteInspectionRecord;
  updateFindingStatus: (
    inspectionId: string,
    findingId: string,
    status: SiteInspectionRecord["findings"][number]["correctiveAction"]["status"]
  ) => void;
  deleteInspection: (id: string) => void;
}

const SiteInspectionContext =
  createContext<SiteInspectionContextValue | null>(null);

function loadInspections(): SiteInspectionRecord[] {
  if (typeof window === "undefined") return seedSiteInspections();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedSiteInspections();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as SiteInspectionRecord[];
    return Array.isArray(parsed) ? parsed : seedSiteInspections();
  } catch {
    return seedSiteInspections();
  }
}

export function SiteInspectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [inspections, setInspections] = useState<SiteInspectionRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInspections(loadInspections());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections));
  }, [inspections, hydrated]);

  const forProject = useCallback(
    (projectId: string) =>
      inspections
        .filter((i) => i.projectId === projectId)
        .sort(
          (a, b) =>
            new Date(b.inspectedAt).getTime() -
            new Date(a.inspectedAt).getTime()
        ),
    [inspections]
  );

  const addInspection = useCallback(
    (
      entry: Omit<SiteInspectionRecord, "id" | "inspectedAt"> & {
        inspectedAt?: string;
      }
    ) => {
      const record: SiteInspectionRecord = {
        ...entry,
        id: createSiteInspectionId(),
        inspectedAt: entry.inspectedAt ?? new Date().toISOString(),
      };
      setInspections((prev) => [record, ...prev]);
      return record;
    },
    []
  );

  const updateFindingStatus = useCallback(
    (
      inspectionId: string,
      findingId: string,
      status: SiteInspectionRecord["findings"][number]["correctiveAction"]["status"]
    ) => {
      setInspections((prev) =>
        prev.map((insp) => {
          if (insp.id !== inspectionId) return insp;
          return {
            ...insp,
            findings: insp.findings.map((f) =>
              f.id === findingId
                ? {
                    ...f,
                    correctiveAction: { ...f.correctiveAction, status },
                  }
                : f
            ),
          };
        })
      );
    },
    []
  );

  const deleteInspection = useCallback((id: string) => {
    setInspections((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      inspections,
      forProject,
      addInspection,
      updateFindingStatus,
      deleteInspection,
    }),
    [
      inspections,
      forProject,
      addInspection,
      updateFindingStatus,
      deleteInspection,
    ]
  );

  return (
    <SiteInspectionContext.Provider value={value}>
      {children}
    </SiteInspectionContext.Provider>
  );
}

export function useSiteInspections() {
  const ctx = useContext(SiteInspectionContext);
  if (!ctx) {
    throw new Error(
      "useSiteInspections must be used within SiteInspectionProvider"
    );
  }
  return ctx;
}
