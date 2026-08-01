"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleTileProps {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
  badge?: string | number;
  delay?: number;
}

export function ModuleTile({
  href,
  label,
  icon: Icon,
  color,
  badge,
  delay = 0,
}: ModuleTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link href={href} className="helix-tile relative min-h-[112px]">
        {badge !== undefined && (
          <span className="absolute right-2.5 top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl text-white shadow-md",
            color
          )}
        >
          <Icon className="size-7" strokeWidth={2.25} />
        </span>
        <span className="text-[13px] font-semibold leading-tight text-foreground">
          {label}
        </span>
      </Link>
    </motion.div>
  );
}
