import Link from "next/link";
import { ProvenLogo } from "@/components/brand/proven-logo";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Offline · Proven",
  description: "You are offline. Reconnect to continue using Proven.",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <ProvenLogo withWordmark iconClassName="size-14 rounded-2xl" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">You&apos;re offline</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Proven can&apos;t reach the network right now. Check your connection,
          then try again. Cached pages may still work.
        </p>
      </div>
      <Button asChild className="h-12 rounded-2xl px-6">
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  );
}
