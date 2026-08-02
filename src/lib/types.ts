export type Role =
  | "Tower Crane Operator"
  | "Rigger"
  | "Formwork Carpenter"
  | "Carpenter"
  | "Yard Worker"
  | "Labourer"
  | "Supervisor"
  | "Apprentice";

export type TaskCategory = "FORMWORK" | "RIGGER" | "TOWER CRANE";

export type ProjectStatus = "active" | "pending" | "completed" | "on-hold";

export type WeatherCondition =
  | "Clear"
  | "Partly Cloudy"
  | "Cloudy"
  | "Rain"
  | "Snow"
  | "Windy"
  | "Fog";

export interface Company {
  id: string;
  name: string;
  shortName: string;
  phone: string;
  address: string;
}

export interface Worker {
  id: string;
  name: string;
  employeeNumber: string;
  trade: string;
  roles: Role[];
  defaultRole: Role;
  supervisor: string;
  crew: string;
  phone: string;
  certifications: string[];
}

export interface Project {
  id: string;
  name: string;
  projectNumber: string;
  client: string;
  primeContractor: string;
  address: string;
  city: string;
  province: string;
  projectManager: string;
  superintendent: string;
  safetyCoordinator: string;
  emergencyContact: string;
  nearestHospital: string;
  musterPoint: string;
  radioChannel: string;
  siteHazards: string[];
  assignedEquipment: string[];
  requiredDocuments: string[];
  crewAssigned: string[];
  status: ProjectStatus;
  weather: WeatherCondition;
  temperature: number;
  recent: boolean;
  assignedToday: boolean;
}

export interface Task {
  id: string;
  label: string;
  category: TaskCategory;
  hazardIds: string[];
  triggersLadder?: boolean;
  equipmentHints?: string[];
}

export interface Hazard {
  id: string;
  title: string;
  controls: string[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  assetTag: string;
  status: "in-service" | "out-of-service" | "maintenance";
  lastInspection: string;
  manufacturer?: string;
  model?: string;
  chartIds?: string[];
}

export interface CraneLoadChart {
  id: string;
  manufacturer: "Liebherr" | "Potain" | "Terex" | string;
  model: string;
  title: string;
  type: string;
  file: string;
  pagesNote: string;
  equipmentIds: string[];
  source: string;
}

export interface DocumentReviewQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Index into options */
  correctIndex: number;
  /** Why the correct answer is right — shown after the worker answers */
  explanation: string;
}

export interface SafeWorkDocument {
  id: string;
  title: string;
  type: string;
  category: "SWP" | "SJP" | "Other";
  shortTitle: string;
  version: string;
  lastUpdated: string;
  owner: string;
  summary: string;
  purpose: string;
  scope: string;
  roles: string[];
  ppe: string[];
  hazards: string[];
  steps: string[];
  emergency: string[];
  references: string[];
  /** Comprehension check — prove review by answering; shows answer + why */
  reviewQuestions: DocumentReviewQuestion[];
}

export interface DocumentReviewRecord {
  documentId: string;
  completedAt: string;
  score: number;
  total: number;
}

export interface DashboardStats {
  outstandingDeficiencies: number;
  openCorrectiveActions: number;
  todaysFlhas: number;
  pendingReviews: number;
  equipmentOutOfService: number;
  weatherAlerts: number;
  upcomingInspections: number;
}

export interface Deficiency {
  id: string;
  title: string;
  projectId: string;
  severity: "low" | "medium" | "high";
  dueDate: string;
  status: "open" | "in-progress" | "closed";
  description: string;
  location: string;
  reportedBy: string;
  assignee: string;
  href: string;
  cta: string;
  bullets: string[];
}

export interface CorrectiveAction {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  projectId: string;
  status: "open" | "in-progress" | "closed";
  priority: "low" | "medium" | "high";
  description: string;
  href: string;
  cta: string;
  bullets: string[];
}

export interface WeatherAlert {
  id: string;
  title: string;
  body: string;
  severity: "low" | "medium" | "high";
  projectId: string;
  issuedAt: string;
  expiresAt: string;
  description: string;
  href: string;
  cta: string;
  bullets: string[];
}

export interface UpcomingInspection {
  id: string;
  title: string;
  date: string;
  projectId: string;
  equipmentId?: string;
  inspector: string;
  type: string;
  description: string;
  href: string;
  cta: string;
  bullets: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "alert" | "info" | "action" | "weather";
  read: boolean;
  href: string;
  cta: string;
  postedBy: string;
  projectId?: string;
  detail: string;
  bullets?: string[];
}

