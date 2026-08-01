import type { TeamMember } from "@/lib/types";

/** High-visibility tickets supervisors scan when assigning task crews */
export const TASK_CERT_FILTERS = [
  {
    id: "fall",
    label: "Fall Pro",
    aliases: ["fall protection", "fall arrest"],
  },
  {
    id: "silica",
    label: "Silica Fit",
    aliases: [
      "silica fit test",
      "respirator fit test",
      "fit test silica",
      "n95 fit test",
      "silica respirator",
    ],
  },
  {
    id: "whmis",
    label: "WHMIS",
    aliases: ["whmis"],
  },
  {
    id: "rigging",
    label: "Rigging",
    aliases: ["rigging ticket", "rigging"],
  },
  {
    id: "signal",
    label: "Signal",
    aliases: ["signal person", "signaller"],
  },
  {
    id: "first-aid",
    label: "First Aid",
    aliases: ["first aid", "ofa"],
  },
  {
    id: "confined",
    label: "Confined",
    aliases: ["confined space"],
  },
] as const;

export type TaskCertFilterId = (typeof TASK_CERT_FILTERS)[number]["id"];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[—–-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function shortCertLabel(cert: string): string {
  const n = normalize(cert);
  if (n.includes("fall")) return "Fall Pro";
  if (n.includes("silica") || (n.includes("fit test") && n.includes("respirator"))) {
    if (n.includes("silica")) return "Silica Fit";
    return "Fit Test";
  }
  if (n.includes("fit test")) return "Fit Test";
  if (n.includes("whmis")) return "WHMIS";
  if (n.includes("rigging")) {
    if (n.includes("2")) return "Rigging L2";
    if (n.includes("1")) return "Rigging L1";
    return "Rigging";
  }
  if (n.includes("signal")) return "Signal";
  if (n.includes("first aid") && n.includes("2")) return "FA L2";
  if (n.includes("first aid")) return "FA L1";
  if (n.includes("tower crane")) return "Tower Crane";
  if (n.includes("mobile crane")) return "Mobile Crane";
  if (n.includes("supervisor")) return "Supervisor";
  if (n.includes("site orientation") || n === "orientation") return "Orient";
  if (n.includes("confined")) return "Confined";
  if (n.includes("forklift")) return "Forklift";
  if (n.includes("traffic")) return "Traffic";
  if (n.includes("ncso")) return "NCSO";
  if (n.includes("radio")) return "Radio";
  return cert.length > 18 ? `${cert.slice(0, 16)}…` : cert;
}

export function memberHasCertAliases(
  member: TeamMember,
  aliases: readonly string[]
): boolean {
  const certs = member.certifications.map(normalize);
  return aliases.some((alias) => {
    const a = normalize(alias);
    return certs.some((c) => c === a || c.includes(a) || a.includes(c));
  });
}

export function memberHasTaskCert(
  member: TeamMember,
  filterId: TaskCertFilterId
): boolean {
  const filter = TASK_CERT_FILTERS.find((f) => f.id === filterId);
  if (!filter) return false;
  return memberHasCertAliases(member, filter.aliases);
}

/** Prefer showing task-critical certs first */
export function orderedCertsForDisplay(certs: string[]): string[] {
  const priority = [
    "fall",
    "silica",
    "fit test",
    "rigging",
    "signal",
    "first aid",
    "whmis",
    "confined",
    "crane",
  ];
  return [...certs].sort((a, b) => {
    const na = normalize(a);
    const nb = normalize(b);
    const ia = priority.findIndex((p) => na.includes(p));
    const ib = priority.findIndex((p) => nb.includes(p));
    const sa = ia === -1 ? 99 : ia;
    const sb = ib === -1 ? 99 : ib;
    if (sa !== sb) return sa - sb;
    return a.localeCompare(b);
  });
}

export function isHighlightCert(cert: string): boolean {
  const n = normalize(cert);
  return (
    n.includes("fall") ||
    n.includes("silica") ||
    n.includes("fit test") ||
    n.includes("rigging") ||
    n.includes("signal") ||
    n.includes("confined")
  );
}
