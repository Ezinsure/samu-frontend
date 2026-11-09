"use client";

import { CoaImportDialog } from "./coa-import-dialog";
import { SetPasswordDialog } from "./set-password-dialog";
import { UserConfirmDialog } from "./user-confirm-dialog";
import { UserFormDialog } from "./user-form-dialog";
import type { UserDialogState } from "./types";

interface UserDialogsProps {
  /** Currently open row dialog, or `null`. */
  dialog: UserDialogState | null;
  /** Whether the "New user" dialog is open. */
  creating: boolean;
  /** Whether the COA Excel/CSV import dialog is open. */
  importingCoas?: boolean;
  onClose: () => void;
  /** Called after any successful change so the list can reload. */
  onChanged: () => void;
}

/** Routes the page's dialog state to the right dialog component. */
export function UserDialogs({
  dialog,
  creating,
  importingCoas = false,
  onClose,
  onChanged,
}: UserDialogsProps) {
  const action = dialog?.action;
  const user = dialog?.user ?? null;

  return (
    <>
      <UserFormDialog
        open={creating || action === "edit"}
        user={action === "edit" ? user : null}
        onClose={onClose}
        onSaved={onChanged}
      />
      <SetPasswordDialog user={action === "password" ? user : null} onClose={onClose} />
      <UserConfirmDialog
        action={
          action === "reset" ||
          action === "activate" ||
          action === "deactivate" ||
          action === "delete"
            ? action
            : null
        }
        user={user}
        onClose={onClose}
        onDone={onChanged}
      />
      <CoaImportDialog
        open={importingCoas}
        onClose={onClose}
        onImported={onChanged}
      />
    </>
  );
}
