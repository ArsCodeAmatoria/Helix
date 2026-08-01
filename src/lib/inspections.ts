import inspectionData from "@/data/inspections.json";
import { db } from "@/lib/db";
import type {
  CraneInspectionEntry,
  CraneInspectionType,
  EquipmentItem,
  InspectionCheckItem,
  InspectionCheckTemplate,
  InspectionLogState,
  InspectionOverall,
  RiggingGearItem,
  RiggingInspectionEntry,
  RiggingInspectionType,
} from "@/lib/types";

export const riggingGear = inspectionData.gear as RiggingGearItem[];
export const craneChecklist =
  inspectionData.craneChecklist as InspectionCheckTemplate[];
export const riggingChecklist =
  inspectionData.riggingChecklist as InspectionCheckTemplate[];

export function getCraneEquipment(): EquipmentItem[] {
  return db.equipment.filter(
    (e) => e.type === "Tower Crane" || e.type === "Mobile Crane"
  );
}

export function getRiggingGear(id: string): RiggingGearItem | undefined {
  return riggingGear.find((g) => g.id === id);
}

export function blankChecks(
  templates: InspectionCheckTemplate[]
): InspectionCheckItem[] {
  return templates.map((t) => ({
    id: t.id,
    label: t.label,
    result: null,
  }));
}

export function deriveOverall(
  checks: InspectionCheckItem[]
): InspectionOverall {
  const scored = checks.filter((c) => c.result === "pass" || c.result === "fail");
  if (scored.some((c) => c.result === "fail")) return "fail";
  if (scored.length === 0) return "conditional";
  if (scored.every((c) => c.result === "pass")) return "pass";
  return "conditional";
}

