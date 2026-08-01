import { Suspense } from "react";
import { FormsScreen } from "@/components/forms/forms-screen";

export default function FormsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Loading…</div>}>
      <FormsScreen />
    </Suspense>
  );
}
