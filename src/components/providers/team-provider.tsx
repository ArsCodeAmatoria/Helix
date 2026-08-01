"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TeamMember, TeamMemberSignature, TeamState } from "@/lib/types";
import { crews, getCrew, getMember } from "@/lib/team";

const STORAGE_KEY = "helix-team";

const DEFAULT_STATE: TeamState = {
  selectedCrewId: "crew-b",
  todaysMemberIds: getCrew("crew-b")?.memberIds.slice(0, 4) ?? [],
  signatures: [],
};

interface TeamContextValue {
  selectedCrewId: string;
  todaysMemberIds: string[];
  signatures: TeamMemberSignature[];
  selectedCrew: ReturnType<typeof getCrew>;
  todaysMembers: TeamMember[];
  signedCount: number;
  selectCrew: (crewId: string) => void;
  toggleMember: (memberId: string) => void;
  fillTeam: () => void;
  clearTeam: () => void;
  setTeamFromSearch: (memberIds: string[]) => void;
  addMember: (memberId: string) => void;
  removeMember: (memberId: string) => void;
  setMemberSignature: (memberId: string, dataUrl: string) => void;
  clearMemberSignature: (memberId: string) => void;
  clearAllSignatures: () => void;
}

const TeamContext = createContext<TeamContextValue | null>(null);

function loadState(): TeamState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<TeamState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      todaysMemberIds: parsed.todaysMemberIds ?? DEFAULT_STATE.todaysMemberIds,
      signatures: parsed.signatures ?? [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TeamState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const selectedCrew = useMemo(
    () => getCrew(state.selectedCrewId) ?? crews[0],
    [state.selectedCrewId]
  );

  const todaysMembers = useMemo(
    () =>
      state.todaysMemberIds
        .map((id) => getMember(id))
        .filter((m): m is TeamMember => Boolean(m)),
    [state.todaysMemberIds]
  );

  const signedCount = useMemo(
    () =>
      state.todaysMemberIds.filter((id) =>
        state.signatures.some((s) => s.memberId === id && s.signature)
      ).length,
    [state.todaysMemberIds, state.signatures]
  );

  const selectCrew = useCallback((crewId: string) => {
    setState((s) => ({ ...s, selectedCrewId: crewId }));
  }, []);

  const toggleMember = useCallback((memberId: string) => {
    setState((s) => {
      const exists = s.todaysMemberIds.includes(memberId);
      return {
        ...s,
        todaysMemberIds: exists
          ? s.todaysMemberIds.filter((id) => id !== memberId)
          : [...s.todaysMemberIds, memberId],
      };
    });
  }, []);

  const fillTeam = useCallback(() => {
    setState((s) => {
      const crew = getCrew(s.selectedCrewId);
      return {
        ...s,
        todaysMemberIds: crew ? [...crew.memberIds] : s.todaysMemberIds,
      };
    });
  }, []);

  const clearTeam = useCallback(() => {
    setState((s) => ({ ...s, todaysMemberIds: [] }));
  }, []);

  const setTeamFromSearch = useCallback((memberIds: string[]) => {
    setState((s) => ({
      ...s,
      todaysMemberIds: Array.from(new Set(memberIds)),
    }));
  }, []);

  const addMember = useCallback((memberId: string) => {
    setState((s) =>
      s.todaysMemberIds.includes(memberId)
        ? s
        : { ...s, todaysMemberIds: [...s.todaysMemberIds, memberId] }
    );
  }, []);

  const removeMember = useCallback((memberId: string) => {
    setState((s) => ({
      ...s,
      todaysMemberIds: s.todaysMemberIds.filter((id) => id !== memberId),
      signatures: s.signatures.filter((sig) => sig.memberId !== memberId),
    }));
  }, []);

  const setMemberSignature = useCallback((memberId: string, dataUrl: string) => {
    setState((s) => {
      const existing = s.signatures.find((sig) => sig.memberId === memberId);
      const next: TeamMemberSignature = {
        memberId,
        signature: dataUrl || null,
        signedAt: dataUrl ? new Date().toISOString() : null,
      };
      return {
        ...s,
        signatures: existing
          ? s.signatures.map((sig) =>
              sig.memberId === memberId ? next : sig
            )
          : [...s.signatures, next],
      };
    });
  }, []);

  const clearMemberSignature = useCallback((memberId: string) => {
    setState((s) => ({
      ...s,
      signatures: s.signatures.map((sig) =>
        sig.memberId === memberId
          ? { ...sig, signature: null, signedAt: null }
          : sig
      ),
    }));
  }, []);

  const clearAllSignatures = useCallback(() => {
    setState((s) => ({
      ...s,
      signatures: s.signatures.map((sig) => ({
        ...sig,
        signature: null,
        signedAt: null,
      })),
    }));
  }, []);

  const value: TeamContextValue = {
    selectedCrewId: state.selectedCrewId,
    todaysMemberIds: state.todaysMemberIds,
    signatures: state.signatures,
    selectedCrew,
    todaysMembers,
    signedCount,
    selectCrew,
    toggleMember,
    fillTeam,
    clearTeam,
    setTeamFromSearch,
    addMember,
    removeMember,
    setMemberSignature,
    clearMemberSignature,
    clearAllSignatures,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeam must be used within TeamProvider");
  return ctx;
}

// Convenience for modules that may render outside team screen but inside provider
export function useTeamOptional() {
  return useContext(TeamContext);
}
