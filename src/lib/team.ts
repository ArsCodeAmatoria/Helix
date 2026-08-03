import teamData from "@/data/team.json";
import type { CrewTeam, TeamMember, TeamMemberRole, SignerRole } from "@/lib/types";

export const crews = teamData.crews as CrewTeam[];
export const members = teamData.members as TeamMember[];

export function getCrew(id: string): CrewTeam | undefined {
  return crews.find((c) => c.id === id);
}

export function getMember(id: string): TeamMember | undefined {
  return members.find((m) => m.id === id);
}

export function getCrewMembers(crewId: string): TeamMember[] {
  const crew = getCrew(crewId);
  if (!crew) return [];
  return crew.memberIds
    .map((id) => getMember(id))
    .filter((m): m is TeamMember => Boolean(m));
}

export function getMemberCrews(memberId: string): CrewTeam[] {
  return crews.filter((c) => c.memberIds.includes(memberId));
}

export function searchMembers(
  query: string,
  options?: { crewId?: string; memberIds?: string[]; directory?: boolean }
): TeamMember[] {
  const q = query.trim().toLowerCase();
  let pool = members;
  if (options?.directory) {
    pool = members;
  } else if (options?.crewId) {
    pool = getCrewMembers(options.crewId);
  } else if (options?.memberIds) {
    const set = new Set(options.memberIds);
    pool = members.filter((m) => set.has(m.id));
  }
  if (!q) return pool;
  return pool.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.employeeNumber.includes(q) ||
      m.role.toLowerCase().includes(q) ||
      m.trade.toLowerCase().includes(q) ||
      m.certifications.some((c) => c.toLowerCase().includes(q)) ||
      getMemberCrews(m.id).some((c) => c.name.toLowerCase().includes(q))
  );
}

export function memberToSignerRole(role: TeamMemberRole): SignerRole {
  const map: Partial<Record<TeamMemberRole, SignerRole>> = {
    Supervisor: "Supervisor",
    "Safety Coordinator": "Safety Coordinator",
    Rigger: "Rigger",
    "Crane Operator": "Crane Operator",
    "Formwork Carpenter": "Crew Member",
    Labourer: "Crew Member",
    Apprentice: "Crew Member",
    Worker: "Worker",
    "Crew Member": "Crew Member",
  };
  return map[role] ?? "Crew Member";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Resolve the logged-in worker to their team directory member */
export function getCurrentMember(
  worker: { memberId?: string; employeeNumber: string; name: string }
): TeamMember | undefined {
  if (worker.memberId) {
    const byId = getMember(worker.memberId);
    if (byId) return byId;
  }
  return (
    members.find((m) => m.employeeNumber === worker.employeeNumber) ??
    members.find((m) => m.name === worker.name)
  );
}

/** Union of worker profile certs + team directory certs */
export function mergedCertifications(
  workerCerts: string[],
  member?: TeamMember
): string[] {
  return Array.from(
    new Set([...(member?.certifications ?? []), ...workerCerts])
  );
}
