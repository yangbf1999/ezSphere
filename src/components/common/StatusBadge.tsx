import React from "react";
import { cn } from "@/lib/utils";

/** apple-design.css badge-success / badge-info / badge-neutral 等 */
export type StatusBadgeVariant =
  | "success"
  | "neutral"
  | "info"
  | "accent"
  | "warning"
  | "error";

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({
  variant,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span className={cn("ez-badge", `ez-badge--${variant}`, className)}>
      {children}
    </span>
  );
}
