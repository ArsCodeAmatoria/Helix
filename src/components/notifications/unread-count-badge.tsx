import { cn } from "@/lib/utils";

/** Numeric count badge for bell / nav icons (and mirrors OS app-icon badge). */
export function UnreadCountBadge({
  count,
  className,
  ringClassName = "ring-card",
}: {
  count: number;
  className?: string;
  ringClassName?: string;
}) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={cn(
        "absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums ring-2",
        ringClassName,
        className
      )}
      aria-hidden
    >
      {label}
    </span>
  );
}
