"use client";

import Link from "next/link";
import { getProject } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProjectDetailScreen({ id }: { id: string }) {
  const project = getProject(id);
  if (!project) {
    return (
      <div>
        <PageHeader title="Not found" backHref="/projects" />
        <p className="p-4 text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  const fields: [string, string][] = [
    ["Client", project.client],
    ["Prime contractor", project.primeContractor],
    ["Address", `${project.address}, ${project.city}, ${project.province}`],
    ["Project manager", project.projectManager],
    ["Superintendent", project.superintendent],
    ["Safety coordinator", project.safetyCoordinator],
    ["Emergency contact", project.emergencyContact],
    ["Nearest hospital", project.nearestHospital],
    ["Muster point", project.musterPoint],
    ["Radio channel", project.radioChannel],
  ];

  return (
    <div>
      <PageHeader
        title={project.projectNumber}
        subtitle={project.name}
        backHref="/projects"
      />
      <main className="space-y-4 px-4 py-5">
        <Button asChild size="lg" className="h-14 w-full rounded-2xl text-base font-semibold">
          <Link href={`/forms/flha?project=${project.id}`}>
            START TODAY&apos;S FLHA
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Site information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {fields.map(([label, value]) => (
              <div key={label} className="border-b border-border/50 pb-2 last:border-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="mt-0.5 font-medium">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Site hazards</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {project.siteHazards.map((h) => (
              <Badge key={h} variant="secondary" className="rounded-full px-3 py-1.5">
                {h}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crew assigned</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.crewAssigned.map((c) => (
              <p key={c} className="rounded-xl bg-muted/60 px-3 py-2.5 text-sm font-medium">
                {c}
              </p>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
