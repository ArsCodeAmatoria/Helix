"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { db } from "@/lib/db";
import { syncAppBadge } from "@/lib/app-badge";
import type { NotificationItem } from "@/lib/types";

const STORAGE_KEY = "proven-notification-reads";

interface NotificationsContextValue {
  items: NotificationItem[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext =
  createContext<NotificationsContextValue | null>(null);

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

function mergeItems(readIds: Set<string>): NotificationItem[] {
  return db.notifications.map((n) => ({
    ...n,
    read: n.read || readIds.has(n.id),
  }));
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReadIds(loadReadIds());
    setHydrated(true);
  }, []);

  const items = useMemo(() => mergeItems(readIds), [readIds]);
  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  useEffect(() => {
    if (!hydrated) return;
    saveReadIds(readIds);
    void syncAppBadge(unreadCount);
  }, [hydrated, readIds, unreadCount]);

  // Re-apply badge when returning to the installed app / SW takes control.
  useEffect(() => {
    if (!hydrated) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncAppBadge(unreadCount);
      }
    };
    const onController = () => {
      void syncAppBadge(unreadCount);
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    navigator.serviceWorker?.addEventListener?.("controllerchange", onController);
    // Extra passes help first install before Badging API is ready.
    const t1 = window.setTimeout(() => void syncAppBadge(unreadCount), 800);
    const t2 = window.setTimeout(() => void syncAppBadge(unreadCount), 2500);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      navigator.serviceWorker?.removeEventListener?.(
        "controllerchange",
        onController
      );
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [hydrated, unreadCount]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const n of db.notifications) next.add(n.id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ items, unreadCount, markRead, markAllRead }),
    [items, unreadCount, markRead, markAllRead]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  }
  return ctx;
}

export function useNotificationsOptional() {
  return useContext(NotificationsContext);
}
