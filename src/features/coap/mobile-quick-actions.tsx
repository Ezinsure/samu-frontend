"use client";

import Link from "next/link";
import { ClipboardList, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, canManageLeads } from "@/lib/api";
import { cn } from "@/lib/utils";

export function MobileQuickActions({ className }: { className?: string }) {
  const { user } = useAuth();
  const canLeads = canManageLeads(user);
  const canActivities = canManageCoap(user);
  if (
    user?.role === "MD_VIEWER" ||
    (!canLeads && !canActivities)
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 p-3 backdrop-blur md:hidden",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto grid max-w-lg gap-2",
          canLeads && canActivities ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        {canLeads ? (
          <Link
            href="/leads/new"
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary-600 px-3 text-sm font-semibold text-foreground-on-primary"
          >
            <UserPlus className="h-4 w-4" />
            New lead
          </Link>
        ) : null}
        {canActivities ? (
          <Link
            href="/activities/new"
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm font-semibold text-foreground"
          >
            <ClipboardList className="h-4 w-4" />
            Log activity
          </Link>
        ) : null}
      </div>
    </div>
  );
}
