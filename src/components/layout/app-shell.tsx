"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { InstallAppAutoPrompt } from "@/components/pwa/install-app-auto";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCalculator = pathname.startsWith("/calculator");

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden bg-background">
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isCalculator
            ? "overflow-y-auto pb-[calc(3.75rem+env(safe-area-inset-bottom))]"
            : "overflow-y-auto pb-20"
        )}
      >
        {children}
      </div>
      <BottomNav />
      <InstallAppAutoPrompt />
    </div>
  );
}
