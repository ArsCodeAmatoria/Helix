import binderData from "@/data/bc-crane-binder.json";
import { db, getEquipment, getProject } from "@/lib/db";
import type {
  BcCraneBinderItemStatus,
  BcCraneBinderMeta,
  BcCraneBinderPartyId,
  BcCraneBinderState,
} from "@/lib/types";

export const bcCraneBinder = binderData as BcCraneBinderMeta;

export function allBinderItemIds(): string[] {
  return bcCraneBinder.sections.flatMap((s) => s.items.map((i) => i.id));
}

export function createEmptyBinderState(): BcCraneBinderState {
  const items: BcCraneBinderState["items"] = {};
  for (const id of allBinderItemIds()) {
    items[id] = { status: null, partyId: null, notes: "" };
  }
  return {
    siteAddress: "",
    meetingDate: new Date().toISOString().slice(0, 10),
    activitySupervisor: "",
    contractor: "",
    craneMake: "",
    craneModel: "",
    craneSerial: "",
    items,
    sectionNotes: {},
    otherDocs: ["", "", ""],
    signOffs: Object.fromEntries(
      bcCraneBinder.signOffRoles.map((r) => [
        r.id,
        { company: "", phone: "", printName: "", confirmed: false },
      ])
    ),
    updatedAt: null,
  };
}

