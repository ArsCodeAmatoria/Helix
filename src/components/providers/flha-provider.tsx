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
  AdditionalHazard,
  EquipmentInspection,
  FlhaFormState,
  FlhaStepId,
  PhotoItem,
  Role,
} from "@/lib/types";
import {
  INITIAL_FLHA_STATE,
  canProceed,
  createEmptyAdditionalHazard,
  getActiveSteps,
} from "@/lib/form-engine";
import {
  getProject,
  getProjectEquipment,
  resolveHazardsFromTasks,
} from "@/lib/db";

const STORAGE_KEY = "helix-flha";

interface FlhaContextValue {
  state: FlhaFormState;
  steps: FlhaStepId[];
  currentStepId: FlhaStepId;
  resolvedHazards: ReturnType<typeof resolveHazardsFromTasks>;
  progress: number;
  setProject: (projectId: string) => void;
  setRole: (role: Role) => void;
  toggleTask: (taskId: string) => void;
  toggleHazardConfirm: (hazardId: string) => void;
  confirmAllHazards: () => void;
  setAdditionalHazardsEnabled: (value: boolean) => void;
  addAdditionalHazard: () => void;
  updateAdditionalHazard: (
    id: string,
    patch: Partial<AdditionalHazard>
  ) => void;
  removeAdditionalHazard: (id: string) => void;
  toggleDocument: (docId: string) => void;
  reviewAllDocuments: (docIds: string[]) => void;
  updateEquipmentInspection: (
    equipmentId: string,
    patch: Partial<EquipmentInspection>
  ) => void;
  toggleLadderType: (type: string) => void;
  setLadderField: (
    field: keyof FlhaFormState["ladder"],
    value: boolean | string[] | null
  ) => void;
  toggleEnvironment: (item: string) => void;
  addPhoto: (photo: PhotoItem) => void;
  removePhoto: (id: string) => void;
  setComments: (value: string) => void;
  setWorkerSignature: (dataUrl: string) => void;
  setSupervisorSignature: (dataUrl: string) => void;
  captureGps: () => void;
  next: () => { ok: boolean; message?: string };
  back: () => void;
  goToStep: (index: number) => void;
  reset: () => void;
  markComplete: () => void;
}

const FlhaContext = createContext<FlhaContextValue | null>(null);

function loadState(): FlhaFormState {
  if (typeof window === "undefined") return INITIAL_FLHA_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_FLHA_STATE;
    return { ...INITIAL_FLHA_STATE, ...JSON.parse(raw) };
  } catch {
    return INITIAL_FLHA_STATE;
  }
}

