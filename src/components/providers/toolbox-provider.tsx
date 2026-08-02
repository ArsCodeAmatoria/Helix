"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ToolboxTalkRecord } from "@/lib/types";
import {
  createToolboxTalkId,
  seedToolboxTalks,
} from "@/lib/toolbox-talks";

const STORAGE_KEY = "helix-toolbox-talks";

interface ToolboxContextValue {
  talks: ToolboxTalkRecord[];
  addTalk: (
    entry: Omit<ToolboxTalkRecord, "id" | "deliveredAt"> & {
      deliveredAt?: string;
    }
  ) => ToolboxTalkRecord;
  deleteTalk: (id: string) => void;
}

const ToolboxContext = createContext<ToolboxContextValue | null>(null);

function loadTalks(): ToolboxTalkRecord[] {
  if (typeof window === "undefined") return seedToolboxTalks();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedToolboxTalks();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as ToolboxTalkRecord[];
    return Array.isArray(parsed) ? parsed : seedToolboxTalks();
  } catch {
    return seedToolboxTalks();
  }
}

export function ToolboxProvider({ children }: { children: React.ReactNode }) {
  const [talks, setTalks] = useState<ToolboxTalkRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTalks(loadTalks());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(talks));
  }, [talks, hydrated]);

  const addTalk = useCallback(
    (
      entry: Omit<ToolboxTalkRecord, "id" | "deliveredAt"> & {
        deliveredAt?: string;
      }
    ) => {
      const record: ToolboxTalkRecord = {
        ...entry,
        id: createToolboxTalkId(),
        deliveredAt: entry.deliveredAt ?? new Date().toISOString(),
      };
      setTalks((prev) => [record, ...prev]);
      return record;
    },
    []
  );

  const deleteTalk = useCallback((id: string) => {
    setTalks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ talks, addTalk, deleteTalk }),
    [talks, addTalk, deleteTalk]
  );

  return (
    <ToolboxContext.Provider value={value}>{children}</ToolboxContext.Provider>
  );
}

export function useToolbox() {
  const ctx = useContext(ToolboxContext);
  if (!ctx) {
    throw new Error("useToolbox must be used within ToolboxProvider");
  }
  return ctx;
}
