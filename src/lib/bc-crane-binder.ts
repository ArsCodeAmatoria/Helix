import binderData from "@/data/bc-crane-binder.json";
import { db, getEquipment, getProject } from "@/lib/db";
import type {
  BcCraneBinderCatalog,
  BcCraneBinderItemStatus,
  BcCraneBinderPack,
  BcCraneBinderPackId,
  BcCraneBinderPartyId,
  BcCraneBinderState,
} from "@/lib/types";

export const bcCraneCatalog = binderData as BcCraneBinderCatalog;

export function getBinderPack(
  packId: BcCraneBinderPackId = "tower"
): BcCraneBinderPack {
  return (
    bcCraneCatalog.packs.find((p) => p.id === packId) ??
    bcCraneCatalog.packs[0]
  );
}

/** Default / tower pack — most call sites use the active pack from provider */
export const bcCraneBinder = getBinderPack("tower");

export function allBinderItemIds(pack: BcCraneBinderPack): string[] {
  return pack.sections.flatMap((s) => s.items.map((i) => i.id));
}

export function allBinderForms() {
  return bcCraneCatalog.packs.flatMap((p) =>
    p.forms.map((f) => ({ ...f, packId: p.id, packLabel: p.label }))
  );
}

export function createEmptyBinderState(
  packId: BcCraneBinderPackId = "tower"
): BcCraneBinderState {
  const pack = getBinderPack(packId);
  const items: BcCraneBinderState["items"] = {};
  for (const id of allBinderItemIds(pack)) {
    items[id] = { status: null, partyId: null, notes: "" };
  }
  return {
    packId,
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
      pack.signOffRoles.map((r) => [
        r.id,
        { company: "", phone: "", printName: "", confirmed: false },
      ])
    ),
    updatedAt: null,
  };
}

