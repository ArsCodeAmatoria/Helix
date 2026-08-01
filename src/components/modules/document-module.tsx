"use client";

import Link from "next/link";
import { FileText, Check, ExternalLink } from "lucide-react";
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
          Project documents loaded automatically. Open each SWP/SJP, then confirm
          you&apos;ve reviewed it.
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
            <div
              key={doc.id}
              className={cn(
                "rounded-2xl border p-4 transition-colors",
                done
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggle(doc.id)}
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    done
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                  aria-label={done ? "Mark unread" : "Mark reviewed"}
                >
                  {done ? (
                    <Check className="size-5" />
                  ) : (
                    <FileText className="size-5" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{doc.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {doc.category} · v{doc.version} · Updated {doc.lastUpdated}
                  </p>
                  <Link
                    href={`/forms/documents/${doc.id}`}
                    className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary"
                  >
                    Open procedure
                    <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
