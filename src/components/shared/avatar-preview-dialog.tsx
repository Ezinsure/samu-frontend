"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/user-avatar";

interface AvatarPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  avatarUrl?: string | null;
  avatarInitials?: string | null;
}

/** Enlarge a profile photo (or initials) for admin / self viewing. */
export function AvatarPreviewDialog({
  open,
  onOpenChange,
  name,
  avatarUrl,
  avatarInitials,
}: AvatarPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed R2 URLs; not next/image hosts
            <img
              src={avatarUrl}
              alt={name}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          ) : (
            <UserAvatar
              name={name}
              avatarInitials={avatarInitials}
              className="h-40 w-40 text-3xl"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
