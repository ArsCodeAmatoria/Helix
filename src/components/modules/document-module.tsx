"use client";

import Link from "next/link";
import { FileText, Check, ExternalLink, GraduationCap } from "lucide-react";
import type { SafeWorkDocument } from "@/lib/types";
import { useDocumentReview } from "@/components/providers/document-review-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DocumentModuleProps {
  documents: SafeWorkDocument[];
  reviewedIds: string[];
  onToggle: (id: string) => void;
  onReviewAll: (ids: string[]) => void;
  onMarkReviewed: (id: string) => void;
}

export function DocumentModule({
  documents,
  reviewedIds,
  onToggle,
  onReviewAll,
  onMarkReviewed,
}: DocumentModuleProps) {
  const docReview = useDocumentReview();

  const quizPassedIds = documents
    .filter((d) => docReview.isComplete(d.id))
    .map((d) => d.id);

  const allQuizPassed =
    documents.length > 0 &&
    documents.every((d) => docReview.isComplete(d.id));

  const allDone =
    documents.length > 0 &&
    documents.every((d) => reviewedIds.includes(d.id));

  const syncPassedToFlha = () => {
    for (const id of quizPassedIds) {
      onMarkReviewed(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Open each SWP/SJP and pass the learning check (questions + why). That
          proves you reviewed it — tapping alone is not enough.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10 shrink-0 rounded-xl"
          disabled={!allQuizPassed || allDone || documents.length === 0}
          onClick={() => onReviewAll(documents.map((d) => d.id))}
        >
          Mark all passed
        </Button>
      </div>

      {quizPassedIds.length > 0 && !allDone && (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl font-semibold"
          onClick={syncPassedToFlha}
        >
          <GraduationCap className="size-4" />
          Sync {quizPassedIds.length} quiz pass
          {quizPassedIds.length === 1 ? "" : "es"} to this FLHA
        </Button>
      )}

      <div className="space-y-2">
        {documents.map((doc) => {
          const quizDone = docReview.isComplete(doc.id);
          const done = reviewedIds.includes(doc.id);
          const record = docReview.getRecord(doc.id);
          return (
            <div
              key={doc.id}
              className={cn(
                "rounded-2xl border p-4 transition-colors",
                done
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : quizDone
                    ? "border-sky-500/30 bg-sky-500/5"
                    : "border-border bg-card"
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!quizDone) return;
                    onToggle(doc.id);
                  }}
                  disabled={!quizDone}
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    done
                      ? "bg-emerald-600 text-white"
                      : quizDone
                        ? "bg-sky-600 text-white"
                        : "bg-muted text-muted-foreground"
                  )}
                  aria-label={
                    !quizDone
                      ? "Complete learning check first"
                      : done
                        ? "Mark unread"
                        : "Mark reviewed on FLHA"
                  }
                >
                  {done || quizDone ? (
                    <Check className="size-5" />
                  ) : (
                    <FileText className="size-5" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{doc.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {doc.category} · v{doc.version} ·{" "}
                    {doc.reviewQuestions?.length ?? 0} review questions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quizDone ? (
                      <Badge className="border-0 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                        Quiz passed
                        {record ? ` · ${record.score}/${record.total}` : ""}
                      </Badge>
                    ) : (
                      <Badge className="border-0 bg-amber-500/15 text-amber-800 dark:text-amber-300">
                        Learning check required
                      </Badge>
                    )}
                    {done && (
                      <Badge className="border-0 bg-sky-500/15 text-sky-800 dark:text-sky-300">
                        On this FLHA
                      </Badge>
                    )}
                  </div>
                  <Link
                    href={`/forms/documents/${doc.id}`}
                    className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary"
                  >
                    {quizDone ? "Open procedure" : "Open & complete learning check"}
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