export function createEntryId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function daysAgoIso(days: number, hour = 6, minute = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function seedCraneChecks(
  failIds: string[] = []
): InspectionCheckItem[] {
  return craneChecklist.map((t) => ({
    id: t.id,
    label: t.label,
    result: failIds.includes(t.id) ? "fail" : "pass",
  }));
}

function seedRiggingChecks(
  failIds: string[] = []
): InspectionCheckItem[] {
  return riggingChecklist.map((t) => ({
    id: t.id,
    label: t.label,
    result: failIds.includes(t.id) ? "fail" : "pass",
  }));
}

export function seedInspectionLogs(): InspectionLogState {
  const craneEntries: CraneInspectionEntry[] = [
    {
      id: "crane-log-1",
      kind: "crane",
      equipmentId: "eq-tc1",
      inspectionType: "daily",
      inspectedAt: daysAgoIso(0, 6, 15),
      inspector: "Alex Nguyen",
      projectId: "proj-oceanview",
      windKmh: 18,
      hours: 4.5,
      checks: seedCraneChecks(),
      overall: "pass",
      comments: "Pre-pour checks complete. Radio Ch 3 confirmed.",
    },
    {
      id: "crane-log-2",
      kind: "crane",
      equipmentId: "eq-tc1",
      inspectionType: "daily",
      inspectedAt: daysAgoIso(1, 6, 20),
      inspector: "Alex Nguyen",
      projectId: "proj-oceanview",
      windKmh: 22,
      hours: 6,
      checks: seedCraneChecks(),
      overall: "pass",
      comments: "All limits tested OK.",
    },
    {
      id: "crane-log-3",
      kind: "crane",
      equipmentId: "eq-tc2",
      inspectionType: "daily",
      inspectedAt: daysAgoIso(0, 6, 40),
      inspector: "Nina Wallace",
      projectId: "proj-oceanview",
      windKmh: 16,
      hours: 3,
      checks: seedCraneChecks(),
      overall: "pass",
      comments: "Luffing crane ready for panel hops.",
    },
    {
      id: "crane-log-4",
      kind: "crane",
      equipmentId: "eq-mobile",
      inspectionType: "shift",
      inspectedAt: daysAgoIso(0, 7, 5),
      inspector: "Mike Tanaka",
      projectId: "proj-yard",
      windKmh: 12,
      hours: 2,
      checks: seedCraneChecks(["c-swing"]),
      overall: "fail",
      comments: "Outrigger pads on soft ground — tagged until mats placed.",
    },
    {
      id: "crane-log-5",
      kind: "crane",
      equipmentId: "eq-tc1",
      inspectionType: "weekly",
      inspectedAt: daysAgoIso(3, 15, 0),
      inspector: "Priya Nair",
      projectId: "proj-oceanview",
      windKmh: null,
      hours: null,
      checks: seedCraneChecks(),
      overall: "pass",
      comments: "Weekly structural walkaround — no issues.",
    },
  ];

  const riggingEntries: RiggingInspectionEntry[] = [
    {
      id: "rig-log-1",
      kind: "rigging",
      gearId: "rig-sling-2t-a",
      inspectionType: "pre-use",
      inspectedAt: daysAgoIso(0, 6, 25),
      inspector: "Marcus Chen",
      projectId: "proj-oceanview",
      checks: seedRiggingChecks(),
      overall: "pass",
      comments: "Ready for deck material hops.",
    },
    {
      id: "rig-log-2",
      kind: "rigging",
      gearId: "rig-shackle-8.5",
      inspectionType: "pre-use",
      inspectedAt: daysAgoIso(0, 6, 28),
      inspector: "Marcus Chen",
      projectId: "proj-oceanview",
      checks: seedRiggingChecks(),
      overall: "pass",
      comments: "",
    },
    {
      id: "rig-log-3",
      kind: "rigging",
      gearId: "rig-wire-10t",
      inspectionType: "periodic",
      inspectedAt: daysAgoIso(2, 14, 0),
      inspector: "Jordan Lee",
      projectId: "proj-oceanview",
      checks: seedRiggingChecks(),
      overall: "pass",
      comments: "Periodic — lubrication OK.",
    },
    {
      id: "rig-log-4",
      kind: "rigging",
      gearId: "rig-softener",
      inspectionType: "pre-use",
      inspectedAt: daysAgoIso(5, 8, 0),
      inspector: "Luis Santos",
      projectId: "proj-burnaby",
      checks: seedRiggingChecks(["r-wear"]),
      overall: "fail",
      comments: "Cut on edge protector — tagged out.",
    },
    {
      id: "rig-log-5",
      kind: "rigging",
      gearId: "rig-shackle-12",
      inspectionType: "after-incident",
      inspectedAt: daysAgoIso(4, 11, 0),
      inspector: "Priya Nair",
      projectId: "proj-fraser",
      checks: seedRiggingChecks(["r-deform"]),
      overall: "fail",
      comments: "Pin distortion after shock load — send for NDT.",
    },
  ];

  return { craneEntries, riggingEntries };
}

export function createCraneDraft(
  equipmentId: string,
  inspector: string,
  inspectionType: CraneInspectionType = "daily"
): Omit<CraneInspectionEntry, "id" | "inspectedAt" | "overall"> & {
  overall: InspectionOverall;
} {
  const checks = blankChecks(craneChecklist);
  return {
    kind: "crane",
    equipmentId,
    inspectionType,
    inspector,
    projectId: null,
    windKmh: null,
    hours: null,
    checks,
    overall: deriveOverall(checks),
    comments: "",
  };
}

export function createRiggingDraft(
  gearId: string,
  inspector: string,
  inspectionType: RiggingInspectionType = "pre-use"
): Omit<RiggingInspectionEntry, "id" | "inspectedAt" | "overall"> & {
  overall: InspectionOverall;
} {
  const checks = blankChecks(riggingChecklist);
  return {
    kind: "rigging",
    gearId,
    inspectionType,
    inspector,
    projectId: null,
    checks,
    overall: deriveOverall(checks),
    comments: "",
  };
}

export function sortEntriesByDateDesc<T extends { inspectedAt: string }>(
  entries: T[]
): T[] {
  return [...entries].sort(
    (a, b) =>
      new Date(b.inspectedAt).getTime() - new Date(a.inspectedAt).getTime()
  );
}
