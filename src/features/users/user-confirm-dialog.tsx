"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteUser,
  sendUserResetLink,
  setUserStatus,
  type ManagedUser,
} from "@/lib/api/users";
import type { MutationResult } from "@/lib/http/mutation";
import type { UserAction } from "./types";

type ConfirmAction = Extract<UserAction, "reset" | "activate" | "deactivate" | "delete">;

interface ConfirmConfig {
  title: (user: ManagedUser) => string;
  description: (user: ManagedUser) => string;
  confirmLabel: string;
  destructive?: boolean;
  /** Runs the API call and returns the toast message for success. */
  run: (user: ManagedUser) => Promise<MutationResult<string>>;
}

/** Wraps an API call so its result carries a success message for the toast. */
async function withMessage<T>(
  call: Promise<MutationResult<T>>,
  message: (data: T) => string,
): Promise<MutationResult<string>> {
  const result = await call;
  return result.ok ? { ok: true, data: message(result.data) } : result;
}

const CONFIGS: Record<ConfirmAction, ConfirmConfig> = {
  reset: {
    title: (u) => `Send reset link to ${u.name}?`,
    description: (u) =>
      `We will email ${u.email} a one-time link to choose a new password.`,
    confirmLabel: "Send link",
    run: (u) =>
      withMessage(sendUserResetLink(u.id), (r) =>
        r.delivered
          ? `Reset link sent to ${u.email}`
          : "Email is not configured on the server; nothing was sent. Use “Set password” instead.",
      ),
  },
  activate: {
    title: (u) => (u.status === "pending" ? `Approve ${u.name}?` : `Reactivate ${u.name}?`),
    description: (u) => `${u.name} will be able to sign in again.`,
    confirmLabel: "Activate",
    run: (u) => withMessage(setUserStatus(u.id, "active"), () => `${u.name} is active`),
  },
  deactivate: {
    title: (u) => `Deactivate ${u.name}?`,
    description: (u) =>
      `${u.name} is signed out immediately and cannot sign in until reactivated. Their records are kept.`,
    confirmLabel: "Deactivate",
    destructive: true,
    run: (u) => withMessage(setUserStatus(u.id, "disabled"), () => `${u.name} deactivated`),
  },
  delete: {
    title: (u) => `Delete ${u.name}?`,
    description: () =>
      "This permanently removes the account. Users with recorded activity cannot be deleted; deactivate them instead.",
    confirmLabel: "Delete",
    destructive: true,
    run: (u) => withMessage(deleteUser(u.id), () => `${u.name} deleted`),
  },
};

interface UserConfirmDialogProps {
  action: ConfirmAction | null;
  user: ManagedUser | null;
  onClose: () => void;
  onDone: () => void;
}

/** Single confirmation dialog for reset-link, activate, deactivate and delete. */
export function UserConfirmDialog({ action, user, onClose, onDone }: UserConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const config = action ? CONFIGS[action] : null;

  async function confirm() {
    if (!config || !user) return;
    setBusy(true);
    const result = await config.run(user);
    setBusy(false);

    if (!result.ok) {
      toast.error("Action failed", { description: result.error });
      return;
    }
    toast.success(result.data);
    onDone();
    onClose();
  }

  return (
    <Dialog open={Boolean(config && user)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        {config && user ? (
          <>
            <DialogHeader>
              <DialogTitle>{config.title(user)}</DialogTitle>
              <DialogDescription>{config.description(user)}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={config.destructive ? "destructive" : "default"}
                onClick={() => void confirm()}
                disabled={busy}
              >
                {busy ? "Working…" : config.confirmLabel}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
