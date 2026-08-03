import catalog from "@/data/site-inspections.json";
import { deriveOverall } from "@/lib/inspections";
import type {
  InspectionOverall,
  SiteInspectionCategory,
  SiteInspectionCheckItem,
  SiteInspectionCheckTemplate,
  SiteInspectionFinding,
  SiteInspectionRecord,
  SiteInspectionSeverity,
} from "@/lib/types";

export const siteInspectionDisclaimer = catalog.disclaimer;
export const siteInspectionCategories =
  catalog.categories as SiteInspectionCategory[];
export const siteInspectionChecklist =
  catalog.checklist as SiteInspectionCheckTemplate[];

export function getSiteInspectionCategory(
  id: string
): SiteInspectionCategory | undefined {
  return siteInspectionCategories.find((c) => c.id === id);
}

export function blankSiteChecks(
  templates: SiteInspectionCheckTemplate[] = siteInspectionChecklist
): SiteInspectionCheckItem[] {
  return templates.map((t) => ({
    id: t.id,
    category: t.category,
    label: t.label,
    guidance: t.guidance,
    result: null,
    note: "",
  }));
}

export function groupSiteChecksByCategory(checks: SiteInspectionCheckItem[]) {
  const order = siteInspectionCategories.map((c) => c.id);
  const map = new Map<string, SiteInspectionCheckItem[]>();
  for (const check of checks) {
    const list = map.get(check.category) ?? [];
    list.push(check);
    map.set(check.category, list);
  }
  return order
    .filter((id) => map.has(id))
    .map((id) => ({
      category: getSiteInspectionCategory(id)!,
      checks: map.get(id)!,
    }));
}

export function deriveSiteOverall(
  checks: SiteInspectionCheckItem[]
): InspectionOverall {
  return deriveOverall(
    checks.map((c) => ({
      id: c.id,
      label: c.label,
      result: c.result,
      section: c.category,
    }))
  );
}

export function createSiteInspectionId(): string {
  return `si-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createFindingId(): string {
  return `sif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function openFindings(records: SiteInspectionRecord[]): SiteInspectionFinding[] {
  return records.flatMap((r) =>
    r.findings.filter((f) => f.correctiveAction.status !== "closed")
  );
}

export function findingsBySeverity(
  findings: SiteInspectionFinding[]
): Record<SiteInspectionSeverity, number> {
  return {
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
  };
}

export function defaultFindingFromCheck(
  check: SiteInspectionCheckItem,
  projectLocation = ""
): Omit<SiteInspectionFinding, "id"> {
  return {
    checkId: check.id,
    title: check.label,
    description: check.note || check.guidance || "Site condition requires correction.",
    location: projectLocation,
    severity: "medium",
    correctiveAction: {
      description: "",
      assignee: "",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      status: "open",
      priority: "medium",
    },
  };
}

export function seedSiteInspections(): SiteInspectionRecord[] {
  const checks = blankSiteChecks();
  for (const c of checks) {
    if (
      [
        "si-access-1",
        "si-access-2",
        "si-hk-1",
        "si-hk-2",
        "si-fp-2",
        "si-crane-1",
        "si-crane-2",
        "si-crane-4",
        "si-public-2",
        "si-elec-1",
        "si-ppe-1",
        "si-ppe-2",
        "si-em-1",
        "si-em-2",
        "si-fw-1",
        "si-env-1",
        "si-env-2",
      ].includes(c.id)
    ) {
      c.result = "pass";
    } else if (["si-access-3", "si-hk-3", "si-elec-3", "si-em-3"].includes(c.id)) {
      c.result = "na";
    } else if (c.id === "si-fp-1") {
      c.result = "fail";
      c.note = "Guardrail gap Level 28 east after deck pour.";
    } else if (c.id === "si-crane-3") {
      c.result = "pass";
    } else if (c.id === "si-public-1") {
      c.result = "pass";
    } else if (c.id === "si-elec-2") {
      c.result = "pass";
    } else if (c.id === "si-fw-2") {
      c.result = "fail";
      c.note = "Uncapped rebar near south stair tower.";
    } else {
      c.result = "pass";
    }
  }

  const findings: SiteInspectionFinding[] = [
    {
      id: "sif-seed-1",
      checkId: "si-fp-1",
      title: "Guardrail gap — Level 28 east edge",
      description:
        "Section of guardrail missing after yesterday’s deck pour. Temporary edge protection required before stripping or trade access.",
      location: "Oceanview Tower · Level 28 east",
      severity: "high",
      correctiveAction: {
        description: "Install temporary edge protection and photograph before closing.",
        assignee: "Tony Rivera",
        dueDate: new Date().toISOString().slice(0, 10),
        status: "in-progress",
        priority: "high",
      },
    },
    {
      id: "sif-seed-2",
      checkId: "si-fw-2",
      title: "Uncapped rebar — south stair",
      description: "Protruding rebar near south stair tower without caps in a travel path.",
      location: "Oceanview Tower · south stair L27–L28",
      severity: "medium",
      correctiveAction: {
        description: "Cap or guard all protruding steel before next break.",
        assignee: "Sam Rivera",
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        status: "open",
        priority: "medium",
      },
    },
  ];

  return [
    {
      id: "si-seed-1",
      projectId: "proj-oceanview",
      inspectedAt: new Date().toISOString(),
      inspector: "Priya Nair",
      weatherNotes: "Partly cloudy · 18°C · light wind",
      comments:
        "Morning site walk before pour support. Edge protection is the priority finding.",
      checks,
      findings,
      overall: deriveSiteOverall(checks),
    },
  ];
}
