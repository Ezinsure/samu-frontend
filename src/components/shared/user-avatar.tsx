"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarPreviewDialog } from "@/components/shared/avatar-preview-dialog";
import { cn } from "@/lib/utils";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export interface UserAvatarProps {
  name: string;
  /** Short-lived signed URL or public URL; initials used when missing/broken. */
  avatarUrl?: string | null;
  avatarInitials?: string | null;
  className?: string;
  /** Extra classes for the fallback circle. */
  fallbackClassName?: string;
  /**
   * When true, clicking opens a larger preview (photo or initials).
   * Defaults to true when a photo URL is present.
   */
  previewable?: boolean;
}

/** Shared avatar with photo when available and initials fallback. */
export function UserAvatar({
  name,
  avatarUrl,
  avatarInitials,
  className,
  fallbackClassName,
  previewable,
}: UserAvatarProps) {
  const [open, setOpen] = useState(false);
  const initials =
    (avatarInitials && avatarInitials.trim()) || initialsFromName(name);
  const canPreview = previewable ?? Boolean(avatarUrl);

  return (
    <>
      <button
        type="button"
        className={cn(
          "inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600",
          canPreview ? "cursor-zoom-in" : "cursor-default",
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (canPreview) setOpen(true);
        }}
        disabled={!canPreview}
        aria-label={canPreview ? `View photo of ${name}` : undefined}
      >
        <Avatar className={cn("h-8 w-8", className)}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
        </Avatar>
      </button>
      {canPreview ? (
        <AvatarPreviewDialog
          open={open}
          onOpenChange={setOpen}
          name={name}
          avatarUrl={avatarUrl}
          avatarInitials={avatarInitials}
        />
      ) : null}
    </>
  );
}
