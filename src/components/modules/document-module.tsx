"use client";

import { FileText, Check } from "lucide-react";
import type { SafeWorkDocument } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentModuleProps {
  documents: SafeWorkDocument[];
  reviewedIds: string[];
  onToggle: (id: string) => void;
  onReviewAll: (ids: string[]) => void;
}

export function DocumentModule({
  documents,
  reviewedIds,
  onToggle,
  onReviewAll,
}: DocumentModuleProps) {
  const allDone =
    documents.length > 0 &&
    documents.every((d) => reviewedIds.includes(d.id));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Project documents loaded automatically. Confirm you&apos;ve reviewed each.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10 shrink-0 rounded-xl"
          disabled={allDone || documents.length === 0}
          onClick={() => onReviewAll(documents.map((d) => d.id))}
        >
          Review all
        </Button>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => {
          const done = reviewedIds.includes(doc.id);
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => onToggle(doc.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                done
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl",
                  done ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="size-5" /> : <FileText className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{doc.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {doc.type} · v{doc.version} · Updated {doc.lastUpdated}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
