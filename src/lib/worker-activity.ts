import activityData from "@/data/worker-activity.json";
import { db, getTask } from "@/lib/db";
import { members } from "@/lib/team";
import type { TeamMember } from "@/lib/types";

export interface ActivityBarItem {
  id: string;
  label: string;
  count: number;
  hours?: number;
  percent: number;
  secondary?: string;
}

export interface MemberActivitySummary {
  member: TeamMember;
  flhas: number;
  hours: number;
  topTasks: ActivityBarItem[];
  byCategory: ActivityBarItem[];
  percentOfHours: number;
  percentOfFlhas: number;
  periodLabel: string;
}

export interface WorkerActivitySummary {
  periodLabel: string;
  siteNote: string;
  totalFlhas: number;
  totalHours: number;
  topTasks: ActivityBarItem[];
  byCategory: ActivityBarItem[];
  byRole: ActivityBarItem[];
  byTrade: ActivityBarItem[];
  byWorker: MemberActivitySummary[];
  insight: string;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function countBy<T>(
  items: T[],
  keyFn: (item: T) => string
): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function buildTaskRows(
  rows: { taskId: string; count: number; hours: number }[]
) {
  return rows
    .map((row) => {
      const task = getTask(row.taskId);
      if (!task) return null;
      return {
        id: task.id,
        label: task.label,
        category: task.category,
        count: row.count,
        hours: row.hours,
      };
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .sort((a, b) => b.count - a.count);
}

function toTopTasks(
  taskRows: ReturnType<typeof buildTaskRows>,
  limit = 10
): ActivityBarItem[] {
  const total = taskRows.reduce((s, t) => s + t.count, 0);
  return taskRows.slice(0, limit).map((t) => ({
    id: t.id,
    label: t.label,
    count: t.count,
    hours: t.hours,
    percent: pct(t.count, total),
    secondary: t.category,
  }));
}

function toByCategory(
  taskRows: ReturnType<typeof buildTaskRows>
): ActivityBarItem[] {
  const total = taskRows.reduce((s, t) => s + t.count, 0);
  const categoryMap = new Map<string, { count: number; hours: number }>();
  for (const t of taskRows) {
    const cur = categoryMap.get(t.category) ?? { count: 0, hours: 0 };
    cur.count += t.count;
    cur.hours += t.hours;
    categoryMap.set(t.category, cur);
  }
  return Array.from(categoryMap.entries())
    .map(([label, v]) => ({
      id: label,
      label,
      count: v.count,
      hours: v.hours,
      percent: pct(v.count, total),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getMemberActivity(
  memberId: string,
  memberList: TeamMember[] = members
): MemberActivitySummary | null {
  const member = memberList.find((m) => m.id === memberId);
  const row = activityData.byMember.find((m) => m.memberId === memberId);
  if (!member || !row) return null;

  const taskRows = buildTaskRows(row.tasks);
  return {
    member,
    flhas: row.flhas,
    hours: row.hours,
    topTasks: toTopTasks(taskRows, 6),
    byCategory: toByCategory(taskRows),
    percentOfHours: pct(row.hours, activityData.totalHours),
    percentOfFlhas: pct(row.flhas, activityData.totalFlhas),
    periodLabel: activityData.periodLabel,
  };
}

export function computeWorkerActivity(
  memberList: TeamMember[] = members
): WorkerActivitySummary {
  const taskRows = buildTaskRows(activityData.tasks);
  const topTasks = toTopTasks(taskRows, 10);
  const byCategory = toByCategory(taskRows);

  const roleCounts = countBy(memberList, (m) => m.role);
  const byRole: ActivityBarItem[] = roleCounts.map((r) => ({
    id: r.key,
    label: r.key,
    count: r.count,
    percent: pct(r.count, memberList.length),
    secondary: `${r.count} worker${r.count === 1 ? "" : "s"}`,
  }));

  const tradeCounts = countBy(memberList, (m) => m.trade);
  const byTrade: ActivityBarItem[] = tradeCounts.map((t) => ({
    id: t.key,
    label: t.key,
    count: t.count,
    percent: pct(t.count, memberList.length),
    secondary: `${t.count} worker${t.count === 1 ? "" : "s"}`,
  }));

  const memberIds = new Set(memberList.map((m) => m.id));
  const byWorker = activityData.byMember
    .filter((row) => memberIds.has(row.memberId))
    .map((row) => getMemberActivity(row.memberId, memberList))
    .filter((r): r is MemberActivitySummary => Boolean(r))
    .sort((a, b) => b.hours - a.hours || b.flhas - a.flhas);

  const top = topTasks[0];
  const topCat = byCategory[0];
  const topWorker = byWorker[0];
  const insight = [
    top
      ? `${top.label} is the most selected FLHA task (${top.count}×, ${top.percent}% of selections).`
      : null,
    topCat
      ? `${topCat.label} work leads category mix at ${topCat.percent}%.`
      : null,
    topWorker
      ? `${topWorker.member.name} leads crew hours (${topWorker.hours}h, ${topWorker.percentOfHours}%).`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    periodLabel: activityData.periodLabel,
    siteNote: activityData.siteNote,
    totalFlhas: activityData.totalFlhas,
    totalHours: activityData.totalHours,
    topTasks,
    byCategory,
    byRole,
    byTrade: byTrade.slice(0, 8),
    byWorker,
    insight:
      insight ||
      `Across ${db.projects.length} projects, track which tasks crews select most on FLHAs.`,
  };
}
