import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  context?: string;
  icon?: LucideIcon;
  trend?: {
    direction: "up" | "down" | "flat";
    label: string;
  };
  className?: string;
}

export function KpiCard({
  title,
  value,
  context,
  icon: Icon,
  trend,
  className,
}: KpiCardProps) {
  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
        ? TrendingDown
        : Minus;

  return (
    <Card className={cn(className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium text-foreground-secondary">
              {title}
            </p>
            <p className="text-[32px] font-bold tabular-nums leading-none tracking-tight text-foreground">
              {value}
            </p>
            {context ? (
              <p className="text-xs text-foreground-muted">{context}</p>
            ) : null}
            {trend ? (
              <p
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  trend.direction === "up" && "text-success",
                  trend.direction === "down" && "text-danger",
                  trend.direction === "flat" && "text-foreground-secondary",
                )}
              >
                <TrendIcon className="h-3.5 w-3.5" aria-hidden />
                {trend.label}
              </p>
            ) : null}
          </div>
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-50 text-primary-600">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
