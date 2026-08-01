"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  FileText,
  Search,
  TowerControl,
} from "lucide-react";
import {
  craneCharts,
  craneChartsDisclaimer,
  getEquipment,
  searchCraneCharts,
} from "@/lib/crane-charts";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MfrFilter = "all" | "Liebherr" | "Potain" | "Terex";

export function CraneChartsScreen() {
  const [query, setQuery] = useState("");
  const [mfr, setMfr] = useState<MfrFilter>("all");

  const charts = useMemo(() => {
    let pool = searchCraneCharts(query);
    if (mfr !== "all") {
      pool = pool.filter((c) => c.manufacturer === mfr);
    }
    return pool;
  }, [query, mfr]);

  const filters: { id: MfrFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: craneCharts.length },
    {
      id: "Liebherr",
      label: "Liebherr",
      count: craneCharts.filter((c) => c.manufacturer === "Liebherr").length,
    },
    {
      id: "Potain",
      label: "Potain",
      count: craneCharts.filter((c) => c.manufacturer === "Potain").length,
    },
    {
      id: "Terex",
      label: "Terex",
      count: craneCharts.filter((c) => c.manufacturer === "Terex").length,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Crane load charts"
        subtitle="Liebherr · Potain · Terex PDFs"
        backHref="/forms"
      />

      <main className="space-y-4 px-4 py-5">
        <div className="helix-card space-y-2 border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Operator reference only
          </p>
          <p className="text-sm text-amber-800/90 dark:text-amber-200/80">
            {craneChartsDisclaimer}
          </p>
          <a
            href="/forms/inspections"
            className="inline-flex text-sm font-bold text-amber-900 underline dark:text-amber-200"
          >
            Open crane &amp; rigging inspection log books
          </a>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manufacturer, model, type…"
            className="h-14 rounded-2xl pl-11 text-base"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setMfr(f.id)}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-semibold",
                mfr === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <section className="space-y-2 pb-4">
          <p className="text-sm font-bold text-muted-foreground">
            {charts.length} chart{charts.length === 1 ? "" : "s"}
          </p>
          {charts.length === 0 && (
            <div className="helix-card p-6 text-center text-sm text-muted-foreground">
              No charts match “{query}”.
            </div>
          )}
          {charts.map((chart) => {
            const linked = chart.equipmentIds
              .map((id) => getEquipment(id))
              .filter(Boolean);
            return (
              <div key={chart.id} className="helix-card space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-700 dark:text-orange-400">
                    <TowerControl className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap gap-2">
                      <Badge className="border-0 bg-primary/10 text-primary">
                        {chart.manufacturer}
                      </Badge>
                      <Badge variant="secondary" className="border-0">
                        {chart.type}
                      </Badge>
                    </div>
                    <p className="font-bold leading-snug">{chart.model}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {chart.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {chart.pagesNote} · {chart.source}
                    </p>
                    {linked.length > 0 && (
                      <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Linked site units:{" "}
                        {linked.map((e) => e!.assetTag).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  asChild
                  className="h-12 w-full rounded-2xl font-semibold"
                >
                  <a href={chart.file} target="_blank" rel="noopener noreferrer">
                    <FileText className="size-4" />
                    Open PDF
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
