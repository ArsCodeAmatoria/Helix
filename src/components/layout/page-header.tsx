"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  className?: string;
  showTheme?: boolean;
  showInstall?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  onBack,
  action,
  className,
  showTheme = true,
  showInstall = true,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/50 bg-card/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {onBack ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            onClick={onBack}
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </Button>
        ) : backHref ? (
          <Button variant="ghost" size="icon" className="size-11 shrink-0" asChild>
            <Link href={backHref} aria-label="Back">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {action}
          {showInstall && <InstallAppButton />}
          {showTheme && <ThemeToggle />}
        </div>
      </div>
    </header>
  );
}
