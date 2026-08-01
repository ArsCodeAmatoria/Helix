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
  logoText: string;
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
}

export interface SafeWorkDocument {
  id: string;
  title: string;
  type: string;
  version: string;
  lastUpdated: string;
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
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "alert" | "info" | "action" | "weather";
  read: boolean;
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