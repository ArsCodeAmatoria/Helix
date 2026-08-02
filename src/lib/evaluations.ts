import evalData from "@/data/evaluations.json";
import { members } from "@/lib/team";
import type {
  EvaluationCheckItem,
  EvaluationOverall,
  EvaluationRecord,
  TeamMember,
} from "@/lib/types";

export interface EvaluationChecklistItem {
  id: string;
  label: string;
}

export interface EvaluationChecklist {
  id: string;
  trackId: string;
  stageId: string;
  title: string;
  category: string;
  audience: string;
  estimatedMinutes: number;
  items: EvaluationChecklistItem[];
}

export interface EvaluationStage {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  checklistIds: string[];
  credentialHint: string;
}

export interface EvaluationTrack {
  id: string;
  title: string;
  authority: string;
  summary: string;
  stages: EvaluationStage[];
}

export const evaluationSource = evalData.source;
export const evaluationDisclaimer = evalData.disclaimer;
export const evaluationTracks = evalData.tracks as EvaluationTrack[];
export const evaluationChecklists =
  evalData.checklists as EvaluationChecklist[];

export function getEvaluationTrack(id: string): EvaluationTrack | undefined {
  return evaluationTracks.find((t) => t.id === id);
}

export function getEvaluationChecklist(
  id: string
): EvaluationChecklist | undefined {
  return evaluationChecklists.find((c) => c.id === id);
}

export function getChecklistsForStage(
  trackId: string,
  stageId: string
): EvaluationChecklist[] {
  return evaluationChecklists.filter(
    (c) => c.trackId === trackId && c.stageId === stageId
  );
}

export function blankEvaluationItems(
  checklist: EvaluationChecklist
): EvaluationCheckItem[] {
  return checklist.items.map((i) => ({
    id: i.id,
    label: i.label,
    result: null,
  }));
}

export function deriveEvaluationOverall(
  items: EvaluationCheckItem[]
): EvaluationOverall {
  const scored = items.filter((i) => i.result === "pass" || i.result === "fail");
  if (scored.some((i) => i.result === "fail")) return "fail";
  if (scored.length === 0) return "conditional";
  if (scored.every((i) => i.result === "pass")) return "pass";
  return "conditional";
}

