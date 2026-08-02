"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, GraduationCap, RotateCcw, X } from "lucide-react";
import { useDocumentReview } from "@/components/providers/document-review-provider";
import type { DocumentReviewQuestion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DocumentReviewQuizProps {
  documentId: string;
  questions: DocumentReviewQuestion[];
  onPassed?: () => void;
}

type AnswerState = {
  selectedIndex: number | null;
  revealed: boolean;
};

export function DocumentReviewQuiz({
  documentId,
  questions,
  onPassed,
}: DocumentReviewQuizProps) {
  const review = useDocumentReview();
  const alreadyDone = review.isComplete(documentId);
  const record = review.getRecord(documentId);

  const [answers, setAnswers] = useState<AnswerState[]>(() =>
    questions.map(() => ({ selectedIndex: null, revealed: false }))
  );
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setAnswers(questions.map(() => ({ selectedIndex: null, revealed: false })));
    setStarted(false);
  }, [documentId, questions]);

  const correctCount = useMemo(
    () =>
      answers.filter(
        (a, i) =>
          a.revealed && a.selectedIndex === questions[i]?.correctIndex
      ).length,
    [answers, questions]
  );

  const answeredCount = answers.filter((a) => a.revealed).length;
  const allCorrect =
    questions.length > 0 &&
    answers.every(
      (a, i) => a.revealed && a.selectedIndex === questions[i]?.correctIndex
    );
  const progress =
    questions.length === 0
      ? 100
      : Math.round((answeredCount / questions.length) * 100);

  useEffect(() => {
    if (!allCorrect || alreadyDone) return;
    review.markComplete(documentId, questions.length, questions.length);
    onPassed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only fire when quiz becomes fully correct
  }, [allCorrect, alreadyDone, documentId, questions.length]);

  const selectOption = (qIndex: number, optionIndex: number) => {
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== qIndex) return a;
        if (a.revealed && a.selectedIndex === questions[qIndex].correctIndex) {
          return a;
        }
        return { selectedIndex: optionIndex, revealed: true };
      })
    );
  };

  const retryQuestion = (qIndex: number) => {
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === qIndex ? { selectedIndex: null, revealed: false } : a
      )
    );
  };

  const resetAll = () => {
    review.clearReview(documentId);
    setAnswers(questions.map(() => ({ selectedIndex: null, revealed: false })));
    setStarted(true);
  };

  if (questions.length === 0) return null;

  if (alreadyDone && !started) {
    return (
      <section className="helix-card space-y-3 p-4 ring-2 ring-emerald-500/25">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
            <GraduationCap className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 border-0 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
              Review complete
            </Badge>
            <p className="font-bold leading-snug">Learning check passed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {record
                ? `${record.score}/${record.total} correct · ${new Date(record.completedAt).toLocaleString()}`
                : "You proved you reviewed this procedure."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl font-semibold"
          onClick={resetAll}
        >
          <RotateCcw className="size-4" />
          Retake learning check
        </Button>
      </section>
    );
  }

  return (
    <section className="helix-card space-y-4 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <GraduationCap className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-snug">Prove your review</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Answer each question. You&apos;ll see the correct answer and why —
            so this doubles as a learning tool.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>
            {answeredCount}/{questions.length} answered
          </span>
          <span>
            {correctCount} correct
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      <div className="space-y-4">
        {questions.map((q, qIndex) => {
          const state = answers[qIndex];
          const isCorrect =
            state.revealed && state.selectedIndex === q.correctIndex;
          const isWrong =
            state.revealed && state.selectedIndex !== q.correctIndex;

          return (
            <div
              key={q.id}
              className={cn(
                "rounded-2xl border p-4",
                isCorrect && "border-emerald-500/40 bg-emerald-500/5",
                isWrong && "border-amber-500/40 bg-amber-500/5",
                !state.revealed && "border-border bg-card"
              )}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Question {qIndex + 1} of {questions.length}
              </p>
              <p className="mt-1.5 text-sm font-semibold leading-snug">
                {q.prompt}
              </p>

              <div className="mt-3 space-y-2">
                {q.options.map((option, optionIndex) => {
                  const selected = state.selectedIndex === optionIndex;
                  const showAsCorrect =
                    state.revealed && optionIndex === q.correctIndex;
                  const showAsWrong =
                    state.revealed && selected && optionIndex !== q.correctIndex;

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={isCorrect}
                      onClick={() => selectOption(qIndex, optionIndex)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-colors",
                        showAsCorrect &&
                          "border-emerald-600 bg-emerald-600 text-white",
                        showAsWrong &&
                          "border-rose-600 bg-rose-600 text-white",
                        !state.revealed &&
                          selected &&
                          "border-primary bg-primary/10",
                        !state.revealed &&
                          !selected &&
                          "border-border bg-muted/40 text-foreground",
                        state.revealed &&
                          !showAsCorrect &&
                          !showAsWrong &&
                          "border-border bg-muted/30 text-muted-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                          showAsCorrect || showAsWrong
                            ? "bg-white/20"
                            : "bg-background/80 ring-1 ring-border"
                        )}
                      >
                        {showAsCorrect ? (
                          <Check className="size-3.5" strokeWidth={3} />
                        ) : showAsWrong ? (
                          <X className="size-3.5" strokeWidth={3} />
                        ) : (
                          String.fromCharCode(65 + optionIndex)
                        )}
                      </span>
                      <span className="leading-snug">{option}</span>
                    </button>
                  );
                })}
              </div>

              {state.revealed && (
                <div
                  className={cn(
                    "mt-3 rounded-xl px-3.5 py-3 text-sm",
                    isCorrect
                      ? "bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                      : "bg-amber-500/10 text-amber-950 dark:text-amber-100"
                  )}
                >
                  <p className="font-bold">
                    {isCorrect ? "Correct" : "Not quite"}
                    {!isCorrect && (
                      <span className="font-semibold">
                        {" "}
                        — answer: {q.options[q.correctIndex]}
                      </span>
                    )}
                  </p>
                  <p className="mt-1.5 leading-relaxed">
                    <span className="font-semibold">Why: </span>
                    {q.explanation}
                  </p>
                  {isWrong && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-3 h-10 rounded-xl font-semibold"
                      onClick={() => retryQuestion(qIndex)}
                    >
                      <RotateCcw className="size-3.5" />
                      Try this one again
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allCorrect && (
        <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          All answers correct — review marked complete. You can return to the
          FLHA documents step.
        </div>
      )}
    </section>
  );
}
