"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
}

/** Shared avatar with photo when available and initials fallback. */
export function UserAvatar({
  name,
  avatarUrl,
  avatarInitials,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const initials =
    (avatarInitials && avatarInitials.trim()) || initialsFromName(name);

  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
    </Avatar>
  );
}