/** Demo seed — Oceanview TC-1 binder filled from Helix project / equipment data */
export function seedBinderState(): BcCraneBinderState {
  const base = createEmptyBinderState();
  const project = getProject("proj-oceanview") ?? db.projects[0];
  const crane = getEquipment("eq-tc1");
  const company = db.company;

  const present = (
    id: string,
    party: BcCraneBinderPartyId = "prime",
    notes = ""
  ) => {
    base.items[id] = { status: "present", partyId: party, notes };
  };
  const na = (id: string, notes = "") => {
    base.items[id] = { status: "na", partyId: "na", notes };
  };
  const missing = (id: string, notes = "") => {
    base.items[id] = { status: "missing", partyId: null, notes };
  };

  const address = project
    ? `${project.name.split("—")[0].trim()} — ${project.address}, ${project.city}, ${project.province}`
    : "Oceanview Tower — 1288 Cordova St, Vancouver, BC";

  base.siteAddress = address;
  base.meetingDate = new Date().toISOString().slice(0, 10);
  base.activitySupervisor = "Dave Okonkwo";
  base.contractor = project?.primeContractor
    ? `${company.name} (crane user) / ${project.primeContractor} (prime)`
    : company.name;
  base.craneMake = crane?.manufacturer ?? "Potain";
  base.craneModel = crane?.model ?? "MD 365 B L16";
  base.craneSerial = crane?.assetTag ? `${crane.assetTag}-OV-2026` : "TC-1-OV-2026";

  // Pre-assembly — Helix Oceanview package
  present(
    "1",
    "prime",
    "NAV CANADA land-use submission filed for Oceanview TC-1 (Cordova St)."
  );
  present(
    "2",
    "prime",
    "Aeronautical assessment on file — St. Paul's helipad / YVR approach review."
  );
  present(
    "3",
    "prime",
    "30M33 assurance for east-elevation overhead lines — Rev B in binder drawer A."
  );
  na("4", "No TransLink TOH conflict for this erection sequence.");
  present(
    "5",
    "prime",
    "Site power 480V — City of Vancouver electrical permit + FSR install package."
  );
  present(
    "6",
    "prime",
    `NOP-TC submitted for ${project?.projectNumber ?? "HX-2026-0847"} — WorkSafeBC tower crane project type.`
  );
  present(
    "7",
    "owner",
    "Engineer site layout Rev C — dual Potain radii (TC-1 MD 365 / TC-2 MR 615) with overlap clearances."
  );
  present(
    "8",
    "prime",
    "IFC foundation package + geotech + cylinder breaks ≥ manufacturer MPa — filed under Foundation."
  );
  present(
    "9",
    "supervisor",
    "Pre-assembly meeting completed in site trailer — FM-TC-01 walkthrough with all parties."
  );
  present(
    "10",
    "prime",
    "THARRP / VFRS high-angle rescue acknowledgment on file for tower cab rescue."
  );
  present(
    "11",
    "prime",
    "Municipal TMP + street-use permit #SU-2026-441 (Cordova staging)."
  );
  missing(
    "12",
    "WorkSafeBC RF Coordination Request pending — radio Ch 3 Tower Ops confirmation."
  );
  present(
    "13",
    "owner",
    "Pre-erect NDT report current (<12 mo) — Pacific Crane Supply package."
  );
  na("14", "No WorkSafeBC variance required for this configuration.");
  na("15", "No non-OEM surface additions (signage / banners) installed.");
  present(
    "16",
    "owner",
    "Potain MD 365 B L16 crane-specific manual on site — cab + trailer copy."
  );
  present(
    "17",
    "owner",
    "Load chart posted in cab — Helix PDF: /crane-pdfs/potain-md365-data-sheet.pdf"
  );
  present(
    "18",
    "owner",
    "CSA Z248 compliance / certification report with panel sticker photos."
  );
  na("19", "No assist mobile crane for this TC-1 climb sequence.");
  present(
    "20",
    "supervisor",
    "Activity supervisor visual component inspection complete prior to erect."
  );
  na("21", "Derrick not used.");
  na("22", "Climbing package N/A until first climb window.");

  // Zoning
  na("23", "Single-crane primary ops today — zoning package staged for TC-2 overlap.");
  na("24", "Anti-collision to be commissioned before TC-2 overlap resumes.");

  // Ropes & test blocks
  present("25", "owner", "Hoist rope mill certificate in Ropes tab.");
  na("26", "Rotation-resistant rope shortening schedule N/A for installed rope type.");
  present("27", "user", "Annual chain sling / rigging certs — Helix equipment log.");
  present("28", "owner", "Manufacturer test block weights marked and certificates filed.");
  na("29", "No HLL system on this crane configuration.");

  // BTH
  na("30", "DEP box not used this phase.");
  present("31", "user", "BTH devices NDT + capacity plates — Helix inspections hub.");

  // Procedures
  present(
    "32",
    "supervisor",
    "Site-specific assembly/disassembly written procedures signed by erect crew."
  );
  present(
    "33",
    "supervisor",
    "Activity supervisor Dave Okonkwo + lead hand qualifications on NOP-TC package."
  );
  present(
    "34",
    "supervisor",
    "SWP assembly/disassembly — fall protection, LOA, lockout (Helix forms library)."
  );
  present(
    "35",
    "user",
    "SWP operation & maintenance — operator/maintenance fall-pro plans on file."
  );
  present(
    "36",
    "prime",
    `ERP posted — muster ${project?.musterPoint ?? "NW Cordova & Abbott"}; hospital ${project?.nearestHospital ?? "St. Paul's"}.`
  );

  // Post assembly
  present("37", "owner", "Construction site tower crane / erectors report filed.");
  present("38", "owner", "Preventive maintenance schedule booked with Pacific Crane Supply.");
  missing(
    "39",
    "Post-install mast bolt retorque due after first climb — schedule with supervisor."
  );
  present("40", "user", "Operator orientation complete — Alex Nguyen / Nina Wallace.");
  present(
    "41",
    "user",
    "Operator certification + separate proof of qualification on Helix team profiles."
  );
  present(
    "42",
    "user",
    "Daily / shift inspection logs in Helix crane inspection log book."
  );
  na("43", "No repositioning since original install.");

  base.sectionNotes = {
    "pre-assembly":
      "Oceanview pre-assembly package in binder drawer A. RF coordination (#12) still open before next climb.",
    zoning: "TC-2 overlap zoning/anti-collision to commission before dual-crane ops.",
    ropes: "Mill certs + test block docs from owner package.",
    bth: "BTH devices tracked in Helix inspections.",
    procedures: "Site SWPs aligned to Helix FLHA / ERP / lift plan docs.",
    "post-assembly":
      "Retorque (#39) outstanding. Operator logs live in Helix inspections hub.",
  };

  base.otherDocs = [
    "Site-specific swing radius drawing Rev C (TC-1 / TC-2)",
    "Municipal street use permit #SU-2026-441",
    `Helix project ${project?.projectNumber ?? "HX-2026-0847"} — required docs: SWP pour, SJP rigging, ERP, orientation`,
  ];

  base.signOffs = {
    owner: {
      company: "Pacific Crane Supply",
      phone: "604-555-0101",
      printName: "Elena Vasquez",
      confirmed: true,
    },
    prime: {
      company: project?.primeContractor ?? "Summit Builders Inc.",
      phone: project?.emergencyContact?.split(" ")[0] ?? "604-555-2211",
      printName: project?.projectManager ?? "Sarah Mitchell",
      confirmed: true,
    },
    supervisor: {
      company: company.name,
      phone: "604-555-0188",
      printName: "Dave Okonkwo",
      confirmed: false,
    },
    user: {
      company: company.name,
      phone: company.phone,
      printName: "Alex Nguyen",
      confirmed: true,
    },
    mobile: {
      company: "N/A — assist mobile crane not required this sequence",
      phone: "",
      printName: "",
      confirmed: false,
    },
  };
  base.updatedAt = new Date().toISOString();
  return base;
}

export function binderProgress(state: BcCraneBinderState): {
  total: number;
  answered: number;
  present: number;
  missing: number;
  na: number;
  percent: number;
  complete: boolean;
} {
  const ids = allBinderItemIds();
  let present = 0;
  let missing = 0;
  let na = 0;
  let answered = 0;
  for (const id of ids) {
    const status = state.items[id]?.status ?? null;
    if (!status) continue;
    answered += 1;
    if (status === "present") present += 1;
    else if (status === "missing") missing += 1;
    else na += 1;
  }
  const total = ids.length;
  return {
    total,
    answered,
    present,
    missing,
    na,
    percent: total === 0 ? 0 : Math.round((answered / total) * 100),
    complete: answered === total && missing === 0,
  };
}

export function cycleItemStatus(
  current: BcCraneBinderItemStatus
): BcCraneBinderItemStatus {
  if (current === null) return "present";
  if (current === "present") return "missing";
  if (current === "missing") return "na";
  return null;
}
