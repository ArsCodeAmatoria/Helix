"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  ChevronRight,
  MapPin,
  Sun,
  Users,
  Wind,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function WeatherIcon({ weather }: { weather: Project["weather"] }) {
  const cls = "size-4 text-sky-500";
  switch (weather) {
    case "Rain":
      return <CloudRain className={cls} />;
    case "Snow":
      return <CloudSnow className={cls} />;
    case "Windy":
      return <Wind className={cls} />;
    case "Clear":
      return <Sun className={cls} />;
    default:
      return <Cloud className={cls} />;
  }
}

const statusStyles: Record<Project["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 border-0 dark:bg-emerald-500/15 dark:text-emerald-400",
  pending: "bg-amber-50 text-amber-700 border-0 dark:bg-amber-500/15 dark:text-amber-400",
  completed: "bg-slate-100 text-slate-600 border-0 dark:bg-slate-500/15 dark:text-slate-300",
  "on-hold": "bg-rose-50 text-rose-700 border-0 dark:bg-rose-500/15 dark:text-rose-400",
};

interface ProjectCardProps {
  project: Project;
  showStart?: boolean;
  href?: string;
}

export function ProjectCard({
  project,
  showStart = false,
  href,
}: ProjectCardProps) {
  const content = (
    <motion.div whileTap={{ scale: 0.985 }} className="h-full">
      <article className="helix-card overflow-hidden">
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary">
                {project.projectNumber}
              </p>
              <h3 className="mt-1 text-[17px] font-bold leading-snug tracking-tight">
                {project.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{project.client}</p>
            </div>
            <Badge className={cn("shrink-0 capitalize", statusStyles[project.status])}>
              {project.status.replace("-", " ")}
            </Badge>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              {project.address}, {project.city}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              <WeatherIcon weather={project.weather} />
              {project.weather} · {project.temperature}°C
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Users className="size-3.5" />
              {project.crewAssigned[0]}
            </span>
          </div>
        </div>

        {showStart && (
          <div className="border-t border-border/60 p-3">
            <Button
              asChild
              size="lg"
              className="h-14 w-full rounded-2xl text-[15px] font-bold shadow-md shadow-primary/20"
            >
              <Link href={`/forms/flha?project=${project.id}`}>
                Start today&apos;s FLHA
                <ChevronRight className="size-5" />
              </Link>
            </Button>
          </div>
        )}

        {href && !showStart && (
          <div className="flex items-center justify-end border-t border-border/60 px-4 py-3 text-sm font-semibold text-primary">
            View details
            <ChevronRight className="size-4" />
          </div>
        )}
      </article>
    </motion.div>
  );

  if (href && !showStart) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
