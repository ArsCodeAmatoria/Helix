"use client";

import { useMemo, useState } from "react";
import { Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRecentProjects, searchProjects, getProject } from "@/lib/db";
import { cn } from "@/lib/utils";

interface ProjectModuleProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProjectModule({ selectedId, onSelect }: ProjectModuleProps) {
  const [query, setQuery] = useState("");
  const recent = getRecentProjects();
  const results = useMemo(() => searchProjects(query), [query]);
  const selected = selectedId ? getProject(selectedId) : null;

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, client, number…"
          className="h-14 rounded-2xl pl-11 text-base"
        />
      </div>

      {!query && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="size-4" />
            Recent projects
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                  selectedId === p.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                {p.projectNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {results.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition-colors",
              selectedId === p.id
                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                : "border-border bg-card hover:border-primary/30"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {p.projectNumber}
                </p>
                <p className="mt-0.5 font-semibold leading-snug">{p.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.client} · {p.city}
                </p>
              </div>
              {selectedId === p.id && (
                <Badge className="shrink-0">Selected</Badge>
              )}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-semibold text-primary">Auto-loaded site info</p>
            <dl className="grid grid-cols-1 gap-1.5 text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">PM: </span>
                {selected.projectManager}
              </div>
              <div>
                <span className="font-medium text-foreground">Superintendent: </span>
                {selected.superintendent}
              </div>
              <div>
                <span className="font-medium text-foreground">Safety: </span>
                {selected.safetyCoordinator}
              </div>
              <div>
                <span className="font-medium text-foreground">Muster: </span>
                {selected.musterPoint}
              </div>
              <div>
                <span className="font-medium text-foreground">Radio: </span>
                {selected.radioChannel}
              </div>
              <div>
                <span className="font-medium text-foreground">Hospital: </span>
                {selected.nearestHospital}
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
