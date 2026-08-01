import corElements from "@/data/cor-elements.json";
import corDocuments from "@/data/cor-documents.json";

export type CoverageLevel = "strong" | "partial" | "gap" | "interview";

export interface CorQuestion {
  id: string;
  text: string;
  maxPoints: number;
}

export interface CorElement {
  id: number;
  code?: string;
  title: string;
  maxPoints: number;
  questions: CorQuestion[];
}

export interface CorDocument {
  id: string;
  title: string;
  category: string;
  status: "current" | "needs-review" | "missing";
  lastReviewed: string;
  owner: string;
  elements: number[];
}

/** Question-level Helix evidence mapping for readiness scoring */
const QUESTION_COVERAGE: Record<
  string,
  { level: CoverageLevel; evidenceIds: string[]; note?: string }
> = {
  // Element 1 — Policy
  "1.1": { level: "partial", evidenceIds: ["doc-hspolicy"], note: "Policy on file — confirm senior signature annually" },
  "1.2": { level: "strong", evidenceIds: ["doc-hspolicy"] },
  "1.3": { level: "strong", evidenceIds: ["doc-hspolicy"] },
  "1.4": { level: "strong", evidenceIds: ["doc-hspolicy"] },
  "1.5": { level: "partial", evidenceIds: ["doc-hspolicy"], note: "Last review Jan 2026 — schedule next annual review" },
  "1.6": { level: "partial", evidenceIds: ["doc-hspolicy", "doc-orient"], note: "Available in orientation package" },
  "1.7": { level: "strong", evidenceIds: ["doc-hspolicy"] },
  "1.8": { level: "strong", evidenceIds: ["doc-hspolicy", "doc-johsc"] },
  "1.9": { level: "interview", evidenceIds: ["doc-orient"], note: "Requires worker interviews at audit" },

  // Element 2 — Hazard assessment (Helix strength)
  "2.1": { level: "strong", evidenceIds: ["feat-flha", "doc-swa"] },
  "2.2": { level: "strong", evidenceIds: ["feat-flha"] },
  "2.3": { level: "strong", evidenceIds: ["feat-flha", "feat-signatures"] },
  "2.4": { level: "strong", evidenceIds: ["feat-flha"] },
  "2.5": { level: "strong", evidenceIds: ["feat-flha"], note: "Severity ranking on hazard cards" },
  "2.6": { level: "strong", evidenceIds: ["doc-lift", "doc-crit", "doc-sjp-rig"] },
  "2.7": { level: "strong", evidenceIds: ["feat-flha"] },
  "2.8": { level: "partial", evidenceIds: ["feat-flha", "feat-dashboard"] },
  "2.9": { level: "strong", evidenceIds: ["feat-flha", "feat-signatures", "doc-tbt"] },
  "2.10": { level: "gap", evidenceIds: [], note: "Subcontractor evaluation process not yet in Helix" },
  "2.11": { level: "partial", evidenceIds: ["feat-flha", "feat-dashboard"] },

  // Element 3 — SWP
  "3.1": { level: "strong", evidenceIds: ["doc-swp-pour", "doc-swp-form"] },
  "3.2": { level: "strong", evidenceIds: ["doc-swp-pour", "doc-swp-form", "feat-flha"] },
  "3.3": { level: "interview", evidenceIds: ["doc-orient", "doc-tbt"] },
  "3.4": { level: "strong", evidenceIds: ["feat-flha", "doc-swp-pour"] },
  "3.5": { level: "interview", evidenceIds: ["feat-flha"] },
  "3.6": { level: "partial", evidenceIds: ["doc-tbt", "doc-swp-form"] },

  // Element 4 — SJP
  "4.1": { level: "strong", evidenceIds: ["doc-sjp-rig"] },
  "4.2": { level: "strong", evidenceIds: ["doc-sjp-rig", "doc-lift", "doc-crit"] },
  "4.3": { level: "interview", evidenceIds: ["doc-orient"] },
  "4.4": { level: "interview", evidenceIds: ["feat-flha"] },
  "4.5": { level: "strong", evidenceIds: ["feat-flha", "doc-sjp-rig"] },
  "4.6": { level: "partial", evidenceIds: ["doc-tbt"] },

  // Element 5 — Rules
  "5.1": { level: "strong", evidenceIds: ["doc-rules"] },
  "5.2": { level: "partial", evidenceIds: ["doc-rules", "doc-orient"] },
  "5.3": { level: "interview", evidenceIds: ["doc-orient"] },
  "5.4": { level: "partial", evidenceIds: ["doc-rules"], note: "Discipline process documented — enforcement records limited" },
  "5.5": { level: "gap", evidenceIds: ["doc-rules"], note: "Need consistent disciplinary record examples" },

  // Element 6 — PPE
  "6.1": { level: "strong", evidenceIds: ["doc-ppe"] },
  "6.2": { level: "strong", evidenceIds: ["doc-ppe", "doc-orient"] },
  "6.3": { level: "interview", evidenceIds: ["doc-ppe"] },
  "6.4": { level: "interview", evidenceIds: ["doc-ppe"] },
  "6.5": { level: "interview", evidenceIds: ["doc-ppe"] },
  "6.6": { level: "partial", evidenceIds: ["doc-ppe", "doc-mfr"] },
  "6.7": { level: "partial", evidenceIds: ["doc-orient", "doc-ppe"] },
  "6.8": { level: "strong", evidenceIds: ["doc-ppe"] },
  "6.9": { level: "partial", evidenceIds: ["feat-equip", "doc-inspect"] },

  // Element 7 — Maintenance
  "7.1": { level: "strong", evidenceIds: ["feat-equip"] },
  "7.2": { level: "partial", evidenceIds: ["doc-mfr", "feat-equip"] },
  "7.3": { level: "strong", evidenceIds: ["feat-equip", "doc-inspect"] },
  "7.4": { level: "partial", evidenceIds: ["feat-equip", "feat-dashboard"] },
  "7.5": { level: "partial", evidenceIds: ["feat-equip"] },
  "7.6": { level: "interview", evidenceIds: ["feat-equip"] },
  "7.7": { level: "partial", evidenceIds: ["doc-mfr"] },

  // Element 8 — Training
  "8.1": { level: "strong", evidenceIds: ["doc-orient"] },
  "8.2": { level: "strong", evidenceIds: ["doc-orient"] },
  "8.3": { level: "partial", evidenceIds: ["doc-orient"] },
  "8.4": { level: "partial", evidenceIds: ["doc-orient"] },
  "8.5": { level: "strong", evidenceIds: ["doc-tbt"] },
  "8.6": { level: "strong", evidenceIds: ["doc-tbt", "feat-flha"] },
  "8.7": { level: "partial", evidenceIds: ["doc-orient"] },
  "8.8": { level: "interview", evidenceIds: ["doc-orient"] },
  "8.9": { level: "partial", evidenceIds: ["doc-tbt"] },
  "8.10": { level: "partial", evidenceIds: ["feat-flha", "doc-tbt"] },
  "8.11": { level: "gap", evidenceIds: [], note: "Formal competency tracking not fully digitized" },
  "8.12": { level: "partial", evidenceIds: ["doc-orient"] },
  "8.13": { level: "interview", evidenceIds: ["doc-tbt"] },
  "8.14": { level: "partial", evidenceIds: ["doc-orient"] },
  "8.15": { level: "partial", evidenceIds: ["doc-tbt", "feat-signatures"] },

  // Element 9 — Inspections
  "9.1": { level: "strong", evidenceIds: ["doc-inspect"] },
  "9.2": { level: "strong", evidenceIds: ["doc-inspect"] },
  "9.3": { level: "strong", evidenceIds: ["feat-equip", "feat-dashboard"] },
  "9.4": { level: "strong", evidenceIds: ["feat-equip"] },
  "9.5": { level: "partial", evidenceIds: ["feat-dashboard"] },
  "9.6": { level: "partial", evidenceIds: ["feat-dashboard"] },
  "9.7": { level: "strong", evidenceIds: ["feat-dashboard"] },
  "9.8": { level: "partial", evidenceIds: ["feat-equip"] },
  "9.9": { level: "interview", evidenceIds: ["doc-inspect"] },
  "9.10": { level: "partial", evidenceIds: ["feat-dashboard"] },

  // Element 10 — Investigations
  "10.1": { level: "partial", evidenceIds: ["doc-invest"], note: "Procedure needs review (last Sep 2025)" },
  "10.2": { level: "partial", evidenceIds: ["doc-invest"] },
  "10.3": { level: "gap", evidenceIds: ["doc-invest"], note: "Investigation case records sparse in Helix" },
  "10.4": { level: "gap", evidenceIds: ["doc-invest"] },
  "10.5": { level: "partial", evidenceIds: ["feat-dashboard"] },
  "10.6": { level: "interview", evidenceIds: ["doc-invest"] },
  "10.7": { level: "partial", evidenceIds: ["doc-invest", "doc-tbt"] },
  "10.8": { level: "gap", evidenceIds: [] },
  "10.9": { level: "partial", evidenceIds: ["feat-dashboard"] },
  "10.10": { level: "partial", evidenceIds: ["doc-invest"] },

  // Element 11 — Emergency
  "11.1": { level: "strong", evidenceIds: ["doc-erp"] },
  "11.2": { level: "strong", evidenceIds: ["doc-erp", "doc-orient"] },
  "11.3": { level: "strong", evidenceIds: ["doc-erp", "feat-flha"] },
  "11.4": { level: "partial", evidenceIds: ["doc-erp"] },
  "11.5": { level: "partial", evidenceIds: ["doc-erp"] },
  "11.6": { level: "interview", evidenceIds: ["doc-erp"] },
  "11.7": { level: "partial", evidenceIds: ["doc-erp"] },
  "11.8": { level: "partial", evidenceIds: ["doc-erp"] },
  "11.9": { level: "gap", evidenceIds: ["doc-erp"], note: "Drill records not yet tracked in Helix" },
  "11.10": { level: "partial", evidenceIds: ["doc-erp"] },

  // Element 12 — Records & stats (Helix strength)
  "12.1": { level: "strong", evidenceIds: ["feat-flha", "feat-timeclock", "feat-dashboard"] },
  "12.2": { level: "strong", evidenceIds: ["feat-dashboard"] },
  "12.3": { level: "strong", evidenceIds: ["feat-flha", "feat-signatures"] },
  "12.4": { level: "strong", evidenceIds: ["feat-dashboard", "feat-timeclock"] },
  "12.5": { level: "strong", evidenceIds: ["feat-dashboard"] },
  "12.6": { level: "partial", evidenceIds: ["feat-dashboard"] },
  "12.7": { level: "strong", evidenceIds: ["feat-flha"] },
  "12.8": { level: "partial", evidenceIds: ["feat-dashboard"] },

  // Element 13 — Legislation
  "13.1": { level: "partial", evidenceIds: ["doc-legislation", "doc-orient"] },
  "13.2": { level: "partial", evidenceIds: ["doc-legislation", "feat-flha"] },
  "13.3": { level: "interview", evidenceIds: ["doc-legislation"] },
  "13.4": { level: "partial", evidenceIds: ["doc-legislation"] },

  // Element 14 — JOHSC
  "14.1": { level: "partial", evidenceIds: ["doc-johsc", "doc-tbt"] },
  "14.2": { level: "strong", evidenceIds: ["doc-johsc"] },
  "14.3": { level: "partial", evidenceIds: ["doc-johsc"] },
  "14.4": { level: "gap", evidenceIds: ["doc-johsc"], note: "Meeting minutes not fully linked" },
  "14.5": { level: "interview", evidenceIds: ["doc-johsc"] },
};

