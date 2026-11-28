import type { ReactNode } from "react";
import type { StatusTone } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const toneSurface: Record<StatusTone, string> = {
  success: "border-success/30 bg-success-bg text-success",
  warning: "border-warning/30 bg-warning-bg text-warning",
  danger: "border-danger/30 bg-danger-bg text-danger",
  info: "border-info/30 bg-info-bg text-info",
  neutral: "border-border bg-surface text-foreground-secondary",
  inactive: "border-border bg-muted/40 text-foreground-muted",
};

interface StatSummaryCardProps {
  label: string;
  value: ReactNode;
  /** When set, tints the whole card with the status color. */
  tone?: StatusTone;
  className?: string;
}

/**
 * Standalone metric card with balanced padding.
 * Avoids CardContent's default `pt-0` (meant for header+body cards), which
 * collapses top padding on summary-only cards at the `sm` breakpoint.
 */
export function StatSummaryCard({
  label,
  value,
  tone = "neutral",
  className,
}: StatSummaryCardProps) {
  return (
    <Card
      className={cn(
        "shadow-none",
        toneSurface[tone],
        className,
      )}
    >
      <CardContent className="flex flex-col gap-2 p-4 sm:p-5">
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-wide",
            tone === "neutral" || tone === "inactive"
              ? "text-muted-foreground"
              : "opacity-90",
          )}
        >
          {label}
        </p>
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
