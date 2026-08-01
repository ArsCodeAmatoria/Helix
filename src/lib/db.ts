import projects from "@/data/projects.json";
import tasks from "@/data/tasks.json";
import hazards from "@/data/hazards.json";
import equipment from "@/data/equipment.json";
import documents from "@/data/documents.json";
import worker from "@/data/worker.json";
import company from "@/data/company.json";
import dashboard from "@/data/dashboard.json";
import notifications from "@/data/notifications.json";
import config from "@/data/config.json";
import type {
  Project,
  Task,
  Hazard,
  EquipmentItem,
  SafeWorkDocument,
  Worker,
  Company,
  TaskCategory,
  NotificationItem,
  Deficiency,
  CorrectiveAction,
  WeatherAlert,
  UpcomingInspection,
  DashboardStats,
} from "@/lib/types";

export interface DashboardData {
  stats: DashboardStats;
  deficiencies: Deficiency[];
  correctiveActions: CorrectiveAction[];
  weatherAlerts: WeatherAlert[];
  upcomingInspections: UpcomingInspection[];
}

export const db = {
  projects: projects as Project[],
  tasks: tasks as Task[],
  hazards: hazards as Hazard[],
  equipment: equipment as EquipmentItem[],
  documents: documents as SafeWorkDocument[],
  worker: worker as Worker,
  company: company as Company,
  dashboard: dashboard as DashboardData,
  notifications: notifications as NotificationItem[],
  config,
};

export function getNotification(id: string): NotificationItem | undefined {
  return db.notifications.find((n) => n.id === id);
}

export function getUnreadNotifications(): NotificationItem[] {
  return db.notifications.filter((n) => !n.read);
}

export function getDeficiency(id: string): Deficiency | undefined {
  return db.dashboard.deficiencies.find((d) => d.id === id);
}

export function getCorrectiveAction(id: string): CorrectiveAction | undefined {
  return db.dashboard.correctiveActions.find((a) => a.id === id);
}

export function getWeatherAlert(id: string): WeatherAlert | undefined {
  return db.dashboard.weatherAlerts.find((w) => w.id === id);
}

export function getUpcomingInspection(
  id: string
): UpcomingInspection | undefined {
  return db.dashboard.upcomingInspections.find((i) => i.id === id);
}

export function getProject(id: string): Project | undefined {
  return db.projects.find((p) => p.id === id);
}

export function getTodaysProjects(): Project[] {
  return db.projects.filter((p) => p.assignedToday);
}

export function getRecentProjects(): Project[] {
  return db.projects.filter((p) => p.recent);
}

export function getTask(id: string): Task | undefined {
  return db.tasks.find((t) => t.id === id);
}

export function getTasksByCategory(category: TaskCategory): Task[] {
  return db.tasks.filter((t) => t.category === category);
}

export function getHazard(id: string): Hazard | undefined {
  return db.hazards.find((h) => h.id === id);
}

export function getEquipment(id: string): EquipmentItem | undefined {
  return db.equipment.find((e) => e.id === id);
}

export function getDocument(id: string): SafeWorkDocument | undefined {
  return db.documents.find((d) => d.id === id);
}

export function getDocumentsByCategory(
  category: SafeWorkDocument["category"]
): SafeWorkDocument[] {
  return db.documents.filter((d) => d.category === category);
}

export function getSwpDocuments(): SafeWorkDocument[] {
  return getDocumentsByCategory("SWP");
}

export function getSjpDocuments(): SafeWorkDocument[] {
  return getDocumentsByCategory("SJP");
}

export function searchDocuments(query: string): SafeWorkDocument[] {
  const q = query.trim().toLowerCase();
  if (!q) return db.documents;
  return db.documents.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.shortTitle.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q)
  );
}

/** Resolve unique hazards from selected task IDs — core of the dynamic form engine */
export function resolveHazardsFromTasks(taskIds: string[]): Hazard[] {
  const hazardIds = new Set<string>();
  for (const taskId of taskIds) {
    const task = getTask(taskId);
    if (!task) continue;
    for (const hid of task.hazardIds) hazardIds.add(hid);
  }
  return Array.from(hazardIds)
    .map((id) => getHazard(id))
    .filter((h): h is Hazard => Boolean(h))
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    });
}

export function tasksTriggerLadder(taskIds: string[]): boolean {
  return taskIds.some((id) => getTask(id)?.triggersLadder);
}

export function getProjectEquipment(projectId: string): EquipmentItem[] {
  const project = getProject(projectId);
  if (!project) return [];
  return project.assignedEquipment
    .map((id) => getEquipment(id))
    .filter((e): e is EquipmentItem => Boolean(e));
}

export function getProjectDocuments(projectId: string): SafeWorkDocument[] {
  const project = getProject(projectId);
  if (!project) return [];
  return project.requiredDocuments
    .map((id) => getDocument(id))
    .filter((d): d is SafeWorkDocument => Boolean(d));
}

export function searchProjects(query: string): Project[] {
  const q = query.trim().toLowerCase();
  if (!q) return db.projects;
  return db.projects.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.projectNumber.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
  );
}
