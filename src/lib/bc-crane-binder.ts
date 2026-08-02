import binderData from "@/data/bc-crane-binder.json";
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

/** Demo seed — Oceanview TC-1 binder mostly complete for pre-assembly */
export function seedBinderState(): BcCraneBinderState {
  const base = createEmptyBinderState();
  const present = (id: string, party: BcCraneBinderPartyId = "prime") => {
    base.items[id] = { status: "present", partyId: party, notes: "" };
  };
  const na = (id: string) => {
    base.items[id] = { status: "na", partyId: "na", notes: "" };
  };
  const missing = (id: string) => {
    base.items[id] = { status: "missing", partyId: null, notes: "" };
  };

  base.siteAddress = "Oceanview Tower — 1288 Pacific Blvd, Vancouver";
  base.meetingDate = new Date().toISOString().slice(0, 10);
  base.activitySupervisor = "Dave Okonkwo";
  base.contractor = "Helix Construction Ltd.";
  base.craneMake = "Liebherr";
  base.craneModel = "280 EC-H 12 Litronic";
  base.craneSerial = "TC-1-OV-280";

  for (const id of [
    "1",
    "2",
    "3",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "16",
    "17",
    "18",
    "20",
    "25",
    "27",
    "28",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "38",
    "40",
    "41",
    "42",
  ]) {
    present(id, id === "16" || id === "17" || id === "20" ? "owner" : "prime");
  }
  for (const id of ["4", "14", "15", "19", "21", "22", "23", "24", "26", "29", "30", "39", "43"]) {
    na(id);
  }
  missing("42"); // leave inspections log as attention item in seed? Actually already present - let me leave a couple missing for demo
  // Override a couple as gaps for realism
  base.items["12"] = {
    status: "missing",
    partyId: null,
    notes: "RF coordination pending from city",
  };
  base.items["39"] = {
    status: "missing",
    partyId: "supervisor",
    notes: "Mast bolt retorque schedule after first climb",
  };

  base.sectionNotes = {
    "pre-assembly": "Pre-assembly meeting held on site trailer — package in binder drawer A.",
    "post-assembly": "Retorque and RF items still open before next climb.",
  };
  base.otherDocs = [
    "Site-specific swing radius drawing Rev C",
    "Municipal street use permit #SU-2026-441",
    "",
  ];
  base.signOffs = {
    owner: {
      company: "Pacific Crane Supply",
      phone: "604-555-0101",
      printName: "Elena Vasquez",
      confirmed: true,
    },
    prime: {
      company: "Helix Construction Ltd.",
      phone: "604-555-0199",
      printName: "Sarah Mitchell",
      confirmed: true,
    },
    supervisor: {
      company: "Helix Construction Ltd.",
      phone: "604-555-0188",
      printName: "Dave Okonkwo",
      confirmed: false,
    },
    user: {
      company: "Helix Construction Ltd.",
      phone: "604-555-0162",
      printName: "Alex Nguyen",
      confirmed: true,
    },
    mobile: {
      company: "N/A — self-erect assist not required",
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
