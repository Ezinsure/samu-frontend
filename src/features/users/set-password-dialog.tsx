"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { PasswordInput } from "@/components/shared/password-input";
import { PasswordStrength } from "@/components/shared/password-strength";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setUserPassword, type ManagedUser } from "@/lib/api/users";
import { isPasswordStrong } from "@/lib/auth/password-rules";

function SetPasswordBody({
  user,
  onClose,
}: {
  user: ManagedUser;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await setUserPassword(user.id, password);
    setSaving(false);

    if (!result.ok) {
      toast.error("Could not set the password", { description: result.error });
      return;
    }
    toast.success(`Password set for ${user.name}`, {
      description: "Their existing sessions were signed out.",
    });
    onClose();
  }

  return (
    <form onSubmit={submit}>
      <FormField label="New password" htmlFor="admin-set-password">
        <PasswordInput
          id="admin-set-password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordStrength password={password} className="pt-1" />
        <p className="text-xs text-foreground-secondary">
          Share it through a secure channel.
        </p>
      </FormField>
      <DialogFooter className="mt-6">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isPasswordStrong(password) || saving}>
          {saving ? "Saving…" : "Set password"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Admin sets a user's password directly (e.g. when email is unavailable). */
export function SetPasswordDialog({
  user,
  onClose,
}: {
  user: ManagedUser | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={user !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set password</DialogTitle>
          <DialogDescription>
            Choose a new password for {user?.name}. They will be signed out everywhere.
          </DialogDescription>
        </DialogHeader>
        {user ? <SetPasswordBody user={user} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}
