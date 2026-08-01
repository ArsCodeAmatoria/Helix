import reqData from "@/data/cor-worker-requirements.json";
import { members } from "@/lib/team";
import type { TeamMember, TeamMemberRole } from "@/lib/types";

export interface WorkerRequirement {
  id: string;
  name: string;
  category: string;
  description: string;
  aliases: string[];
}

export interface RequirementStatus {
  requirement: WorkerRequirement;
  met: boolean;
  matchedCertification: string | null;
}

export interface WorkerCompliance {
  member: TeamMember;
  required: RequirementStatus[];
  met: RequirementStatus[];
  missing: RequirementStatus[];
  metCount: number;
  requiredCount: number;
  percent: number;
  compliant: boolean;
}

export interface CrewComplianceSummary {
  workers: WorkerCompliance[];
  compliantCount: number;
  nonCompliantCount: number;
  totalMissing: number;
  percentCompliant: number;
  source: string;
}

type TradeOverride = {
  replace?: string[];
  with?: string[];
  add?: string[];
};

const requirements = reqData.requirements as WorkerRequirement[];
const roleRequirements = reqData.roleRequirements as Record<
  string,
  string[]
>;
const tradeOverrides = reqData.tradeOverrides as Record<string, TradeOverride>;

const requirementById = new Map(requirements.map((r) => [r.id, r]));

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[—–-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function certMatchesRequirement(
  certifications: string[],
  requirement: WorkerRequirement
): string | null {
  const aliases = requirement.aliases.map(normalize);
  for (const cert of certifications) {
    const n = normalize(cert);
    if (
      aliases.some(
        (alias) => n === alias || n.includes(alias) || alias.includes(n)
      )
    ) {
      return cert;
    }
  }
  return null;
}

export function getWorkerRequirementCatalog(): WorkerRequirement[] {
  return requirements;
}

export function requirementIdsForMember(member: TeamMember): string[] {
  const base = [
    ...(roleRequirements[member.role] ??
      roleRequirements.Worker ??
      []),
  ];

  const override = tradeOverrides[member.trade];
  if (!override) return Array.from(new Set(base));

  let next = [...base];
  if (override.replace?.length && override.with?.length) {
    const remove = new Set(override.replace);
    next = next.filter((id) => !remove.has(id));
    next.push(...override.with);
  }
  if (override.add?.length) {
    next.push(...override.add);
  }
  return Array.from(new Set(next));
}

export function scoreWorkerCompliance(member: TeamMember): WorkerCompliance {
  const ids = requirementIdsForMember(member);
  const required: RequirementStatus[] = ids
    .map((id) => requirementById.get(id))
    .filter((r): r is WorkerRequirement => Boolean(r))
    .map((requirement) => {
      const matched = certMatchesRequirement(
        member.certifications,
        requirement
      );
      return {
        requirement,
        met: Boolean(matched),
        matchedCertification: matched,
      };
    });

  const met = required.filter((r) => r.met);
  const missing = required.filter((r) => !r.met);
  const requiredCount = required.length;
  const metCount = met.length;
  const percent =
    requiredCount === 0 ? 100 : Math.round((metCount / requiredCount) * 100);

  return {
    member,
    required,
    met,
    missing,
    metCount,
    requiredCount,
    percent,
    compliant: missing.length === 0,
  };
}

export function computeWorkerCompliance(
  memberList: TeamMember[] = members
): CrewComplianceSummary {
  const workers = memberList
    .map(scoreWorkerCompliance)
    .sort((a, b) => {
      if (a.compliant !== b.compliant) return a.compliant ? 1 : -1;
      if (a.missing.length !== b.missing.length) {
        return b.missing.length - a.missing.length;
      }
      return a.member.name.localeCompare(b.member.name);
    });

  const compliantCount = workers.filter((w) => w.compliant).length;
  const nonCompliantCount = workers.length - compliantCount;
  const totalMissing = workers.reduce((sum, w) => sum + w.missing.length, 0);

  return {
    workers,
    compliantCount,
    nonCompliantCount,
    totalMissing,
    percentCompliant:
      workers.length === 0
        ? 100
        : Math.round((compliantCount / workers.length) * 100),
    source: reqData.source,
  };
}

export function requirementsForRole(role: TeamMemberRole): WorkerRequirement[] {
  const ids = roleRequirements[role] ?? roleRequirements.Worker ?? [];
  return ids
    .map((id) => requirementById.get(id))
    .filter((r): r is WorkerRequirement => Boolean(r));
}
