"use client";

import Link from "next/link";
import { ClipboardList, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap } from "@/lib/api";
import { cn } from "@/lib/utils";

export function MobileQuickActions({ className }: { className?: string }) {
  const { user } = useAuth();
  if (!canManageCoap(user) || user?.role === "MD_VIEWER") return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 p-3 backdrop-blur md:hidden",
        className,
      )}
    >
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
        <Link
          href="/leads/new"
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary-600 px-3 text-sm font-semibold text-foreground-on-primary"
        >
          <UserPlus className="h-4 w-4" />
          New lead
        </Link>
        <Link
          href="/activities/new"
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm font-semibold text-foreground"
        >
          <ClipboardList className="h-4 w-4" />
          Log activity
        </Link>
      </div>
    </div>
  );
}
