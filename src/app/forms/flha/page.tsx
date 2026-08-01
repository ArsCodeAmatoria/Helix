import { Suspense } from "react";
import { FlhaWizard } from "@/components/flha/flha-wizard";

export default function FlhaPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Loading FLHA…</div>}>
      <FlhaWizard />
    </Suspense>
  );
}
