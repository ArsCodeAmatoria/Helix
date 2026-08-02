"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  HardHat,
  Shield,
} from "lucide-react";
import { getDocument } from "@/lib/db";
import { useDocumentReview } from "@/components/providers/document-review-provider";
import { useFlhaOptional } from "@/components/providers/flha-provider";
import { DocumentReviewQuiz } from "@/components/forms/document-review-quiz";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DocumentDetailScreen({ id }: { id: string }) {
  const doc = getDocument(id);
  const docReview = useDocumentReview();
  const flha = useFlhaOptional();
  const reviewComplete = doc ? docReview.isComplete(doc.id) : false;

  if (!doc) notFound();

  const isSwp = doc.category === "SWP";
  const isSjp = doc.category === "SJP";
  const backHref = isSwp
    ? "/forms/swp"
    : isSjp
      ? "/forms/sjp"
      : "/forms/documents";

  return (
    <div>
      <PageHeader
        title={doc.category === "Other" ? "Document" : doc.category}
        subtitle={`v${doc.version} · ${doc.lastUpdated}`}
        backHref={backHref}
      />

      <main className="space-y-5 px-4 py-5">
        <div className="helix-card space-y-4 p-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl",
                isSwp
                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-400"
                  : isSjp
                    ? "bg-violet-500/15 text-violet-700 dark:text-violet-400"
                    : "bg-primary/10 text-primary"
              )}
            >
              {isSwp ? (
                <BookOpen className="size-6" />
              ) : isSjp ? (
                <ClipboardList className="size-6" />
              ) : (
                <Shield className="size-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Badge
                className={cn(
                  "mb-2 border-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                  isSwp
                    ? "bg-sky-500/15 text-sky-700 dark:text-sky-400"
                    : isSjp
                      ? "bg-violet-500/15 text-violet-700 dark:text-violet-400"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {doc.type}
              </Badge>
              <h1 className="text-xl font-bold leading-snug tracking-tight">
                {doc.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {doc.owner}
              </p>
            </div>
          </div>
          <p className="text-[15px] leading-relaxed">{doc.summary}</p>
        </div>

        <Section title="Purpose" icon={<Shield className="size-4" />}>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {doc.purpose}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Scope: </span>
            {doc.scope}
          </p>
        </Section>

        <Section title="Applies to" icon={<HardHat className="size-4" />}>
          <div className="flex flex-wrap gap-2">
            {doc.roles.map((role) => (
              <Badge
                key={role}
                variant="secondary"
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                {role}
              </Badge>
            ))}
          </div>
        </Section>

        <Section title="Required PPE" icon={<CheckCircle2 className="size-4" />}>
          <ul className="space-y-2">
            {doc.ppe.map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </ul>
        </Section>

        <Section title="Key hazards" icon={<AlertTriangle className="size-4" />}>
          <ul className="space-y-2">
            {doc.hazards.map((item) => (
              <Bullet key={item} tone="warn">
                {item}
              </Bullet>
            ))}
          </ul>
        </Section>

        <Section
          title={isSjp ? "Job steps" : "Procedure steps"}
          icon={<ClipboardList className="size-4" />}
        >
          <ol className="space-y-3">
            {doc.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm leading-snug">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Emergency" icon={<AlertTriangle className="size-4" />}>
          <ul className="space-y-2">
            {doc.emergency.map((item) => (
              <Bullet key={item} tone="danger">
                {item}
              </Bullet>
            ))}
          </ul>
        </Section>

        {doc.references.length > 0 && (
          <Section title="References" icon={<BookOpen className="size-4" />}>
            <div className="flex flex-wrap gap-2">
              {doc.references.map((ref) => (
                <Badge
                  key={ref}
                  variant="outline"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                >
                  {ref}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        <DocumentReviewQuiz
          documentId={doc.id}
          questions={doc.reviewQuestions ?? []}
          onPassed={() => {
            flha?.markDocumentReviewed(doc.id);
          }}
        />

        <div className="grid gap-2 pb-4">
          <Button
            asChild
            size="lg"
            className="h-14 rounded-2xl text-base font-bold"
          >
            <Link href="/forms/flha">
              {reviewComplete
                ? "Back to FLHA — review recorded"
                : "Start FLHA with this context"}
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-2xl font-semibold"
          >
            <Link href={backHref}>Back to {isSwp ? "SWPs" : isSjp ? "SJPs" : "documents"}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="helix-card space-y-3 p-4">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Bullet({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warn" | "danger";
}) {
  return (
    <li className="flex gap-2.5 text-sm leading-snug">
      <span
        className={cn(
          "mt-1.5 size-1.5 shrink-0 rounded-full",
          tone === "warn" && "bg-amber-500",
          tone === "danger" && "bg-rose-500",
          tone === "default" && "bg-primary"
        )}
      />
      <span>{children}</span>
    </li>
  );
}
