import type { FlhaFormState, FlhaStepId, Role } from "@/lib/types";
import { tasksTriggerLadder } from "@/lib/db";

export const INITIAL_FLHA_STATE: FlhaFormState = {
  projectId: null,
  role: null,
  taskIds: [],
  confirmedHazardIds: [],
  additionalHazardsEnabled: null,
  additionalHazards: [],
  reviewedDocuments: [],
  equipmentInspections: [],
  ladder: {
    types: [],
    correctLadder: null,
    inspected: null,
    secured: null,
    threePointContact: null,
  },
  environment: [],
  photos: [],
  comments: "",
  signatures: {
    worker: null,
    supervisor: null,
    gps: null,
    timestamp: null,
  },
  currentStep: 0,
  completed: false,
};

export function getActiveSteps(taskIds: string[]): FlhaStepId[] {
  const base: FlhaStepId[] = [
    "project",
    "worker",
    "tasks",
    "hazards",
    "site-hazards",
    "documents",
    "equipment",
  ];
  if (tasksTriggerLadder(taskIds)) {
    base.push("ladder");
  }
  base.push("environment", "photos", "comments", "signatures", "preview");
  return base;
}

export function createEmptyAdditionalHazard() {
  return {
    id: `ah-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    hazard: "",
    control: "",
    responsiblePerson: "",
  };
}

export function stepLabel(id: FlhaStepId): string {
  const labels: Record<FlhaStepId, string> = {
    project: "Select Project",
    worker: "Worker",
    tasks: "Today's Tasks",
    hazards: "Hazards & Controls",
    "site-hazards": "Site-Specific Hazards",
    documents: "Safe Work Documents",
    equipment: "Equipment",
    ladder: "Ladder Check",
    environment: "Environment",
    photos: "Photos",
    comments: "Comments",
    signatures: "Signatures",
    preview: "PDF Preview",
  };
  return labels[id];
}

export function canProceed(
  step: FlhaStepId,
  state: FlhaFormState,
  requiredHazardIds: string[]
): { ok: boolean; message?: string } {
  switch (step) {
    case "project":
      return state.projectId
        ? { ok: true }
        : { ok: false, message: "Select a project to continue" };
    case "worker":
      return state.role
        ? { ok: true }
        : { ok: false, message: "Confirm your role" };
    case "tasks":
      return state.taskIds.length > 0
        ? { ok: true }
        : { ok: false, message: "Select at least one task" };
    case "hazards": {
      const allConfirmed = requiredHazardIds.every((id) =>
        state.confirmedHazardIds.includes(id)
      );
      return allConfirmed
        ? { ok: true }
        : { ok: false, message: "Confirm all hazards" };
    }
    case "site-hazards":
      if (state.additionalHazardsEnabled === null) {
        return { ok: false, message: "Answer yes or no" };
      }
      if (state.additionalHazardsEnabled) {
        const incomplete = state.additionalHazards.some(
          (h) => !h.hazard.trim() || !h.control.trim()
        );
        if (state.additionalHazards.length === 0 || incomplete) {
          return {
            ok: false,
            message: "Add hazard and control for each card",
          };
        }
      }
      return { ok: true };
    case "documents":
      return { ok: true };
    case "equipment":
      return { ok: true };
    case "ladder": {
      const l = state.ladder;
      if (l.types.length === 0)
        return { ok: false, message: "Select ladder type" };
      if (
        l.correctLadder === null ||
        l.inspected === null ||
        l.secured === null ||
        l.threePointContact === null
      ) {
        return { ok: false, message: "Answer all ladder questions" };
      }
      return { ok: true };
    }
    case "environment":
      return { ok: true };
    case "photos":
      return { ok: true };
    case "comments":
      return { ok: true };
    case "signatures":
      return state.signatures.worker
        ? { ok: true }
        : { ok: false, message: "Worker signature required" };
    case "preview":
      return { ok: true };
    default:
      return { ok: true };
  }
}

export function defaultRoleFromWorker(
  roles: Role[],
  defaultRole: Role
): Role {
  return roles.includes(defaultRole) ? defaultRole : roles[0];
}
