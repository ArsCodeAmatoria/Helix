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

export interface WorkerActivitySummary {
  periodLabel: string;
  siteNote: string;
  totalFlhas: number;
  totalHours: number;
  topTasks: ActivityBarItem[];
  byCategory: ActivityBarItem[];
  byRole: ActivityBarItem[];
  byTrade: ActivityBarItem[];
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

export function computeWorkerActivity(
  memberList: TeamMember[] = members
): WorkerActivitySummary {
  const taskRows = activityData.tasks
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

  const totalTaskCount = taskRows.reduce((s, t) => s + t.count, 0);
  const topTasks: ActivityBarItem[] = taskRows.slice(0, 10).map((t) => ({
    id: t.id,
    label: t.label,
    count: t.count,
    hours: t.hours,
    percent: pct(t.count, totalTaskCount),
    secondary: t.category,
  }));

  const categoryMap = new Map<string, { count: number; hours: number }>();
  for (const t of taskRows) {
    const cur = categoryMap.get(t.category) ?? { count: 0, hours: 0 };
    cur.count += t.count;
    cur.hours += t.hours;
    categoryMap.set(t.category, cur);
  }
  const byCategory: ActivityBarItem[] = Array.from(categoryMap.entries())
    .map(([label, v]) => ({
      id: label,
      label,
      count: v.count,
      hours: v.hours,
      percent: pct(v.count, totalTaskCount),
    }))
    .sort((a, b) => b.count - a.count);

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

  const top = topTasks[0];
  const topCat = byCategory[0];
  const topRole = byRole[0];
  const insight = [
    top
      ? `${top.label} is the most selected FLHA task (${top.count}×, ${top.percent}% of selections).`
      : null,
    topCat
      ? `${topCat.label} work leads category mix at ${topCat.percent}%.`
      : null,
    topRole
      ? `Largest role group on roster: ${topRole.label} (${topRole.count}).`
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
    insight:
      insight ||
      `Across ${db.projects.length} projects, track which tasks crews select most on FLHAs.`,
  };
}