export interface AdditionalHazard {
  id: string;
  hazard: string;
  control: string;
  responsiblePerson: string;
  photo?: string;
}

export interface EquipmentInspection {
  equipmentId: string;
  inspected: boolean | null;
  deficiencies: boolean | null;
  comments: string;
  photo?: string;
}

export interface LadderInspection {
  types: string[];
  correctLadder: boolean | null;
  inspected: boolean | null;
  secured: boolean | null;
  threePointContact: boolean | null;
}

export interface PhotoItem {
  id: string;
  dataUrl: string;
  caption: string;
  annotated: boolean;
}

export type SignerRole =
  | "Worker"
  | "Supervisor"
  | "Safety Coordinator"
  | "Rigger"
  | "Crane Operator"
  | "Crew Member"
  | "Other";

export interface SignerEntry {
  id: string;
  name: string;
  role: SignerRole;
  signature: string | null;
  signedAt: string | null;
}

export interface SignatureData {
  signers: SignerEntry[];
  gps: { lat: number; lng: number } | null;
  timestamp: string | null;
}

export type TeamMemberRole =
  | "Rigger"
  | "Supervisor"
  | "Safety Coordinator"
  | "Formwork Carpenter"
  | "Crane Operator"
  | "Labourer"
  | "Apprentice"
  | "Worker"
  | "Crew Member";

export interface TeamMember {
  id: string;
  name: string;
  employeeNumber: string;
  role: TeamMemberRole;
  trade: string;
  phone: string;
  certifications: string[];
}

export interface CrewTeam {
  id: string;
  name: string;
  supervisor: string;
  color: string;
  memberIds: string[];
}

export interface TeamMemberSignature {
  memberId: string;
  signature: string | null;
  signedAt: string | null;
}

export interface TeamState {
  selectedCrewId: string;
  todaysMemberIds: string[];
  signatures: TeamMemberSignature[];
}

export interface FlhaFormState {
  projectId: string | null;
  role: Role | null;
  taskIds: string[];
  confirmedHazardIds: string[];
  additionalHazardsEnabled: boolean | null;
  additionalHazards: AdditionalHazard[];
  reviewedDocuments: string[];
  equipmentInspections: EquipmentInspection[];
  ladder: LadderInspection;
  environment: string[];
  photos: PhotoItem[];
  comments: string;
  signatures: SignatureData;
  currentStep: number;
  completed: boolean;
}

export type FlhaStepId =
  | "project"
  | "worker"
  | "tasks"
  | "hazards"
  | "site-hazards"
  | "documents"
  | "equipment"
  | "ladder"
  | "environment"
  | "photos"
  | "comments"
  | "signatures"
  | "preview";

/** One site visit — clock in through clock out (or still open) */
export interface SiteVisit {
  id: string;
  projectId: string;
  clockIn: string;
  clockOut: string | null;
  note: string;
  gpsIn: { lat: number; lng: number } | null;
  gpsOut: { lat: number; lng: number } | null;
}

export type InspectionCheckResult = "pass" | "fail" | "na" | null;
export type InspectionOverall = "pass" | "fail" | "conditional";
export type CraneInspectionType = "daily" | "shift" | "weekly" | "monthly";
export type RiggingInspectionType = "pre-use" | "periodic" | "after-incident";

export interface InspectionCheckTemplate {
  id: string;
  label: string;
  section?: string;
}

export interface InspectionCheckItem {
  id: string;
  label: string;
  result: InspectionCheckResult;
  section?: string;
}

export interface CraneGreasePoint {
  id: string;
  label: string;
  intervalDays: number;
}

export interface CraneMaintenanceSchedule {
  equipmentId: string;
  notes: string;
  greasePoints: CraneGreasePoint[];
}

export interface CraneGreasingEntry {
  id: string;
  equipmentId: string;
  greasedAt: string;
  technician: string;
  pointIds: string[];
  notes: string;
}

export interface RiggingGearItem {
  id: string;
  name: string;
  category: string;
  type: string;
  assetTag: string;
  capacity: string;
  manufacturer: string;
  status: "in-service" | "out-of-service" | "maintenance";
  lastInspection: string;
}

export interface CraneInspectionEntry {
  id: string;
  kind: "crane";
  equipmentId: string;
  inspectionType: CraneInspectionType;
  inspectedAt: string;
  inspector: string;
  projectId: string | null;
  windKmh: number | null;
  hours: number | null;
  checks: InspectionCheckItem[];
  overall: InspectionOverall;
  comments: string;
}

export interface RiggingGearResult {
  gearId: string;
  result: InspectionCheckResult;
}

