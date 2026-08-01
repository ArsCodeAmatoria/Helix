import inspectionData from "@/data/inspections.json";
import { db } from "@/lib/db";
import type {
  CraneGreasingEntry,
  CraneInspectionEntry,
  CraneInspectionType,
  CraneMaintenanceSchedule,
  EquipmentItem,
  InspectionCheckItem,
  InspectionCheckResult,
  InspectionCheckTemplate,
  InspectionLogState,
  InspectionOverall,
  RiggingGearItem,
  RiggingGearResult,
  RiggingInspectionEntry,
  RiggingInspectionType,
} from "@/lib/types";

export const riggingGear = inspectionData.gear as RiggingGearItem[];
export const riggingCategories = (inspectionData.categories ??
  []) as string[];
export const craneChecklist =
  inspectionData.craneChecklist as InspectionCheckTemplate[];
export const riggingChecklist =
  inspectionData.riggingChecklist as InspectionCheckTemplate[];
export const craneMaintenance = (inspectionData.craneMaintenance ??
  []) as CraneMaintenanceSchedule[];

export function getCraneEquipment(): EquipmentItem[] {
  return db.equipment.filter(
    (e) => e.type === "Tower Crane" || e.type === "Mobile Crane"
  );
}

export function getRiggingGear(id: string): RiggingGearItem | undefined {
  return riggingGear.find((g) => g.id === id);
}

export function getRiggingByCategory(category?: string): RiggingGearItem[] {
  if (!category || category === "all") return riggingGear;
  return riggingGear.filter((g) => g.category === category);
}

export function getCraneMaintenance(
  equipmentId: string
): CraneMaintenanceSchedule | undefined {
  return craneMaintenance.find((m) => m.equipmentId === equipmentId);
}

export function blankChecks(
  templates: InspectionCheckTemplate[]
): InspectionCheckItem[] {
  return templates.map((t) => ({
    id: t.id,
    label: t.label,
    section: t.section,
    result: null,
  }));
}

export function groupChecksBySection(checks: InspectionCheckItem[]) {
  const sections: { section: string; items: InspectionCheckItem[] }[] = [];
  for (const item of checks) {
    const section = item.section ?? "General";
    const existing = sections.find((s) => s.section === section);
    if (existing) existing.items.push(item);
    else sections.push({ section, items: [item] });
  }
  return sections;
}

export function lastGreasedForPoint(
  entries: CraneGreasingEntry[],
  equipmentId: string,
  pointId: string
): CraneGreasingEntry | undefined {
  return sortByGreasedAtDesc(
    entries.filter(
      (e) => e.equipmentId === equipmentId && e.pointIds.includes(pointId)
    )
  )[0];
}

export function greasePointStatus(
  point: { id: string; intervalDays: number },
  last?: CraneGreasingEntry
): { dueAt: Date; overdue: boolean; daysLeft: number } {
  const dueAt = new Date(last?.greasedAt ?? 0);
  if (!last) {
    const now = new Date();
    return { dueAt: now, overdue: true, daysLeft: 0 };
  }
  dueAt.setDate(dueAt.getDate() + point.intervalDays);
  const now = new Date();
  const daysLeft = Math.ceil(
    (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return { dueAt, overdue: daysLeft < 0, daysLeft };
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

/** Gear IDs covered by an entry (supports legacy single gearId). */
export function entryGearIds(entry: {
  gearId?: string;
  gearIds?: string[];
  gearResults?: { gearId: string }[];
}): string[] {
  if (entry.gearIds && entry.gearIds.length > 0) return entry.gearIds;
  if (entry.gearResults && entry.gearResults.length > 0) {
    return entry.gearResults.map((g) => g.gearId);
  }
  if (entry.gearId) return [entry.gearId];
  return [];
}

export function normalizeRiggingEntry(
  entry: RiggingInspectionEntry
): RiggingInspectionEntry {
  const gearIds = entryGearIds(entry);
  const gearResults =
    entry.gearResults?.length > 0
      ? entry.gearResults
      : gearIds.map((gearId) => ({
          gearId,
          result: (entry.overall === "fail" ? "fail" : "pass") as
            | "pass"
            | "fail"
            | "na"
            | null,
        }));
  return {
    ...entry,
    gearIds,
    gearResults,
    checks: entry.checks ?? [],
  };
}

export function deriveRiggingOverall(
  gearResults: { result: InspectionCheckResult }[],
  checks: InspectionCheckItem[] = []
): InspectionOverall {
  const gearScored = gearResults.filter(
    (g) => g.result === "pass" || g.result === "fail"
  );
  const checkScored = checks.filter(
    (c) => c.result === "pass" || c.result === "fail"
  );
  if (
    gearScored.some((g) => g.result === "fail") ||
    checkScored.some((c) => c.result === "fail")
  ) {
    return "fail";
  }
  if (gearScored.length === 0 && checkScored.length === 0) {
    return "conditional";
  }
  return "pass";
}

export function gearResultFor(
  entry: RiggingInspectionEntry,
  gearId: string
): InspectionCheckResult {
  const normalized = normalizeRiggingEntry(entry);
  return (
    normalized.gearResults.find((g) => g.gearId === gearId)?.result ?? null
  );
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
    section: t.section,
    result: failIds.includes(t.id) ? "fail" : "pass",
  }));
}

