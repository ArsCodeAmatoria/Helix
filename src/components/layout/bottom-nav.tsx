"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Clock,
  Grid2x2,
  Home,
  User,
} from "lucide-react";
import { useNotificationsOptional } from "@/components/providers/notifications-provider";
import { UnreadCountBadge } from "@/components/notifications/unread-count-badge";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/timeclock", label: "Clock", icon: Clock },
  { href: "/forms", label: "Forms", icon: Grid2x2 },
  { href: "/statistics", label: "COR", icon: ClipboardList },
  { href: "/profile", label: "Me", icon: User, badge: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const notifications = useNotificationsOptional();
  const unread = notifications?.unreadCount ?? 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(16,24,40,0.06)] backdrop-blur-md">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[11px] font-semibold transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={
                  item.badge && unread > 0
                    ? `${item.label}, ${unread} unread`
                    : item.label
                }
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-x-2 top-1 -z-10 h-8 rounded-full bg-primary/10"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative">
                  <Icon className={cn("size-[22px]", active && "stroke-[2.5]")} />
                  {item.badge ? (
                    <UnreadCountBadge
                      count={unread}
                      className="-top-1.5 -right-2.5 h-4 min-w-4 text-[9px]"
                    />
                  ) : null}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
