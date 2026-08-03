import indexJson from "@/data/digital-forms/index.json";
import dailySafety from "@/data/digital-forms/daily-site-safety-checklist.json";
import dailyInspection from "@/data/digital-forms/daily-site-inspection.json";
import comprehensive from "@/data/digital-forms/comprehensive-site-inspection.json";
import corSite from "@/data/digital-forms/internal-cor-site-inspection.json";
import omsInterview from "@/data/digital-forms/oms-worker-interview.json";
import auditWorkbook from "@/data/digital-forms/bccsa-cor-audit-workbook.json";
import { deriveOverall } from "@/lib/inspections";
import type {
  DigitalFormCheckItem,
  DigitalFormIndexEntry,
  DigitalFormInterviewAnswer,
  DigitalFormRecord,
  DigitalFormTemplate,
  InspectionOverall,
} from "@/lib/types";

const templates: DigitalFormTemplate[] = [
  auditWorkbook as DigitalFormTemplate,
  omsInterview as DigitalFormTemplate,
  corSite as DigitalFormTemplate,
  comprehensive as DigitalFormTemplate,
  dailyInspection as DigitalFormTemplate,
  dailySafety as DigitalFormTemplate,
];

export const digitalFormIndex =
  indexJson.forms as DigitalFormIndexEntry[];

export function getDigitalFormTemplates(): DigitalFormTemplate[] {
  return templates;
}

export function getDigitalFormTemplate(
  id: string
): DigitalFormTemplate | undefined {
  return templates.find((t) => t.id === id);
}

export function blankDigitalChecks(
  template: DigitalFormTemplate
): DigitalFormCheckItem[] {
  return (template.checklist ?? []).map((t) => ({
    id: t.id,
    category: t.category,
    label: t.label,
    guidance: t.guidance,
    result: null,
    note: "",
  }));
}

export function blankDigitalAnswers(
  template: DigitalFormTemplate
): DigitalFormInterviewAnswer[] {
  return (template.questions ?? []).map((q) => ({
    questionId: q.id,
    response: "",
    assessment: null,
    evidenceNotes: "",
  }));
}

export function blankDigitalMeta(
  template: DigitalFormTemplate
): Record<string, string | string[]> {
  const meta: Record<string, string | string[]> = {};
  for (const field of template.metaFields) {
    meta[field.id] = field.type === "multiselect" ? [] : "";
  }
  return meta;
}

export function deriveDigitalOverall(
  checks: DigitalFormCheckItem[]
): InspectionOverall {
  if (checks.length === 0) return "conditional";
  return deriveOverall(
    checks.map((c) => ({
      id: c.id,
      label: c.label,
      result: c.result,
      section: c.category,
    }))
  );
}

export function createDigitalFormId(): string {
  return `df-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function groupDigitalChecks(checks: DigitalFormCheckItem[]) {
  const map = new Map<string, DigitalFormCheckItem[]>();
  for (const check of checks) {
    const list = map.get(check.category) ?? [];
    list.push(check);
    map.set(check.category, list);
  }
  return map;
}

export function checklistProgress(checks: DigitalFormCheckItem[]) {
  const scored = checks.filter((c) => c.result != null).length;
  const fails = checks.filter((c) => c.result === "fail").length;
  const percent =
    checks.length === 0 ? 0 : Math.round((scored / checks.length) * 100);
  return { scored, total: checks.length, fails, percent };
}

export function interviewProgress(answers: DigitalFormInterviewAnswer[]) {
  const answered = answers.filter((a) => a.response.trim().length > 0).length;
  const percent =
    answers.length === 0 ? 0 : Math.round((answered / answers.length) * 100);
  return { answered, total: answers.length, percent };
}

export function formKindLabel(kind: DigitalFormTemplate["kind"]): string {
  if (kind === "interview") return "Interview";
  if (kind === "audit-plan") return "Audit plan";
  return "Checklist";
}

export function seedDigitalForms(): DigitalFormRecord[] {
  return [];
}

/** Map COR document ids / PDF paths to digital form ids */
export const pdfToDigitalFormId: Record<string, string> = {
  "doc-bccsa-workbook": "bccsa-cor-audit-workbook",
  "doc-oms-interview": "oms-worker-interview",
  "doc-cor-site-inspection": "internal-cor-site-inspection",
  "doc-site-inspection-form": "comprehensive-site-inspection",
  "doc-daily-site-inspection": "daily-site-inspection",
  "doc-daily-safety-checklist": "daily-site-safety-checklist",
  "/cor-pdfs/bccsa-cor-internal-audit-workbook.pdf": "bccsa-cor-audit-workbook",
  "/cor-pdfs/oms-worker-interview-guide.pdf": "oms-worker-interview",
  "/cor-pdfs/internal-cor-site-inspection-checklist.pdf":
    "internal-cor-site-inspection",
  "/cor-pdfs/comprehensive-construction-site-inspection.pdf":
    "comprehensive-site-inspection",
  "/cor-pdfs/daily-site-inspection.pdf": "daily-site-inspection",
  "/cor-pdfs/daily-site-safety-checklist.pdf": "daily-site-safety-checklist",
};
