"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  FileText,
  Search,
} from "lucide-react";
import {
  db,
  getSjpDocuments,
  getSwpDocuments,
  searchDocuments,
} from "@/lib/db";
import type { SafeWorkDocument } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DocFilter = "all" | "SWP" | "SJP" | "Other";

function DocRow({ doc }: { doc: SafeWorkDocument }) {
  const isSwp = doc.category === "SWP";
  const isSjp = doc.category === "SJP";

  return (
    <Link
      href={`/forms/documents/${doc.id}`}
      className="helix-card flex items-start gap-3 p-4 transition-shadow active:scale-[0.99]"
    >
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl",
          isSwp
            ? "bg-sky-500/15 text-sky-700 dark:text-sky-400"
            : isSjp
              ? "bg-violet-500/15 text-violet-700 dark:text-violet-400"
              : "bg-muted text-muted-foreground"
        )}
      >
        {isSwp ? (
          <BookOpen className="size-5" />
        ) : isSjp ? (
          <ClipboardList className="size-5" />
        ) : (
          <FileText className="size-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              isSwp
                ? "bg-sky-500/15 text-sky-700 dark:text-sky-400"
                : isSjp
                  ? "bg-violet-500/15 text-violet-700 dark:text-violet-400"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {doc.category}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            v{doc.version}
          </span>
        </div>
        <p className="font-semibold leading-snug">{doc.shortTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {doc.summary}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Updated {doc.lastUpdated}
        </p>
      </div>
      <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function DocumentsScreen({
  initialFilter = "all",
  title = "Documents",
  subtitle = "SWPs, SJPs & site docs",
}: {
  initialFilter?: DocFilter;
  title?: string;
  subtitle?: string;
}) {
  const [filter, setFilter] = useState<DocFilter>(initialFilter);
  const [query, setQuery] = useState("");

  const docs = useMemo(() => {
    const pool =
      filter === "SWP"
        ? getSwpDocuments()
        : filter === "SJP"
          ? getSjpDocuments()
          : filter === "Other"
            ? db.documents.filter((d) => d.category === "Other")
            : searchDocuments(query);

    if (filter !== "all" && query.trim()) {
      const q = query.trim().toLowerCase();
      return pool.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.shortTitle.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q)
      );
    }
    if (filter === "all") return searchDocuments(query);
    return pool;
  }, [filter, query]);

  const filters: { id: DocFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: db.documents.length },
    { id: "SWP", label: "SWPs", count: getSwpDocuments().length },
    { id: "SJP", label: "SJPs", count: getSjpDocuments().length },
    {
      id: "Other",
      label: "Other",
      count: db.documents.filter((d) => d.category === "Other").length,
    },
  ];

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} backHref="/forms" />
      <main className="space-y-4 px-4 py-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search procedures…"
            className="h-14 rounded-2xl pl-11 text-base"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-semibold",
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <section className="space-y-2 pb-2">
          <p className="text-sm font-bold text-muted-foreground">
            {docs.length} document{docs.length === 1 ? "" : "s"}
          </p>
          {docs.length === 0 && (
            <div className="helix-card p-6 text-center text-sm text-muted-foreground">
              No documents match “{query}”.
            </div>
          )}
          {docs.map((doc) => (
            <DocRow key={doc.id} doc={doc} />
          ))}
        </section>
      </main>
    </div>
  );
}