export function createEvaluationId(): string {
  return `eval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function tracksForMember(member: TeamMember): EvaluationTrack[] {
  const role = member.role.toLowerCase();
  const trade = member.trade.toLowerCase();
  const ids = new Set<string>();
  if (
    role.includes("rigger") ||
    trade.includes("rigging") ||
    trade.includes("crane support")
  ) {
    ids.add("rigger");
  }
  if (
    role.includes("crane") ||
    trade.includes("tower crane") ||
    trade.includes("crane")
  ) {
    if (trade.includes("mobile")) ids.add("mobile-crane");
    else ids.add("tower-crane");
  }
  if (role.includes("supervisor") || role.includes("safety")) {
    ids.add("rigger");
    ids.add("tower-crane");
  }
  // Labourers / formwork often on intermediate lift evals
  if (
    trade.includes("formwork") ||
    role.includes("formwork") ||
    role.includes("labour")
  ) {
    ids.add("rigger");
  }
  if (ids.size === 0) ids.add("rigger");
  return evaluationTracks.filter((t) => ids.has(t.id));
}

export function memberEvalRecords(
  records: EvaluationRecord[],
  memberId: string
): EvaluationRecord[] {
  return records
    .filter((r) => r.memberId === memberId)
    .sort(
      (a, b) =>
        new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
    );
}

export function passedChecklistIds(
  records: EvaluationRecord[],
  memberId: string
): Set<string> {
  const set = new Set<string>();
  for (const r of memberEvalRecords(records, memberId)) {
    if (r.overall === "pass" && r.supervisorSignature) {
      set.add(r.checklistId);
    }
  }
  return set;
}

export function stageProgress(
  track: EvaluationTrack,
  stage: EvaluationStage,
  passed: Set<string>
): { complete: number; total: number; percent: number; status: string } {
  const total = stage.checklistIds.length;
  const complete = stage.checklistIds.filter((id) => passed.has(id)).length;
  const percent = total === 0 ? 0 : Math.round((complete / total) * 100);
  return {
    complete,
    total,
    percent,
    status:
      complete === 0
        ? "not-started"
        : complete === total
          ? "complete"
          : "in-progress",
  };
}

export function trackProgress(
  track: EvaluationTrack,
  passed: Set<string>
): { complete: number; total: number; percent: number } {
  const ids = track.stages.flatMap((s) => s.checklistIds);
  const total = ids.length;
  const complete = ids.filter((id) => passed.has(id)).length;
  return {
    complete,
    total,
    percent: total === 0 ? 0 : Math.round((complete / total) * 100),
  };
}

function daysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function passItems(checklistId: string): EvaluationCheckItem[] {
  const checklist = getEvaluationChecklist(checklistId);
  if (!checklist) return [];
  return checklist.items.map((i) => ({
    id: i.id,
    label: i.label,
    result: "pass" as const,
  }));
}

/** Seed continuous evals for demo workers */
export function seedEvaluationRecords(): EvaluationRecord[] {
  const chen = members.find((m) => m.id === "m-chen");
  const nguyen = members.find((m) => m.id === "m-nguyen");
  const wallace = members.find((m) => m.id === "m-wallace");
  const santos = members.find((m) => m.id === "m-santos");
  const records: EvaluationRecord[] = [];

  if (chen) {
    for (const [checklistId, days, notes] of [
      ["eval-rig-basics-theory", 90, "Level 1 knowledge solid."],
      ["eval-rig-basics-practical", 88, "Practical with Fulford-aligned assessor notes."],
      ["eval-signal", 60, "Deck signal on TC-1."],
      ["eval-concrete-day", 14, "Oceanview L28 pour — competent."],
      ["eval-tables", 10, "Table hop with tag lines — pass."],
      ["eval-gang-forms", 7, "Gang panel hop — pass."],
    ] as const) {
      const cl = getEvaluationChecklist(checklistId)!;
      records.push({
        id: `seed-${chen.id}-${checklistId}`,
        memberId: chen.id,
        checklistId,
        trackId: cl.trackId,
        stageId: cl.stageId,
        evaluatedAt: daysAgo(days),
        evaluatorName: "Dave Okonkwo",
        evaluatorRole: "Supervisor",
        projectId: "proj-oceanview",
        items: passItems(checklistId),
        overall: "pass",
        notes,
        supervisorName: "Dave Okonkwo",
        supervisorSignature: "data:image/png;base64,seed",
        supervisorSignedAt: daysAgo(days, 11),
      });
    }
  }

  if (santos) {
    for (const checklistId of [
      "eval-rig-basics-theory",
      "eval-rig-basics-practical",
      "eval-signal",
      "eval-concrete-day",
    ]) {
      const cl = getEvaluationChecklist(checklistId)!;
      records.push({
        id: `seed-${santos.id}-${checklistId}`,
        memberId: santos.id,
        checklistId,
        trackId: cl.trackId,
        stageId: cl.stageId,
        evaluatedAt: daysAgo(30),
        evaluatorName: "Dave Okonkwo",
        evaluatorRole: "Supervisor",
        projectId: "proj-oceanview",
        items: passItems(checklistId),
        overall: "pass",
        notes: "Basics complete — continue intermediate lifts.",
        supervisorName: "Dave Okonkwo",
        supervisorSignature: "data:image/png;base64,seed",
        supervisorSignedAt: daysAgo(30, 12),
      });
    }
  }

  if (nguyen) {
    for (const [checklistId, days] of [
      ["eval-tc-bcs-registration", 120],
      ["eval-tc-orientation", 100],
      ["eval-tc-level1-knowledge", 80],
      ["eval-tc-daily-ops", 5],
      ["eval-tc-complex-lifts", 3],
    ] as const) {
      const cl = getEvaluationChecklist(checklistId)!;
      records.push({
        id: `seed-${nguyen.id}-${checklistId}`,
        memberId: nguyen.id,
        checklistId,
        trackId: cl.trackId,
        stageId: cl.stageId,
        evaluatedAt: daysAgo(days),
        evaluatorName: "Priya Nair",
        evaluatorRole: "Safety Coordinator",
        projectId: "proj-oceanview",
        items: passItems(checklistId),
        overall: "pass",
        notes: "Tower ops pathway — toward Level 2 / practical.",
        supervisorName: "Priya Nair",
        supervisorSignature: "data:image/png;base64,seed",
        supervisorSignedAt: daysAgo(days, 11),
      });
    }
  }

  if (wallace) {
    for (const checklistId of [
      "eval-mc-bcs-registration",
      "eval-mc-orientation",
      "eval-mc-setup-lifts",
    ]) {
      const cl = getEvaluationChecklist(checklistId)!;
      records.push({
        id: `seed-${wallace.id}-${checklistId}`,
        memberId: wallace.id,
        checklistId,
        trackId: cl.trackId,
        stageId: cl.stageId,
        evaluatedAt: daysAgo(20),
        evaluatorName: "Mike Tanaka",
        evaluatorRole: "Supervisor",
        projectId: "proj-yard",
        items: passItems(checklistId),
        overall: "pass",
        notes: "Mobile pathway started.",
        supervisorName: "Mike Tanaka",
        supervisorSignature: "data:image/png;base64,seed",
        supervisorSignedAt: daysAgo(20, 13),
      });
    }
  }

  return records;
}