export interface RiggingInspectionEntry {
  id: string;
  kind: "rigging";
  /** @deprecated Prefer gearIds — kept for older localStorage entries */
  gearId?: string;
  /** Gear selected / in use for this inspection */
  gearIds: string[];
  /** Pass/fail per selected gear (null = not rated yet while drafting) */
  gearResults: RiggingGearResult[];
  inspectionType: RiggingInspectionType;
  inspectedAt: string;
  inspector: string;
  projectId: string | null;
  /** Optional detail checks — unmarked items do not block save */
  checks: InspectionCheckItem[];
  overall: InspectionOverall;
  comments: string;
}

export type InspectionLogEntry = CraneInspectionEntry | RiggingInspectionEntry;

export interface InspectionLogState {
  craneEntries: CraneInspectionEntry[];
  riggingEntries: RiggingInspectionEntry[];
  greasingEntries: CraneGreasingEntry[];
}

/** BC Crane Safety FM-TC-01 site binder */
export type BcCraneBinderItemStatus = "present" | "missing" | "na" | null;

export type BcCraneBinderPartyId =
  | "owner"
  | "prime"
  | "supervisor"
  | "user"
  | "mobile"
  | "other"
  | "na";

export interface BcCraneBinderMeta {
  source: string;
  docNumber: string;
  docDate: string;
  pages: number;
  copyright: string;
  pdf: string;
  title: string;
  subtitle: string;
  parties: { id: BcCraneBinderPartyId; label: string }[];
  signOffRoles: { id: string; role: string; description: string }[];
  forms: {
    id: string;
    docNumber: string;
    title: string;
    file: string;
    source: string;
  }[];
  externalLinks: { id: string; label: string; url: string }[];
  sections: {
    id: string;
    title: string;
    items: {
      id: string;
      label: string;
      notes?: string;
      ohsr?: string;
      standards?: string;
    }[];
  }[];
}

export interface BcCraneBinderItemState {
  status: BcCraneBinderItemStatus;
  partyId: BcCraneBinderPartyId | null;
  notes: string;
}

export interface BcCraneBinderSignOff {
  company: string;
  phone: string;
  printName: string;
  confirmed: boolean;
}

export interface BcCraneBinderState {
  siteAddress: string;
  meetingDate: string;
  activitySupervisor: string;
  contractor: string;
  craneMake: string;
  craneModel: string;
  craneSerial: string;
  items: Record<string, BcCraneBinderItemState>;
  sectionNotes: Record<string, string>;
  otherDocs: string[];
  signOffs: Record<string, BcCraneBinderSignOff>;
  updatedAt: string | null;
}

/** Continuous competency evaluations (rigger / crane operator) */
export type EvaluationItemResult = "pass" | "fail" | "na" | null;

export type EvaluationOverall = "pass" | "fail" | "conditional";

export interface EvaluationCheckItem {
  id: string;
  label: string;
  result: EvaluationItemResult;
}

export interface EvaluationRecord {
  id: string;
  memberId: string;
  checklistId: string;
  trackId: string;
  stageId: string;
  evaluatedAt: string;
  evaluatorName: string;
  evaluatorRole: string;
  projectId: string | null;
  items: EvaluationCheckItem[];
  overall: EvaluationOverall;
  notes: string;
  /** Supervisor / foreman acknowledgement */
  supervisorName: string;
  supervisorSignature: string | null;
  supervisorSignedAt: string | null;
}

export interface EvaluationPathwayProgress {
  trackId: string;
  stageId: string;
  completedChecklistIds: string[];
  percent: number;
  status: "not-started" | "in-progress" | "complete";
}

/** Toolbox talks (crew safety briefings) */
export type ToolboxAuthority =
  | "WorkSafeBC"
  | "BC Crane Safety"
  | "Technical Safety BC";

export interface ToolboxCitation {
  authority: ToolboxAuthority;
  label: string;
  url?: string;
}

export interface ToolboxTopic {
  id: string;
  title: string;
  category: string;
  summary: string;
  talkingPoints: string[];
  discussionPrompts: string[];
  citations: ToolboxCitation[];
  relatedDocumentIds: string[];
}

export interface ToolboxAuthorityMeta {
  id: string;
  name: string;
  shortName: string;
  url: string;
}

export interface ToolboxTalkRecord {
  id: string;
  topicIds: string[];
  title: string;
  projectId: string | null;
  deliveredAt: string;
  facilitatorName: string;
  attendeeMemberIds: string[];
  notes: string;
  /** Snapshot of generated talk body for history */
  generatedSummary: string;
}