const LEVEL_SCORE: Record<CoverageLevel, number> = {
  strong: 1,
  partial: 0.55,
  interview: 0.35,
  gap: 0,
};

export function getCorConfig() {
  return corElements as {
    source: string;
    passOverallPercent: number;
    passElementPercent: number;
    elements: CorElement[];
  };
}

export function getCorDocuments(): CorDocument[] {
  return corDocuments as CorDocument[];
}

export function docsForElement(elementId: number): CorDocument[] {
  return getCorDocuments().filter((d) => d.elements.includes(elementId));
}

export function coverageForQuestion(questionId: string) {
  return (
    QUESTION_COVERAGE[questionId] ?? {
      level: "gap" as CoverageLevel,
      evidenceIds: [],
      note: "Not yet mapped",
    }
  );
}

export function scoreQuestion(q: CorQuestion) {
  const cov = coverageForQuestion(q.id);
  const awarded = Math.round(q.maxPoints * LEVEL_SCORE[cov.level] * 10) / 10;
  return { ...cov, awarded, maxPoints: q.maxPoints };
}

export function scoreElement(element: CorElement) {
  const questions = element.questions.map((q) => ({
    ...q,
    score: scoreQuestion(q),
  }));
  const awarded = questions.reduce((s, q) => s + q.score.awarded, 0);
  const maxPoints = element.maxPoints || questions.reduce((s, q) => s + q.maxPoints, 0);
  const percent = maxPoints === 0 ? 0 : Math.round((awarded / maxPoints) * 1000) / 10;
  const strong = questions.filter((q) => q.score.level === "strong").length;
  const partial = questions.filter((q) => q.score.level === "partial").length;
  const interview = questions.filter((q) => q.score.level === "interview").length;
  const gaps = questions.filter((q) => q.score.level === "gap").length;
  const docs = docsForElement(element.id);
  const staleDocs = docs.filter((d) => d.status === "needs-review").length;

  return {
    element,
    questions,
    awarded: Math.round(awarded * 10) / 10,
    maxPoints,
    percent,
    strong,
    partial,
    interview,
    gaps,
    docs,
    staleDocs,
    meetsElementMin: percent >= getCorConfig().passElementPercent,
  };
}

export function computeCorReadiness() {
  const config = getCorConfig();
  const elements = config.elements.map(scoreElement);
  const awarded = elements.reduce((s, e) => s + e.awarded, 0);
  const maxPoints = elements.reduce((s, e) => s + e.maxPoints, 0);
  const percent = maxPoints === 0 ? 0 : Math.round((awarded / maxPoints) * 1000) / 10;
  const docs = getCorDocuments();
  const currentDocs = docs.filter((d) => d.status === "current").length;
  const needsReview = docs.filter((d) => d.status === "needs-review").length;
  const failingElements = elements.filter((e) => !e.meetsElementMin);
  const gapQuestions = elements.flatMap((e) =>
    e.questions.filter((q) => q.score.level === "gap")
  );

  return {
    config,
    elements,
    awarded: Math.round(awarded * 10) / 10,
    maxPoints,
    percent,
    passesOverall: percent >= config.passOverallPercent,
    passesAllElements: failingElements.length === 0,
    failingElements,
    docs,
    currentDocs,
    needsReview,
    gapQuestions,
    auditReady:
      percent >= config.passOverallPercent && failingElements.length === 0,
  };
}
