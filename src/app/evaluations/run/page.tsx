import { Suspense } from "react";
import { EvaluationRunScreen } from "@/components/evaluations/evaluation-run-screen";

export default function EvaluationRunPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          Loading evaluation…
        </div>
      }
    >
      <EvaluationRunScreen />
    </Suspense>
  );
}