export function FlhaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FlhaFormState>(INITIAL_FLHA_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const steps = useMemo(
    () => getActiveSteps(state.taskIds),
    [state.taskIds]
  );

  const currentStepId = steps[Math.min(state.currentStep, steps.length - 1)];

  const resolvedHazards = useMemo(
    () => resolveHazardsFromTasks(state.taskIds),
    [state.taskIds]
  );

  const progress =
    steps.length > 0
      ? ((state.currentStep + 1) / steps.length) * 100
      : 0;

  const setProject = useCallback((projectId: string) => {
    const equipment = getProjectEquipment(projectId);
    const project = getProject(projectId);
    const suggestions: string[] = [];
    if (project) {
      if (project.weather === "Windy") suggestions.push("High Wind");
      if (project.weather === "Rain") suggestions.push("Rain");
      if (project.weather === "Snow") suggestions.push("Snow");
      if (project.temperature >= 28) suggestions.push("Heat");
      if (project.temperature <= 0) suggestions.push("Cold");
      if (project.siteHazards.some((h) => h.toLowerCase().includes("powerline"))) {
        suggestions.push("Powerlines");
      }
      if (project.siteHazards.some((h) => h.toLowerCase().includes("public"))) {
        suggestions.push("Public");
      }
      if (project.siteHazards.some((h) => h.toLowerCase().includes("traffic"))) {
        suggestions.push("Traffic");
      }
    }
    setState((s) => ({
      ...s,
      projectId,
      equipmentInspections: equipment.map((e) => ({
        equipmentId: e.id,
        inspected: null,
        deficiencies: null,
        comments: "",
      })),
      reviewedDocuments: [],
      environment: suggestions,
    }));
  }, []);

  const setRole = useCallback((role: Role) => {
    setState((s) => ({ ...s, role }));
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setState((s) => {
      const exists = s.taskIds.includes(taskId);
      const taskIds = exists
        ? s.taskIds.filter((id) => id !== taskId)
        : [...s.taskIds, taskId];
      const hazards = resolveHazardsFromTasks(taskIds);
      const confirmedHazardIds = s.confirmedHazardIds.filter((id) =>
        hazards.some((h) => h.id === id)
      );
      return { ...s, taskIds, confirmedHazardIds };
    });
  }, []);

  const toggleHazardConfirm = useCallback((hazardId: string) => {
    setState((s) => {
      const exists = s.confirmedHazardIds.includes(hazardId);
      return {
        ...s,
        confirmedHazardIds: exists
          ? s.confirmedHazardIds.filter((id) => id !== hazardId)
          : [...s.confirmedHazardIds, hazardId],
      };
    });
  }, []);

  const confirmAllHazards = useCallback(() => {
    setState((s) => ({
      ...s,
      confirmedHazardIds: resolveHazardsFromTasks(s.taskIds).map((h) => h.id),
    }));
  }, []);

  const setAdditionalHazardsEnabled = useCallback((value: boolean) => {
    setState((s) => ({
      ...s,
      additionalHazardsEnabled: value,
      additionalHazards: value
        ? s.additionalHazards.length
          ? s.additionalHazards
          : [createEmptyAdditionalHazard()]
        : [],
    }));
  }, []);

  const addAdditionalHazard = useCallback(() => {
    setState((s) => ({
      ...s,
      additionalHazards: [...s.additionalHazards, createEmptyAdditionalHazard()],
    }));
  }, []);

  const updateAdditionalHazard = useCallback(
    (id: string, patch: Partial<AdditionalHazard>) => {
      setState((s) => ({
        ...s,
        additionalHazards: s.additionalHazards.map((h) =>
          h.id === id ? { ...h, ...patch } : h
        ),
      }));
    },
    []
  );

  const removeAdditionalHazard = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      additionalHazards: s.additionalHazards.filter((h) => h.id !== id),
    }));
  }, []);

  const toggleDocument = useCallback((docId: string) => {
    setState((s) => {
      const exists = s.reviewedDocuments.includes(docId);
      return {
        ...s,
        reviewedDocuments: exists
          ? s.reviewedDocuments.filter((id) => id !== docId)
          : [...s.reviewedDocuments, docId],
      };
    });
  }, []);

  const reviewAllDocuments = useCallback((docIds: string[]) => {
    setState((s) => ({ ...s, reviewedDocuments: docIds }));
  }, []);

  const updateEquipmentInspection = useCallback(
    (equipmentId: string, patch: Partial<EquipmentInspection>) => {
      setState((s) => ({
        ...s,
        equipmentInspections: s.equipmentInspections.map((e) =>
          e.equipmentId === equipmentId ? { ...e, ...patch } : e
        ),
      }));
    },
    []
  );

  const toggleLadderType = useCallback((type: string) => {
    setState((s) => {
      const exists = s.ladder.types.includes(type);
      return {
        ...s,
        ladder: {
          ...s.ladder,
          types: exists
            ? s.ladder.types.filter((t) => t !== type)
            : [...s.ladder.types, type],
        },
      };
    });
  }, []);

  const setLadderField = useCallback(
    (
      field: keyof FlhaFormState["ladder"],
      value: boolean | string[] | null
    ) => {
      setState((s) => ({
        ...s,
        ladder: { ...s.ladder, [field]: value },
      }));
    },
    []
  );

  const toggleEnvironment = useCallback((item: string) => {
    setState((s) => {
      const exists = s.environment.includes(item);
      return {
        ...s,
        environment: exists
          ? s.environment.filter((e) => e !== item)
          : [...s.environment, item],
      };
    });
  }, []);

  const addPhoto = useCallback((photo: PhotoItem) => {
    setState((s) => ({ ...s, photos: [...s.photos, photo] }));
  }, []);

  const removePhoto = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      photos: s.photos.filter((p) => p.id !== id),
    }));
  }, []);

  const setComments = useCallback((value: string) => {
    setState((s) => ({ ...s, comments: value }));
  }, []);

  const setWorkerSignature = useCallback((dataUrl: string) => {
    setState((s) => ({
      ...s,
      signatures: {
        ...s.signatures,
        worker: dataUrl,
        timestamp: new Date().toISOString(),
      },
    }));
  }, []);

  const setSupervisorSignature = useCallback((dataUrl: string) => {
    setState((s) => ({
      ...s,
      signatures: { ...s.signatures, supervisor: dataUrl },
    }));
  }, []);

  const captureGps = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        signatures: {
          ...s.signatures,
          gps: { lat: 49.2827, lng: -123.1207 },
        },
      }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState((s) => ({
          ...s,
          signatures: {
            ...s.signatures,
            gps: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          },
        }));
      },
      () => {
        setState((s) => ({
          ...s,
          signatures: {
            ...s.signatures,
            gps: { lat: 49.2827, lng: -123.1207 },
          },
        }));
      },
      { timeout: 5000 }
    );
  }, []);

  const next = useCallback(() => {
    const required = resolvedHazards.map((h) => h.id);
    const check = canProceed(currentStepId, state, required);
    if (!check.ok) return check;
    setState((s) => ({
      ...s,
      currentStep: Math.min(s.currentStep + 1, steps.length - 1),
    }));
    return { ok: true };
  }, [currentStepId, state, resolvedHazards, steps.length]);

  const back = useCallback(() => {
    setState((s) => ({
      ...s,
      currentStep: Math.max(s.currentStep - 1, 0),
    }));
  }, []);

  const goToStep = useCallback((index: number) => {
    setState((s) => ({ ...s, currentStep: index }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_FLHA_STATE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const markComplete = useCallback(() => {
    setState((s) => ({ ...s, completed: true }));
  }, []);

  const value: FlhaContextValue = {
    state,
    steps,
    currentStepId,
    resolvedHazards,
    progress,
    setProject,
    setRole,
    toggleTask,
    toggleHazardConfirm,
    confirmAllHazards,
    setAdditionalHazardsEnabled,
    addAdditionalHazard,
    updateAdditionalHazard,
    removeAdditionalHazard,
    toggleDocument,
    reviewAllDocuments,
    updateEquipmentInspection,
    toggleLadderType,
    setLadderField,
    toggleEnvironment,
    addPhoto,
    removePhoto,
    setComments,
    setWorkerSignature,
    setSupervisorSignature,
    captureGps,
    next,
    back,
    goToStep,
    reset,
    markComplete,
  };

  return <FlhaContext.Provider value={value}>{children}</FlhaContext.Provider>;
}

export function useFlha() {
  const ctx = useContext(FlhaContext);
  if (!ctx) throw new Error("useFlha must be used within FlhaProvider");
  return ctx;
}