function seedRiggingChecks(
  failIds: string[] = []
): InspectionCheckItem[] {
  return riggingChecklist.map((t) => ({
    id: t.id,
    label: t.label,
    section: t.section,
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
      comments: "Pre-pour checks complete. Limits & E-stops tested. Radio Ch 3 confirmed.",
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
      comments: "All limits and E-stops OK.",
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
      comments: "Luffing crane ready for panel hops. A2B tested.",
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
      comments: "Weekly structural + greasing walkaround — no issues.",
    },
  ];

  const greasingEntries: CraneGreasingEntry[] = [
    {
      id: "grease-1",
      equipmentId: "eq-tc1",
      greasedAt: daysAgoIso(2, 16, 0),
      technician: "Alex Nguyen",
      pointIds: ["g-slew", "g-trolley", "g-hook"],
      notes: "Weekly grease — slew, trolley, hook.",
    },
    {
      id: "grease-2",
      equipmentId: "eq-tc1",
      greasedAt: daysAgoIso(8, 15, 0),
      technician: "Yard Maintenance",
      pointIds: ["g-rope", "g-pinion", "g-mast"],
      notes: "Bi-weekly rope + monthly pinion/mast points.",
    },
    {
      id: "grease-3",
      equipmentId: "eq-tc2",
      greasedAt: daysAgoIso(1, 17, 0),
      technician: "Nina Wallace",
      pointIds: ["g-slew", "g-luff", "g-hook"],
      notes: "Post-shift grease on luffing pins.",
    },
    {
      id: "grease-4",
      equipmentId: "eq-mobile",
      greasedAt: daysAgoIso(0, 6, 50),
      technician: "Mike Tanaka",
      pointIds: ["g-outrigger"],
      notes: "Outriggers greased at start of shift.",
    },
  ];

  const passGear = (ids: string[]): RiggingGearResult[] =>
    ids.map((gearId) => ({ gearId, result: "pass" as const }));

  const riggingEntries: RiggingInspectionEntry[] = [
    {
      id: "rig-log-1",
      kind: "rigging",
      gearIds: [
        "rig-sling-2t-a",
        "rig-bridle-2leg",
        "rig-hook-block-tc1",
        "rig-shackle-8.5",
        "rig-bin-debris",
      ],
      gearResults: passGear([
        "rig-sling-2t-a",
        "rig-bridle-2leg",
        "rig-hook-block-tc1",
        "rig-shackle-8.5",
        "rig-bin-debris",
      ]),
      inspectionType: "pre-use",
      inspectedAt: daysAgoIso(0, 6, 25),
      inspector: "Marcus Chen",
      projectId: "proj-oceanview",
      checks: [],
      overall: "pass",
      comments:
        "Morning pre-use — sling, 2-leg bridle, hook block, 8.5t shackles, debris bin only. Other gear not in use.",
    },
    {
      id: "rig-log-2",
      kind: "rigging",
      gearIds: ["rig-softener"],
      gearResults: [{ gearId: "rig-softener", result: "fail" }],
      inspectionType: "pre-use",
      inspectedAt: daysAgoIso(5, 8, 0),
      inspector: "Luis Santos",
      projectId: "proj-burnaby",
      checks: seedRiggingChecks(["r-wear"]),
      overall: "fail",
      comments: "Cut on edge protector — tagged out.",
    },
    {
      id: "rig-log-3",
      kind: "rigging",
      gearIds: ["rig-shackle-12"],
      gearResults: [{ gearId: "rig-shackle-12", result: "fail" }],
      inspectionType: "after-incident",
      inspectedAt: daysAgoIso(4, 11, 0),
      inspector: "Priya Nair",
      projectId: "proj-fraser",
      checks: seedRiggingChecks(["r-deform"]),
      overall: "fail",
      comments: "Pin distortion after shock load — send for NDT.",
    },
    {
      id: "rig-log-4",
      kind: "rigging",
      gearIds: ["rig-snatch", "rig-sling-5t-a"],
      gearResults: passGear(["rig-snatch", "rig-sling-5t-a"]),
      inspectionType: "periodic",
      inspectedAt: daysAgoIso(2, 14, 0),
      inspector: "Jordan Lee",
      projectId: "proj-oceanview",
      checks: [],
      overall: "pass",
      comments: "Snatch block + 5t sling for steel hop.",
    },
  ];

  return { craneEntries, riggingEntries, greasingEntries };
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
  inspector: string,
  inspectionType: RiggingInspectionType = "pre-use",
  gearIds: string[] = []
): Omit<RiggingInspectionEntry, "id" | "inspectedAt" | "overall"> & {
  overall: InspectionOverall;
} {
  const gearResults: RiggingGearResult[] = gearIds.map((gearId) => ({
    gearId,
    result: null,
  }));
  return {
    kind: "rigging",
    gearIds,
    gearResults,
    inspectionType,
    inspector,
    projectId: null,
    checks: [],
    overall: deriveRiggingOverall(gearResults),
    comments: "",
  };
}

/** Soft checklist — only for selected gear categories (optional detail). */
export function checklistForSelectedGear(
  gearIds: string[]
): InspectionCheckTemplate[] {
  const cats = new Set(
    gearIds
      .map((id) => getRiggingGear(id)?.category)
      .filter((c): c is string => Boolean(c))
  );
  return softRiggingChecksForCategories(cats);
}

function softRiggingChecksForCategories(
  categories: Set<string>
): InspectionCheckTemplate[] {
  const always = ["r-tag", "r-rating", "r-wear", "r-deform", "r-match"];
  const byCat: Record<string, string[]> = {
    "Garbage Bin": ["r-bin", "r-hardware"],
    Slings: ["r-stitch", "r-clean", "r-storage"],
    Bridle: ["r-bridle", "r-hardware"],
    "Crane Hook & Block": ["r-throat", "r-block", "r-hardware"],
    Shackles: ["r-throat", "r-hardware"],
    "Wire Rope": ["r-wire", "r-clean"],
    Chain: ["r-hardware", "r-clean"],
    "Below-the-hook": ["r-hardware", "r-clean"],
    "Blocks & Sheaves": ["r-block", "r-hardware"],
    "Tag Lines & Softeners": ["r-wear", "r-clean", "r-storage"],
  };
  const ids = new Set(always);
  for (const cat of categories) {
    for (const id of byCat[cat] ?? ["r-hardware", "r-clean"]) {
      ids.add(id);
    }
  }
  return riggingChecklist.filter((t) => ids.has(t.id));
}

export function sortEntriesByDateDesc<T extends { inspectedAt: string }>(
  entries: T[]
): T[] {
  return [...entries].sort(
    (a, b) =>
      new Date(b.inspectedAt).getTime() - new Date(a.inspectedAt).getTime()
  );
}

export function sortByGreasedAtDesc(
  entries: CraneGreasingEntry[]
): CraneGreasingEntry[] {
  return [...entries].sort(
    (a, b) =>
      new Date(b.greasedAt).getTime() - new Date(a.greasedAt).getTime()
  );
}
