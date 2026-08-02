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
  BcCraneBinderItemStatus,
  BcCraneBinderPartyId,
  BcCraneBinderState,
} from "@/lib/types";
import {
  binderProgress,
  createEmptyBinderState,
  seedBinderState,
} from "@/lib/bc-crane-binder";

const STORAGE_KEY = "helix-bc-crane-binder-v2";

interface BcCraneBinderContextValue {
  state: BcCraneBinderState;
  progress: ReturnType<typeof binderProgress>;
  updateHeader: (patch: Partial<BcCraneBinderState>) => void;
  setItemStatus: (itemId: string, status: BcCraneBinderItemStatus) => void;
  setItemParty: (itemId: string, partyId: BcCraneBinderPartyId | null) => void;
  setItemNotes: (itemId: string, notes: string) => void;
  setSectionNotes: (sectionId: string, notes: string) => void;
  setOtherDoc: (index: number, value: string) => void;
  setSignOff: (
    roleId: string,
    patch: Partial<BcCraneBinderState["signOffs"][string]>
  ) => void;
  reset: () => void;
  loadSeed: () => void;
}

const BcCraneBinderContext =
  createContext<BcCraneBinderContextValue | null>(null);

function loadState(): BcCraneBinderState {
  if (typeof window === "undefined") return seedBinderState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedBinderState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as BcCraneBinderState;
    const empty = createEmptyBinderState();
    return {
      ...empty,
      ...parsed,
      items: { ...empty.items, ...parsed.items },
      signOffs: { ...empty.signOffs, ...parsed.signOffs },
      otherDocs: parsed.otherDocs?.length
        ? parsed.otherDocs
        : empty.otherDocs,
    };
  } catch {
    return seedBinderState();
  }
}

export function BcCraneBinderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<BcCraneBinderState>(createEmptyBinderState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const touch = useCallback(
    (updater: (s: BcCraneBinderState) => BcCraneBinderState) => {
      setState((s) => ({
        ...updater(s),
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  const updateHeader = useCallback(
    (patch: Partial<BcCraneBinderState>) => {
      touch((s) => ({ ...s, ...patch }));
    },
    [touch]
  );

  const setItemStatus = useCallback(
    (itemId: string, status: BcCraneBinderItemStatus) => {
      touch((s) => ({
        ...s,
        items: {
          ...s.items,
          [itemId]: {
            ...(s.items[itemId] ?? {
              status: null,
              partyId: null,
              notes: "",
            }),
            status,
            partyId:
              status === "na"
                ? "na"
                : s.items[itemId]?.partyId === "na"
                  ? null
                  : s.items[itemId]?.partyId ?? null,
          },
        },
      }));
    },
    [touch]
  );

  const setItemParty = useCallback(
    (itemId: string, partyId: BcCraneBinderPartyId | null) => {
      touch((s) => ({
        ...s,
        items: {
          ...s.items,
          [itemId]: {
            ...(s.items[itemId] ?? {
              status: null,
              partyId: null,
              notes: "",
            }),
            partyId,
          },
        },
      }));
    },
    [touch]
  );

  const setItemNotes = useCallback(
    (itemId: string, notes: string) => {
      touch((s) => ({
        ...s,
        items: {
          ...s.items,
          [itemId]: {
            ...(s.items[itemId] ?? {
              status: null,
              partyId: null,
              notes: "",
            }),
            notes,
          },
        },
      }));
    },
    [touch]
  );

  const setSectionNotes = useCallback(
    (sectionId: string, notes: string) => {
      touch((s) => ({
        ...s,
        sectionNotes: { ...s.sectionNotes, [sectionId]: notes },
      }));
    },
    [touch]
  );

  const setOtherDoc = useCallback(
    (index: number, value: string) => {
      touch((s) => {
        const otherDocs = [...s.otherDocs];
        otherDocs[index] = value;
        return { ...s, otherDocs };
      });
    },
    [touch]
  );

  const setSignOff = useCallback(
    (
      roleId: string,
      patch: Partial<BcCraneBinderState["signOffs"][string]>
    ) => {
      touch((s) => ({
        ...s,
        signOffs: {
          ...s.signOffs,
          [roleId]: {
            ...(s.signOffs[roleId] ?? {
              company: "",
              phone: "",
              printName: "",
              confirmed: false,
            }),
            ...patch,
          },
        },
      }));
    },
    [touch]
  );

  const reset = useCallback(() => {
    setState(createEmptyBinderState());
  }, []);

  const loadSeed = useCallback(() => {
    setState(seedBinderState());
  }, []);

  const progress = useMemo(() => binderProgress(state), [state]);

  const value = useMemo(
    () => ({
      state,
      progress,
      updateHeader,
      setItemStatus,
      setItemParty,
      setItemNotes,
      setSectionNotes,
      setOtherDoc,
      setSignOff,
      reset,
      loadSeed,
    }),
    [
      state,
      progress,
      updateHeader,
      setItemStatus,
      setItemParty,
      setItemNotes,
      setSectionNotes,
      setOtherDoc,
      setSignOff,
      reset,
      loadSeed,
    ]
  );

  return (
    <BcCraneBinderContext.Provider value={value}>
      {children}
    </BcCraneBinderContext.Provider>
  );
}

export function useBcCraneBinder() {
  const ctx = useContext(BcCraneBinderContext);
  if (!ctx) {
    throw new Error(
      "useBcCraneBinder must be used within BcCraneBinderProvider"
    );
  }
  return ctx;
}
