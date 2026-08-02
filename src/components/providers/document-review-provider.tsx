"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DocumentReviewRecord } from "@/lib/types";

const STORAGE_KEY = "helix-doc-reviews";

interface DocumentReviewContextValue {
  records: DocumentReviewRecord[];
  isComplete: (documentId: string) => boolean;
  getRecord: (documentId: string) => DocumentReviewRecord | undefined;
  markComplete: (
    documentId: string,
    score: number,
    total: number
  ) => DocumentReviewRecord;
  clearReview: (documentId: string) => void;
}

const DocumentReviewContext =
  createContext<DocumentReviewContextValue | null>(null);

function loadRecords(): DocumentReviewRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DocumentReviewRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function DocumentReviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [records, setRecords] = useState<DocumentReviewRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecords(loadRecords());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records, hydrated]);

  const getRecord = useCallback(
    (documentId: string) => records.find((r) => r.documentId === documentId),
    [records]
  );

  const isComplete = useCallback(
    (documentId: string) => {
      const r = getRecord(documentId);
      return Boolean(r && r.score === r.total && r.total > 0);
    },
    [getRecord]
  );

  const markComplete = useCallback(
    (documentId: string, score: number, total: number) => {
      const next: DocumentReviewRecord = {
        documentId,
        completedAt: new Date().toISOString(),
        score,
        total,
      };
      setRecords((prev) => [
        next,
        ...prev.filter((r) => r.documentId !== documentId),
      ]);
      return next;
    },
    []
  );

  const clearReview = useCallback((documentId: string) => {
    setRecords((prev) => prev.filter((r) => r.documentId !== documentId));
  }, []);

  const value = useMemo(
    () => ({
      records,
      isComplete,
      getRecord,
      markComplete,
      clearReview,
    }),
    [records, isComplete, getRecord, markComplete, clearReview]
  );

  return (
    <DocumentReviewContext.Provider value={value}>
      {children}
    </DocumentReviewContext.Provider>
  );
}

export function useDocumentReview() {
  const ctx = useContext(DocumentReviewContext);
  if (!ctx) {
    throw new Error(
      "useDocumentReview must be used within DocumentReviewProvider"
    );
  }
  return ctx;
}

export function useDocumentReviewOptional() {
  return useContext(DocumentReviewContext);
}
