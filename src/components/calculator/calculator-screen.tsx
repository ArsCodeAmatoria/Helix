"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  Ruler,
  Triangle,
  Weight,
} from "lucide-react";
import {
  MATERIALS,
  boomFromHeightRadius,
  boomFromLengthAngle,
  distanceFromHeightAngle,
  formatNum,
  heightFromDistanceAngle,
  lengthUnit,
  materialUnitWeight,
  materialWeight,
  parseNum,
  quantityLabel,
  weightUnit,
  type Material,
  type UnitSystem,
} from "@/lib/calculator";
import { ScientificCalculator } from "@/components/calculator/scientific-calculator";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Tab = "sci" | "trig" | "height" | "materials";

function UnitToggle({
  system,
  onChange,
}: {
  system: UnitSystem;
  onChange: (s: UnitSystem) => void;
}) {
  return (
    <div className="flex rounded-2xl bg-muted p-1">
      {(
        [
          ["imperial", "Imperial"],
          ["metric", "Metric"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
            system === id
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
        {unit ? ` (${unit})` : ""}
      </span>
      <Input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "0"}
        className="h-12 rounded-2xl text-base font-semibold tabular-nums"
      />
    </label>
  );
}

function ResultRow({
  label,
  value,
  unit,
  emphasize,
}: {
  label: string;
  value: string;
  unit?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 rounded-2xl px-3.5 py-3",
        emphasize ? "bg-primary/10" : "bg-muted/60"
      )}
    >
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-lg font-bold tabular-nums",
          emphasize && "text-primary"
        )}
      >
        {value}
        {unit ? (
          <span className="ml-1 text-sm font-semibold text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function TrigPanel({ system }: { system: UnitSystem }) {
  const lu = lengthUnit(system);
  const [mode, setMode] = useState<"length-angle" | "height-radius">(
    "length-angle"
  );
  const [length, setLength] = useState("");
  const [angle, setAngle] = useState("60");
  const [height, setHeight] = useState("");
  const [radius, setRadius] = useState("");

  const result = useMemo(() => {
    if (mode === "length-angle") {
      const L = parseNum(length);
      const A = parseNum(angle);
      if (L == null || A == null) return null;
      const r = boomFromLengthAngle(L, A);
      return {
        rows: [
          { label: "sin(θ)", value: formatNum(r.sin, 4) },
          { label: "cos(θ)", value: formatNum(r.cos, 4) },
          { label: "tan(θ)", value: formatNum(r.tan, 4) },
          {
            label: "Tip height",
            value: formatNum(r.height),
            unit: lu,
            emphasize: true,
          },
          {
            label: "Working radius",
            value: formatNum(r.radius),
            unit: lu,
            emphasize: true,
          },
        ],
      };
    }
    const H = parseNum(height);
    const R = parseNum(radius);
    if (H == null || R == null || (H === 0 && R === 0)) return null;
    const r = boomFromHeightRadius(H, R);
    return {
      rows: [
        { label: "sin(θ)", value: formatNum(r.sin, 4) },
        { label: "cos(θ)", value: formatNum(r.cos, 4) },
        {
          label: "Boom / sling angle",
          value: formatNum(r.angleDeg),
          unit: "°",
          emphasize: true,
        },
        {
          label: "Boom / sling length",
          value: formatNum(r.length),
          unit: lu,
          emphasize: true,
        },
      ],
    };
  }, [mode, length, angle, height, radius, lu]);

  return (
    <div className="space-y-4">
      <div className="flex rounded-2xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("length-angle")}
          className={cn(
            "flex-1 rounded-xl px-2 py-2.5 text-xs font-bold sm:text-sm",
            mode === "length-angle"
              ? "bg-card shadow-sm"
              : "text-muted-foreground"
          )}
        >
          Length + angle
        </button>
        <button
          type="button"
          onClick={() => setMode("height-radius")}
          className={cn(
            "flex-1 rounded-xl px-2 py-2.5 text-xs font-bold sm:text-sm",
            mode === "height-radius"
              ? "bg-card shadow-sm"
              : "text-muted-foreground"
          )}
        >
          Height + radius
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Rigging / boom from horizontal. Uses sin() for height and cos() for
        radius.
      </p>

      {mode === "length-angle" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Boom / sling length"
            unit={lu}
            value={length}
            onChange={setLength}
            placeholder={system === "imperial" ? "80" : "24"}
          />
          <Field
            label="Angle from horizontal"
            unit="°"
            value={angle}
            onChange={setAngle}
            placeholder="60"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Tip height"
            unit={lu}
            value={height}
            onChange={setHeight}
          />
          <Field
            label="Working radius"
            unit={lu}
            value={radius}
            onChange={setRadius}
          />
        </div>
      )}

      {result && (
        <div className="space-y-2">
          {result.rows.map((row) => (
            <ResultRow key={row.label} {...row} />
          ))}
        </div>
      )}
    </div>
  );
}

function HeightPanel({ system }: { system: UnitSystem }) {
  const lu = lengthUnit(system);
  const [mode, setMode] = useState<"to-height" | "to-distance">("to-height");
  const [distance, setDistance] = useState("");
  const [height, setHeight] = useState("");
  const [angle, setAngle] = useState("45");

  const result = useMemo(() => {
    const A = parseNum(angle);
    if (A == null) return null;
    const r = Math.PI / 180;
    const sin = Math.sin(A * r);
    const cos = Math.cos(A * r);

    if (mode === "to-height") {
      const D = parseNum(distance);
      if (D == null) return null;
      const H = heightFromDistanceAngle(D, A);
      const hyp = D / cos;
      return {
        rows: [
          { label: "sin(θ)", value: formatNum(sin, 4) },
          { label: "cos(θ)", value: formatNum(cos, 4) },
          {
            label: "Height",
            value: formatNum(H),
            unit: lu,
            emphasize: true,
          },
          {
            label: "Sight / slope length",
            value: formatNum(hyp),
            unit: lu,
          },
        ],
      };
    }

    const H = parseNum(height);
    if (H == null) return null;
    const D = distanceFromHeightAngle(H, A);
    if (D == null) return null;
    const hyp = H / sin;
    return {
      rows: [
        { label: "sin(θ)", value: formatNum(sin, 4) },
        { label: "cos(θ)", value: formatNum(cos, 4) },
        {
          label: "Horizontal distance",
          value: formatNum(D),
          unit: lu,
          emphasize: true,
        },
        {
          label: "Sight / slope length",
          value: formatNum(hyp),
          unit: lu,
        },
      ],
    };
  }, [mode, distance, height, angle, lu]);

  return (
    <div className="space-y-4">
      <div className="flex rounded-2xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("to-height")}
          className={cn(
            "flex-1 rounded-xl px-2 py-2.5 text-xs font-bold sm:text-sm",
            mode === "to-height" ? "bg-card shadow-sm" : "text-muted-foreground"
          )}
        >
          Find height
        </button>
        <button
          type="button"
          onClick={() => setMode("to-distance")}
          className={cn(
            "flex-1 rounded-xl px-2 py-2.5 text-xs font-bold sm:text-sm",
            mode === "to-distance"
              ? "bg-card shadow-sm"
              : "text-muted-foreground"
          )}
        >
          Find distance
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Mobile height & distance from an elevation angle — useful for clearances
        and reach checks.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {mode === "to-height" ? (
          <Field
            label="Horizontal distance"
            unit={lu}
            value={distance}
            onChange={setDistance}
          />
        ) : (
          <Field
            label="Height"
            unit={lu}
            value={height}
            onChange={setHeight}
          />
        )}
        <Field
          label="Elevation angle"
          unit="°"
          value={angle}
          onChange={setAngle}
        />
      </div>

      {result && (
        <div className="space-y-2">
          {result.rows.map((row) => (
            <ResultRow key={row.label} {...row} />
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialsPanel({ system }: { system: UnitSystem }) {
  const [materialId, setMaterialId] = useState(MATERIALS[0].id);
  const [quantity, setQuantity] = useState("");
  const [thickness, setThickness] = useState("1");
  const [pieces, setPieces] = useState("1");

  const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0];
  const unit = materialUnitWeight(material, system);
  const qtyMeta = quantityLabel(material.kind, system);
  const wu = weightUnit(system);

  const total = useMemo(() => {
    const q = parseNum(quantity);
    const p = parseNum(pieces) ?? 1;
    if (q == null) return null;
    const t =
      material.id === "steel-plate" ? (parseNum(thickness) ?? 1) : undefined;
    return materialWeight(material, system, q, t) * p;
  }, [material, system, quantity, thickness, pieces]);

  const kindLabel =
    material.kind === "linear"
      ? "Linear"
      : material.kind === "area"
        ? "Square (area)"
        : "Cubic (volume)";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Multiply length, area, or volume by material unit weight — linear,
        square, or cubic.
      </p>

      <label className="block space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Material
        </span>
        <select
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          className="flex h-12 w-full rounded-2xl border border-input bg-background px-3 text-sm font-semibold"
        >
          {MATERIALS.map((m: Material) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">
          {kindLabel}
        </span>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold tabular-nums">
          {formatNum(unit.value, 3)} {unit.unit}
        </span>
      </div>

      {material.note && (
        <p className="text-xs text-muted-foreground">{material.note}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={qtyMeta.label}
          unit={qtyMeta.unit}
          value={quantity}
          onChange={setQuantity}
        />
        <Field
          label="Pieces / count"
          value={pieces}
          onChange={setPieces}
          placeholder="1"
        />
      </div>

      {material.id === "steel-plate" && (
        <Field
          label={system === "imperial" ? "Thickness" : "Thickness"}
          unit={system === "imperial" ? "in" : "cm"}
          value={thickness}
          onChange={setThickness}
        />
      )}

      {total != null && (
        <div className="space-y-2">
          <ResultRow
            label="Total weight"
            value={formatNum(total)}
            unit={wu}
            emphasize
          />
          {system === "imperial" && (
            <ResultRow
              label="≈ tons (US)"
              value={formatNum(total / 2000, 3)}
              unit="ton"
            />
          )}
          {system === "metric" && (
            <ResultRow
              label="≈ tonnes"
              value={formatNum(total / 1000, 3)}
              unit="t"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function CalculatorScreen() {
  const [system, setSystem] = useState<UnitSystem>("imperial");
  const [tab, setTab] = useState<Tab>("sci");

  const tabs: { id: Tab; label: string; icon: typeof Calculator }[] = [
    { id: "sci", label: "Basic", icon: Calculator },
    { id: "trig", label: "Rigging", icon: Triangle },
    { id: "height", label: "Height", icon: Ruler },
    { id: "materials", label: "Weights", icon: Weight },
  ];

  const isSci = tab === "sci";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        isSci && "flex-1 overflow-hidden"
      )}
    >
      <PageHeader
        title="Calculator"
        subtitle={
          isSci
            ? "Scientific"
            : "Rigging · height · material weights"
        }
        backHref="/"
        showTheme={!isSci}
        showInstall={!isSci}
        action={
          isSci ? undefined : (
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <Calculator className="size-5 text-muted-foreground" />
            </div>
          )
        }
      />

      <div
        className={cn(
          "sticky z-30 border-b border-border/40 bg-background/95 px-3 py-2 backdrop-blur-md",
          // Sit under the sticky PageHeader
          "top-[max(3.75rem,calc(env(safe-area-inset-top)+3.25rem))]"
        )}
      >
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <Button
                key={t.id}
                type="button"
                variant={active ? "default" : "outline"}
                onClick={() => setTab(t.id)}
                className={cn(
                  "h-auto flex-col gap-0.5 rounded-xl px-1 py-1.5",
                  active && "shadow-sm"
                )}
              >
                <Icon className="size-3.5" />
                <span className="text-[10px] font-bold leading-none">
                  {t.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {isSci ? (
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-2 pt-2">
          <ScientificCalculator />
        </div>
      ) : (
        <main className="space-y-4 px-4 py-4 pb-8">
          <UnitToggle system={system} onChange={setSystem} />

          <div className="helix-card space-y-4 p-4">
            {tab === "trig" && <TrigPanel system={system} />}
            {tab === "height" && <HeightPanel system={system} />}
            {tab === "materials" && <MaterialsPanel system={system} />}
          </div>

          <p className="px-1 text-center text-xs text-muted-foreground">
            Field estimates only — verify against manufacturer charts and site
            engineering before lifts.
          </p>
        </main>
      )}
    </div>
  );
}
