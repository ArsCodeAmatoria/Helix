export type UnitSystem = "imperial" | "metric";

export type MaterialKind = "linear" | "area" | "volume";

export type Material = {
  id: string;
  name: string;
  kind: MaterialKind;
  /** Imperial density / unit weight */
  imperial: { value: number; unit: string };
  /** Metric density / unit weight */
  metric: { value: number; unit: string };
  note?: string;
};

/** Common construction / rigging material unit weights. */
export const MATERIALS: Material[] = [
  {
    id: "steel-volume",
    name: "Structural steel",
    kind: "volume",
    imperial: { value: 490, unit: "lb/ft³" },
    metric: { value: 7850, unit: "kg/m³" },
  },
  {
    id: "steel-plate",
    name: "Steel plate (per inch thick)",
    kind: "area",
    imperial: { value: 40.8, unit: "lb/ft²·in" },
    metric: { value: 78.5, unit: "kg/m²·cm" },
    note: "Imperial: lb/ft² × thickness (in). Metric: kg/m² × thickness (cm).",
  },
  {
    id: "aluminum",
    name: "Aluminum",
    kind: "volume",
    imperial: { value: 169, unit: "lb/ft³" },
    metric: { value: 2700, unit: "kg/m³" },
  },
  {
    id: "concrete",
    name: "Concrete (normal)",
    kind: "volume",
    imperial: { value: 150, unit: "lb/ft³" },
    metric: { value: 2400, unit: "kg/m³" },
  },
  {
    id: "gravel",
    name: "Gravel / crushed stone",
    kind: "volume",
    imperial: { value: 105, unit: "lb/ft³" },
    metric: { value: 1680, unit: "kg/m³" },
  },
  {
    id: "water",
    name: "Water",
    kind: "volume",
    imperial: { value: 62.4, unit: "lb/ft³" },
    metric: { value: 1000, unit: "kg/m³" },
  },
  {
    id: "lumber",
    name: "Softwood lumber (approx.)",
    kind: "volume",
    imperial: { value: 35, unit: "lb/ft³" },
    metric: { value: 560, unit: "kg/m³" },
  },
  {
    id: "plywood-3-4",
    name: "Plywood ¾″",
    kind: "area",
    imperial: { value: 2.2, unit: "lb/ft²" },
    metric: { value: 10.7, unit: "kg/m²" },
  },
  {
    id: "rebar-4",
    name: "Rebar #4 (½″)",
    kind: "linear",
    imperial: { value: 0.668, unit: "lb/ft" },
    metric: { value: 0.994, unit: "kg/m" },
  },
  {
    id: "rebar-5",
    name: "Rebar #5 (⅝″)",
    kind: "linear",
    imperial: { value: 1.043, unit: "lb/ft" },
    metric: { value: 1.552, unit: "kg/m" },
  },
  {
    id: "rebar-6",
    name: "Rebar #6 (¾″)",
    kind: "linear",
    imperial: { value: 1.502, unit: "lb/ft" },
    metric: { value: 2.235, unit: "kg/m" },
  },
  {
    id: "rebar-8",
    name: "Rebar #8 (1″)",
    kind: "linear",
    imperial: { value: 2.67, unit: "lb/ft" },
    metric: { value: 3.973, unit: "kg/m" },
  },
  {
    id: "wire-rope-1-2",
    name: "Wire rope ½″ (approx.)",
    kind: "linear",
    imperial: { value: 0.42, unit: "lb/ft" },
    metric: { value: 0.63, unit: "kg/m" },
  },
  {
    id: "wire-rope-3-4",
    name: "Wire rope ¾″ (approx.)",
    kind: "linear",
    imperial: { value: 0.95, unit: "lb/ft" },
    metric: { value: 1.41, unit: "kg/m" },
  },
];

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function parseNum(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function formatNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const d = abs >= 100 ? 1 : abs >= 10 ? 2 : digits;
  return n.toLocaleString(undefined, {
    maximumFractionDigits: d,
    minimumFractionDigits: 0,
  });
}

/** Boom / sling from horizontal: height = L·sinθ, radius = L·cosθ */
export function boomFromLengthAngle(length: number, angleDeg: number) {
  const r = degToRad(angleDeg);
  return {
    height: length * Math.sin(r),
    radius: length * Math.cos(r),
    sin: Math.sin(r),
    cos: Math.cos(r),
    tan: Math.tan(r),
  };
}

/** Given tip height + working radius → boom length and angle */
export function boomFromHeightRadius(height: number, radius: number) {
  const length = Math.hypot(height, radius);
  const angleDeg = radToDeg(Math.atan2(height, radius));
  return { length, angleDeg, sin: height / length, cos: radius / length };
}

/** Height from horizontal distance and angle of elevation */
export function heightFromDistanceAngle(distance: number, angleDeg: number) {
  return distance * Math.tan(degToRad(angleDeg));
}

/** Horizontal distance from height and elevation angle */
export function distanceFromHeightAngle(height: number, angleDeg: number) {
  const t = Math.tan(degToRad(angleDeg));
  if (Math.abs(t) < 1e-12) return null;
  return height / t;
}

export function materialUnitWeight(
  material: Material,
  system: UnitSystem
): { value: number; unit: string } {
  return system === "imperial" ? material.imperial : material.metric;
}

/**
 * Total weight = quantity × unit weight.
 * For steel plate imperial: quantity is area (ft²), thickness multiplies into unit.
 */
export function materialWeight(
  material: Material,
  system: UnitSystem,
  quantity: number,
  thickness?: number
): number {
  const { value } = materialUnitWeight(material, system);
  if (material.id === "steel-plate") {
    const t = thickness ?? 1;
    return quantity * value * t;
  }
  return quantity * value;
}

export function quantityLabel(
  kind: MaterialKind,
  system: UnitSystem
): { label: string; unit: string } {
  if (kind === "linear") {
    return system === "imperial"
      ? { label: "Length", unit: "ft" }
      : { label: "Length", unit: "m" };
  }
  if (kind === "area") {
    return system === "imperial"
      ? { label: "Area", unit: "ft²" }
      : { label: "Area", unit: "m²" };
  }
  return system === "imperial"
    ? { label: "Volume", unit: "ft³" }
    : { label: "Volume", unit: "m³" };
}

export function weightUnit(system: UnitSystem): string {
  return system === "imperial" ? "lb" : "kg";
}

export function lengthUnit(system: UnitSystem): string {
  return system === "imperial" ? "ft" : "m";
}
