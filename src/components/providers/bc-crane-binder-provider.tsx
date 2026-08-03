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
  BcCraneBinderPack,
  BcCraneBinderPackId,
  BcCraneBinderPartyId,
  BcCraneBinderState,
} from "@/lib/types";
import {
  binderProgress,
  createEmptyBinderState,
  getBinderPack,
  seedBinderState,
} from "@/lib/bc-crane-binder";

const STORAGE_KEY = "helix-bc-crane-binder-v3";

type PackStates = Record<BcCraneBinderPackId, BcCraneBinderState>;

interface StoredBinder {
  activePack: BcCraneBinderPackId;
  packs: PackStates;
}

interface BcCraneBinderContextValue {
  pack: BcCraneBinderPack;
  packId: BcCraneBinderPackId;
  setPackId: (id: BcCraneBinderPackId) => void;
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

function defaultPackStates(): PackStates {
  return {
    tower: seedBinderState("tower"),
    "self-erect": seedBinderState("self-erect"),
  };
}

function loadStored(): StoredBinder {
  if (typeof window === "undefined") {
    return { activePack: "tower", packs: defaultPackStates() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = { activePack: "tower" as const, packs: defaultPackStates() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as StoredBinder | BcCraneBinderState;
    // migrate v2 single-state → v3 packs
    if (parsed && "items" in parsed && !("packs" in parsed)) {
      const legacy = parsed as BcCraneBinderState;
      const packs = defaultPackStates();
      packs.tower = {
        ...createEmptyBinderState("tower"),
        ...legacy,
        packId: "tower",
        items: {
          ...createEmptyBinderState("tower").items,
          ...legacy.items,
        },
        signOffs: {
          ...createEmptyBinderState("tower").signOffs,
          ...legacy.signOffs,
        },
      };
      return { activePack: "tower", packs };
    }
    const stored = parsed as StoredBinder;
    const emptyTower = createEmptyBinderState("tower");
    const emptySetc = createEmptyBinderState("self-erect");
    return {
      activePack: stored.activePack === "self-erect" ? "self-erect" : "tower",
      packs: {
        tower: {
          ...emptyTower,
          ...stored.packs?.tower,
          packId: "tower",
          items: { ...emptyTower.items, ...stored.packs?.tower?.items },
          signOffs: {
            ...emptyTower.signOffs,
            ...stored.packs?.tower?.signOffs,
          },
        },
        "self-erect": {
          ...emptySetc,
          ...stored.packs?.["self-erect"],
          packId: "self-erect",
          items: {
            ...emptySetc.items,
            ...stored.packs?.["self-erect"]?.items,
          },
          signOffs: {
            ...emptySetc.signOffs,
            ...stored.packs?.["self-erect"]?.signOffs,
          },
        },
      },
    };
  } catch {
    return { activePack: "tower", packs: defaultPackStates() };
  }
}

export function BcCraneBinderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activePack, setActivePack] = useState<BcCraneBinderPackId>("tower");
  const [packs, setPacks] = useState<PackStates>(() => ({
    tower: createEmptyBinderState("tower"),
    "self-erect": createEmptyBinderState("self-erect"),
  }));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadStored();
    setActivePack(stored.activePack);
    setPacks(stored.packs);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activePack, packs } satisfies StoredBinder)
    );
  }, [activePack, packs, hydrated]);

  const state = packs[activePack];
  const pack = getBinderPack(activePack);

  const touch = useCallback(
    (updater: (s: BcCraneBinderState) => BcCraneBinderState) => {
      setPacks((prev) => {
        const current = prev[activePack];
        return {
          ...prev,
          [activePack]: {
            ...updater(current),
            packId: activePack,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [activePack]
  );

  const setPackId = useCallback((id: BcCraneBinderPackId) => {
    setActivePack(id);
  }, []);

  const updateHeader = useCallback(
    (patch: Partial<BcCraneBinderState>) => {
      touch((s) => ({ ...s, ...patch, packId: activePack }));
    },
    [touch, activePack]
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
    setPacks((prev) => ({
      ...prev,
      [activePack]: createEmptyBinderState(activePack),
    }));
  }, [activePack]);

  const loadSeed = useCallback(() => {
    setPacks((prev) => ({
      ...prev,
      [activePack]: seedBinderState(activePack),
    }));
  }, [activePack]);

  const progress = useMemo(() => binderProgress(state), [state]);

  const value = useMemo(
    () => ({
      pack,
      packId: activePack,
      setPackId,
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
      pack,
      activePack,
      setPackId,
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
