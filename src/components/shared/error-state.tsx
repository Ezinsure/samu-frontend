import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this content. Please try again.",
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-danger/20 bg-danger-bg/40 px-4 py-10 text-center sm:px-6 sm:py-12",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="mt-1 w-full max-w-full break-words text-sm text-foreground-secondary [overflow-wrap:anywhere] sm:max-w-sm">
        {description}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        {action}
      </div>
    </div>
  );
}
