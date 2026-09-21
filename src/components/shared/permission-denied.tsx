import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PermissionDeniedProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PermissionDenied({
  title = "Access denied",
  description = "You do not have permission to view this page. Contact an administrator if you believe this is an error.",
  action,
  className,
}: PermissionDeniedProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-border bg-surface px-6 py-12 text-center shadow-[var(--samu-shadow-card)]",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-bg text-warning">
        <ShieldAlert className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-foreground-secondary">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