/** Demo seed — Oceanview filled from Helix project / equipment data */
export function seedBinderState(
  packId: BcCraneBinderPackId = "tower"
): BcCraneBinderState {
  const pack = getBinderPack(packId);
  const base = createEmptyBinderState(packId);
  const project = getProject("proj-oceanview") ?? db.projects[0];
  const crane =
    packId === "self-erect"
      ? getEquipment("eq-tc1") // prototype: same site; self-erect charts also available
      : getEquipment("eq-tc1");
  const company = db.company;

  const present = (
    id: string,
    party: BcCraneBinderPartyId = "prime",
    notes = ""
  ) => {
    if (!base.items[id]) return;
    base.items[id] = { status: "present", partyId: party, notes };
  };
  const na = (id: string, notes = "") => {
    if (!base.items[id]) return;
    base.items[id] = { status: "na", partyId: "na", notes };
  };
  const missing = (id: string, notes = "") => {
    if (!base.items[id]) return;
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

  if (packId === "self-erect") {
    base.craneMake = "Potain";
    base.craneModel = "HDT 80";
    base.craneSerial = "SETC-OV-HDT80-2026";
  } else {
    base.craneMake = crane?.manufacturer ?? "Potain";
    base.craneModel = crane?.model ?? "MD 365 B L16";
    base.craneSerial = crane?.assetTag
      ? `${crane.assetTag}-OV-2026`
      : "TC-1-OV-2026";
  }

  // Shared early pre-assembly items (ids align across packs for 1–9)
  present(
    "1",
    "prime",
    "NAV CANADA land-use submission filed for Oceanview crane activity."
  );
  present(
    "2",
    "prime",
    "Aeronautical assessment on file — St. Paul's helipad / YVR approach review."
  );
  present(
    "3",
    "prime",
    "30M33 assurance for east-elevation overhead lines — Rev B in binder."
  );
  na("4", "No TransLink TOH conflict for this sequence.");
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
    packId === "self-erect"
      ? "Self-erect site layout / radii package Rev B on file."
      : "Engineer site layout Rev C — dual Potain radii with overlap clearances."
  );
  present(
    "8",
    "prime",
    packId === "self-erect"
      ? "Foundation / shoring / geotech package for self-erect pad — IFC on file."
      : "IFC foundation package + geotech + cylinder breaks ≥ manufacturer MPa."
  );
  present(
    "9",
    "supervisor",
    `Pre-assembly meeting completed — ${pack.docNumber} walkthrough with all parties.`
  );

  if (packId === "tower") {
    present("10", "prime", "THARRP / VFRS high-angle rescue acknowledgment on file.");
    present("11", "prime", "Municipal TMP + street-use permit #SU-2026-441.");
    missing(
      "12",
      "WorkSafeBC RF Coordination Request pending — radio Ch 3 Tower Ops."
    );
    present("13", "owner", "Pre-erect NDT report current (<12 mo).");
    na("14", "No WorkSafeBC variance required.");
    na("15", "No non-OEM surface additions installed.");
    present("16", "owner", "Crane-specific manual on site — cab + trailer copy.");
    present(
      "17",
      "owner",
      "Load chart posted — Helix PDF: /crane-pdfs/potain-md365-data-sheet.pdf"
    );
    present("18", "owner", "CSA Z248 compliance / certification report on file.");
    na("19", "No assist mobile crane for this TC-1 climb sequence.");
    present("20", "supervisor", "Activity supervisor visual component inspection complete.");
    na("21", "Derrick not used.");
    na("22", "Climbing package N/A until first climb window.");
    na("23", "Zoning staged for TC-2 overlap.");
    na("24", "Anti-collision to commission before dual-crane ops.");
    present("25", "owner", "Hoist rope mill certificate in Ropes tab.");
    na("26", "Rotation-resistant rope shortening schedule N/A.");
    present("27", "user", "Annual chain sling / rigging certs — Helix equipment log.");
    present("28", "owner", "Manufacturer test block weights marked and certificates filed.");
    na("29", "No HLL system on this crane configuration.");
    na("30", "DEP box not used this phase.");
    present("31", "user", "BTH devices NDT + capacity plates — Helix inspections hub.");
    present("32", "supervisor", "Site-specific assembly/disassembly procedures signed.");
    present("33", "supervisor", "Activity supervisor + lead hand qualifications on NOP-TC.");
    present("34", "supervisor", "SWP assembly/disassembly on file.");
    present("35", "user", "SWP operation & maintenance on file.");
    present(
      "36",
      "prime",
      `ERP posted — muster ${project?.musterPoint ?? "NW Cordova & Abbott"}.`
    );
    present("37", "owner", "Construction site tower crane / erectors report filed.");
    present("38", "owner", "Preventive maintenance schedule booked.");
    missing("39", "Post-install mast bolt retorque due after first climb.");
    present("40", "user", "Operator orientation complete.");
    present("41", "user", "Operator certification + proof of qualification on file.");
    present("42", "user", "Inspection logs in Helix crane inspection log book.");
    na("43", "No repositioning since original install.");

    base.sectionNotes = {
      "pre-assembly":
        "Oceanview pre-assembly package in binder drawer A. RF coordination (#12) still open.",
      zoning: "TC-2 overlap zoning/anti-collision to commission before dual-crane ops.",
      "post-assembly": "Retorque (#39) outstanding.",
    };
    base.otherDocs = [
      "Site-specific swing radius drawing Rev C (TC-1 / TC-2)",
      "Municipal street use permit #SU-2026-441",
      `Helix project ${project?.projectNumber ?? "HX-2026-0847"} required docs package`,
    ];
  } else {
    // Self-erect item map (FM-SETC-01)
    present("10", "prime", "Municipal TMP + street-use permit #SU-2026-441.");
    missing("11", "RF Coordination Request pending for self-erect radio set.");
    present(
      "12",
      "owner",
      "Annual visual + NDT certification current; counterweight marks in erectors report."
    );
    na("13", "No WorkSafeBC variance required.");
    na("14", "No surface additions (HLL / banners) this setup.");
    present("15", "owner", "Potain HDT 80 crane-specific manual on site.");
    present(
      "16",
      "owner",
      "Load chart available at controls — Helix PDF: /crane-pdfs/potain-hdt80-product-guide.pdf"
    );
    present("17", "owner", "CSA compliance / certification report on file.");
    present("18", "supervisor", "Component visual inspection complete before erect.");
    present(
      "19",
      "mobile",
      "Assist mobile crane annual inspection + ground conditions package filed."
    );
    present("20", "prime", "THARRP / high-angle rescue acknowledgment on file.");
    na("21", "Derrick not used.");
    na("22", "Climbing N/A for this self-erect configuration.");
    na("23", "No zoning system required this phase.");
    na("24", "No anti-collision system required this phase.");
    present("25", "owner", "Hoist rope mill certificate filed.");
    na("26", "Hoist rope shortening record N/A for installed rope type.");
    present("27", "user", "Rigging certification documentation current.");
    present("28", "owner", "Test block documentation on file.");
    present("29", "user", "BTH lifting devices documentation current.");
    na("30", "DEP box / platforms N/A this phase.");
    present("31", "supervisor", "Site-specific assembly/disassembly procedures signed.");
    present("32", "supervisor", "Activity supervisor + lead hand qualifications on NOP-TC.");
    present("33", "supervisor", "SWP assembly/disassembly on file.");
    present("34", "user", "SWP operation & maintenance on file.");
    present(
      "35",
      "prime",
      `ERP posted — muster ${project?.musterPoint ?? "NW Cordova & Abbott"}.`
    );
    present("36", "owner", "Construction site tower crane / erectors report filed.");
    present("37", "owner", "Preventive maintenance schedule booked.");
    present("38", "user", "Operator orientation complete.");
    present("39", "user", "Operator certification + proof of qualification on file.");
    present("40", "user", "Inspection logs available to operator and WorkSafeBC.");

    base.sectionNotes = {
      "pre-assembly":
        "Self-erect Oceanview package — RF (#11) still open before sustained ops.",
      procedures: "Assembly SWPs signed by erect crew.",
      "post-assembly": "Operator orientation and logs complete.",
    };
    base.otherDocs = [
      "Self-erect counterweight / ballast mark sheet",
      "Municipal street use permit #SU-2026-441",
      "Potain HDT 80 product guide (Helix crane charts)",
    ];
  }

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
      printName: packId === "self-erect" ? "Jordan Lee" : "Alex Nguyen",
      confirmed: true,
    },
    mobile: {
      company:
        packId === "self-erect"
          ? "Coastal Mobile Cranes — assist erect"
          : "N/A — assist mobile crane not required this sequence",
      phone: packId === "self-erect" ? "604-555-0177" : "",
      printName: packId === "self-erect" ? "Mike Tanaka" : "",
      confirmed: packId === "self-erect",
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
  const pack = getBinderPack(state.packId);
  const ids = allBinderItemIds(pack);
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
