"use client";

import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/modules/project-card";

export function ProjectsScreen() {
  return (
    <div>
      <PageHeader title="Projects" subtitle="All active sites" />
      <main className="space-y-4 px-4 py-5">
        {db.projects.map((p) => (
          <ProjectCard key={p.id} project={p} href={`/projects/${p.id}`} />
        ))}
      </main>
    </div>
  );
}
