"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { InstallAppAutoPrompt } from "@/components/pwa/install-app-auto";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background">
      <div className="flex-1 pb-20">{children}</div>
      <BottomNav />
      <InstallAppAutoPrompt />
    </div>
  );
}
