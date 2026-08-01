import chartData from "@/data/crane-charts.json";
import { db, getEquipment } from "@/lib/db";
import type { CraneLoadChart, EquipmentItem } from "@/lib/types";

export const craneCharts = chartData.charts as CraneLoadChart[];
export const craneChartsDisclaimer = chartData.disclaimer;

export { getEquipment };

export function getCraneChart(id: string): CraneLoadChart | undefined {
  return craneCharts.find((c) => c.id === id);
}

export function getChartsForEquipment(equipmentId: string): CraneLoadChart[] {
  return craneCharts.filter((c) => c.equipmentIds.includes(equipmentId));
}

export function searchCraneCharts(query: string): CraneLoadChart[] {
  const q = query.trim().toLowerCase();
  if (!q) return craneCharts;
  return craneCharts.filter(
    (c) =>
      c.manufacturer.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      c.source.toLowerCase().includes(q)
  );
}

export function getTowerCranes(): EquipmentItem[] {
  return db.equipment.filter((e) => e.type === "Tower Crane");
}
